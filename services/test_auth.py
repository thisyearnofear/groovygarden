"""
Test suite for authentication enhancements
"""
import unittest
import asyncio
from unittest.mock import Mock, patch, MagicMock
from solar.access import User, authenticated, public, get_user_from_request
from fastapi import Request, HTTPException
from starlette.datastructures import Headers


class TestAuthentication(unittest.TestCase):
    """Test the enhanced authentication system"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.valid_wallet_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.invalid_wallet_address = "invalid_address"
        
    def test_get_user_from_request_with_valid_wallet_address(self):
        """Test getting user from request with valid wallet address"""
        # Create a mock request with valid wallet address
        headers = Headers({"X-User-Address": self.valid_wallet_address})
        mock_request = Mock(spec=Request)
        mock_request.headers = headers
        
        user = get_user_from_request(mock_request)
        
        self.assertIsNotNone(user)
        self.assertEqual(user.id, self.valid_wallet_address)
        self.assertEqual(user.email, f"{self.valid_wallet_address[:8]}@base.local")
    
    def test_get_user_from_request_with_invalid_wallet_address(self):
        """Test getting user from request with invalid wallet address"""
        # Create a mock request with invalid wallet address
        headers = Headers({"X-User-Address": self.invalid_wallet_address})
        mock_request = Mock(spec=Request)
        mock_request.headers = headers
        
        user = get_user_from_request(mock_request)
        
        # Should return None for invalid address
        self.assertIsNone(user)
    
    def test_get_user_from_request_with_no_wallet_address(self):
        """Test getting user from request without wallet address"""
        # Create a mock request without wallet address
        headers = Headers({})
        mock_request = Mock(spec=Request)
        mock_request.headers = headers
        
        user = get_user_from_request(mock_request)
        
        # Should return None when no address provided
        self.assertIsNone(user)
    
    def test_authenticated_decorator_with_valid_user(self):
        """Test authenticated decorator with valid user"""
        # Create a mock async function to decorate (since FastAPI uses async)
        async def mock_func(**kwargs):
            return "success"
        
        decorated_func = authenticated(mock_func)
        
        # Create a mock request with valid wallet address
        headers = Headers({"X-User-Address": self.valid_wallet_address})
        mock_request = Mock(spec=Request)
        mock_request.headers = headers
        
        # Call the decorated function
        # Need to run this in an event loop since it's async
        async def run_test():
            result = await decorated_func(request=mock_request)
            return result
        
        import asyncio
        result = asyncio.run(run_test())
        
        # Note: Since the original function is mocked, we can't directly verify the call
        # but we can verify that it didn't raise an exception
        self.assertEqual(result, "success")
    
    def test_authenticated_decorator_with_invalid_user(self):
        """Test authenticated decorator with invalid user"""
        # Create a mock async function to decorate
        async def mock_func(**kwargs):
            return "success"
        
        decorated_func = authenticated(mock_func)
        
        # Create a mock request without wallet address
        headers = Headers({})
        mock_request = Mock(spec=Request)
        mock_request.headers = headers
        
        # Call the decorated function and expect HTTPException
        async def run_test():
            return await decorated_func(request=mock_request)
        
        import asyncio
        try:
            asyncio.run(run_test())
            self.fail("Expected HTTPException was not raised")
        except HTTPException as e:
            self.assertEqual(e.status_code, 401)
            self.assertEqual(e.detail, "No authenticated user found")
    
    def test_public_decorator(self):
        """Test public decorator allows unauthenticated access"""
        # Create a mock async function to decorate
        async def mock_func():
            return "success"
        
        decorated_func = public(mock_func)
        
        # Call the decorated function without authentication
        async def run_test():
            return await decorated_func()
        
        import asyncio
        result = asyncio.run(run_test())
        
        # Verify the function executed without authentication
        self.assertEqual(result, "success")


if __name__ == '__main__':
    unittest.main()