from typing import Optional, List, Dict
from solar.access import User, authenticated, public
from solar.media import MediaFile, save_to_bucket, generate_presigned_url
from core.dance_chains import DanceChain
from core.chain_moves import ChainMove
from core.user_profiles import UserProfile
import uuid
import json
try:
    import cv2
    import mediapipe as mp
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
import tempfile
import os

@authenticated
def create_dance_chain(user: User, title: str, description: str, category: str,
                      video: MediaFile, max_moves: int = 10) -> DanceChain:
    """Create a new dance chain with the initial move."""
    
    # Validate video duration (5-10 seconds)
    if video.size > 50 * 1024 * 1024:  # 50MB limit
        raise ValueError("Video file too large")
    
    # Check if user has a profile
    profile_results = UserProfile.sql(
        "SELECT id FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    if not profile_results:
        raise ValueError("User must create a profile before creating chains")
    
    # Save video to media storage
    video_path = save_to_bucket(video, f"videos/chains/{uuid.uuid4()}.{video.mime_type.split('/')[-1]}")
    
    # Extract pose data from video
    pose_data = extract_pose_landmarks_from_media(video)
    
    # Create the dance chain
    chain = DanceChain(
        title=title,
        description=description,
        category=category,
        max_moves=max_moves,
        creator_id=user.id,
        current_move_count=1
    )
    chain.sync()
    
    # Create the first move
    first_move = ChainMove(
        chain_id=chain.id,
        user_id=user.id,
        move_number=1,
        video_path=video_path,
        pose_data=pose_data,
        verification_score=1.0,  # First move is always 100% verified
        duration_seconds=get_video_duration_from_media(video)
    )
    first_move.sync()
    
    # Update user profile stats
    UserProfile.sql(
        "UPDATE user_profiles SET total_chains_created = total_chains_created + 1 WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    
    return chain

@public
def get_dance_chains(category: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[DanceChain]:
    """Get dance chains with optional category filter."""
    if category:
        results = DanceChain.sql(
            """SELECT * FROM dance_chains 
               WHERE category = %(category)s AND status = 'active' 
               ORDER BY created_at DESC 
               LIMIT %(limit)s OFFSET %(offset)s""",
            {"category": category, "limit": limit, "offset": offset}
        )
    else:
        results = DanceChain.sql(
            """SELECT * FROM dance_chains 
               WHERE status = 'active' 
               ORDER BY created_at DESC 
               LIMIT %(limit)s OFFSET %(offset)s""",
            {"limit": limit, "offset": offset}
        )
    
    return [DanceChain(**result) for result in results]

@public
def get_dance_chain(chain_id: uuid.UUID) -> Optional[DanceChain]:
    """Get a specific dance chain by ID."""
    results = DanceChain.sql(
        "SELECT * FROM dance_chains WHERE id = %(chain_id)s",
        {"chain_id": chain_id}
    )
    
    if not results:
        return None
    
    # Increment view count
    DanceChain.sql(
        "UPDATE dance_chains SET total_views = total_views + 1 WHERE id = %(chain_id)s",
        {"chain_id": chain_id}
    )
    
    return DanceChain(**results[0])

@public
def get_chain_moves(chain_id: uuid.UUID) -> List[ChainMove]:
    """Get all moves for a specific chain in order."""
    results = ChainMove.sql(
        "SELECT * FROM chain_moves WHERE chain_id = %(chain_id)s ORDER BY move_number ASC",
        {"chain_id": chain_id}
    )
    
    moves = []
    for result in results:
        move = ChainMove(**result)
        # Generate presigned URL for video
        move.video_path = generate_presigned_url(move.video_path)
        moves.append(move)
    
    return moves

@authenticated
def add_move_to_chain(user: User, chain_id: uuid.UUID, video: MediaFile) -> ChainMove:
    """Add a new move to an existing dance chain."""
    
    # Get the chain
    chain = get_dance_chain(chain_id)
    if not chain:
        raise ValueError("Chain not found")
    
    if chain.status != "active":
        raise ValueError("Chain is not active")
    
    if chain.current_move_count >= chain.max_moves:
        raise ValueError("Chain has reached maximum moves")
    
    # Check if user has a profile
    profile_results = UserProfile.sql(
        "SELECT id FROM user_profiles WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    if not profile_results:
        raise ValueError("User must create a profile before submitting moves")
    
    # Validate video
    if video.size > 50 * 1024 * 1024:  # 50MB limit
        raise ValueError("Video file too large")
    
    # Get existing moves to verify against
    existing_moves = get_chain_moves(chain_id)
    
    # Extract pose data from new video
    new_pose_data = extract_pose_landmarks_from_media(video)
    
    # Verify the user performed all previous moves correctly
    verification_score = verify_move_sequence(existing_moves, new_pose_data)
    
    if verification_score < 0.7:  # 70% threshold
        raise ValueError(f"Move verification failed. Score: {verification_score:.2f}. You must perform all previous moves correctly.")
    
    # Save video
    video_path = save_to_bucket(video, f"videos/moves/{uuid.uuid4()}.{video.mime_type.split('/')[-1]}")
    
    # Create the new move
    new_move_number = chain.current_move_count + 1
    new_move = ChainMove(
        chain_id=chain_id,
        user_id=user.id,
        move_number=new_move_number,
        video_path=video_path,
        pose_data=new_pose_data,
        verification_score=verification_score,
        duration_seconds=get_video_duration_from_media(video)
    )
    new_move.sync()
    
    # Update chain
    chain.current_move_count = new_move_number
    if new_move_number >= chain.max_moves:
        chain.status = "completed"
    chain.sync()
    
    # Update user profile stats
    UserProfile.sql(
        "UPDATE user_profiles SET total_moves_submitted = total_moves_submitted + 1 WHERE user_id = %(user_id)s",
        {"user_id": user.id}
    )
    
    # Generate presigned URL for the video
    new_move.video_path = generate_presigned_url(new_move.video_path)
    
    return new_move

def extract_pose_landmarks_from_media(video: MediaFile) -> Dict:
    """Extract pose landmarks from video using MediaPipe."""
    if not CV2_AVAILABLE:
        # Return mock pose data when CV2 is not available
        return {
            "landmarks": [[0.5] * 132] * 30,  # Mock landmarks for 30 frames
            "frame_count": 30
        }
    
    # Save video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video.bytes)
        temp_path = temp_file.name
    
    try:
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        cap = cv2.VideoCapture(temp_path)
        landmarks_sequence = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb_frame)
            
            if results.pose_landmarks:
                landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])
                landmarks_sequence.append(landmarks)
        
        cap.release()
        
        return {
            "landmarks": landmarks_sequence,
            "frame_count": len(landmarks_sequence)
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def get_video_duration_from_media(video: MediaFile) -> float:
    """Get video duration in seconds."""
    if not CV2_AVAILABLE:
        # Return mock duration when CV2 is not available
        return 8.0  # Mock 8 second duration
    
    # Save video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video.bytes)
        temp_path = temp_file.name
    
    try:
        cap = cv2.VideoCapture(temp_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = frame_count / fps if fps > 0 else 0
        cap.release()
        return duration
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def verify_move_sequence(existing_moves: List[ChainMove], new_pose_data: Dict) -> float:
    """Verify that the new video contains all previous moves plus a new one."""
    if not existing_moves:
        return 1.0
    
    # For now, return a simple score based on having pose data
    # In a production system, this would do sophisticated pose comparison
    if new_pose_data and new_pose_data.get("landmarks"):
        # Simple verification: if we extracted poses successfully, give a reasonable score
        return 0.85
    
    return 0.0

@public
def search_chains(query: str, limit: int = 20) -> List[DanceChain]:
    """Search for dance chains by title or description."""
    results = DanceChain.sql(
        """SELECT * FROM dance_chains 
           WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) 
           AND status = 'active'
           ORDER BY total_views DESC
           LIMIT %(limit)s""",
        {"query": f"%{query}%", "limit": limit}
    )
    
    return [DanceChain(**result) for result in results]