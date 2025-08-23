"""
Unit tests for user module
Validates registration, login and CRUD operations with security measures
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
from models.user import UserCreate, UserLogin, hash_password, verify_password


class TestUserRegistration:
    """Tests for user registration"""

    def test_create_user_success(self):
        """Test: Successful user registration"""
        with mock_aws():
            # Mock API Gateway event
            event = {
                'httpMethod': 'POST',
                'path': '/users',
                'body': json.dumps({
                    'name': 'Bryan Torres',
                    'email': 'bryan@example.com',
                    'currency': 'MXN',
                    'password': 'MyPassword123!',
                    'confirm_password': 'MyPassword123!'
                })
            }

            with patch.dict(os.environ, {'DYNAMODB_TABLE': 'test-table'}):
                with patch('handlers.users.db_client') as mock_db:
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
                        'email_verified': False
                    }

                    # Execute
                    response = lambda_handler(event, None)

                    # Validate
                    assert response['statusCode'] == 201
                    body = json.loads(response['body'])
                    assert body['message'] == 'User created successfully'
                    assert 'user' in body
                    assert body['user']['email'] == 'bryan@example.com'

    def test_create_user_email_exists(self):
        """Test: Error when email already exists"""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': json.dumps({
                'name': 'Bryan Torres',
                'email': 'bryan@example.com',
                'currency': 'MXN',
                'password': 'MyPassword123!',
                'confirm_password': 'MyPassword123!'
            })
        }

        with patch('handlers.users.db_client') as mock_db:
            # Email already exists
            mock_db.get_user_by_email.return_value = {'email': 'bryan@example.com'}

            response = lambda_handler(event, None)

            assert response['statusCode'] == 409
            body = json.loads(response['body'])
            assert 'Email is already registered' in body['error']

    def test_create_user_weak_password(self):
        """Test: Error with weak password"""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': json.dumps({
                'name': 'Bryan Torres',
                'email': 'bryan@example.com',
                'currency': 'MXN',
                'password': '123',  # Very weak password
                'confirm_password': '123'
            })
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'Invalid registration data' in body['error']

    def test_create_user_password_mismatch(self):
        """Test: Error when passwords don't match"""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': json.dumps({
                'name': 'Bryan Torres',
                'email': 'bryan@example.com',
                'currency': 'MXN',
                'password': 'MyPassword123!',
                'confirm_password': 'DifferentPassword456!'
            })
        }

        response = lambda_handler(event, None)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'Passwords do not match' in body['details']


class TestUserLogin:
    """Tests for user login"""

    def test_login_success(self):
        """Test: Successful login"""
        event = {
            'httpMethod': 'POST',
            'path': '/users/login',
            'body': json.dumps({
                'email': 'bryan@example.com',
                'password': 'MyPassword123!'
            })
        }

        with patch('handlers.users.db_client') as mock_db:
            # User exists and is active
            hashed_password = hash_password('MyPassword123!')
            mock_db.get_user_by_email.return_value = {
                'user_id': 'usr_test123',
                'name': 'Bryan Torres',
                'email': 'bryan@example.com',
                'password_hash': hashed_password,
                'is_active': True,
                'failed_login_attempts': 0
            }
            mock_db.successful_login.return_value = True

            response = lambda_handler(event, None)

            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert body['message'] == 'Successful login'
            assert 'user' in body
            mock_db.successful_login.assert_called_once()

    def test_login_wrong_password(self):
        """Test: Error with incorrect password"""
        event = {
            'httpMethod': 'POST',
            'path': '/users/login',
            'body': json.dumps({
                'email': 'bryan@example.com',
                'password': 'IncorrectPassword123!'
            })
        }

        with patch('handlers.users.db_client') as mock_db:
            hashed_password = hash_password('MyPassword123!')
            mock_db.get_user_by_email.return_value = {
                'user_id': 'usr_test123',
                'email': 'bryan@example.com',
                'password_hash': hashed_password,
                'is_active': True,
                'failed_login_attempts': 2
            }
            mock_db.update_failed_login_attempts.return_value = True

            response = lambda_handler(event, None)

            assert response['statusCode'] == 401
            body = json.loads(response['body'])
            assert 'Invalid credentials' in body['error']
            mock_db.update_failed_login_attempts.assert_called_with('usr_test123', 3)

    def test_login_user_not_found(self):
        """Test: Error when user doesn't exist"""
        event = {
            'httpMethod': 'POST',
            'path': '/users/login',
            'body': json.dumps({
                'email': 'nonexistent@example.com',
                'password': 'MyPassword123!'
            })
        }

        with patch('handlers.users.db_client') as mock_db:
            mock_db.get_user_by_email.return_value = None

            response = lambda_handler(event, None)

            assert response['statusCode'] == 401
            body = json.loads(response['body'])
            assert 'Invalid credentials' in body['error']

    def test_login_account_blocked(self):
        """Test: Error with account blocked due to failed attempts"""
        event = {
            'httpMethod': 'POST',
            'path': '/users/login',
            'body': json.dumps({
                'email': 'bryan@example.com',
                'password': 'IncorrectPassword123!'
            })
        }

        with patch('handlers.users.db_client') as mock_db:
            hashed_password = hash_password('MyPassword123!')
            mock_db.get_user_by_email.return_value = {
                'user_id': 'usr_test123',
                'email': 'bryan@example.com',
                'password_hash': hashed_password,
                'is_active': True,
                'failed_login_attempts': 4  # One more and it gets blocked
            }
            mock_db.update_failed_login_attempts.return_value = True
            mock_db.deactivate_user_temporarily.return_value = True

            response = lambda_handler(event, None)

            assert response['statusCode'] == 423
            body = json.loads(response['body'])
            assert 'Account blocked' in body['error']
            mock_db.deactivate_user_temporarily.assert_called_once()


class TestPasswordSecurity:
    """Tests for password security functions"""

    def test_hash_password(self):
        """Test: Password hashing"""
        password = 'MyPassword123!'
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 20
        assert verify_password(password, hashed)

    def test_verify_password_correct(self):
        """Test: Correct password verification"""
        password = 'MyPassword123!'
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test: Incorrect password verification"""
        password = 'MyPassword123!'
        wrong_password = 'IncorrectPassword456!'
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False


class TestUserValidation:
    """Tests for user data validation"""

    def test_user_create_valid(self):
        """Test: Successful UserCreate validation"""
        user_data = UserCreate(
            name='Bryan Torres',
            email='bryan@example.com',
            currency='MXN',
            password='MyPassword123!',
            confirm_password='MyPassword123!'
        )
        
        assert user_data.name == 'Bryan Torres'
        assert user_data.email == 'bryan@example.com'
        assert user_data.currency == 'MXN'

    def test_user_create_invalid_email(self):
        """Test: Error with invalid email"""
        with pytest.raises(Exception):
            UserCreate(
                name='Bryan Torres',
                email='invalid-email',
                currency='MXN',
                password='MyPassword123!',
                confirm_password='MyPassword123!'
            )

    def test_user_create_invalid_currency(self):
        """Test: Error with invalid currency"""
        with pytest.raises(ValueError, match="Currency not supported"):
            UserCreate(
                name='Bryan Torres',
                email='bryan@example.com',
                currency='XYZ',  # Unsupported currency
                password='MyPassword123!',
                confirm_password='MyPassword123!'
            )

    def test_user_create_invalid_name(self):
        """Test: Error with invalid name"""
        with pytest.raises(ValueError, match="can only contain letters"):
            UserCreate(
                name='Bryan123Torres',  # Numbers not allowed
                email='bryan@example.com',
                currency='MXN',
                password='MyPassword123!',
                confirm_password='MyPassword123!'
            )


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
