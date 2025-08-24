"""
Tests for user handlers with JWT authentication
Tests authorization and secure endpoint access (auth endpoints moved to auth module)
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
    get_user_handler,
    update_user_handler,
    delete_user_handler,
    get_user_summary_handler
)

from utils.jwt_auth import create_access_token, create_refresh_token

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


class TestTokenSecurity:
    """Test security aspects of JWT implementation for user endpoints"""
    
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
    
    def test_invalid_jwt_token(self):
        """Test handling of invalid JWT token"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/test_user_123',
            'headers': {'Authorization': 'Bearer invalid.jwt.token'},
            'pathParameters': {'user_id': 'test_user_123'},
            'body': None
        }
        
        response = lambda_handler(event, None)
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert body['error'] == 'Authentication required'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
