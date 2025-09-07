"""
Tests for transaction handlers
Tests all transaction CRUD operations and business logic
"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime

from handlers.transactions import (
    create_transaction_handler,
    list_transactions_handler,
    get_transaction_handler,
    update_transaction_handler,
    delete_transaction_handler,
    get_transaction_summary_handler,
    lambda_handler,
    generate_transaction_id
)
from utils.jwt_auth import TokenPayload


class TestTransactionHandlers:
    
    def setup_method(self):
        """Set up test data"""
        self.mock_context = Mock()
        self.test_user_id = "user_123"
        self.test_account_id = "acc_test123"
        self.test_transaction_id = "txn_test123"
        
        # Mock user data from JWT - create proper TokenPayload object
        self.mock_user_data = TokenPayload(
            user_id=self.test_user_id,
            email='test@example.com',
            exp=1234567890,
            iat=1234567800
        )
        
        # Sample account data
        self.sample_account = {
            'account_id': self.test_account_id,
            'user_id': self.test_user_id,
            'name': 'Test Checking Account',
            'account_type': 'checking',
            'bank_name': 'BBVA México',
            'currency': 'MXN',
            'current_balance': 1000.0,
            'is_active': True,
            'created_at': '2024-01-01T00:00:00',
            'updated_at': '2024-01-01T00:00:00'
        }
        
        # Sample transaction data
        self.sample_transaction_data = {
            'account_id': self.test_account_id,
            'amount': 250.75,
            'description': 'Grocery shopping',
            'transaction_type': 'expense',
            'category': 'groceries'
        }
        
        # Sample DB transaction response
        self.sample_db_transaction = {
            'transaction_id': self.test_transaction_id,
            'user_id': self.test_user_id,
            'account_id': self.test_account_id,
            'account_name': 'Test Checking Account',
            'amount': 250.75,
            'description': 'Grocery shopping',
            'transaction_type': 'expense',
            'category': 'groceries',
            'status': 'completed',
            'transaction_date': '2024-01-15T10:30:00',
            'reference_number': None,
            'notes': None,
            'tags': [],
            'location': None,
            'destination_account_id': None,
            'destination_account_name': None,
            'account_balance_after': 749.25,
            'is_recurring': False,
            'recurring_frequency': None,
            'created_at': '2024-01-15T10:30:00',
            'updated_at': '2024-01-15T10:30:00'
        }
    
    def _create_event_with_auth(self, base_event):
        """Helper to create event with proper authentication headers"""
        event = base_event.copy()
        event['headers'] = {
            'Authorization': 'Bearer valid_token',
            'Content-Type': 'application/json'
        }
        return event
    
    def test_generate_transaction_id(self):
        """Test transaction ID generation"""
        txn_id = generate_transaction_id()
        assert txn_id.startswith('txn_')
        assert len(txn_id) == 16  # 'txn_' + 12 hex chars
        
        # Generate another one to ensure uniqueness
        txn_id2 = generate_transaction_id()
        assert txn_id != txn_id2
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transaction_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction creation"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.return_value = self.sample_account
        mock_db.create_transaction.return_value = self.sample_db_transaction
        mock_db.update_account.return_value = None
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': json.dumps(self.sample_transaction_data)
        }
        event = self._create_event_with_auth(base_event)
        
        with patch('handlers.transactions.generate_transaction_id', return_value=self.test_transaction_id):
            response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        assert 'transaction' in body
        assert body['transaction']['transaction_id'] == self.test_transaction_id
        assert body['transaction']['amount'] == 250.75
        
        # Verify database calls
        mock_db.get_account_by_id.assert_called_once_with(self.test_user_id, self.test_account_id)
        mock_db.create_transaction.assert_called_once()
        mock_db.update_account.assert_called_once()
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transaction_account_not_found(self, mock_db_client, mock_validate_token):
        """Test transaction creation with non-existent account"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.return_value = None  # Account not found
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': json.dumps(self.sample_transaction_data)
        }
        event = self._create_event_with_auth(base_event)
        
        response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'Account not found' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transaction_inactive_account(self, mock_db_client, mock_validate_token):
        """Test transaction creation with inactive account"""
        mock_validate_token.return_value = self.mock_user_data
        
        inactive_account = self.sample_account.copy()
        inactive_account['is_active'] = False
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.return_value = inactive_account
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': json.dumps(self.sample_transaction_data)
        }
        event = self._create_event_with_auth(base_event)
        
        response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'inactive account' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transfer_transaction_success(self, mock_db_client, mock_validate_token):
        """Test successful transfer transaction creation"""
        mock_validate_token.return_value = self.mock_user_data
        
        # Destination account
        dest_account = {
            'account_id': 'acc_dest456',
            'user_id': self.test_user_id,
            'name': 'Savings Account',
            'current_balance': 500.0,
            'is_active': True
        }
        
        transfer_data = {
            'account_id': self.test_account_id,
            'destination_account_id': 'acc_dest456',
            'amount': 200.0,
            'description': 'Transfer to savings',
            'transaction_type': 'transfer',
            'category': 'account_transfer'
        }
        
        mock_db = mock_db_client.return_value
        mock_db.get_account_by_id.side_effect = lambda user_id, account_id: {
            self.test_account_id: self.sample_account,
            'acc_dest456': dest_account
        }.get(account_id)
        mock_db.create_transaction.return_value = self.sample_db_transaction
        mock_db.update_account.return_value = None
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': json.dumps(transfer_data)
        }
        event = self._create_event_with_auth(base_event)
        
        with patch('handlers.transactions.generate_transaction_id', return_value=self.test_transaction_id):
            response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 201
        
        # Verify both transactions were created (source and destination)
        assert mock_db.create_transaction.call_count == 2
        # Verify both accounts were updated
        assert mock_db.update_account.call_count == 2
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transaction_invalid_json(self, mock_db_client, mock_validate_token):
        """Test transaction creation with invalid JSON"""
        mock_validate_token.return_value = self.mock_user_data
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': 'invalid json'
        }
        event = self._create_event_with_auth(base_event)
        
        response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'Invalid JSON format' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_create_transaction_validation_error(self, mock_db_client, mock_validate_token):
        """Test transaction creation with validation error"""
        mock_validate_token.return_value = self.mock_user_data
        
        invalid_data = {
            'account_id': self.test_account_id,
            'amount': 0.0,  # Invalid zero amount
            'description': '',  # Invalid empty description
            'transaction_type': 'expense',
            'category': 'groceries'
        }
        
        base_event = {
            'httpMethod': 'POST',
            'path': '/transactions',
            'body': json.dumps(invalid_data)
        }
        event = self._create_event_with_auth(base_event)
        
        response = create_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_list_transactions_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction listing"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.list_user_transactions.return_value = [self.sample_db_transaction]
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/transactions',
            'queryStringParameters': {
                'account_id': self.test_account_id,
                'page': '1',
                'per_page': '10'
            }
        }
        event = self._create_event_with_auth(base_event)
        
        response = list_transactions_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'transactions' in body
        assert len(body['transactions']) == 1
        assert body['total_count'] == 1
        assert body['page'] == 1
        assert body['per_page'] == 10
        
        mock_db.list_user_transactions.assert_called_once()
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_list_transactions_with_filters(self, mock_db_client, mock_validate_token):
        """Test transaction listing with filters"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.list_user_transactions.return_value = []
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/transactions',
            'queryStringParameters': {
                'transaction_type': 'expense',
                'category': 'groceries',
                'date_from': '2024-01-01T00:00:00',
                'date_to': '2024-01-31T23:59:59',
                'amount_min': '10.0',
                'amount_max': '1000.0',
                'search_term': 'grocery'
            }
        }
        event = self._create_event_with_auth(base_event)
        
        response = list_transactions_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        
        # Verify filters were passed to database
        call_args = mock_db.list_user_transactions.call_args
        filters = call_args[0][1]  # Second argument (filters)
        assert filters['transaction_type'] == 'expense'
        assert filters['category'] == 'groceries'
        assert filters['date_from'] == '2024-01-01T00:00:00'
        assert filters['amount_min'] == 10.0
        assert filters['search_term'] == 'grocery'
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_get_transaction_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction retrieval"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = self.sample_db_transaction
        
        base_event = {
            'httpMethod': 'GET',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id}
        }
        event = self._create_event_with_auth(base_event)
        
        response = get_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transaction_id'] == self.test_transaction_id
        assert body['amount'] == 250.75
        
        mock_db.get_transaction_by_id.assert_called_once_with(self.test_user_id, self.test_transaction_id)
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_get_transaction_not_found(self, mock_db_client, mock_validate_token):
        """Test transaction retrieval when not found"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = None
        
        base_event = {
            'httpMethod': 'GET',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id}
        }
        event = self._create_event_with_auth(base_event)
        
        response = get_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'Transaction not found' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_update_transaction_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction update"""
        mock_validate_token.return_value = self.mock_user_data
        
        update_data = {
            'description': 'Updated grocery shopping',
            'category': 'food_drinks',
            'notes': 'Updated notes'
        }
        
        updated_transaction = self.sample_db_transaction.copy()
        updated_transaction.update(update_data)
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = self.sample_db_transaction
        mock_db.update_transaction.return_value = updated_transaction
        
        base_event = {
            'httpMethod': 'PUT',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id},
            'body': json.dumps(update_data)
        }
        event = self._create_event_with_auth(base_event)
        
        response = update_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transaction']['description'] == 'Updated grocery shopping'
        assert body['transaction']['category'] == 'food_drinks'
        
        mock_db.update_transaction.assert_called_once()
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_update_transaction_not_found(self, mock_db_client, mock_validate_token):
        """Test transaction update when not found"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = None
        
        update_data = {'description': 'Updated description'}
        
        base_event = {
            'httpMethod': 'PUT',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id},
            'body': json.dumps(update_data)
        }
        event = self._create_event_with_auth(base_event)
        
        response = update_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'Transaction not found' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_delete_transaction_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction deletion"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = self.sample_db_transaction
        mock_db.get_account_by_id.return_value = self.sample_account
        mock_db.update_account.return_value = None
        mock_db.delete_transaction.return_value = True
        
        base_event = {
            'httpMethod': 'DELETE',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id}
        }
        event = self._create_event_with_auth(base_event)
        
        response = delete_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'deleted successfully' in body['message']
        assert 'account_balance_after_deletion' in body
        
        mock_db.delete_transaction.assert_called_once()
        mock_db.update_account.assert_called_once()
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_delete_transaction_not_found(self, mock_db_client, mock_validate_token):
        """Test transaction deletion when not found"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.get_transaction_by_id.return_value = None
        
        base_event = {
            'httpMethod': 'DELETE',
            'path': f'/transactions/{self.test_transaction_id}',
            'pathParameters': {'transaction_id': self.test_transaction_id}
        }
        event = self._create_event_with_auth(base_event)
        
        response = delete_transaction_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'Transaction not found' in body['error']
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_get_transaction_summary_success(self, mock_db_client, mock_validate_token):
        """Test successful transaction summary retrieval"""
        mock_validate_token.return_value = self.mock_user_data
        
        # Sample transactions for summary
        income_transaction = self.sample_db_transaction.copy()
        income_transaction.update({
            'transaction_id': 'txn_income123',
            'amount': 5000.0,
            'transaction_type': 'salary',
            'category': 'salary'
        })
        
        expense_transaction = self.sample_db_transaction.copy()
        expense_transaction.update({
            'amount': -250.75,  # Negative for expense
            'transaction_type': 'expense',
            'category': 'groceries'
        })
        
        mock_db = mock_db_client.return_value
        mock_db.list_user_transactions.return_value = [income_transaction, expense_transaction]
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/transactions/summary',
            'queryStringParameters': {'period': 'current_month'}
        }
        event = self._create_event_with_auth(base_event)
        
        response = get_transaction_summary_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'total_income' in body
        assert 'total_expenses' in body
        assert 'net_amount' in body
        assert 'income_by_category' in body
        assert 'expenses_by_category' in body
        assert body['transaction_count'] == 2
    
    @patch('utils.jwt_auth.validate_token_from_event')
    @patch('handlers.transactions.DynamoDBClient')
    def test_get_transaction_summary_custom_period(self, mock_db_client, mock_validate_token):
        """Test transaction summary with custom period"""
        mock_validate_token.return_value = self.mock_user_data
        
        mock_db = mock_db_client.return_value
        mock_db.list_user_transactions.return_value = []
        
        base_event = {
            'httpMethod': 'GET',
            'path': '/transactions/summary',
            'queryStringParameters': {
                'period': 'custom',
                'date_from': '2024-01-01T00:00:00',
                'date_to': '2024-01-31T23:59:59'
            }
        }
        event = self._create_event_with_auth(base_event)
        
        response = get_transaction_summary_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['period'] == 'custom'
        
        # Verify filters were passed
        call_args = mock_db.list_user_transactions.call_args
        filters = call_args[0][1]
        assert filters['date_from'] == '2024-01-01T00:00:00'
        assert filters['date_to'] == '2024-01-31T23:59:59'


class TestLambdaHandler:
    
    def setup_method(self):
        """Set up test data"""
        self.mock_context = Mock()
    
    @patch('handlers.transactions.create_transaction_handler')
    def test_lambda_handler_create_transaction(self, mock_create):
        """Test lambda handler routing for create transaction"""
        mock_create.return_value = {'statusCode': 201, 'body': '{}'}
        
        event = {
            'httpMethod': 'POST',
            'path': '/transactions'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_create.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 201
    
    @patch('handlers.transactions.list_transactions_handler')
    def test_lambda_handler_list_transactions(self, mock_list):
        """Test lambda handler routing for list transactions"""
        mock_list.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'GET',
            'path': '/transactions'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_list.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 200
    
    @patch('handlers.transactions.get_transaction_summary_handler')
    def test_lambda_handler_get_summary(self, mock_summary):
        """Test lambda handler routing for transaction summary"""
        mock_summary.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'GET',
            'path': '/transactions/summary'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_summary.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 200
    
    @patch('handlers.transactions.get_transaction_handler')
    def test_lambda_handler_get_transaction(self, mock_get):
        """Test lambda handler routing for get transaction"""
        mock_get.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'GET',
            'path': '/transactions/txn_123'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_get.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 200
    
    @patch('handlers.transactions.update_transaction_handler')
    def test_lambda_handler_update_transaction(self, mock_update):
        """Test lambda handler routing for update transaction"""
        mock_update.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'PUT',
            'path': '/transactions/txn_123'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_update.assert_called_once_with(event, self.mock_context)
        assert result['statusCode'] == 200
    
    @patch('handlers.transactions.delete_transaction_handler')
    def test_lambda_handler_delete_transaction(self, mock_delete):
        """Test lambda handler routing for delete transaction"""
        mock_delete.return_value = {'statusCode': 200, 'body': '{}'}
        
        event = {
            'httpMethod': 'DELETE',
            'path': '/transactions/txn_123'
        }
        
        result = lambda_handler(event, self.mock_context)
        
        mock_delete.assert_called_once_with(event, self.mock_context)
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
    
    def test_lambda_handler_api_prefix_removal(self):
        """Test that API Gateway prefix is removed from path"""
        with patch('handlers.transactions.list_transactions_handler') as mock_list:
            mock_list.return_value = {'statusCode': 200, 'body': '{}'}
            
            event = {
                'httpMethod': 'GET',
                'path': '/api/transactions'  # With API prefix
            }
            
            result = lambda_handler(event, self.mock_context)
            
            mock_list.assert_called_once()
            assert result['statusCode'] == 200
