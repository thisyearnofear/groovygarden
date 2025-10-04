from solar import Table, ColumnDetails
from datetime import datetime
import uuid

class Vote(Table):
    __tablename__ = "votes"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    move_id: uuid.UUID  # References chain_moves.id
    user_id: uuid.UUID  # References authenticated user who voted
    vote_type: str  # "up" or "down"
    created_at: datetime = ColumnDetails(default_factory=datetime.now)