from typing import Optional, List
from solar.access import User, authenticated, public
from core.votes import Vote
from core.chain_moves import ChainMove
from core.user_profiles import UserProfile
import uuid
import logging

logger = logging.getLogger(__name__)

@authenticated
def vote_on_move(user: User, move_id: uuid.UUID, vote_type: str) -> Vote:
    """Vote on a specific move. vote_type should be 'up' or 'down'."""
    try:
        # Validate inputs
        if not move_id:
            raise ValueError("Move ID is required")
        
        if vote_type not in ["up", "down"]:
            raise ValueError("Vote type must be 'up' or 'down'")
        
        # Check if user has a profile
        profile_results = UserProfile.sql(
            "SELECT id FROM user_profiles WHERE user_id = %(user_id)s",
            {"user_id": user.id}
        )
        if not profile_results:
            raise ValueError("User must create a profile before voting")
        
        # Check if move exists
        move_results = ChainMove.sql(
            "SELECT id, user_id FROM chain_moves WHERE id = %(move_id)s",
            {"move_id": move_id}
        )
        if not move_results:
            raise ValueError("Move not found")
        
        move_data = move_results[0]
        
        # Check if user is trying to vote on their own move
        if move_data["user_id"] == user.id:
            raise ValueError("Cannot vote on your own move")
        
        # Check if user has already voted on this move
        existing_vote = Vote.sql(
            "SELECT id, vote_type FROM votes WHERE move_id = %(move_id)s AND user_id = %(user_id)s",
            {"move_id": move_id, "user_id": user.id}
        )
        
        if existing_vote:
            # Update existing vote if different
            old_vote = Vote(**existing_vote[0])
            if old_vote.vote_type != vote_type:
                # Remove old vote count
                if old_vote.vote_type == "up":
                    ChainMove.sql(
                        "UPDATE chain_moves SET votes_up = votes_up - 1 WHERE id = %(move_id)s",
                        {"move_id": move_id}
                    )
                else:
                    ChainMove.sql(
                        "UPDATE chain_moves SET votes_down = votes_down - 1 WHERE id = %(move_id)s",
                        {"move_id": move_id}
                    )
                
                # Update vote
                old_vote.vote_type = vote_type
                old_vote.sync()
                
                # Add new vote count
                if vote_type == "up":
                    ChainMove.sql(
                        "UPDATE chain_moves SET votes_up = votes_up + 1 WHERE id = %(move_id)s",
                        {"move_id": move_id}
                    )
                else:
                    ChainMove.sql(
                        "UPDATE chain_moves SET votes_down = votes_down + 1 WHERE id = %(move_id)s",
                        {"move_id": move_id}
                    )
                
                return old_vote
            else:
                # Same vote type, no change needed
                return old_vote
        
        # Create new vote
        vote = Vote(
            move_id=move_id,
            user_id=user.id,
            vote_type=vote_type
        )
        vote.sync()
        
        # Update move vote count
        if vote_type == "up":
            ChainMove.sql(
                "UPDATE chain_moves SET votes_up = votes_up + 1 WHERE id = %(move_id)s",
                {"move_id": move_id}
            )
        else:
            ChainMove.sql(
                "UPDATE chain_moves SET votes_down = votes_down + 1 WHERE id = %(move_id)s",
                {"move_id": move_id}
            )
        
        # Update creator's total votes received
        UserProfile.sql(
            "UPDATE user_profiles SET total_votes_received = total_votes_received + 1 WHERE user_id = %(creator_id)s",
            {"creator_id": move_data["user_id"]}
        )
        
        return vote
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error voting on move: {str(e)}")
        raise

@authenticated
def remove_vote(user: User, move_id: uuid.UUID) -> bool:
    """Remove a user's vote from a move."""
    try:
        # Validate inputs
        if not move_id:
            raise ValueError("Move ID is required")
        
        # Find existing vote
        existing_vote = Vote.sql(
            "SELECT id, vote_type FROM votes WHERE move_id = %(move_id)s AND user_id = %(user_id)s",
            {"move_id": move_id, "user_id": user.id}
        )
        
        if not existing_vote:
            return False
        
        vote_data = existing_vote[0]
        
        # Remove vote count from move
        if vote_data["vote_type"] == "up":
            ChainMove.sql(
                "UPDATE chain_moves SET votes_up = votes_up - 1 WHERE id = %(move_id)s",
                {"move_id": move_id}
            )
        else:
            ChainMove.sql(
                "UPDATE chain_moves SET votes_down = votes_down - 1 WHERE id = %(move_id)s",
                {"move_id": move_id}
            )
        
        # Delete the vote
        Vote.sql(
            "DELETE FROM votes WHERE id = %(vote_id)s",
            {"vote_id": vote_data["id"]}
        )
        
        return True
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error removing vote: {str(e)}")
        raise

@authenticated
def get_user_vote_on_move(user: User, move_id: uuid.UUID) -> Optional[Vote]:
    """Get the current user's vote on a specific move."""
    try:
        # Validate inputs
        if not move_id:
            raise ValueError("Move ID is required")
        
        results = Vote.sql(
            "SELECT * FROM votes WHERE move_id = %(move_id)s AND user_id = %(user_id)s",
            {"move_id": move_id, "user_id": user.id}
        )
        
        if not results:
            return None
        
        return Vote(**results[0])
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting user vote on move: {str(e)}")
        raise

@public
def get_top_moves(limit: int = 20) -> List[ChainMove]:
    """Get the top-voted moves across all chains."""
    try:
        # Validate inputs
        if limit < 1 or limit > 100:
            raise ValueError("Limit must be between 1 and 100")
        
        results = ChainMove.sql(
            """SELECT * FROM chain_moves 
               WHERE flagged = false
               ORDER BY (votes_up - votes_down) DESC, votes_up DESC
               LIMIT %(limit)s""",
            {"limit": limit}
        )
        
        moves = []
        for result in results:
            move = ChainMove(**result)
            # Generate presigned URL for video
            from solar.media import generate_presigned_url
            move.video_path = generate_presigned_url(move.video_path)
            moves.append(move)
        
        return moves
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting top moves: {str(e)}")
        raise

@public  
def get_move_leaderboard_for_chain(chain_id: uuid.UUID) -> List[ChainMove]:
    """Get moves for a specific chain ranked by votes."""
    try:
        # Validate inputs
        if not chain_id:
            raise ValueError("Chain ID is required")
        
        results = ChainMove.sql(
            """SELECT * FROM chain_moves 
               WHERE chain_id = %(chain_id)s AND flagged = false
               ORDER BY (votes_up - votes_down) DESC, votes_up DESC""",
            {"chain_id": chain_id}
        )
        
        moves = []
        for result in results:
            move = ChainMove(**result)
            # Generate presigned URL for video
            from solar.media import generate_presigned_url
            move.video_path = generate_presigned_url(move.video_path)
            moves.append(move)
        
        return moves
    except ValueError:
        # Re-raise value errors as they are validation errors
        raise
    except Exception as e:
        logger.error(f"Error getting move leaderboard for chain: {str(e)}")
        raise