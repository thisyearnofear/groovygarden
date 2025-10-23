"""
Test suite for enhanced service validation and error handling
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import uuid
from core.user_service import get_user_profile, create_user_profile, update_user_profile, get_public_user_profile
from core.chain_service import create_dance_chain, get_dance_chains, add_move_to_chain
from core.voting_service import vote_on_move, remove_vote, get_user_vote_on_move, get_top_moves
from solar.access import User
from solar.media import MediaFile


class TestUserServiceValidation(unittest.TestCase):
    """Test enhanced user service validation and error handling"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_user = User(id="0x742d35Cc6634C0532925a3b844Bc454e4438f44e", email="test@test.local")
        self.mock_media_file = MediaFile(size=1000, mime_type="image/jpeg", bytes=b"fake image data")
    
    @patch('core.user_service.UserProfile.sql')
    @patch('core.user_service.get_user_profile')
    def test_get_user_profile_with_exception(self, mock_get_profile, mock_sql):
        """Test get_user_profile handles exceptions properly"""
        mock_sql.side_effect = Exception("Database error")
        
        with self.assertRaises(Exception):
            get_user_profile(self.mock_user)
    
    @patch('core.user_service.UserProfile.sql')
    def test_create_user_profile_validations(self, mock_sql):
        """Test create_user_profile validation"""
        mock_sql.return_value = []  # No existing profile
        
        # Test username length validation
        with self.assertRaises(ValueError) as context:
            create_user_profile(self.mock_user, username="ab", display_name="Test User")
        self.assertIn("3 and 50 characters", str(context.exception))
        
        # Test username max length validation
        long_username = "a" * 51
        with self.assertRaises(ValueError) as context:
            create_user_profile(self.mock_user, username=long_username, display_name="Test User")
        self.assertIn("3 and 50 characters", str(context.exception))
        
        # Test display name validation
        with self.assertRaises(ValueError) as context:
            create_user_profile(
                self.mock_user, 
                username="validuser", 
                display_name="a" * 101  # Too long
            )
        self.assertIn("100 characters", str(context.exception))
        
        # Test bio validation
        with self.assertRaises(ValueError) as context:
            create_user_profile(
                self.mock_user, 
                username="validuser", 
                bio="a" * 501  # Too long
            )
        self.assertIn("500 characters", str(context.exception))
    
    @patch('core.user_service.UserProfile.sql')
    @patch('core.user_service.get_user_profile')
    def test_update_user_profile_validations(self, mock_get_profile, mock_sql):
        """Test update_user_profile validation"""
        # Mock existing profile
        mock_profile = Mock()
        mock_profile.user_id = self.mock_user.id
        mock_profile.username = "existinguser"
        mock_get_profile.return_value = mock_profile
        mock_sql.return_value = [{"id": "profile-id", "user_id": self.mock_user.id}]
        
        # Test display name validation
        with self.assertRaises(ValueError) as context:
            update_user_profile(
                self.mock_user,
                display_name="a" * 101  # Too long
            )
        self.assertIn("100 characters", str(context.exception))
        
        # Test bio validation
        with self.assertRaises(ValueError) as context:
            update_user_profile(
                self.mock_user,
                bio="a" * 501  # Too long
            )
        self.assertIn("500 characters", str(context.exception))
    
    @patch('core.user_service.UserProfile.sql')
    def test_get_public_user_profile_validations(self, mock_sql):
        """Test get_public_user_profile validation"""
        mock_sql.return_value = []
        
        # Test username length validation (too short)
        with self.assertRaises(ValueError) as context:
            get_public_user_profile("ab")
        self.assertIn("3 and 50 characters", str(context.exception))
        
        # Test username length validation (too long)
        with self.assertRaises(ValueError) as context:
            get_public_user_profile("a" * 51)
        self.assertIn("3 and 50 characters", str(context.exception))


class TestChainServiceValidation(unittest.TestCase):
    """Test enhanced chain service validation and error handling"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_user = User(id="0x742d35Cc6634C0532925a3b844Bc454e4438f44e", email="test@test.local")
        self.mock_media_file = MediaFile(size=1000, mime_type="video/mp4", bytes=b"fake video data")
    
    @patch('core.chain_service.get_dance_chains')
    def test_get_dance_chains_validations(self, mock_get_chains):
        """Test get_dance_chains validation"""
        mock_get_chains.return_value = []
        
        # Test limit validation (too low)
        with self.assertRaises(ValueError) as context:
            get_dance_chains(limit=0)
        self.assertIn("1 and 100", str(context.exception))
        
        # Test limit validation (too high)
        with self.assertRaises(ValueError) as context:
            get_dance_chains(limit=101)
        self.assertIn("1 and 100", str(context.exception))
        
        # Test offset validation
        with self.assertRaises(ValueError) as context:
            get_dance_chains(offset=-1)
        self.assertIn("non-negative", str(context.exception))
    
    @patch('core.chain_service.UserProfile.sql')
    @patch('core.chain_service.extract_pose_landmarks_from_media')
    @patch('core.chain_service.get_video_duration_from_media')
    @patch('core.chain_service.save_to_bucket')
    @patch('uuid.uuid4')
    def test_create_dance_chain_validations(self, mock_uuid, mock_save, mock_duration, mock_extract, mock_profile_sql):
        """Test create_dance_chain validation"""
        mock_profile_sql.return_value = [{"id": "profile-id"}]  # User has profile
        mock_duration.return_value = 10.0
        mock_extract.return_value = {"landmarks": [], "frame_count": 0}
        mock_save.return_value = "test-video-path"
        mock_uuid.return_value = "mock-uuid"
        
        # Test title validation (too short)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "", "description", "category", self.mock_media_file)
        self.assertIn("1 and 200 characters", str(context.exception))
        
        # Test title validation (too long)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "a" * 201, "description", "category", self.mock_media_file)
        self.assertIn("1 and 200 characters", str(context.exception))
        
        # Test description validation (too long)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "valid title", "a" * 1001, "category", self.mock_media_file)
        self.assertIn("1000 characters", str(context.exception))
        
        # Test category validation (too long)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "valid title", "description", "a" * 51, self.mock_media_file)
        self.assertIn("1 and 50 characters", str(context.exception))
        
        # Test max_moves validation (too low)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "valid title", "description", "category", self.mock_media_file, max_moves=1)
        self.assertIn("2 and 50", str(context.exception))
        
        # Test max_moves validation (too high)
        with self.assertRaises(ValueError) as context:
            create_dance_chain(self.mock_user, "valid title", "description", "category", self.mock_media_file, max_moves=51)
        self.assertIn("2 and 50", str(context.exception))
    
    @patch('core.chain_service.get_dance_chain')
    @patch('core.chain_service.get_chain_moves')
    @patch('core.chain_service.verify_move_sequence')
    @patch('core.chain_service.extract_pose_landmarks_from_media')
    @patch('core.chain_service.get_video_duration_from_media')
    @patch('core.chain_service.save_to_bucket')
    @patch('core.chain_service.UserProfile.sql')
    def test_add_move_to_chain_validations(self, mock_profile_sql, mock_save, mock_duration, mock_extract, mock_verify, mock_get_moves, mock_get_chain):
        """Test add_move_to_chain validation"""
        # Setup mocks
        mock_profile_sql.return_value = [{"id": "profile-id"}]  # User has profile
        mock_get_chain.return_value = Mock()
        mock_get_chain.return_value.status = "active"
        mock_get_chain.return_value.current_move_count = 1
        mock_get_chain.return_value.max_moves = 10
        mock_get_moves.return_value = []
        mock_duration.return_value = 10.0
        mock_extract.return_value = {"landmarks": [], "frame_count": 0}
        mock_verify.return_value = 0.8  # Good verification score
        mock_save.return_value = "test-video-path"
        
        # Test with invalid chain_id
        with self.assertRaises(ValueError) as context:
            add_move_to_chain(self.mock_user, None, self.mock_media_file)
        self.assertIn("Chain ID is required", str(context.exception))


class TestVotingServiceValidation(unittest.TestCase):
    """Test enhanced voting service validation and error handling"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_user = User(id="0x742d35Cc6634C0532925a3b844Bc454e4438f44e", email="test@test.local")
        self.mock_chain_id = uuid.uuid4()
        self.mock_move_id = uuid.uuid4()
    
    @patch('core.voting_service.Vote.sql')
    @patch('core.voting_service.ChainMove.sql')
    @patch('core.voting_service.UserProfile.sql')
    def test_vote_on_move_validations(self, mock_user_profile_sql, mock_chain_move_sql, mock_vote_sql):
        """Test vote_on_move validation"""
        # Setup mocks
        mock_user_profile_sql.return_value = [{"id": "profile-id"}]  # User has profile
        mock_chain_move_sql.return_value = [{"id": self.mock_move_id, "user_id": "different-user-id"}]
        mock_vote_sql.return_value = []  # No existing vote
        
        # Test with invalid move_id
        with self.assertRaises(ValueError) as context:
            vote_on_move(self.mock_user, None, "up")
        self.assertIn("Move ID is required", str(context.exception))
        
        # Test with invalid vote type
        with self.assertRaises(ValueError) as context:
            vote_on_move(self.mock_user, self.mock_move_id, "invalid")
        self.assertIn("Vote type must be", str(context.exception))
    
    @patch('core.voting_service.Vote.sql')
    def test_remove_vote_validations(self, mock_vote_sql):
        """Test remove_vote validation"""
        mock_vote_sql.return_value = []
        
        # Test with invalid move_id
        result = remove_vote(self.mock_user, None)
        self.assertFalse(result)
    
    @patch('core.voting_service.Vote.sql')
    def test_get_user_vote_on_move_validations(self, mock_vote_sql):
        """Test get_user_vote_on_move validation"""
        mock_vote_sql.return_value = []
        
        # Test with invalid move_id
        with self.assertRaises(ValueError) as context:
            get_user_vote_on_move(self.mock_user, None)
        self.assertIn("Move ID is required", str(context.exception))
    
    @patch('core.voting_service.ChainMove.sql')
    def test_get_top_moves_validations(self, mock_chain_move_sql):
        """Test get_top_moves validation"""
        mock_chain_move_sql.return_value = []
        
        # Test limit validation (too low)
        with self.assertRaises(ValueError) as context:
            get_top_moves(limit=0)
        self.assertIn("1 and 100", str(context.exception))
        
        # Test limit validation (too high)
        with self.assertRaises(ValueError) as context:
            get_top_moves(limit=101)
        self.assertIn("1 and 100", str(context.exception))


class TestVotingServiceEdgeCases(unittest.TestCase):
    """Test voting service edge cases"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_user = User(id="0x742d35Cc6634C0532925a3b844Bc454e4438f44e", email="test@test.local")
        self.mock_move_id = uuid.uuid4()
    
    @patch('core.voting_service.Vote.sql')
    @patch('core.voting_service.ChainMove.sql')
    @patch('core.voting_service.UserProfile.sql')
    def test_vote_on_own_move(self, mock_user_profile_sql, mock_chain_move_sql, mock_vote_sql):
        """Test that users can't vote on their own moves"""
        # Setup mocks - user is the move creator
        mock_user_profile_sql.return_value = [{"id": "profile-id"}]
        mock_chain_move_sql.return_value = [{"id": self.mock_move_id, "user_id": self.mock_user.id}]
        mock_vote_sql.return_value = []
        
        with self.assertRaises(ValueError) as context:
            vote_on_move(self.mock_user, self.mock_move_id, "up")
        self.assertIn("Cannot vote on your own move", str(context.exception))


if __name__ == '__main__':
    unittest.main()