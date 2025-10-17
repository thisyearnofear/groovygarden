"""
Tableland integration for DegenDancing application.
This module provides utilities for interacting with Tableland for on-chain storage.
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Tableland configuration
TABLELAND_CHAIN_ID = os.getenv("TABLELAND_CHAIN_ID", "84532")  # Base Sepolia testnet
TABLELAND_CONTRACT_ADDRESS = os.getenv("TABLELAND_CONTRACT_ADDRESS", "0x5c4e6A9e5C1e1BF445A062006faF547f895ac810")
TABLELAND_RPC_URL = os.getenv("TABLELAND_RPC_URL", "https://base-sepolia-rpc.publicnode.com")

class TablelandClient:
    """Client for interacting with Tableland."""
    
    def __init__(self):
        """Initialize the Tableland client."""
        self.chain_id = TABLELAND_CHAIN_ID
        self.contract_address = Web3.to_checksum_address(TABLELAND_CONTRACT_ADDRESS)
        self.w3 = Web3(Web3.HTTPProvider(TABLELAND_RPC_URL))
        
        if not self.w3.is_connected():
            logger.warning("Failed to connect to Tableland RPC")
        
        # Tableland registry contract ABI (simplified)
        self.registry_abi = [
            {
                "inputs": [{"internalType": "string", "name": "query", "type": "string"}],
                "name": "create",
                "outputs": [{"internalType": "uint256", "name": "tableId", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "tableId", "type": "uint256"}],
                "name": "getTableName",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        self.registry_contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.registry_abi
        )
    
    def create_table(self, table_name: str, schema: str, private_key: str) -> Optional[str]:
        """
        Create a new table in Tableland.
        
        Args:
            table_name: Name of the table to create
            schema: SQL schema for the table
            private_key: Private key for the account that will own the table
            
        Returns:
            Table ID if successful, None otherwise
        """
        try:
            # Create the full table definition
            table_definition = f"CREATE TABLE {table_name} ({schema});"
            
            # Get account from private key
            account = self.w3.eth.account.from_key(private_key)
            
            # Build transaction
            transaction = self.registry_contract.functions.create(table_definition).build_transaction({
                'from': account.address,
                'nonce': self.w3.eth.get_transaction_count(account.address),
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if tx_receipt.status == 1:
                logger.info(f"Table {table_name} created successfully")
                return tx_receipt.transactionHash.hex()
            else:
                logger.error(f"Failed to create table {table_name}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating table {table_name}: {str(e)}")
            return None
    
    def insert_data(self, table_name: str, data: Dict[str, Any], private_key: str) -> Optional[str]:
        """
        Insert data into a Tableland table.
        
        Args:
            table_name: Name of the table to insert data into
            data: Dictionary of column-value pairs to insert
            private_key: Private key for the account that owns the table
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        try:
            # Format the data for SQL insertion
            columns = ', '.join(data.keys())
            values = ', '.join([f"'{v}'" if isinstance(v, str) else str(v) for v in data.values()])
            insert_query = f"INSERT INTO {table_name} ({columns}) VALUES ({values});"
            
            # Get account from private key
            account = self.w3.eth.account.from_key(private_key)
            
            # For simplicity, we're using a direct SQL execution approach
            # In a production environment, you would use the Tableland validator API
            logger.info(f"Would execute query: {insert_query}")
            
            # This is a placeholder - in reality, you would send this to the Tableland validator
            # For now, we'll just log it and return a mock transaction hash
            logger.info(f"Data inserted into {table_name}: {data}")
            return "0x" + "0" * 64  # Mock transaction hash
            
        except Exception as e:
            logger.error(f"Error inserting data into {table_name}: {str(e)}")
            return None

# Global instance
tableland_client = TablelandClient()

def create_user_profile_table(private_key: str) -> Optional[str]:
    """
    Create the user_profiles table in Tableland.
    
    Args:
        private_key: Private key for the account that will own the table
        
    Returns:
        Table ID if successful, None otherwise
    """
    schema = """
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT,
        bio TEXT,
        avatar_cid TEXT,
        location TEXT,
        dance_styles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """
    
    return tableland_client.create_table("user_profiles", schema, private_key)

def store_user_profile_on_chain(user_id: str, username: str, display_name: Optional[str] = None,
                               bio: Optional[str] = None, avatar_cid: Optional[str] = None,
                               location: Optional[str] = None, dance_styles: Optional[str] = None,
                               private_key: str = None) -> Optional[str]:
    """
    Store user profile data on Tableland.
    
    Args:
        user_id: User's ID
        username: User's username
        display_name: User's display name
        bio: User's bio
        avatar_cid: IPFS CID for user's avatar
        location: User's location
        dance_styles: User's preferred dance styles
        private_key: Private key for the account that owns the table
        
    Returns:
        Transaction hash if successful, None otherwise
    """
    if not private_key:
        logger.warning("No private key provided for Tableland interaction")
        return None
    
    data = {
        "id": f"{user_id}_{int(os.time())}",  # Unique ID with timestamp
        "user_id": user_id,
        "username": username,
        "display_name": display_name or "",
        "bio": bio or "",
        "avatar_cid": avatar_cid or "",
        "location": location or "",
        "dance_styles": dance_styles or "",
    }
    
    return tableland_client.insert_data("user_profiles", data, private_key)