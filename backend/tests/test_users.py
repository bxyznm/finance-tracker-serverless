"""
Unit tests for user management Lambda handlers.

This module tests all CRUD operations for user management:
- User creation with validation
- User retrieval by ID
- User updates with partial data
- User deletion (soft delete)
- Error handling and edge cases

Uses moto for AWS service mocking and pytest for test framework.
"""

import json
import os
import pytest
from datetime import datetime
from unittest.mock import patch

import boto3
from moto import mock_aws

from src.handlers.users import lambda_handler, create_user, get_user, update_user, delete_user


# Test configuration
TEST_REGION = 'us-east-1'  # moto-supported region for testing
TEST_TABLE_NAME = 'test-users-table'


@pytest.fixture
def aws_credentials():
    """Mock AWS credentials for testing."""
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'


@pytest.fixture
def mock_env_vars():
    """Mock environment variables for testing."""
    env_vars = {
        'AWS_REGION': TEST_REGION,
        'APP_AWS_REGION': TEST_REGION,  # Add both for compatibility
        'USERS_TABLE': TEST_TABLE_NAME,  # This is what config.py looks for
        'USERS_TABLE_NAME': TEST_TABLE_NAME
    }
    
    with patch.dict(os.environ, env_vars, clear=False):
        yield


@pytest.fixture
def dynamodb_table(aws_credentials, mock_env_vars):
    """Create a mock DynamoDB table for testing."""
    with mock_aws():
        # Create DynamoDB resource
        dynamodb = boto3.resource('dynamodb', region_name=TEST_REGION)
        
        # Create the users table
        table = dynamodb.create_table(
            TableName=TEST_TABLE_NAME,
            KeySchema=[
                {
                    'AttributeName': 'user_id',
                    'KeyType': 'HASH'
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'email',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'EmailIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'email',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    },
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            BillingMode='PROVISIONED',
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        
        # Wait for table to be created
        table.meta.client.get_waiter('table_exists').wait(TableName=TEST_TABLE_NAME)
        yield table


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'first_name': 'Juan',
        'last_name': 'Pérez',
        'email': 'juan.perez@example.com',
        'phone_number': '+525551234567',
        'birth_date': '1990-05-15'
    }


@pytest.fixture
def lambda_create_event(sample_user_data):
    """Sample Lambda event for user creation."""
    return {
        'httpMethod': 'POST',
        'path': '/users',
        'body': json.dumps(sample_user_data),
        'headers': {'Content-Type': 'application/json'},
        'pathParameters': None,
        'queryStringParameters': None
    }


class TestUserCreation:
    """Test cases for user creation functionality."""
    
    def test_create_user_success(self, dynamodb_table, lambda_create_event):
        """Test successful user creation."""
        # Execute the lambda handler
        response = lambda_handler(lambda_create_event, {})
        
        # Parse response
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        
        # Verify response structure
        assert body['success'] is True
        assert body['message'] == 'User created successfully'
        assert 'data' in body
        
        # Verify user data
        user_data = body['data']
        assert 'user_id' in user_data
        assert user_data['first_name'] == 'Juan'
        assert user_data['last_name'] == 'Pérez'
        assert user_data['email'] == 'juan.perez@example.com'
        assert user_data['phone_number'] == '+525551234567'
        assert user_data['birth_date'] == '1990-05-15'
        assert user_data['is_active'] is True
        assert 'created_at' in user_data
        assert 'updated_at' in user_data
        
        # Verify user exists in DynamoDB
        table_response = dynamodb_table.get_item(
            Key={'user_id': user_data['user_id']}
        )
        assert 'Item' in table_response
    
    def test_create_user_duplicate_email(self, dynamodb_table, lambda_create_event, sample_user_data):
        """Test creating user with duplicate email fails."""
        # Create first user
        first_response = lambda_handler(lambda_create_event, {})
        assert first_response['statusCode'] == 201
        
        # Try to create second user with same email
        second_response = lambda_handler(lambda_create_event, {})
        
        # Should fail with conflict
        assert second_response['statusCode'] == 409
        body = json.loads(second_response['body'])
        assert body['success'] is False
        assert 'already exists' in body['message'].lower()
    
    def test_create_user_invalid_email(self, dynamodb_table, sample_user_data):
        """Test creating user with invalid email format fails."""
        # Create event with invalid email
        sample_user_data['email'] = 'invalid-email'
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': json.dumps(sample_user_data),
            'headers': {'Content-Type': 'application/json'},
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        # Should fail with validation error
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'validation error' in body['message'].lower()
    
    def test_create_user_invalid_phone(self, dynamodb_table, sample_user_data):
        """Test creating user with invalid phone number fails."""
        # Create event with invalid phone
        sample_user_data['phone_number'] = '1234567890'  # Missing +52 prefix
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': json.dumps(sample_user_data),
            'headers': {'Content-Type': 'application/json'},
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        # Should fail with validation error
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'validation error' in body['message'].lower()
    
    def test_create_user_invalid_json(self, dynamodb_table):
        """Test creating user with invalid JSON fails."""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': '{"invalid": json}',
            'headers': {'Content-Type': 'application/json'},
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        # Should fail with JSON error
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'json' in body['message'].lower()


class TestUserRetrieval:
    """Test cases for user retrieval functionality."""
    
    def test_get_user_success(self, dynamodb_table, lambda_create_event):
        """Test successful user retrieval."""
        # First create a user
        create_response = lambda_handler(lambda_create_event, {})
        assert create_response['statusCode'] == 201
        
        # Get the created user ID
        create_body = json.loads(create_response['body'])
        user_id = create_body['data']['user_id']
        
        # Create GET request event
        get_event = {
            'httpMethod': 'GET',
            'path': f'/users/{user_id}',
            'pathParameters': {'user_id': user_id},
            'body': None
        }
        
        # Execute GET request
        response = lambda_handler(get_event, {})
        
        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['success'] is True
        assert body['message'] == 'User retrieved successfully'
        
        # Verify user data
        user_data = body['data']
        assert user_data['user_id'] == user_id
        assert user_data['first_name'] == 'Juan'
        assert user_data['email'] == 'juan.perez@example.com'
    
    def test_get_user_not_found(self, dynamodb_table):
        """Test retrieving non-existent user."""
        event = {
            'httpMethod': 'GET',
            'path': '/users/non-existent-id',
            'pathParameters': {'user_id': 'non-existent-id'},
            'body': None
        }
        
        response = lambda_handler(event, {})
        
        # Should return 404
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'not found' in body['message'].lower()


class TestUserUpdate:
    """Test cases for user update functionality."""
    
    def test_update_user_success(self, dynamodb_table, lambda_create_event):
        """Test successful user update."""
        # First create a user
        create_response = lambda_handler(lambda_create_event, {})
        assert create_response['statusCode'] == 201
        
        # Get the created user ID
        create_body = json.loads(create_response['body'])
        user_id = create_body['data']['user_id']
        
        # Create update request
        update_data = {
            'first_name': 'Juan Carlos',
            'phone_number': '+525559876543'
        }
        update_event = {
            'httpMethod': 'PUT',
            'path': f'/users/{user_id}',
            'pathParameters': {'user_id': user_id},
            'body': json.dumps(update_data),
            'headers': {'Content-Type': 'application/json'}
        }
        
        # Execute update
        response = lambda_handler(update_event, {})
        
        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['success'] is True
        assert body['message'] == 'User updated successfully'
        
        # Verify updated data
        user_data = body['data']
        assert user_data['first_name'] == 'Juan Carlos'
        assert user_data['phone_number'] == '+525559876543'
        assert user_data['email'] == 'juan.perez@example.com'  # Unchanged
        assert user_data['last_name'] == 'Pérez'  # Unchanged
    
    def test_update_user_not_found(self, dynamodb_table):
        """Test updating non-existent user."""
        update_data = {'first_name': 'New Name'}
        event = {
            'httpMethod': 'PUT',
            'path': '/users/non-existent-id',
            'pathParameters': {'user_id': 'non-existent-id'},
            'body': json.dumps(update_data),
            'headers': {'Content-Type': 'application/json'}
        }
        
        response = lambda_handler(event, {})
        
        # Should return 404
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'not found' in body['message'].lower()
    
    def test_update_user_partial_data(self, dynamodb_table, lambda_create_event):
        """Test updating user with partial data."""
        # Create user first
        create_response = lambda_handler(lambda_create_event, {})
        user_id = json.loads(create_response['body'])['data']['user_id']
        
        # Update only last name
        update_data = {'last_name': 'García'}
        update_event = {
            'httpMethod': 'PUT',
            'path': f'/users/{user_id}',
            'pathParameters': {'user_id': user_id},
            'body': json.dumps(update_data),
            'headers': {'Content-Type': 'application/json'}
        }
        
        response = lambda_handler(update_event, {})
        
        # Verify partial update
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        user_data = body['data']
        assert user_data['last_name'] == 'García'
        assert user_data['first_name'] == 'Juan'  # Unchanged


class TestUserDeletion:
    """Test cases for user deletion functionality."""
    
    def test_delete_user_success(self, dynamodb_table, lambda_create_event):
        """Test successful user deletion (soft delete)."""
        # First create a user
        create_response = lambda_handler(lambda_create_event, {})
        assert create_response['statusCode'] == 201
        
        # Get the created user ID
        create_body = json.loads(create_response['body'])
        user_id = create_body['data']['user_id']
        
        # Create delete request
        delete_event = {
            'httpMethod': 'DELETE',
            'path': f'/users/{user_id}',
            'pathParameters': {'user_id': user_id},
            'body': None
        }
        
        # Execute delete
        response = lambda_handler(delete_event, {})
        
        # Verify response
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['success'] is True
        assert body['message'] == 'User deleted successfully'
        assert body['data']['is_active'] is False
        
        # Verify user still exists in DynamoDB but is inactive
        table_response = dynamodb_table.get_item(
            Key={'user_id': user_id}
        )
        assert 'Item' in table_response
        assert table_response['Item']['is_active'] is False
    
    def test_delete_user_not_found(self, dynamodb_table):
        """Test deleting non-existent user."""
        event = {
            'httpMethod': 'DELETE',
            'path': '/users/non-existent-id',
            'pathParameters': {'user_id': 'non-existent-id'},
            'body': None
        }
        
        response = lambda_handler(event, {})
        
        # Should return 404
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'not found' in body['message'].lower()


class TestLambdaHandlerRouting:
    """Test cases for Lambda handler routing logic."""
    
    def test_unsupported_method(self, dynamodb_table):
        """Test unsupported HTTP method returns 405."""
        event = {
            'httpMethod': 'PATCH',
            'path': '/users',
            'body': None,
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 405
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'method not allowed' in body['message'].lower()
    
    def test_get_without_user_id(self, dynamodb_table):
        """Test GET request without user_id returns 405."""
        event = {
            'httpMethod': 'GET',
            'path': '/users',
            'pathParameters': None,
            'body': None
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 405
        body = json.loads(response['body'])
        assert body['success'] is False


class TestErrorHandling:
    """Test cases for error handling scenarios."""
    
    def test_missing_body_for_post(self, dynamodb_table):
        """Test POST request with missing body."""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': None,
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['success'] is False
    
    def test_empty_body_for_post(self, dynamodb_table):
        """Test POST request with empty body."""
        event = {
            'httpMethod': 'POST',
            'path': '/users',
            'body': '{}',
            'pathParameters': None
        }
        
        response = lambda_handler(event, {})
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'validation error' in body['message'].lower()


if __name__ == '__main__':
    pytest.main([__file__])
