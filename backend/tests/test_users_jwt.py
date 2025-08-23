"""
Tests for user handlers with JWT authentication
Tests authentication, authorization, and secure endpoint access
"""

import pytest
import json
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import handlers and JWT utilities
from handlers.users import (
    lambda_handler,
    create_user_handler,
    login_user_handler,
    get_user_handler,
    update_user_handler,
    delete_user_handler,
    get_user_summary_handler,
    refresh_token_handler
)

from utils.jwt_auth import create_access_token, create_refresh_token, create_token_response

class TestAuthenticatedEndpoints:
    """Test endpoints that require JWT authentication"""
    
    def setup_method(self):
        """Setup test data for each test"""
        self.user_id = "test_user_123"
        self.email = "test@example.com"
        self.access_token = create_access_token(self.user_id, self.email)
        self.refresh_token = create_refresh_token(self.user_id, self.email)
        
        # Sample user data
        self.user_data = {
            'user_id': self.user_id,
            'email': self.email,
            'name': 'Test User',
            'currency': 'MXN',
            'is_active': True,
            'created_at': '2025-01-01T00:00:00',
            'updated_at': '2025-01-01T00:00:00'
        }
    
    def create_authenticated_event(self, method='GET', path='/users', body=None, path_params=None):
        """Helper to create authenticated Lambda event"""
        return {
            'httpMethod': method,
            'path': path,
            'headers': {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            },
            'pathParameters': path_params or {},
            'body': json.dumps(body) if body else None
        }
    
    def create_unauthenticated_event(self, method='GET', path='/users', body=None):
        """Helper to create unauthenticated Lambda event"""
        return {
            'httpMethod': method,
            'path': path,
            'headers': {'Content-Type': 'application/json'},
            'pathParameters': {},
            'body': json.dumps(body) if body else None
        }
    
    @patch('handlers.users.db_client')
    def test_get_user_with_valid_auth(self, mock_db):
        """Test getting user with valid authentication"""
        mock_db.get_user_by_id.return_value = self.user_data
        
        event = self.create_authenticated_event(
            method='GET',
            path=f'/users/{self.user_id}',
            path_params={'user_id': self.user_id}
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'user' in body
        assert body['user']['user_id'] == self.user_id
        mock_db.get_user_by_id.assert_called_with(self.user_id)
    
    @patch('handlers.users.db_client')
    def test_get_user_without_auth(self, mock_db):
        """Test getting user without authentication returns 401"""
        event = self.create_unauthenticated_event(
            method='GET',
            path=f'/users/{self.user_id}'
        )
        event['pathParameters'] = {'user_id': self.user_id}
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Authentication required'
        mock_db.get_user_by_id.assert_not_called()
    
    @patch('handlers.users.db_client')
    def test_get_user_wrong_user_id_returns_403(self, mock_db):
        """Test accessing another user's data returns 403"""
        other_user_id = "other_user_456"
        event = self.create_authenticated_event(
            method='GET',
            path=f'/users/{other_user_id}',
            path_params={'user_id': other_user_id}
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 403
        body = json.loads(response['body'])
        assert body['error'] == 'Access denied'
        mock_db.get_user_by_id.assert_not_called()
    
    def test_get_user_summary_with_auth(self):
        """Test getting user summary with authentication"""
        event = self.create_authenticated_event(method='GET', path='/users')
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'authenticated_user' in body
        assert body['authenticated_user']['user_id'] == self.user_id
        assert body['authenticated_user']['email'] == self.email
    
    def test_get_user_summary_without_auth(self):
        """Test getting user summary without authentication returns 401"""
        event = self.create_unauthenticated_event(method='GET', path='/users')
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Authentication required'
    
    @patch('handlers.users.db_client')
    def test_update_user_with_auth(self, mock_db):
        """Test updating user with valid authentication"""
        mock_db.get_user_by_id.return_value = self.user_data
        mock_db.update_user.return_value = {**self.user_data, 'name': 'Updated Name'}
        
        update_data = {'name': 'Updated Name'}
        event = self.create_authenticated_event(
            method='PUT',
            path=f'/users/{self.user_id}',
            path_params={'user_id': self.user_id},
            body=update_data
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['message'] == 'User updated successfully'
        mock_db.get_user_by_id.assert_called_with(self.user_id)
        mock_db.update_user.assert_called_once()
    
    @patch('handlers.users.db_client')
    def test_update_user_wrong_user_returns_403(self, mock_db):
        """Test updating another user's data returns 403"""
        other_user_id = "other_user_456"
        update_data = {'name': 'Hacker Name'}
        event = self.create_authenticated_event(
            method='PUT',
            path=f'/users/{other_user_id}',
            path_params={'user_id': other_user_id},
            body=update_data
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 403
        body = json.loads(response['body'])
        assert body['error'] == 'Access denied'
        mock_db.get_user_by_id.assert_not_called()
    
    @patch('handlers.users.db_client')
    def test_delete_user_with_auth(self, mock_db):
        """Test deleting user with valid authentication"""
        mock_db.get_user_by_id.return_value = self.user_data
        mock_db.delete_user.return_value = None
        
        event = self.create_authenticated_event(
            method='DELETE',
            path=f'/users/{self.user_id}',
            path_params={'user_id': self.user_id}
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['message'] == 'User account deleted successfully'
        mock_db.get_user_by_id.assert_called_with(self.user_id)
        mock_db.delete_user.assert_called_once()
    
    @patch('handlers.users.db_client')
    def test_delete_user_wrong_user_returns_403(self, mock_db):
        """Test deleting another user's account returns 403"""
        other_user_id = "other_user_456"
        event = self.create_authenticated_event(
            method='DELETE',
            path=f'/users/{other_user_id}',
            path_params={'user_id': other_user_id}
        )
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 403
        body = json.loads(response['body'])
        assert body['error'] == 'Access denied'
        mock_db.get_user_by_id.assert_not_called()

class TestLoginWithJWT:
    """Test login functionality with JWT token generation"""
    
    @patch('handlers.users.db_client')
    @patch('models.user.verify_password')
    def test_successful_login_returns_jwt_tokens(self, mock_verify, mock_db):
        """Test successful login returns JWT tokens"""
        user_data = {
            'user_id': 'test_user_123',
            'email': 'test@example.com',
            'name': 'Test User',
            'password_hash': 'hashed_password',
            'is_active': True
        }
        
        mock_db.get_user_by_email.return_value = user_data
        mock_verify.return_value = True
        mock_db.successful_login.return_value = None
        
        login_data = {
            'email': 'test@example.com',
            'password': 'correct_password'
        }
        
        response = login_user_handler(login_data)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        
        # Check JWT tokens are present
        assert 'tokens' in body
        assert 'access_token' in body['tokens']
        assert 'refresh_token' in body['tokens']
        assert body['tokens']['token_type'] == 'Bearer'
        assert 'expires_in' in body['tokens']
        
        # Check user data is present
        assert 'user' in body
        assert body['user']['user_id'] == user_data['user_id']
        assert body['user']['email'] == user_data['email']
        
        # Verify database calls
        mock_db.get_user_by_email.assert_called_with('test@example.com')
        mock_db.successful_login.assert_called_with(user_data['user_id'])
    
    @patch('handlers.users.db_client')
    def test_login_with_nonexistent_email(self, mock_db):
        """Test login with non-existent email returns 401"""
        mock_db.get_user_by_email.return_value = None
        
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'password'
        }
        
        response = login_user_handler(login_data)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Invalid credentials'
    
    @patch('handlers.users.db_client')
    @patch('models.user.verify_password')
    def test_login_with_incorrect_password(self, mock_verify, mock_db):
        """Test login with incorrect password returns 401"""
        user_data = {
            'user_id': 'test_user_123',
            'email': 'test@example.com',
            'password_hash': 'hashed_password',
            'is_active': True,
            'failed_login_attempts': 0
        }
        
        mock_db.get_user_by_email.return_value = user_data
        mock_verify.return_value = False
        mock_db.update_failed_login_attempts.return_value = None
        
        login_data = {
            'email': 'test@example.com',
            'password': 'wrong_password'
        }
        
        response = login_user_handler(login_data)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Invalid credentials'
        
        # Verify failed attempt is recorded
        mock_db.update_failed_login_attempts.assert_called_with(
            user_data['user_id'], 1
        )
    
    @patch('handlers.users.db_client')
    @patch('models.user.verify_password')
    def test_login_inactive_account(self, mock_verify, mock_db):
        """Test login with inactive account returns 403"""
        user_data = {
            'user_id': 'test_user_123',
            'email': 'test@example.com',
            'password_hash': 'hashed_password',
            'is_active': False
        }
        
        mock_db.get_user_by_email.return_value = user_data
        
        login_data = {
            'email': 'test@example.com',
            'password': 'correct_password'
        }
        
        response = login_user_handler(login_data)
        
        assert response['statusCode'] == 403
        body = json.loads(response['body'])
        assert body['error'] == 'Inactive account'

class TestRefreshToken:
    """Test refresh token functionality"""
    
    def test_successful_token_refresh(self):
        """Test successful token refresh"""
        user_id = "test_user_123"
        email = "test@example.com"
        
        refresh_token = create_refresh_token(user_id, email)
        request_data = {'refresh_token': refresh_token}
        
        response = refresh_token_handler(request_data)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        
        assert body['message'] == 'Token refreshed successfully'
        assert 'tokens' in body
        assert 'access_token' in body['tokens']
        assert body['tokens']['token_type'] == 'Bearer'
        assert body['tokens']['user_id'] == user_id
        assert body['tokens']['email'] == email
    
    def test_refresh_token_missing_token(self):
        """Test refresh with missing refresh token"""
        request_data = {}
        
        response = refresh_token_handler(request_data)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['error'] == 'Missing refresh token'
    
    def test_refresh_token_invalid_token(self):
        """Test refresh with invalid token"""
        request_data = {'refresh_token': 'invalid.token.here'}
        
        response = refresh_token_handler(request_data)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Invalid refresh token'
    
    def test_refresh_with_access_token(self):
        """Test refresh fails when using access token instead of refresh token"""
        user_id = "test_user_123"
        email = "test@example.com"
        
        # Use access token instead of refresh token
        access_token = create_access_token(user_id, email)
        request_data = {'refresh_token': access_token}
        
        response = refresh_token_handler(request_data)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Invalid refresh token'

class TestAuthenticationFlow:
    """Integration tests for complete authentication flow"""
    
    @patch('handlers.users.db_client')
    @patch('models.user.verify_password')
    def test_complete_auth_flow(self, mock_verify, mock_db):
        """Test complete authentication flow from login to refresh"""
        # Setup user data
        user_data = {
            'user_id': 'test_user_123',
            'email': 'test@example.com',
            'name': 'Test User',
            'password_hash': 'hashed_password',
            'is_active': True
        }
        
        mock_db.get_user_by_email.return_value = user_data
        mock_db.get_user_by_id.return_value = user_data
        mock_verify.return_value = True
        mock_db.successful_login.return_value = None
        
        # Step 1: Login
        login_data = {'email': 'test@example.com', 'password': 'password'}
        login_response = login_user_handler(login_data)
        
        assert login_response['statusCode'] == 200
        login_body = json.loads(login_response['body'])
        
        access_token = login_body['tokens']['access_token']
        refresh_token = login_body['tokens']['refresh_token']
        
        # Step 2: Use access token to get user data
        auth_event = {
            'httpMethod': 'GET',
            'path': '/users/test_user_123',
            'headers': {'Authorization': f'Bearer {access_token}'},
            'pathParameters': {'user_id': 'test_user_123'},
            'body': None
        }
        
        user_response = lambda_handler(auth_event, None)
        assert user_response['statusCode'] == 200
        
        # Step 3: Refresh token
        refresh_data = {'refresh_token': refresh_token}
        refresh_response = refresh_token_handler(refresh_data)
        
        assert refresh_response['statusCode'] == 200
        refresh_body = json.loads(refresh_response['body'])
        
        new_access_token = refresh_body['tokens']['access_token']
        
        # Step 4: Use new access token
        auth_event['headers']['Authorization'] = f'Bearer {new_access_token}'
        user_response_2 = lambda_handler(auth_event, None)
        assert user_response_2['statusCode'] == 200
    
    def test_expired_token_handling(self):
        """Test that expired tokens are properly rejected"""
        # Create event with invalid/expired token
        event = {
            'httpMethod': 'GET',
            'path': '/users/test_user_123',
            'headers': {'Authorization': 'Bearer expired.or.invalid.token'},
            'pathParameters': {'user_id': 'test_user_123'},
            'body': None
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Authentication required'

class TestTokenSecurity:
    """Test security aspects of JWT implementation"""
    
    def test_user_isolation_in_endpoints(self):
        """Test that users cannot access each other's data"""
        user1_token = create_access_token("user1", "user1@example.com")
        user2_id = "user2"
        
        # User 1 tries to access User 2's data
        event = {
            'httpMethod': 'GET',
            'path': f'/users/{user2_id}',
            'headers': {'Authorization': f'Bearer {user1_token}'},
            'pathParameters': {'user_id': user2_id},
            'body': None
        }
        
        response = lambda_handler(event, None)
        
        assert response['statusCode'] == 403
        body = json.loads(response['body'])
        assert 'Access denied' in body['error']
    
    def test_malformed_bearer_token(self):
        """Test handling of malformed Bearer token"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/test_user_123',
            'headers': {'Authorization': 'Bearer'},  # malformed
            'pathParameters': {'user_id': 'test_user_123'},
            'body': None
        }
        
        response = lambda_handler(event, None)
        assert response['statusCode'] == 401
    
    def test_missing_authorization_header(self):
        """Test handling when Authorization header is missing"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/test_user_123',
            'headers': {},  # no Authorization header
            'pathParameters': {'user_id': 'test_user_123'},
            'body': None
        }
        
        response = lambda_handler(event, None)
        assert response['statusCode'] == 401

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
