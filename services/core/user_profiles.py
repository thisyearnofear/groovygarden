from solar import Table, ColumnDetails
from typing import Optional
from datetime import datetime
import uuid

class UserProfile(Table):
    __tablename__ = "user_profiles"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID  # References Solar authenticated user
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_path: Optional[str] = None  # Path to avatar image in Solar media storage
    avatar_cid: Optional[str] = None   # IPFS CID for avatar image
    location: Optional[str] = None
    dance_styles: Optional[str] = None  # Comma-separated list of preferred styles
    total_chains_created: int = ColumnDetails(default=0)
    total_moves_submitted: int = ColumnDetails(default=0)
    total_votes_received: int = ColumnDetails(default=0)
    follower_count: int = ColumnDetails(default=0)
    following_count: int = ColumnDetails(default=0)
    verified: bool = ColumnDetails(default=False)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    updated_at: datetime = ColumnDetails(default_factory=datetime.now)