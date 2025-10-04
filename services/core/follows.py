from solar import Table, ColumnDetails
from datetime import datetime
import uuid

class Follow(Table):
    __tablename__ = "follows"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    follower_id: uuid.UUID  # User who is following
    following_id: uuid.UUID  # User being followed
    created_at: datetime = ColumnDetails(default_factory=datetime.now)