#!/usr/bin/env python3
"""
Database Setup Script for DegenDancing

This script initializes the database with all required tables and seed data.
Run this once to set up your development database.

Usage:
    cd services
    python setup_database.py
"""

import os
import sys
import logging
from pathlib import Path

# Add the services directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables from project root
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_tables():
    """Create all database tables based on model definitions."""

    logger.info("Creating database tables...")

    # Import models
    from core.user import User

    # Define table creation SQL statements
    tables_sql = [
        # Users table (simplified for development)
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE
        );
        """,

        # User profiles table
        """
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            username VARCHAR(50) NOT NULL UNIQUE,
            display_name VARCHAR(100),
            bio TEXT,
            avatar_path VARCHAR(500),
            location VARCHAR(100),
            dance_styles VARCHAR(500),
            total_chains_created INTEGER DEFAULT 0,
            total_moves_submitted INTEGER DEFAULT 0,
            total_votes_received INTEGER DEFAULT 0,
            follower_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0,
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,

        # Dance chains table
        """
        CREATE TABLE IF NOT EXISTS dance_chains (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(200) NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            max_moves INTEGER DEFAULT 10,
            creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'active',
            current_move_count INTEGER DEFAULT 1,
            total_views INTEGER DEFAULT 0,
            total_votes INTEGER DEFAULT 0,
            featured BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,

        # Chain moves table
        """
        CREATE TABLE IF NOT EXISTS chain_moves (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chain_id UUID NOT NULL REFERENCES dance_chains(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            move_number INTEGER NOT NULL,
            video_path VARCHAR(500) NOT NULL,
            pose_data JSONB,
            verification_score REAL,
            duration_seconds REAL NOT NULL,
            votes_up INTEGER DEFAULT 0,
            votes_down INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            flagged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_chain_move UNIQUE(chain_id, move_number)
        );
        """,

        # Votes table
        """
        CREATE TABLE IF NOT EXISTS votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            move_id UUID NOT NULL REFERENCES chain_moves(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_user_vote UNIQUE(move_id, user_id)
        );
        """,

        # Follows table
        """
        CREATE TABLE IF NOT EXISTS follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
            CONSTRAINT no_self_follow CHECK (follower_id != following_id)
        );
        """
    ]

    # Execute table creation
    try:
        for i, sql in enumerate(tables_sql, 1):
            logger.info(f"Creating table {i}/{len(tables_sql)}...")
            User.sql(sql)
        logger.info("✅ All tables created successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return False

def create_indexes():
    """Create database indexes for better performance."""

    logger.info("Creating database indexes...")

    from core.user import User

    indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_dance_chains_creator_id ON dance_chains(creator_id);",
        "CREATE INDEX IF NOT EXISTS idx_dance_chains_category ON dance_chains(category);",
        "CREATE INDEX IF NOT EXISTS idx_dance_chains_status ON dance_chains(status);",
        "CREATE INDEX IF NOT EXISTS idx_dance_chains_created_at ON dance_chains(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_chain_moves_chain_id ON chain_moves(chain_id);",
        "CREATE INDEX IF NOT EXISTS idx_chain_moves_user_id ON chain_moves(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_chain_moves_move_number ON chain_moves(chain_id, move_number);",
        "CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);",
        "CREATE INDEX IF NOT EXISTS idx_votes_move_id ON votes(move_id);",
        "CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);",
        "CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);",
    ]

    try:
        for sql in indexes_sql:
            User.sql(sql)
        logger.info("✅ All indexes created successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")
        return False

def seed_database():
    """Add some initial seed data for development."""

    logger.info("Seeding database with initial data...")

    from core.user import User

    try:
        # Create a test user if it doesn't exist
        test_user_id = "550e8400-e29b-41d4-a716-446655440000"

        # Check if test user exists
        existing_user = User.sql("SELECT id FROM users WHERE id = %s", [test_user_id])
        if not existing_user:
            # Create test user
            User.sql("INSERT INTO users (id, email) VALUES (%s, %s)", [test_user_id, "test@example.com"])
            logger.info("✅ Created test user")

            # Create test user profile
            User.sql("""
                INSERT INTO user_profiles (user_id, username, display_name, bio, dance_styles)
                VALUES (%s, %s, %s, %s, %s)
            """, [test_user_id, "testdancer", "Test Dancer", "A passionate dancer exploring new moves!", "hip-hop, freestyle"])

            logger.info("✅ Created test user profile")

            # Create a sample dance chain
            chain_id = "650e8400-e29b-41d4-a716-446655440001"
            User.sql("""
                INSERT INTO dance_chains (id, title, description, category, creator_id, status, max_moves, current_move_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                chain_id,
                "Basic Hip-Hop Flow",
                "A simple hip-hop dance chain to get you started. Add your unique twist!",
                "hip-hop",
                test_user_id,
                "active",
                5,
                1
            ])

            logger.info("✅ Created sample dance chain")

            # Create initial move for the chain
            move_id = "750e8400-e29b-41d4-a716-446655440002"
            User.sql("""
                INSERT INTO chain_moves (id, chain_id, user_id, move_number, video_path, pose_data, verification_score, duration_seconds)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                move_id,
                chain_id,
                test_user_id,
                1,
                "videos/chains/sample_move_1.mp4",
                '{"landmarks": [], "frame_count": 30}',
                1.0,
                8.5
            ])

            logger.info("✅ Created initial chain move")
        else:
            logger.info("ℹ️  Test data already exists, skipping seed")

        return True
    except Exception as e:
        logger.error(f"❌ Failed to seed database: {e}")
        return False

def test_database_connection():
    """Test database connection and basic functionality."""
    logger.info("Testing database connection...")

    try:
        from solar.table import get_pool
        pool = get_pool()
        logger.info("✅ Database connection successful!")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main setup function."""
    logger.info("🚀 Starting DegenDancing database setup...")

    # Check environment variables
    logger.info("Checking environment configuration...")
    db_vars = [var for var in os.environ.keys() if 'NEON' in var or 'PG_' in var]
    if not db_vars:
        logger.error("❌ No database connection strings found!")
        logger.error("Please set NEON_CONN_URL in your .env file")
        return False

    logger.info(f"✅ Found database environment variables: {db_vars}")

    # Test database connection
    if not test_database_connection():
        return False

    # Import models and config
    try:
        from solar.config import config
        db_urls = config.get_all_pg_connection_strings()
        if not db_urls:
            logger.error("❌ No valid database URLs found in configuration")
            return False
        logger.info(f"✅ Found {len(db_urls)} database connection(s)")
    except Exception as e:
        logger.error(f"❌ Environment configuration error: {e}")
        return False

    # Create tables
    if not create_tables():
        return False

    # Create indexes
    if not create_indexes():
        return False

    # Seed database
    if not seed_database():
        return False

    logger.info("🎉 Database setup completed successfully!")
    logger.info("")
    logger.info("🚀 Next steps:")
    logger.info("1. Start the backend: cd services && python main.py")
    logger.info("2. Start the frontend: cd app && pnpm dev")
    logger.info("3. Visit http://localhost:5173 to see the app")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
