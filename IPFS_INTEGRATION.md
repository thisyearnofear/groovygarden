# IPFS Integration in DegenDancing

This document explains how IPFS (InterPlanetary File System) is integrated into the DegenDancing application for decentralized storage of media files.

## Overview

IPFS is used to store large media files in a decentralized manner, providing:
- Cost-effective storage for large files
- Content addressing to prevent broken links
- Distributed storage for improved availability
- Permanent storage with cryptographic verification

## Implementation

### IPFS Client

The `ipfs.py` module in `services/core/` provides a wrapper around the `ipfshttpclient` library:

- `IPFSClient`: Main client class for interacting with IPFS
- `store_file()`: Store binary files on IPFS
- `store_json()`: Store JSON data on IPFS
- `retrieve_file()`: Retrieve files from IPFS
- `retrieve_json()`: Retrieve JSON data from IPFS

### Media Storage

User avatars and dance move videos are stored on both S3 (for performance) and IPFS (for decentralization):

1. When a user uploads an avatar:
   - Stored on S3 for fast delivery
   - Also stored on IPFS for decentralized access
   - CID (Content Identifier) saved in the database

2. When dance moves are created:
   - Video files stored on IPFS
   - Pose data stored on IPFS as JSON
   - CIDs referenced in the database

## Configuration

The following environment variables are used for IPFS integration:

- `IPFS_HOST`: IPFS node endpoint (default: Infura)
- `IPFS_PROJECT_ID`: Project ID for authenticated IPFS services
- `IPFS_PROJECT_SECRET`: Project secret for authenticated IPFS services

## Benefits

1. **Cost Efficiency**: IPFS is more cost-effective for storing large media files compared to traditional cloud storage
2. **Permanence**: Content addressing ensures files are permanently available
3. **Decentralization**: No single point of failure
4. **Integrity**: Cryptographic verification ensures file integrity
5. **Interoperability**: Files can be accessed from any IPFS gateway

## Accessing IPFS Content

Files stored on IPFS can be accessed through public gateways:
- `https://ipfs.io/ipfs/{cid}`
- `https://gateway.pinata.cloud/ipfs/{cid}`
- `https://cloudflare-ipfs.com/ipfs/{cid}`

## Future Enhancements

1. **Pinata Integration**: Use Pinata for reliable pinning of important content
2. **NFT.Storage**: Integrate with NFT.Storage for long-term archival
3. **Filecoin**: Use Filecoin for incentivized storage
4. **Content Distribution**: Implement a CDN layer on top of IPFS

This integration ensures that DegenDancing can scale while maintaining the decentralized principles of web3.