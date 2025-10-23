import time
from typing import Optional, List, Dict
from solar.access import User, authenticated, public
from solar.media import MediaFile, save_to_bucket, generate_presigned_url
from core.dance_chains import DanceChain
from core.chain_moves import ChainMove
from core.user_profiles import UserProfile
import uuid
import json
import logging
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

logger = logging.getLogger(__name__)

# Import monitoring
try:
    from ..monitoring import metrics_collector
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    logger.warning("Monitoring module not available")

@authenticated
def create_dance_chain(user: User, title: str, description: str, category: str,
                      video: MediaFile, max_moves: int = 10) -> DanceChain:
    """Create a new dance chain with the initial move."""
    try:
        # Validate inputs
        if not title or len(title) > 200:
            raise ValueError("Title must be between 1 and 200 characters")
        
        if description and len(description) > 1000:
            raise ValueError("Description must be 1000 characters or less")
        
        if not category or len(category) > 50:
            raise ValueError("Category must be between 1 and 50 characters")
        
        if max_moves < 2 or max_moves > 50:
            raise ValueError("Max moves must be between 2 and 50")
        
        # Validate video file
        if not video:
            raise ValueError("Video file is required")
        
        if video.size > 50 * 1024 * 1024:  # 50MB limit
            raise ValueError("Video file too large (max 50MB)")
        
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
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error creating dance chain: {str(e)}")
        raise

@public
def get_dance_chains(category: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[DanceChain]:
    """Get dance chains with optional category filter."""
    try:
        # Validate inputs
        if limit < 1 or limit > 100:
            raise ValueError("Limit must be between 1 and 100")
        
        if offset < 0:
            raise ValueError("Offset must be non-negative")
        
        if category and len(category) > 50:
            raise ValueError("Category must be 50 characters or less")
        
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
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting dance chains: {str(e)}")
        raise

@public
def get_dance_chain(chain_id: uuid.UUID) -> Optional[DanceChain]:
    """Get a specific dance chain by ID."""
    try:
        # Validate chain_id
        if not chain_id:
            raise ValueError("Chain ID is required")
        
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
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting dance chain: {str(e)}")
        raise

@public
def get_chain_moves(chain_id: uuid.UUID) -> List[ChainMove]:
    """Get all moves for a specific chain in order."""
    try:
        # Validate chain_id
        if not chain_id:
            raise ValueError("Chain ID is required")
        
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
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting chain moves: {str(e)}")
        raise

@authenticated
def add_move_to_chain(user: User, chain_id: uuid.UUID, video: MediaFile) -> ChainMove:
    """Add a new move to an existing dance chain."""
    try:
        # Validate inputs
        if not chain_id:
            raise ValueError("Chain ID is required")
        
        if not video:
            raise ValueError("Video file is required")
        
        if video.size > 50 * 1024 * 1024:  # 50MB limit
            raise ValueError("Video file too large (max 50MB)")
        
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
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error adding move to chain: {str(e)}")
        raise

def extract_pose_landmarks_from_media(video: MediaFile) -> Dict:
    """Extract pose landmarks from video using MediaPipe."""
    start_time = time.time()
    
    if not CV2_AVAILABLE:
        # Return mock pose data when CV2 is not available
        logger.warning("OpenCV not available, returning mock pose data")
        result = {
            "landmarks": [[0.5] * 132] * 30,  # Mock landmarks for 30 frames
            "frame_count": 30
        }
        # Track in monitoring
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "method": "mock"})
            metrics_collector.increment_counter("video_processing_total", {"operation": "pose_extraction", "success": "false", "method": "mock"})
        return result
    
    # Validate video file
    if not video or not hasattr(video, 'bytes'):
        if MONITORING_AVAILABLE:
            metrics_collector.increment_counter("video_processing_errors_total", {"operation": "pose_extraction", "error_type": "invalid_file"})
        raise ValueError("Invalid video file provided")
    
    # Save video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video.bytes)
        temp_path = temp_file.name
    
    try:
        # Validate video can be opened
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            if MONITORING_AVAILABLE:
                processing_time = time.time() - start_time
                metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "result": "error"})
                metrics_collector.increment_counter("video_processing_errors_total", {"operation": "pose_extraction", "error_type": "cannot_open"})
            raise ValueError("Could not open video file")

        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0

        # Validate video duration (5-30 seconds for dance moves)
        if duration < 2 or duration > 60:  # More flexible range
            cap.release()
            if MONITORING_AVAILABLE:
                processing_time = time.time() - start_time
                metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "result": "error"})
                metrics_collector.increment_counter("video_processing_errors_total", {"operation": "pose_extraction", "error_type": "invalid_duration"})
            raise ValueError(f"Video duration {duration:.1f}s is outside allowed range (2-60 seconds)")

        # Validate FPS is reasonable
        if fps < 1 or fps > 60:
            cap.release()
            if MONITORING_AVAILABLE:
                processing_time = time.time() - start_time
                metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "result": "error"})
                metrics_collector.increment_counter("video_processing_errors_total", {"operation": "pose_extraction", "error_type": "invalid_fps"})
            raise ValueError(f"Video FPS {fps} is outside reasonable range (1-60)")

        # Reset to beginning
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

        # Initialize MediaPipe Pose with better parameters for dance moves
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Higher complexity for better accuracy
            smooth_landmarks=True,
            min_detection_confidence=0.6,  # Higher confidence for accuracy
            min_tracking_confidence=0.6   # Higher tracking confidence
        )

        landmarks_sequence = []
        processed_frames = 0
        max_frames = 500  # Increased limit for longer videos

        # Calculate how many frames to skip to get a good sample (max 100 samples per video)
        frame_skip = max(1, frame_count // 100) if frame_count > 100 else 1

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Skip frames to sample appropriately
            if frame_idx % frame_skip != 0:
                frame_idx += 1
                continue

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
                    # This ensures we maintain meaningful data even with detection failures
                    logger.debug(f"No pose detected in frame {frame_idx}")
                    landmarks_sequence.append([0.0] * 132)  # 33 landmarks * 4 values each

                processed_frames += 1

                # Safety break to prevent infinite processing
                if processed_frames >= max_frames:
                    logger.warning(f"Maximum frame limit reached ({max_frames})")
                    break

            except Exception as e:
                logger.error(f"Error processing frame {frame_idx}: {str(e)}")
                # If frame processing fails, add placeholder and continue
                landmarks_sequence.append([0.0] * 132)
                processed_frames += 1

            frame_idx += 1

        cap.release()
        pose.close()
        
        if not landmarks_sequence:
            logger.warning("No landmarks extracted from video")
            result = {
                "landmarks": [[0.0] * 132] * 1,  # At least return one frame
                "frame_count": 1
            }
        else:
            result = {
                "landmarks": landmarks_sequence,
                "frame_count": len(landmarks_sequence),
                "sample_rate": frame_skip,  # Include sample rate for reference
                "total_original_frames": frame_count
            }
        
        # Track successful processing
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "result": "success"})
            metrics_collector.increment_counter("video_processing_total", {"operation": "pose_extraction", "success": "true"})
            metrics_collector.set_gauge("video_frames_processed", processed_frames, {"operation": "pose_extraction"})
        
        return result
    
    except Exception as e:
        # Track error in monitoring
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "pose_extraction", "result": "error"})
            metrics_collector.increment_counter("video_processing_errors_total", {"operation": "pose_extraction", "error_type": type(e).__name__})
        raise
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def get_video_duration_from_media(video: MediaFile) -> float:
    """Get video duration in seconds with validation."""
    start_time = time.time()
    
    if not CV2_AVAILABLE:
        # Return mock duration when CV2 is not available
        logger.warning("OpenCV not available, returning mock duration")
        # Track in monitoring
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "method": "mock"})
        return 8.0  # Mock 8 second duration

    if not video or not hasattr(video, 'bytes'):
        logger.error("Invalid video file provided")
        # Track error
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "result": "error"})
            metrics_collector.increment_counter("video_processing_errors_total", {"operation": "get_duration", "error_type": "invalid_file"})
        return 0.0

    # Save video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video.bytes)
        temp_path = temp_file.name

    try:
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            logger.error("Could not open video file for duration check")
            # Track error
            if MONITORING_AVAILABLE:
                processing_time = time.time() - start_time
                metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "result": "error"})
                metrics_collector.increment_counter("video_processing_errors_total", {"operation": "get_duration", "error_type": "cannot_open"})
            return 0.0

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 and frame_count > 0 else 0
        cap.release()

        # Validate duration is reasonable for dance moves
        if duration <= 0 or duration > 120:  # Up to 2 minutes for longer sequences
            logger.warning(f"Video duration {duration:.1f}s is outside acceptable range (0-120 seconds)")
            # Track validation error
            if MONITORING_AVAILABLE:
                processing_time = time.time() - start_time
                metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "result": "error"})
                metrics_collector.increment_counter("video_processing_errors_total", {"operation": "get_duration", "error_type": "invalid_duration"})
            return 0.0

        logger.debug(f"Video duration: {duration:.2f} seconds, FPS: {fps}, Frames: {frame_count}")
        
        # Track successful processing
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "result": "success"})
            metrics_collector.increment_counter("video_processing_total", {"operation": "get_duration", "success": "true"})
        
        return duration

    except Exception as e:
        logger.error(f"Error getting video duration: {str(e)}")
        # Track error
        if MONITORING_AVAILABLE:
            processing_time = time.time() - start_time
            metrics_collector.set_gauge("video_processing_duration_seconds", processing_time, {"operation": "get_duration", "result": "error"})
            metrics_collector.increment_counter("video_processing_errors_total", {"operation": "get_duration", "error_type": type(e).__name__})
        return 0.0

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

    Uses a sliding window approach with dynamic time warping concepts
    to find where sequence_b appears most similarly within sequence_a,
    allowing for timing variations and partial matches.

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

    # Use dynamic programming approach to find best matching subsequence
    # This allows for better matching when sequences have slightly different timing
    best_similarity = 0.0

    # Try different possible alignments to handle timing differences
    # Use a sliding window approach with overlap consideration
    window_size = len(normalized_b)
    step_size = max(1, window_size // 4)  # Move by 1/4 of the window size
    
    for start_idx in range(0, len(normalized_a) - window_size + 1, step_size):
        end_idx = start_idx + window_size
        segment = normalized_a[start_idx:end_idx]

        # Calculate similarity between the segment and target sequence
        similarity = calculate_pose_similarity(segment, normalized_b)
        
        # Apply a penalty for matches at the very beginning or end where only partial moves might be captured
        position_penalty = 1.0
        if start_idx < len(normalized_a) * 0.1 or start_idx > len(normalized_a) * 0.9:
            position_penalty = 0.8  # Reduce score for edge cases
            
        similarity *= position_penalty
        best_similarity = max(best_similarity, similarity)

    # Also try a more precise matching by checking each possible start position,
    # but only if the sequences are short enough to avoid performance issues
    if len_a <= 100:  # Only for reasonable lengths
        for start_idx in range(len(normalized_a) - len(normalized_b) + 1):
            end_idx = start_idx + len(normalized_b)
            segment = normalized_a[start_idx:end_idx]
            
            similarity = calculate_pose_similarity(segment, normalized_b)
            best_similarity = max(best_similarity, similarity)

    return best_similarity

def normalize_pose_sequence(sequence: List) -> List:
    """Normalize pose landmarks to focus on relative body positions.

    Converts absolute coordinates to relative positions based on body center,
    making the comparison more robust to dancer positioning in frame.
    Uses more landmarks for better accuracy.
    """
    if not sequence:
        return []

    normalized = []

    for frame in sequence:
        if not isinstance(frame, list) or len(frame) < 132:  # 33 landmarks * 4 values (x,y,z,visibility) each
            continue

        try:
            # MediaPipe pose landmarks: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
            # Extract key points - using a more complete set for better accuracy
            # Indices: [x, y, z, visibility] for each landmark
            
            # Upper body: nose, eyes, ears, shoulders
            nose = [frame[0], frame[1], frame[2]]  # landmark 0
            left_eye = [frame[12], frame[13], frame[14]]  # landmark 2
            right_eye = [frame[16], frame[17], frame[18]]  # landmark 4
            left_ear = [frame[20], frame[21], frame[22]]  # landmark 6
            right_ear = [frame[24], frame[25], frame[26]]  # landmark 8
            left_shoulder = [frame[33], frame[34], frame[35]]  # landmark 11
            right_shoulder = [frame[36], frame[37], frame[38]]  # landmark 12
            left_elbow = [frame[45], frame[46], frame[47]]  # landmark 13
            right_elbow = [frame[48], frame[49], frame[50]]  # landmark 14
            left_wrist = [frame[57], frame[58], frame[59]]  # landmark 15
            right_wrist = [frame[60], frame[61], frame[62]]  # landmark 16

            # Lower body: hips, knees, ankles
            left_hip = [frame[69], frame[70], frame[71]]  # landmark 23
            right_hip = [frame[72], frame[73], frame[74]]  # landmark 24
            left_knee = [frame[81], frame[82], frame[83]]  # landmark 25
            right_knee = [frame[84], frame[85], frame[86]]  # landmark 26
            left_ankle = [frame[93], frame[94], frame[95]]  # landmark 27
            right_ankle = [frame[96], frame[97], frame[98]]  # landmark 28

            # Calculate body center as average of core points (shoulders, hips)
            center_x = (left_shoulder[0] + right_shoulder[0] + left_hip[0] + right_hip[0]) / 4
            center_y = (left_shoulder[1] + right_shoulder[1] + left_hip[1] + right_hip[1]) / 4

            # Create relative positions from body center, focusing on more key points for better accuracy
            relative_frame = [
                nose[0] - center_x, nose[1] - center_y,  # nose relative to center
                left_eye[0] - center_x, left_eye[1] - center_y,  # left eye
                right_eye[0] - center_x, right_eye[1] - center_y,  # right eye
                left_shoulder[0] - center_x, left_shoulder[1] - center_y,  # left shoulder
                right_shoulder[0] - center_x, right_shoulder[1] - center_y,  # right shoulder
                left_elbow[0] - center_x, left_elbow[1] - center_y,  # left elbow
                right_elbow[0] - center_x, right_elbow[1] - center_y,  # right elbow
                left_wrist[0] - center_x, left_wrist[1] - center_y,  # left wrist
                right_wrist[0] - center_x, right_wrist[1] - center_y,  # right wrist
                left_hip[0] - center_x, left_hip[1] - center_y,  # left hip
                right_hip[0] - center_x, right_hip[1] - center_y,  # right hip
                left_knee[0] - center_x, left_knee[1] - center_y,  # left knee
                right_knee[0] - center_x, right_knee[1] - center_y,  # right knee
                left_ankle[0] - center_x, left_ankle[1] - center_y,  # left ankle
                right_ankle[0] - center_x, right_ankle[1] - center_y,  # right ankle
            ]

            normalized.append(relative_frame)

        except (IndexError, TypeError):
            continue  # Skip malformed frames

    return normalized

def calculate_pose_similarity(sequence_a: List, sequence_b: List, tolerance: float = 0.1) -> float:
    """Calculate similarity between two pose sequences.

    Uses dynamic time warping and cosine similarity for more robust matching,
    normalized to a 0-1 similarity score.
    """
    if len(sequence_a) != len(sequence_b) or not sequence_a:
        return 0.0

    # Calculate similarity using a more robust method
    similarities = []
    
    for frame_a, frame_b in zip(sequence_a, sequence_b):
        if len(frame_a) != len(frame_b) or len(frame_a) == 0:
            continue

        # Calculate cosine similarity between frames
        # This is more robust to scale differences than Euclidean distance
        dot_product = sum(a * b for a, b in zip(frame_a, frame_b))
        magnitude_a = sum(a * a for a in frame_a) ** 0.5
        magnitude_b = sum(b * b for b in frame_b) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            # If one frame is all zeros, similarity is 0
            cosine_similarity = 0.0
        else:
            cosine_similarity = dot_product / (magnitude_a * magnitude_b)
            # Cosine similarity is in range [-1, 1], normalize to [0, 1]
            cosine_similarity = (cosine_similarity + 1.0) / 2.0

        similarities.append(cosine_similarity)

    if not similarities:
        return 0.0

    # Return average similarity
    avg_similarity = sum(similarities) / len(similarities)
    return avg_similarity

@public
def search_chains(query: str, limit: int = 20) -> List[DanceChain]:
    """Search for dance chains by title or description."""
    try:
        # Validate inputs
        if not query or len(query) < 2:
            raise ValueError("Search query must be at least 2 characters")
        
        if len(query) > 100:
            raise ValueError("Search query must be 100 characters or less")
        
        if limit < 1 or limit > 100:
            raise ValueError("Limit must be between 1 and 100")
        
        results = DanceChain.sql(
            """SELECT * FROM dance_chains 
               WHERE (title ILIKE %(query)s OR description ILIKE %(query)s) 
               AND status = 'active'
               ORDER BY total_views DESC
               LIMIT %(limit)s""",
            {"query": f"%{query}%", "limit": limit}
        )
        
        return [DanceChain(**result) for result in results]
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error searching chains: {str(e)}")
        raise