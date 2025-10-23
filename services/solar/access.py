from functools import wraps
from typing import Callable, Optional
from fastapi import Request, HTTPException, status
from solar.table import Table
import uuid
import re


class User:
    """
    User class for authentication.
    Note: This doesn't inherit from Table since wallet addresses aren't UUIDs.
    """
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


def get_user_from_request(request: Request) -> Optional[User]:
    """
    Extract user information from request headers.
    For Base Accounts, we use the X-User-Address header.
    For fallback, we could use JWT tokens if needed.
    """
    # Try Base Account wallet address first
    user_address = request.headers.get("X-User-Address")
    if user_address:
        # Validate that it's a proper Ethereum address format
        if re.match(r"^0x[a-fA-F0-9]{40}$", user_address):
            # Create a user object with the wallet address as ID
            return User(id=user_address, email=f"{user_address[:8]}@base.local")
    
    return None


def authenticated(func) -> Callable:
    """
    Enhanced authentication decorator that validates user authentication.
    Works with both Base Accounts (wallet) and potentially JWT tokens.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract request object from function arguments
        request = None
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break
        
        for key, value in kwargs.items():
            if isinstance(value, Request):
                request = value
                break
        
        # If no request object found, assume public access
        if not request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found in function arguments"
            )
        
        # Get user from request
        user = get_user_from_request(request)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authenticated user found"
            )
        
        # Add user to kwargs for the actual function
        kwargs['current_user'] = user
        return await func(*args, **kwargs)

    return wrapper


def public(func) -> Callable:
    """
    Public endpoint decorator that explicitly allows unauthenticated access.
    This is just for clarity and documentation purposes.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper
