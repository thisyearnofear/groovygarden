# DegenDancing Hybrid Storage Architecture

This document explains the hybrid storage architecture used in DegenDancing, which combines centralized databases, blockchain storage, and decentralized file storage for optimal performance and data integrity.

## Storage Layers

### 1. Neon.tech (PostgreSQL) - Centralized Database
**Purpose**: High-performance storage for frequently changing data and complex queries

**Data Stored**:
- User authentication data
- User profile information (with counters)
- Dance chain metadata
- Social interactions (follows, votes)
- Real-time analytics data

**Benefits**:
- Fast read/write operations for real-time user interactions
- Complex querying capabilities for search and analytics
- ACID compliance for data consistency
- Cost-effective for frequent operations

### 2. Tableland (Base Network) - On-Chain Storage
**Purpose**: Immutable storage for verification and ownership records

**Data Stored**:
- User profile verification records
- Dance chain creation records
- Ownership and authenticity proofs
- Public metadata that benefits from immutability

**Benefits**:
- Cryptographic immutability for trust
- Decentralized storage with no single point of failure
- Transparent verification process
- Potential for NFT integration

### 3. IPFS - Decentralized File Storage
**Purpose**: Cost-effective storage for large media files

**Data Stored**:
- Dance move videos
- User avatars
- Pose data JSON files
- Other media assets

**Benefits**:
- Cost-effective storage for large files
- Content addressing prevents broken links
- Distributed storage improves availability
- Permanent storage with cryptographic verification

## Data Flow

### User Profile Creation
1. User submits profile data through the app
2. Profile stored in Neon.tech PostgreSQL for fast access
3. Profile verification record stored on Tableland for immutability
4. Avatar image stored on IPFS for decentralized access

### Dance Chain Creation
1. User creates dance chain through the app
2. Chain metadata stored in Neon.tech for search and discovery
3. Chain creation record stored on Tableland for provenance
4. Dance move videos stored on IPFS for decentralized access

## Implementation Details

### Tableland Integration
The `tableland.py` module provides utilities for interacting with Tableland:

- `create_user_profile_table()`: Creates the user profiles table on Tableland
- `store_user_profile_on_chain()`: Stores user profile data on Tableland

### Environment Variables
The following environment variables are used for Tableland integration:

- `TABLELAND_CHAIN_ID`: Chain ID for Tableland network (default: Base Sepolia testnet)
- `TABLELAND_CONTRACT_ADDRESS`: Tableland registry contract address
- `TABLELAND_RPC_URL`: RPC endpoint for Tableland network
- `TABLELAND_PRIVATE_KEY`: Private key for account that owns tables

## Benefits of Hybrid Approach

1. **Performance**: Fast user interactions through Neon.tech
2. **Trust**: Immutable records on Tableland for verification
3. **Cost Efficiency**: Decentralized storage for large media files
4. **Scalability**: Each storage layer optimized for its specific use case
5. **User Experience**: Best of all worlds for a seamless experience

This hybrid approach ensures that DegenDancing can scale while maintaining the trustless, decentralized principles of web3.