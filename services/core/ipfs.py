"""
IPFS integration for DegenDancing application.
This module provides utilities for storing and retrieving files from IPFS.
"""

import os
import io
import json
import logging
from typing import Optional, Union, Dict, Any
import ipfshttpclient
from solar.media import MediaFile

# Set up logging
logger = logging.getLogger(__name__)

# IPFS configuration
IPFS_HOST = os.getenv("IPFS_HOST", "/dns4/ipfs.infura.io/tcp/5001/https")
IPFS_PROJECT_ID = os.getenv("IPFS_PROJECT_ID")
IPFS_PROJECT_SECRET = os.getenv("IPFS_PROJECT_SECRET")

class IPFSClient:
    """Client for interacting with IPFS."""
    
    def __init__(self):
        """Initialize the IPFS client."""
        self.host = IPFS_HOST
        self.client = None
        self._connect()
    
    def _connect(self):
        """Connect to the IPFS node."""
        try:
            if IPFS_PROJECT_ID and IPFS_PROJECT_SECRET:
                # Connect with authentication
                auth = (IPFS_PROJECT_ID, IPFS_PROJECT_SECRET)
                self.client = ipfshttpclient.connect(self.host, auth=auth)
            else:
                # Connect without authentication (for local nodes)
                self.client = ipfshttpclient.connect(self.host)
            
            logger.info("Connected to IPFS node")
        except Exception as e:
            logger.error(f"Failed to connect to IPFS node: {str(e)}")
            self.client = None
    
    def store_file(self, file_data: Union[bytes, str, io.BytesIO], file_name: Optional[str] = None) -> Optional[str]:
        """
        Store a file on IPFS.
        
        Args:
            file_data: File content as bytes, string, or BytesIO object
            file_name: Optional name for the file
            
        Returns:
            CID (Content Identifier) if successful, None otherwise
        """
        if not self.client:
            logger.error("IPFS client not initialized")
            return None
        
        try:
            # Convert file_data to bytes if it's a string
            if isinstance(file_data, str):
                file_data = file_data.encode('utf-8')
            
            # If it's a BytesIO object, get the bytes
            if isinstance(file_data, io.BytesIO):
                file_data = file_data.getvalue()
            
            # Add file to IPFS
            result = self.client.add_bytes(file_data)
            
            # Pin the file to ensure it's not garbage collected
            self.client.pin.add(result)
            
            logger.info(f"File stored on IPFS with CID: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error storing file on IPFS: {str(e)}")
            return None
    
    def store_json(self, data: Dict[str, Any], file_name: Optional[str] = None) -> Optional[str]:
        """
        Store JSON data on IPFS.
        
        Args:
            data: Dictionary to store as JSON
            file_name: Optional name for the file
            
        Returns:
            CID (Content Identifier) if successful, None otherwise
        """
        try:
            json_data = json.dumps(data, indent=2)
            return self.store_file(json_data, file_name)
        except Exception as e:
            logger.error(f"Error storing JSON data on IPFS: {str(e)}")
            return None
    
    def retrieve_file(self, cid: str) -> Optional[bytes]:
        """
        Retrieve a file from IPFS.
        
        Args:
            cid: Content Identifier of the file to retrieve
            
        Returns:
            File content as bytes if successful, None otherwise
        """
        if not self.client:
            logger.error("IPFS client not initialized")
            return None
        
        try:
            # Get file from IPFS
            result = self.client.cat(cid)
            logger.info(f"File retrieved from IPFS with CID: {cid}")
            return result
        except Exception as e:
            logger.error(f"Error retrieving file from IPFS: {str(e)}")
            return None
    
    def retrieve_json(self, cid: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve JSON data from IPFS.
        
        Args:
            cid: Content Identifier of the JSON file to retrieve
            
        Returns:
            JSON data as dictionary if successful, None otherwise
        """
        try:
            file_data = self.retrieve_file(cid)
            if file_data:
                json_data = json.loads(file_data.decode('utf-8'))
                return json_data
            return None
        except Exception as e:
            logger.error(f"Error retrieving JSON data from IPFS: {str(e)}")
            return None

# Global instance
ipfs_client = IPFSClient()

def store_media_file(media_file: MediaFile) -> Optional[str]:
    """
    Store a media file on IPFS.
    
    Args:
        media_file: MediaFile object to store
        
    Returns:
        CID (Content Identifier) if successful, None otherwise
    """
    try:
        # Get the file content
        if hasattr(media_file, 'content'):
            file_content = media_file.content
        elif hasattr(media_file, 'file'):
            file_content = media_file.file.read()
        else:
            logger.error("MediaFile object has no recognizable content attribute")
            return None
        
        # Store on IPFS
        cid = ipfs_client.store_file(file_content, media_file.filename)
        return cid
    except Exception as e:
        logger.error(f"Error storing media file on IPFS: {str(e)}")
        return None

def store_pose_data(pose_data: Dict[str, Any]) -> Optional[str]:
    """
    Store pose data JSON on IPFS.
    
    Args:
        pose_data: Pose data dictionary to store
        
    Returns:
        CID (Content Identifier) if successful, None otherwise
    """
    try:
        return ipfs_client.store_json(pose_data, "pose_data.json")
    except Exception as e:
        logger.error(f"Error storing pose data on IPFS: {str(e)}")
        return None

def get_ipfs_gateway_url(cid: str) -> str:
    """
    Get a gateway URL for accessing IPFS content.
    
    Args:
        cid: Content Identifier
        
    Returns:
        Gateway URL for accessing the content
    """
    # Using a public IPFS gateway
    return f"https://ipfs.io/ipfs/{cid}"

# Example usage:
# cid = store_media_file(media_file)
# if cid:
#     gateway_url = get_ipfs_gateway_url(cid)
#     print(f"Access your file at: {gateway_url}")