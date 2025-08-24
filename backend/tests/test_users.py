"""
Unit tests for user module
Validates user CRUD operations (authentication moved to auth module)
"""

import pytest
import json
import os
from unittest.mock import patch, MagicMock
from moto import mock_aws

# Import system modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from handlers.users import lambda_handler


class TestUserCRUD:
    """Tests for user CRUD operations"""

    def test_get_user_success(self):
        """Test: Successful user retrieval by ID"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/usr_test123',
            'pathParameters': {'user_id': 'usr_test123'},
            'headers': {
                'Authorization': 'Bearer valid_jwt_token'
            }
        }

        with patch('handlers.users.validate_token_from_event') as mock_validate:
            # Mock successful token validation
            mock_user = MagicMock()
            mock_user.user_id = 'usr_test123'
            mock_validate.return_value = mock_user

            with patch('handlers.users.db_client') as mock_db:
                mock_db.get_user_by_id.return_value = {
                    'user_id': 'usr_test123',
                    'name': 'Bryan Torres',
                    'email': 'bryan@example.com',
                    'currency': 'MXN',
                    'is_active': True
                }

                response = lambda_handler(event, None)

                assert response['statusCode'] == 200
                body = json.loads(response['body'])
                assert 'user' in body
                assert body['user']['user_id'] == 'usr_test123'

    def test_get_user_not_found(self):
        """Test: User not found by ID"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/nonexistent',
            'pathParameters': {'user_id': 'nonexistent'},
            'headers': {
                'Authorization': 'Bearer valid_jwt_token'
            }
        }

        with patch('handlers.users.validate_token_from_event') as mock_validate:
            mock_user = MagicMock()
            mock_user.user_id = 'nonexistent'
            mock_validate.return_value = mock_user

            with patch('handlers.users.db_client') as mock_db:
                mock_db.get_user_by_id.return_value = None

                response = lambda_handler(event, None)

                assert response['statusCode'] == 404
                body = json.loads(response['body'])
                assert 'User not found' in body['error']

    def test_get_user_unauthorized(self):
        """Test: Unauthorized access to user data"""
        event = {
            'httpMethod': 'GET',
            'path': '/users/usr_test123',
            'pathParameters': {'user_id': 'usr_test123'},
            'headers': {
                'Authorization': 'Bearer valid_jwt_token'
            }
        }

        with patch('handlers.users.validate_token_from_event') as mock_validate:
            # Mock different user trying to access another user's data
            mock_user = MagicMock()
            mock_user.user_id = 'other_user'
            mock_validate.return_value = mock_user

            response = lambda_handler(event, None)

            assert response['statusCode'] == 403
            body = json.loads(response['body'])
            assert 'Access denied' in body['error']

    def test_update_user_success(self):
        """Test: Successful user update"""
        event = {
            'httpMethod': 'PUT',
            'path': '/users/usr_test123',
            'pathParameters': {'user_id': 'usr_test123'},
            'headers': {
                'Authorization': 'Bearer valid_jwt_token'
            },
            'body': json.dumps({
                'name': 'Bryan Torres Updated',
                'currency': 'USD'
            })
        }

        with patch('handlers.users.validate_token_from_event') as mock_validate:
            mock_user = MagicMock()
            mock_user.user_id = 'usr_test123'
            mock_validate.return_value = mock_user

            with patch('handlers.users.db_client') as mock_db:
                mock_db.get_user_by_id.return_value = {
                    'user_id': 'usr_test123',
                    'name': 'Bryan Torres',
                    'email': 'bryan@example.com'
                }
                mock_db.update_user.return_value = {
                    'user_id': 'usr_test123',
                    'name': 'Bryan Torres Updated',
                    'email': 'bryan@example.com',
                    'currency': 'USD'
                }

                response = lambda_handler(event, None)

                assert response['statusCode'] == 200
                body = json.loads(response['body'])
                assert body['user']['name'] == 'Bryan Torres Updated'

    def test_delete_user_success(self):
        """Test: Successful user deletion"""
        event = {
            'httpMethod': 'DELETE',
            'path': '/users/usr_test123',
            'pathParameters': {'user_id': 'usr_test123'},
            'headers': {
                'Authorization': 'Bearer valid_jwt_token'
            }
        }

        with patch('handlers.users.validate_token_from_event') as mock_validate:
            mock_user = MagicMock()
            mock_user.user_id = 'usr_test123'
            mock_validate.return_value = mock_user

            with patch('handlers.users.db_client') as mock_db:
                mock_db.get_user_by_id.return_value = {
                    'user_id': 'usr_test123',
                    'name': 'Bryan Torres'
                }
                mock_db.delete_user.return_value = True

                response = lambda_handler(event, None)

                assert response['statusCode'] == 200
                body = json.loads(response['body'])
                assert 'deleted successfully' in body['message']


class TestUserRouting:
    """Tests for user endpoint routing"""

    def test_invalid_method(self):
        """Test: Invalid HTTP method for users endpoint"""
        event = {
            'httpMethod': 'PATCH',  # Not supported
            'path': '/users/usr_test123',
            'pathParameters': {'user_id': 'usr_test123'}
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 405
        body = json.loads(response['body'])
        assert 'not allowed' in body['error']

    def test_missing_user_id_for_put(self):
        """Test: PUT request without user_id"""
        event = {
            'httpMethod': 'PUT',
            'path': '/users',
            'body': json.dumps({'name': 'New Name'})
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'user_id is required' in body['error']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
