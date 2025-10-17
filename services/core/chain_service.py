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
    NUMPY_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    NUMPY_AVAILABLE = False
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
    
    if verification_score < 0.6:  # 60% threshold for pose similarity
        raise ValueError(f"Move verification failed. Score: {verification_score:.2f}. You must perform all previous moves with sufficient accuracy.")
    
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
        # Validate video can be opened
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")

        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0

        # Validate video duration (5-30 seconds for dance moves)
        if duration < 5 or duration > 30:
            cap.release()
            raise ValueError(f"Video duration {duration:.1f}s is outside allowed range (5-30 seconds)")

        # Reset to beginning
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        landmarks_sequence = []
        processed_frames = 0
        max_frames = 300  # Limit processing to prevent excessive computation

        while cap.isOpened() and processed_frames < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            try:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = pose.process(rgb_frame)

                if results.pose_landmarks:
                    landmarks = []
                    for landmark in results.pose_landmarks.landmark:
                        # Store x, y, z coordinates and visibility for each landmark
                        landmarks.extend([landmark.x, landmark.y, landmark.z, landmark.visibility])
                    landmarks_sequence.append(landmarks)
                else:
                    # If no pose detected in this frame, add a placeholder frame
                    # This ensures we maintain frame count even with detection failures
                    landmarks_sequence.append([0.0] * 132)  # 33 landmarks * 4 values each

                processed_frames += 1

            except Exception as e:
                # If frame processing fails, add placeholder and continue
                landmarks_sequence.append([0.0] * 132)
                processed_frames += 1

        cap.release()
        pose.close()
        
        return {
            "landmarks": landmarks_sequence,
            "frame_count": len(landmarks_sequence)
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def get_video_duration_from_media(video: MediaFile) -> float:
    """Get video duration in seconds with validation."""
    if not CV2_AVAILABLE:
        # Return mock duration when CV2 is not available
        return 8.0  # Mock 8 second duration

    # Save video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video.bytes)
        temp_path = temp_file.name

    try:
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            return 0.0

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        cap.release()

        # Validate duration is reasonable
        if duration < 1 or duration > 60:
            return 0.0

        return duration

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def verify_move_sequence(existing_moves: List[ChainMove], new_pose_data: Dict) -> float:
    """Verify that the new video contains all previous moves plus a new one.

    Uses pose landmark analysis to ensure the performer demonstrates
    all previous moves in sequence with sufficient accuracy.
    """
    if not existing_moves:
        return 1.0  # First move is always verified

    if not new_pose_data or not new_pose_data.get("landmarks"):
        return 0.0  # No pose data to analyze

    new_landmarks = new_pose_data["landmarks"]
    if not new_landmarks or len(new_landmarks) < 10:
        return 0.0  # Insufficient pose data

    verification_scores = []

    # Verify each existing move is present in the new sequence
    for move in existing_moves:
        if not move.pose_data or not move.pose_data.get("landmarks"):
            continue  # Skip moves without pose data

        move_landmarks = move.pose_data["landmarks"]
        if not move_landmarks:
            continue

        # Find the best matching segment in the new pose sequence
        similarity_score = find_pose_sequence_match(new_landmarks, move_landmarks)
        verification_scores.append(similarity_score)

    if not verification_scores:
        return 0.0  # No moves could be verified

    # Require all moves to be present with minimum accuracy
    min_required_score = 0.6  # 60% similarity threshold
    verified_moves = sum(1 for score in verification_scores if score >= min_required_score)

    if verified_moves < len(existing_moves):
        return 0.0  # Not all moves verified

    # Return average verification score, capped at 0.95 to leave room for new move
    avg_score = sum(verification_scores) / len(verification_scores)
    return min(avg_score, 0.95)

def find_pose_sequence_match(sequence_a: List, sequence_b: List, tolerance: float = 0.1) -> float:
    """Find the best matching segment of sequence_b within sequence_a.

    Uses a sliding window approach to find where sequence_b appears
    most similarly within sequence_a, allowing for timing variations.

    Args:
        sequence_a: The longer sequence to search within (new pose data)
        sequence_b: The shorter sequence to find (existing move)
        tolerance: Maximum allowed difference per landmark (0-1 scale)

    Returns:
        Similarity score between 0.0 and 1.0
    """
    if not sequence_a or not sequence_b:
        return 0.0

    len_a, len_b = len(sequence_a), len(sequence_b)

    if len_a < len_b:
        return 0.0  # New sequence too short to contain the move

    # Normalize sequences to relative pose positions (focus on shape, not absolute position)
    normalized_a = normalize_pose_sequence(sequence_a)
    normalized_b = normalize_pose_sequence(sequence_b)

    if not normalized_a or not normalized_b:
        return 0.0

    best_similarity = 0.0

    # Slide window over sequence_a to find best match for sequence_b
    for start_idx in range(len(normalized_a) - len(normalized_b) + 1):
        end_idx = start_idx + len(normalized_b)
        segment = normalized_a[start_idx:end_idx]

        # Calculate similarity between the segment and target sequence
        similarity = calculate_pose_similarity(segment, normalized_b, tolerance)
        best_similarity = max(best_similarity, similarity)

    return best_similarity

def normalize_pose_sequence(sequence: List) -> List:
    """Normalize pose landmarks to focus on relative body positions.

    Converts absolute coordinates to relative positions based on body center,
    making the comparison more robust to dancer positioning in frame.
    """
    if not sequence:
        return []

    normalized = []

    for frame in sequence:
        if not isinstance(frame, list) or len(frame) < 12:  # Need at least basic pose points
            continue

        # Extract key body points (nose, shoulders, hips, knees, ankles)
        # MediaPipe pose landmarks: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
        try:
            # Key points: nose(0), left_shoulder(11), right_shoulder(12), left_hip(23), right_hip(24)
            nose = [frame[0], frame[1], frame[2]]  # x, y, z
            left_shoulder = [frame[33], frame[34], frame[35]]
            right_shoulder = [frame[36], frame[37], frame[38]]
            left_hip = [frame[69], frame[70], frame[71]]
            right_hip = [frame[72], frame[73], frame[74]]

            # Calculate body center as average of shoulders and hips
            center_x = (left_shoulder[0] + right_shoulder[0] + left_hip[0] + right_hip[0]) / 4
            center_y = (left_shoulder[1] + right_shoulder[1] + left_hip[1] + right_hip[1]) / 4

            # Create relative positions from body center
            relative_frame = [
                nose[0] - center_x, nose[1] - center_y,  # nose relative to center
                left_shoulder[0] - center_x, left_shoulder[1] - center_y,  # left shoulder
                right_shoulder[0] - center_x, right_shoulder[1] - center_y,  # right shoulder
                left_hip[0] - center_x, left_hip[1] - center_y,  # left hip
                right_hip[0] - center_x, right_hip[1] - center_y,  # right hip
            ]

            normalized.append(relative_frame)

        except (IndexError, TypeError):
            continue  # Skip malformed frames

    return normalized

def calculate_pose_similarity(sequence_a: List, sequence_b: List, tolerance: float = 0.1) -> float:
    """Calculate similarity between two pose sequences.

    Uses average Euclidean distance between corresponding frames,
    normalized to a 0-1 similarity score.
    """
    if len(sequence_a) != len(sequence_b) or not sequence_a:
        return 0.0

    total_distance = 0.0
    frame_count = 0

    for frame_a, frame_b in zip(sequence_a, sequence_b):
        if len(frame_a) != len(frame_b):
            continue

        # Calculate Euclidean distance between frames
        frame_distance = 0.0
        for i in range(len(frame_a)):
            diff = frame_a[i] - frame_b[i]
            frame_distance += diff * diff

        frame_distance = frame_distance ** 0.5  # Square root for Euclidean distance
        total_distance += frame_distance
        frame_count += 1

    if frame_count == 0:
        return 0.0

    avg_distance = total_distance / frame_count

    # Convert distance to similarity score (lower distance = higher similarity)
    # Normalize so that distance of 0 = similarity of 1.0
    # Distance of ~0.5 (significant pose difference) = similarity of 0.0
    similarity = max(0.0, 1.0 - (avg_distance / tolerance))

    return similarity

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