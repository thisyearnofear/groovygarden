# Neon.tech Database Optimizations

This document explains the performance optimizations applied to the Neon.tech PostgreSQL database for the DegenDancing application.

## Overview

Neon.tech is used as the primary relational database for storing frequently accessed data that requires complex queries and real-time updates. The optimizations focus on:

1. **Indexing strategies** for faster query execution
2. **Materialized views** for complex aggregations
3. **Query planning** for optimal performance
4. **Connection pooling** for efficient resource usage

## Performance Indexes

The following indexes have been added to optimize common query patterns:

### User Profile Indexes
- `idx_user_profiles_display_name`: Fast search by display name
- `idx_user_profiles_created_at`: Ordered retrieval by creation time
- `idx_user_profiles_user_id`: Fast lookup by user ID
- `idx_user_profiles_username`: Fast lookup by username

### Dance Chain Indexes
- `idx_dance_chains_title`: Full-text search on chain titles
- `idx_dance_chains_description`: Full-text search on chain descriptions
- `idx_dance_chains_total_votes`: Ordered retrieval by vote count
- `idx_dance_chains_total_views`: Ordered retrieval by view count
- `idx_dance_chains_creator_id`: Fast lookup by creator
- `idx_dance_chains_category`: Filtering by dance category
- `idx_dance_chains_status`: Filtering by chain status

### Chain Move Indexes
- `idx_chain_moves_chain_id`: Fast lookup of moves in a chain
- `idx_chain_moves_user_id`: Fast lookup of moves by user
- `idx_chain_moves_move_number`: Ordered retrieval by move sequence
- `idx_chain_moves_created_at`: Ordered retrieval by creation time

### Social Indexes
- `idx_votes_move_id`: Fast lookup of votes for a move
- `idx_votes_user_id`: Fast lookup of votes by user
- `idx_follows_follower_id`: Fast lookup of follows by follower
- `idx_follows_following_id`: Fast lookup of follows by following

## Materialized Views

Two materialized views are used to cache complex aggregations:

### User Statistics View
Pre-computes user rankings based on:
- Total votes received
- Follower count
- Chains created
- Moves submitted

### Trending Chains View
Pre-computes trending dance chains based on:
- Vote count (weighted 2x)
- View count
- Featured status

These views are refreshed periodically to maintain accuracy while providing fast query performance.

## Query Optimizations

The following PostgreSQL settings are enabled for better performance monitoring:
- `track_activities`: Tracks active queries
- `track_counts`: Tracks database statistics
- `track_functions`: Tracks function call statistics
- `track_io_timing`: Tracks I/O timing statistics

## Connection Pooling

Neon.tech uses connection pooling through the `psycopg-pool` library to:
- Reduce connection overhead
- Limit concurrent connections
- Reuse database connections efficiently

## Monitoring and Maintenance

### Refreshing Materialized Views
```bash
cd services
python optimizations/neon_optimizations.py --refresh
```

### Adding New Indexes
Indexes can be added to the `add_performance_indexes()` function in `neon_optimizations.py`.

## Benefits

1. **Fast Query Performance**: Indexes reduce query execution time by orders of magnitude
2. **Scalability**: Materialized views handle complex aggregations efficiently
3. **Cost Efficiency**: Optimized queries reduce database load and costs
4. **User Experience**: Fast response times for real-time interactions
5. **Analytics**: Pre-computed views enable fast reporting and dashboards

These optimizations ensure that DegenDancing can handle high user loads while maintaining responsive performance for real-time interactions.