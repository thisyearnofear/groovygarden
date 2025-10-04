from solar import Table, ColumnDetails
from typing import Optional, Dict, List
from datetime import datetime
import uuid

class ChainMove(Table):
    __tablename__ = "chain_moves"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    chain_id: uuid.UUID  # References dance_chains.id
    user_id: uuid.UUID  # References authenticated user who created this move
    move_number: int  # Position in the chain (1, 2, 3, etc.)
    video_path: str  # Path to video file in Solar media storage
    pose_data: Dict  # JSON containing MediaPipe pose landmarks for the move
    verification_score: Optional[float] = None  # AI accuracy score for previous moves (0-1)
    duration_seconds: float  # Length of the video in seconds
    votes_up: int = ColumnDetails(default=0)
    votes_down: int = ColumnDetails(default=0)
    views: int = ColumnDetails(default=0)
    flagged: bool = ColumnDetails(default=False)  # For content moderation
    created_at: datetime = ColumnDetails(default_factory=datetime.now)