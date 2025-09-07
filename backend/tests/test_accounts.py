"""
Tests for account handlers
"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add the src directory to the path for imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils.jwt_auth import TokenPayload
from handlers.accounts import (
    create_account_handler,
    list_accounts_handler,
    get_account_handler,
    update_account_handler,
    delete_account_handler,
    update_balance_handler,
    lambda_handler,
    generate_account_id
)


class TestAccountHandlers:
    
    def setup_method(self):
        """Set up test data"""
        self.mock_context = Mock()
        self.test_user_id = "user_123"
        self.test_account_id = "acc_test123"
        
        # Mock user data from JWT
        import time
        current_time = int(time.time())
        self.mock_user_data = TokenPayload(
            user_id=self.test_user_id,
            email='test@example.com',
            exp=current_time + 1800,  # 30 minutes from now
            iat=current_time,         # issued now
            token_type='access'
        )
        
        # Sample account data
        self.sample_account_data = {
            'name': 'Test Savings Account',
            'account_type': 'savings',
            'bank_name': 'BBVA México',
            'bank_code': 'bbva',
            'currency': 'MXN',
            'initial_balance': 1000.0,
            'is_active': True,
            'description': 'My savings account',
            'color': '#FF0000'
        }
        
        # Sample DB account response
        self.sample_db_account = {
            'account_id': self.test_account_id,
            'user_id': self.test_user_id,
            'name': 'Test Savings Account',
            'account_type': 'savings',
            'bank_name': 'BBVA México',
            'bank_code': 'bbva',
            'currency': 'MXN',
            'current_balance': 1000.0,
            'is_active': True,
            'description': 'My savings account',
            'color': '#FF0000',
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }
    
    def _create_event_with_auth(self, base_event):
        """Helper to create event with proper authentication headers"""
        event = base_event.copy()
        event['headers'] = {'Authorization': 'Bearer valid-token'}
        return event
    
    def test_generate_account_id(self):
        """Test account ID generation"""
        account_id = generate_account_id()
        assert account_id.startswith('acc_')
        assert len(account_id) == 20  # 'acc_' + 16 hex characters
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_create_account_success(self, mock_db_client, mock_validate_token):
        """Test successful account creation"""
        # Setup authentication mock
        mock_validate_token.return_value = self.mock_user_data
        
        # Setup database mock
        mock_db = mock_db_client.return_value
        mock_db.create_account.return_value = self.sample_db_account
        
        # Create event
        base_event = {
            'body': json.dumps(self.sample_account_data),
            'httpMethod': 'POST',
            'path': '/accounts'
        }
        event = self._create_event_with_auth(base_event)
        
        # Call handler
        with patch('handlers.accounts.generate_account_id', return_value=self.test_account_id):
            result = create_account_handler(event, self.mock_context)
        
        # Verify response
        assert result['statusCode'] == 201
        response_body = json.loads(result['body'])
        assert response_body['message'] == 'Account created successfully'
        assert response_body['account']['account_id'] == self.test_account_id
        assert response_body['account']['name'] == 'Test Savings Account'
        
        # Verify database call
        mock_db.create_account.assert_called_once()
        create_call_args = mock_db.create_account.call_args[0][0]
        assert create_call_args['user_id'] == self.test_user_id
        assert create_call_args['account_id'] == self.test_account_id
        assert create_call_args['name'] == 'Test Savings Account'
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_create_account_invalid_json(self, mock_db_client, mock_validate_token):
        """Test account creation with invalid JSON"""
        mock_validate_token.return_value = self.mock_user_data
        
        base_event = {
            'body': 'invalid json',
            'httpMethod': 'POST',
            'path': '/accounts'
        }
        event = self._create_event_with_auth(base_event)
        
        result = create_account_handler(event, self.mock_context)
        
        assert result['statusCode'] == 400
        response_body = json.loads(result['body'])
        assert 'Invalid JSON format' in response_body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_create_account_validation_error(self, mock_db_client, mock_validate_token):
        """Test account creation with validation error"""
        mock_validate_token.return_value = self.mock_user_data
        
        invalid_data = self.sample_account_data.copy()
        invalid_data['currency'] = 'INVALID'  # Invalid currency
        
        base_event = {
            'body': json.dumps(invalid_data),
            'httpMethod': 'POST',
            'path': '/accounts'
        }
        event = self._create_event_with_auth(base_event)
        
        result = create_account_handler(event, self.mock_context)
        
        assert result['statusCode'] == 400
        response_body = json.loads(result['body'])
        assert 'error' in response_body
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_list_accounts_success(self, mock_db_client, mock_validate_token):
        """Test successful account listing"""
        mock_validate_token.return_value = self.mock_user_data
        
        # Setup mock
        mock_db = mock_db_client.return_value
        mock_accounts = [self.sample_db_account]
        mock_db.list_user_accounts.return_value = mock_accounts
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/accounts',
            'queryStringParameters': None
        }
        event = self._create_event_with_auth(base_event)
        
        result = list_accounts_handler(event, self.mock_context)
        
        assert result['statusCode'] == 200
        response_body = json.loads(result['body'])
        assert len(response_body['accounts']) == 1
        assert response_body['total_count'] == 1
        assert response_body['active_count'] == 1
        assert 'MXN' in response_body['total_balance_by_currency']
        assert response_body['total_balance_by_currency']['MXN'] == 1000.0
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_list_accounts_with_inactive(self, mock_db_client, mock_validate_token):
        """Test account listing with inactive accounts"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.list_user_accounts.return_value = []
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/accounts',
            'queryStringParameters': {'include_inactive': 'true'}
        }
        event = self._create_event_with_auth(base_event)
        
        result = list_accounts_handler(event, self.mock_context)
        
        # Verify database call
        mock_db.list_user_accounts.assert_called_with(self.test_user_id, True)
        assert result['statusCode'] == 200
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_get_account_success(self, mock_db_client, mock_validate_token):
        """Test successful account retrieval"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.return_value = self.sample_db_account
        
        base_event = {
            'pathParameters': {'account_id': self.test_account_id},
            'httpMethod': 'GET'
        }
        event = self._create_event_with_auth(base_event)
        
        result = get_account_handler(event, self.mock_context)
        
        assert result['statusCode'] == 200
        response_body = json.loads(result['body'])
        assert response_body['account_id'] == self.test_account_id
        assert response_body['name'] == 'Test Savings Account'
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.accounts.DynamoDBClient')
    def test_get_account_not_found(self, mock_db_client, mock_validate_token):
        """Test account retrieval when account doesn't exist"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.return_value = None
        
        base_event = {
            'pathParameters': {'account_id': 'non_existent'},
            'httpMethod': 'GET'
        }
        event = self._create_event_with_auth(base_event)
        
        result = get_account_handler(event, self.mock_context)
        
        assert result['statusCode'] == 404
        response_body = json.loads(result['body'])
        assert 'Account not found' in response_body['error']
    
    def test_get_account_missing_path_parameter(self):
        """Test account retrieval with missing path parameter"""
        # No auth mocking needed since this should fail before auth check
        event = {
            'pathParameters': {},  # Missing account_id
            'httpMethod': 'GET'
        }
        
        with patch('utils.jwt_auth.validate_token_from_event', return_value=self.mock_user_data):
            result = get_account_handler(event, self.mock_context)
        
        assert result['statusCode'] == 400
        response_body = json.loads(result['body'])
        assert 'Account ID is required' in response_body['error']


class TestLambdaHandler:
    
    def setup_method(self):
        """Set up test data"""
        self.mock_context = Mock()
    
    @patch('handlers.accounts.create_account_handler')
    def test_lambda_handler_create_account(self, mock_create):
        """Test lambda handler routing for create account"""
        mock_create.return_value = {'statusCode': 201, 'body': '{}'}
        
        event = {
            'httpMethod': 'POST',
            'path': '/accounts'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_create.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 201
    
    @patch('handlers.accounts.list_accounts_handler')
    def test_lambda_handler_list_accounts(self, mock_list):
        """Test lambda handler routing for list accounts"""
        mock_list.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'GET',
            'path': '/accounts'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_list.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 200
    
    def test_lambda_handler_endpoint_not_found(self):
        """Test lambda handler with unknown endpoint"""
        event = {
            'httpMethod': 'GET',
            'path': '/unknown'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        assert result['statusCode'] == 404
        response_body = json.loads(result['body'])
        assert 'Endpoint not found' in response_body['error']
    
    def test_lambda_handler_with_api_prefix(self):
        """Test lambda handler with API Gateway prefix"""
        with patch('handlers.accounts.create_account_handler') as mock_create:
            mock_create.return_value = {'statusCode': 201, 'body': '{}'}
            
            event = {
                'httpMethod': 'POST',
                'path': '/api/accounts'  # With API prefix
            }
            
            result = lambda_handler(event, self.mock_context)
            
            mock_create.assert_called_once_with(event, self.mock_context)
            assert result['statusCode'] == 201
    
    def test_lambda_handler_exception_handling(self):
        """Test lambda handler exception handling"""
        event = {
            'httpMethod': 'POST'
            # Missing 'path' to trigger exception
        }
        
        result = lambda_handler(event, self.mock_context)
        
        assert result['statusCode'] == 500
        response_body = json.loads(result['body'])
        assert 'Internal server error' in response_body['error']
