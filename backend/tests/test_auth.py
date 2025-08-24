"""
Unit tests for auth module
Validates login, register, and refresh token operations
"""

import pytest
import json
import os
from unittest.mock import patch, MagicMock
from moto import mock_aws

# Import system modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from handlers.auth import lambda_handler
from models.user import UserCreate, UserLogin, hash_password, verify_password


class TestAuthRegistration:
    """Tests for user registration via auth endpoint"""

    def test_register_user_success(self):
        """Test: Successful user registration"""
        with mock_aws():
            # Mock API Gateway event for /auth/register
            event = {
                'httpMethod': 'POST',
                'path': '/auth/register',
                'body': json.dumps({
                    'name': 'Bryan Torres',
                    'email': 'bryan@example.com',
                    'currency': 'MXN',
                    'password': 'MyPassword123!',
                    'confirm_password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    # Configure mocks
                    mock_db.get_user_by_email.return_value = None  # Email doesn't exist
                    mock_db.create_user.return_value = {
                        'user_id': 'usr_test123',
                        'name': 'Bryan Torres',
                        'email': 'bryan@example.com',
                        'currency': 'MXN',
                        'created_at': '2025-08-22T00:00:00',
                        'updated_at': '2025-08-22T00:00:00',
                        'is_active': True,
                    }

                    # Mock JWT token creation
                    with patch('handlers.auth.create_token_response') as mock_token:
                        mock_token.return_value = {
                            'access_token': 'test_access_token',
                            'refresh_token': 'test_refresh_token',
                            'token_type': 'bearer',
                            'expires_in': 3600
                        }

                        # Call handler
                        response = lambda_handler(event, None)

                        # Assert response
                        assert response['statusCode'] == 201
                        body = json.loads(response['body'])
                        assert body['user_id'] == 'usr_test123'
                        assert body['name'] == 'Bryan Torres'
                        assert body['email'] == 'bryan@example.com'
                        assert 'access_token' in body
                        assert 'refresh_token' in body
                        assert 'password_hash' not in body

    def test_register_user_duplicate_email(self):
        """Test: Registration with existing email fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/register',
                'body': json.dumps({
                    'name': 'Bryan Torres',
                    'email': 'existing@example.com',
                    'currency': 'MXN',
                    'password': 'MyPassword123!',
                    'confirm_password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    # Configure mock to return existing user
                    mock_db.get_user_by_email.return_value = {
                        'user_id': 'existing_user',
                        'email': 'existing@example.com'
                    }

                    response = lambda_handler(event, None)

                    # Assert error response
                    assert response['statusCode'] == 409
                    body = json.loads(response['body'])
                    assert body['error'] == 'Email is already registered'

    def test_register_user_invalid_data(self):
        """Test: Registration with invalid data fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/register',
                'body': json.dumps({
                    'name': '',  # Invalid: empty name
                    'email': 'invalid-email',  # Invalid email
                    'password': '123'  # Invalid: weak password
                })
            }

            response = lambda_handler(event, None)

            # Assert validation error
            assert response['statusCode'] == 400
            body = json.loads(response['body'])
            assert 'error' in body


class TestAuthLogin:
    """Tests for user authentication"""

    def test_login_success(self):
        """Test: Successful login"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/login',
                'body': json.dumps({
                    'email': 'bryan@example.com',
                    'password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    # Mock user exists with hashed password
                    hashed_password = hash_password('MyPassword123!')
                    mock_db.get_user_by_email.return_value = {
                        'user_id': 'usr_test123',
                        'name': 'Bryan Torres',
                        'email': 'bryan@example.com',
                        'currency': 'MXN',
                        'password_hash': hashed_password,
                        'is_active': True,
                        'created_at': '2025-08-22T00:00:00',
                        'updated_at': '2025-08-22T00:00:00'
                    }
                    mock_db.update_user_last_login.return_value = True

                    # Mock JWT token creation
                    with patch('handlers.auth.create_token_response') as mock_token:
                        mock_token.return_value = {
                            'access_token': 'test_access_token',
                            'refresh_token': 'test_refresh_token',
                            'token_type': 'bearer',
                            'expires_in': 3600
                        }

                        response = lambda_handler(event, None)

                        # Assert success response
                        assert response['statusCode'] == 200
                        body = json.loads(response['body'])
                        assert 'access_token' in body
                        assert 'refresh_token' in body
                        assert 'user' in body
                        assert body['user']['user_id'] == 'usr_test123'
                        assert 'password_hash' not in body['user']

    def test_login_invalid_email(self):
        """Test: Login with non-existent email fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/login',
                'body': json.dumps({
                    'email': 'nonexistent@example.com',
                    'password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    mock_db.get_user_by_email.return_value = None

                    response = lambda_handler(event, None)

                    # Assert unauthorized response
                    assert response['statusCode'] == 401
                    body = json.loads(response['body'])
                    assert body['error'] == 'Invalid credentials'

    def test_login_incorrect_password(self):
        """Test: Login with incorrect password fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/login',
                'body': json.dumps({
                    'email': 'bryan@example.com',
                    'password': 'WrongPassword!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    # Mock user exists with different password
                    hashed_password = hash_password('CorrectPassword123!')
                    mock_db.get_user_by_email.return_value = {
                        'user_id': 'usr_test123',
                        'email': 'bryan@example.com',
                        'password_hash': hashed_password,
                        'is_active': True
                    }

                    response = lambda_handler(event, None)

                    # Assert unauthorized response
                    assert response['statusCode'] == 401
                    body = json.loads(response['body'])
                    assert body['error'] == 'Invalid credentials'

    def test_login_inactive_user(self):
        """Test: Login with inactive account fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/login',
                'body': json.dumps({
                    'email': 'bryan@example.com',
                    'password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.auth.db_client') as mock_db:
                    hashed_password = hash_password('MyPassword123!')
                    mock_db.get_user_by_email.return_value = {
                        'user_id': 'usr_test123',
                        'email': 'bryan@example.com',
                        'password_hash': hashed_password,
                        'is_active': False  # Inactive account
                    }

                    response = lambda_handler(event, None)

                    # Assert unauthorized response
                    assert response['statusCode'] == 401
                    body = json.loads(response['body'])
                    assert body['error'] == 'User account not found or disabled'


class TestAuthRefreshToken:
    """Tests for token refresh"""

    def test_refresh_token_success(self):
        """Test: Successful token refresh"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/refresh',
                'body': json.dumps({
                    'refresh_token': 'valid_refresh_token'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('utils.jwt_auth.refresh_access_token') as mock_refresh:
                    mock_refresh.return_value = {
                        'access_token': 'new_access_token',
                        'refresh_token': 'new_refresh_token',
                        'token_type': 'bearer',
                        'expires_in': 3600,
                        'user_id': 'usr_test123',
                        'email': 'bryan@example.com'
                    }

                    response = lambda_handler(event, None)

                    # Assert success response
                    assert response['statusCode'] == 200
                    body = json.loads(response['body'])
                    assert body['access_token'] == 'new_access_token'
                    assert body['refresh_token'] == 'new_refresh_token'

    def test_refresh_token_missing(self):
        """Test: Refresh without token fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/refresh',
                'body': json.dumps({})
            }

            response = lambda_handler(event, None)

            # Assert bad request
            assert response['statusCode'] == 400
            body = json.loads(response['body'])
            assert body['error'] == 'refresh_token is required'

    def test_refresh_token_invalid(self):
        """Test: Refresh with invalid token fails"""
        with mock_aws():
            event = {
                'httpMethod': 'POST',
                'path': '/auth/refresh',
                'body': json.dumps({
                    'refresh_token': 'invalid_token'
                })
            }

            with patch('utils.jwt_auth.refresh_access_token') as mock_refresh:
                mock_refresh.side_effect = Exception("Invalid token")

                response = lambda_handler(event, None)

                # Assert unauthorized response
                assert response['statusCode'] == 401
                body = json.loads(response['body'])
                assert body['error'] == 'Invalid or expired refresh token'


class TestAuthRouting:
    """Tests for auth endpoint routing"""

    def test_invalid_endpoint(self):
        """Test: Request to non-existent auth endpoint"""
        event = {
            'httpMethod': 'POST',
            'path': '/auth/invalid',
            'body': '{}'
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert body['error'] == 'Auth endpoint not found'

    def test_invalid_method(self):
        """Test: Invalid HTTP method"""
        event = {
            'httpMethod': 'GET',
            'path': '/auth/login',
            'body': '{}'
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 405
        body = json.loads(response['body'])
        assert 'not allowed' in body['error']

    def test_invalid_json(self):
        """Test: Invalid JSON in request body"""
        event = {
            'httpMethod': 'POST',
            'path': '/auth/login',
            'body': 'invalid json'
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['error'] == 'Invalid JSON in request body'
