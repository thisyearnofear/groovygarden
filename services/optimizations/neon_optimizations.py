"""
Neon.tech database optimizations for DegenDancing.
This script adds performance optimizations for the PostgreSQL database.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from solar import User
from solar.table import get_connection
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_performance_indexes():
    """Add additional indexes for better query performance."""
    try:
        # Get database connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Additional indexes for performance optimization
        indexes_sql = [
            # Index for user profile search by display name
            "CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);",
            
            # Index for dance chains search by title (full text search)
            "CREATE INDEX IF NOT EXISTS idx_dance_chains_title ON dance_chains USING gin(to_tsvector('english', title));",
            
            # Index for dance chains search by description (full text search)
            "CREATE INDEX IF NOT EXISTS idx_dance_chains_description ON dance_chains USING gin(to_tsvector('english', description));",
            
            # Index for chain moves ordered by creation time
            "CREATE INDEX IF NOT EXISTS idx_chain_moves_created_at ON chain_moves(created_at DESC);",
            
            # Index for votes ordered by creation time
            "CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);",
            
            # Index for follows ordered by creation time
            "CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);",
            
            # Composite index for chain moves search by chain and move number
            "CREATE INDEX IF NOT EXISTS idx_chain_moves_chain_move ON chain_moves(chain_id, move_number);",
            
            # Index for user profiles ordered by creation time
            "CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);",
            
            # Index for dance chains ordered by total votes
            "CREATE INDEX IF NOT EXISTS idx_dance_chains_total_votes ON dance_chains(total_votes DESC);",
            
            # Index for dance chains ordered by total views
            "CREATE INDEX IF NOT EXISTS idx_dance_chains_total_views ON dance_chains(total_views DESC);",
        ]
        
        # Execute index creation
        for i, sql in enumerate(indexes_sql, 1):
            logger.info(f"Creating index {i}/{len(indexes_sql)}...")
            cursor.execute(sql)
        
        conn.commit()
        logger.info("✅ All performance indexes created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create performance indexes: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def add_materialized_views():
    """Add materialized views for complex queries."""
    try:
        # Get database connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Materialized view for user statistics
        cursor.execute("""
            CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
            SELECT 
                up.user_id,
                up.username,
                up.display_name,
                up.avatar_path,
                up.avatar_cid,
                up.total_chains_created,
                up.total_moves_submitted,
                up.total_votes_received,
                up.follower_count,
                up.following_count,
                up.verified,
                up.created_at
            FROM user_profiles up
            ORDER BY up.total_votes_received DESC, up.follower_count DESC;
        """)
        
        # Index for the materialized view
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);
        """)
        
        # Materialized view for trending dance chains
        cursor.execute("""
            CREATE MATERIALIZED VIEW IF NOT EXISTS trending_chains AS
            SELECT 
                dc.id,
                dc.title,
                dc.description,
                dc.category,
                dc.creator_id,
                dc.total_views,
                dc.total_votes,
                dc.featured,
                dc.created_at,
                up.username as creator_username,
                up.avatar_path as creator_avatar_path,
                up.avatar_cid as creator_avatar_cid
            FROM dance_chains dc
            JOIN user_profiles up ON dc.creator_id = up.user_id
            WHERE dc.status = 'active'
            ORDER BY (dc.total_votes * 2 + dc.total_views) DESC
            LIMIT 100;
        """)
        
        # Index for the materialized view
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_trending_chains_id ON trending_chains(id);
        """)
        
        conn.commit()
        logger.info("✅ Materialized views created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create materialized views: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def refresh_materialized_views():
    """Refresh materialized views."""
    try:
        # Get database connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Refresh materialized views
        cursor.execute("REFRESH MATERIALIZED VIEW user_statistics;")
        cursor.execute("REFRESH MATERIALIZED VIEW trending_chains;")
        
        conn.commit()
        logger.info("✅ Materialized views refreshed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to refresh materialized views: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def add_query_optimizations():
    """Add query optimizations and statistics."""
    try:
        # Get database connection
        conn = get_connection()
        cursor = conn.cursor()
        
        # Enable query planner statistics
        cursor.execute("SET track_activities = on;")
        cursor.execute("SET track_counts = on;")
        cursor.execute("SET track_functions = all;")
        cursor.execute("SET track_io_timing = on;")
        
        conn.commit()
        logger.info("✅ Query optimizations enabled successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to enable query optimizations: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    """Main optimization function."""
    logger.info("🚀 Starting Neon.tech database optimizations...")
    
    # Add performance indexes
    if not add_performance_indexes():
        return False
    
    # Add materialized views
    if not add_materialized_views():
        return False
    
    # Add query optimizations
    if not add_query_optimizations():
        return False
    
    logger.info("🎉 Database optimizations completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    if success:
        logger.info("✅ All optimizations applied successfully!")
        logger.info("💡 To refresh materialized views later, run: python optimizations/neon_optimizations.py --refresh")
        
        # Check if refresh flag was passed
        if len(sys.argv) > 1 and sys.argv[1] == "--refresh":
            refresh_materialized_views()
    else:
        logger.error("❌ Database optimizations failed!")
        sys.exit(1)