from solar import Table, ColumnDetails
from typing import Optional, List
from datetime import datetime
import uuid

class DanceChain(Table):
    __tablename__ = "dance_chains"
    
    id: uuid.UUID = ColumnDetails(default_factory=uuid.uuid4, primary_key=True)
    title: str
    description: str
    category: str  # e.g., "hip-hop", "contemporary", "breakdance", "freestyle"
    max_moves: int = ColumnDetails(default=10)
    creator_id: uuid.UUID  # References user who created the chain
    status: str = ColumnDetails(default="active")  # "active", "completed", "archived"
    current_move_count: int = ColumnDetails(default=1)  # Number of moves currently in chain
    total_views: int = ColumnDetails(default=0)
    total_votes: int = ColumnDetails(default=0)
    featured: bool = ColumnDetails(default=False)
    created_at: datetime = ColumnDetails(default_factory=datetime.now)
    updated_at: datetime = ColumnDetails(default_factory=datetime.now)