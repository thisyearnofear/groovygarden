"""
Test suite for enhanced computer vision functions
"""
import unittest
from unittest.mock import patch, Mock
import numpy as np
from core.chain_service import (
    normalize_pose_sequence, 
    calculate_pose_similarity, 
    find_pose_sequence_match,
    extract_pose_landmarks_from_media,
    get_video_duration_from_media
)
from solar.media import MediaFile


class TestPoseNormalization(unittest.TestCase):
    """Test pose normalization functions"""
    
    def test_normalize_pose_sequence_basic(self):
        """Test basic pose sequence normalization"""
        # Create a sequence with 3 frames, each with 33 landmarks * 4 values (x,y,z,visibility)
        # Using simplified version with just the key landmarks we're using
        test_sequence = [
            [0.5, 0.5, 0.0, 0.9,    # nose (x, y, z, visibility)
             0.3, 0.3, 0.0, 0.9,    # left eye
             0.7, 0.3, 0.0, 0.9,    # right eye
             0.2, 0.6, 0.0, 0.9,    # left shoulder
             0.8, 0.6, 0.0, 0.9,    # right shoulder
             0.2, 0.8, 0.0, 0.9,    # left hip
             0.8, 0.8, 0.0, 0.9],   # right hip
            [0.5, 0.5, 0.0, 0.9,    # Same pose, shifted slightly
             0.3, 0.3, 0.0, 0.9,
             0.7, 0.3, 0.0, 0.9,
             0.2, 0.6, 0.0, 0.9,
             0.8, 0.6, 0.0, 0.9,
             0.2, 0.8, 0.0, 0.9,
             0.8, 0.8, 0.0, 0.9]
        ]
        
        result = normalize_pose_sequence(test_sequence)
        
        # Should return normalized sequence
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)  # Two frames
        # Each frame should have 22 values (11 key points * 2 coordinates each)
        self.assertEqual(len(result[0]), 22)
    
    def test_normalize_pose_sequence_empty(self):
        """Test normalize_pose_sequence with empty input"""
        result = normalize_pose_sequence([])
        self.assertEqual(result, [])
    
    def test_normalize_pose_sequence_invalid_length(self):
        """Test normalize_pose_sequence with invalid input length"""
        # Too short to contain required landmarks
        result = normalize_pose_sequence([[0.1, 0.2]])  # Only 2 values
        self.assertEqual(result, [])


class TestPoseSimilarity(unittest.TestCase):
    """Test pose similarity calculation"""
    
    def test_calculate_pose_similarity_identical(self):
        """Test similarity calculation for identical poses"""
        sequence_a = [[0.0, 0.0, 0.1, 0.1]]
        sequence_b = [[0.0, 0.0, 0.1, 0.1]]
        
        similarity = calculate_pose_similarity(sequence_a, sequence_b)
        
        # Identical poses should have high similarity (but not necessarily 1.0 due to normalization)
        self.assertGreaterEqual(similarity, 0.9)  # Allow for some normalization differences
        self.assertLessEqual(similarity, 1.0)
    
    def test_calculate_pose_similarity_different(self):
        """Test similarity calculation for different poses"""
        sequence_a = [[0.0, 0.0, 0.1, 0.1]]
        sequence_b = [[1.0, 1.0, 1.1, 1.1]]
        
        similarity = calculate_pose_similarity(sequence_a, sequence_b)
        
        # Different poses should have lower similarity
        self.assertLess(similarity, 1.0)
    
    def test_calculate_pose_similarity_different_lengths(self):
        """Test similarity calculation for sequences of different lengths"""
        sequence_a = [[0.0, 0.0, 0.1, 0.1]]
        sequence_b = [[0.0, 0.0, 0.1, 0.1], [0.5, 0.5, 0.6, 0.6]]
        
        similarity = calculate_pose_similarity(sequence_a, sequence_b)
        
        # Should return 0.0 for different lengths
        self.assertEqual(similarity, 0.0)


class TestPoseSequenceMatching(unittest.TestCase):
    """Test pose sequence matching"""
    
    def test_find_pose_sequence_match_perfect(self):
        """Test sequence matching with perfect match"""
        # Create sequences where sequence_b is contained in sequence_a
        sequence_a = [
            [0.0, 0.0, 0.1, 0.1],
            [0.1, 0.1, 0.2, 0.2],
            [0.2, 0.2, 0.3, 0.3],
            [0.3, 0.3, 0.4, 0.4]
        ]
        sequence_b = [
            [0.1, 0.1, 0.2, 0.2],
            [0.2, 0.2, 0.3, 0.3]
        ]
        
        similarity = find_pose_sequence_match(sequence_a, sequence_b)
        
        # Should find high similarity since sequence_b is part of sequence_a
        self.assertGreater(similarity, 0.5)
    
    def test_find_pose_sequence_match_no_match(self):
        """Test sequence matching with no match"""
        sequence_a = [
            [0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0]
        ]
        sequence_b = [
            [1.0, 1.0, 1.0, 1.0],
            [1.0, 1.0, 1.0, 1.0]
        ]
        
        similarity = find_pose_sequence_match(sequence_a, sequence_b)
        
        # Should have low similarity
        self.assertLess(similarity, 0.5)


class TestVideoProcessingFunctions(unittest.TestCase):
    """Test video processing functions"""
    
    @patch('core.chain_service.CV2_AVAILABLE', False)
    def test_extract_pose_landmarks_no_cv2(self):
        """Test pose extraction without OpenCV available"""
        mock_video = Mock()
        mock_video.bytes = b"fake video data"
        
        result = extract_pose_landmarks_from_media(mock_video)
        
        # Should return mock data
        self.assertIn("landmarks", result)
        self.assertIn("frame_count", result)
        self.assertEqual(result["frame_count"], 30)  # Default mock frame count
        self.assertEqual(len(result["landmarks"]), 30)
    
    @patch('core.chain_service.CV2_AVAILABLE', False)
    def test_get_video_duration_no_cv2(self):
        """Test video duration without OpenCV available"""
        mock_video = Mock()
        mock_video.bytes = b"fake video data"
        
        duration = get_video_duration_from_media(mock_video)
        
        # Should return mock duration
        self.assertEqual(duration, 8.0)  # Default mock duration
    
    def test_extract_pose_landmarks_invalid_video(self):
        """Test pose extraction with invalid video"""
        # Test with video that doesn't have bytes attribute
        invalid_video = Mock()
        del invalid_video.bytes
        
        with self.assertRaises(ValueError):
            extract_pose_landmarks_from_media(invalid_video)


class TestVerificationFunctions(unittest.TestCase):
    """Test the complete verification workflow"""
    
    def test_verify_move_sequence_empty(self):
        """Test verify_move_sequence with empty inputs"""
        from core.chain_service import verify_move_sequence
        from core.chain_moves import ChainMove
        
        # Create mock moves list
        mock_moves = []
        
        mock_new_pose_data = {
            "landmarks": [],
            "frame_count": 0
        }
        
        result = verify_move_sequence(mock_moves, mock_new_pose_data)
        
        # Empty moves list should return 1.0 (first move verification)
        self.assertEqual(result, 1.0)
    
    def test_verify_move_sequence_no_pose_data(self):
        """Test verify_move_sequence with no pose data"""
        from core.chain_service import verify_move_sequence
        from core.chain_moves import ChainMove
        
        # Create mock moves list
        mock_moves = [Mock()]
        
        # Test with no pose data
        result = verify_move_sequence(mock_moves, None)
        self.assertEqual(result, 0.0)
        
        # Test with empty pose data
        result = verify_move_sequence(mock_moves, {})
        self.assertEqual(result, 0.0)


if __name__ == '__main__':
    unittest.main()