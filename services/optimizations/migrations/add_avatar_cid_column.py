"""
Migration script to add avatar_cid column to user_profiles table.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from solar import User
from solar.table import get_connection

def add_avatar_cid_column():
    """Add avatar_cid column to user_profiles table."""
    try:
        # Get database connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='user_profiles' AND column_name='avatar_cid'
        """)
        
        if cursor.fetchone():
            print("Column avatar_cid already exists in user_profiles table")
            return True
        
        # Add avatar_cid column
        cursor.execute("""
            ALTER TABLE user_profiles 
            ADD COLUMN avatar_cid VARCHAR(255)
        """)
        
        conn.commit()
        print("Successfully added avatar_cid column to user_profiles table")
        return True
        
    except Exception as e:
        print(f"Error adding avatar_cid column: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = add_avatar_cid_column()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)