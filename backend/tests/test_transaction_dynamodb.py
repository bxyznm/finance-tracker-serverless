"""
Tests for DynamoDB transaction operations
Tests the database layer for transaction CRUD and filtering
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from botocore.exceptions import ClientError

from utils.dynamodb_client import DynamoDBClient


class TestDynamoDBTransactionOperations:
    
    def setup_method(self):
        """Set up test data"""
        self.test_user_id = "user_123"
        self.test_account_id = "acc_test123"
        self.test_transaction_id = "txn_test123"
        
        # Sample transaction data for database
        self.sample_transaction_data = {
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
            'reference_number': 'REF123',
            'notes': 'Weekly groceries',
            'tags': ['grocery', 'food'],
            'location': 'Supermarket XYZ',
            'destination_account_id': None,
            'destination_account_name': None,
            'account_balance_after': 749.25,
            'is_recurring': False,
            'recurring_frequency': None,
            'created_at': '2024-01-15T10:30:00',
            'updated_at': '2024-01-15T10:30:00'
        }
        
        # Expected DynamoDB item structure
        self.expected_db_item = {
            'pk': f'USER#{self.test_user_id}',
            'sk': f'TRANSACTION#{self.test_transaction_id}',
            'gsi1_pk': f'ACCOUNT#{self.test_account_id}',
            'gsi1_sk': f'TRANSACTION#2024-01-15T10:30:00#{self.test_transaction_id}',
            'entity_type': 'transaction',
            'transaction_id': self.test_transaction_id,
            'user_id': self.test_user_id,
            'account_id': self.test_account_id,
            'account_name': 'Test Checking Account',
            'amount': Decimal('250.75'),
            'description': 'Grocery shopping',
            'transaction_type': 'expense',
            'category': 'groceries',
            'status': 'completed',
            'transaction_date': '2024-01-15T10:30:00',
            'reference_number': 'REF123',
            'notes': 'Weekly groceries',
            'tags': ['grocery', 'food'],
            'location': 'Supermarket XYZ',
            'destination_account_id': None,
            'destination_account_name': None,
            'account_balance_after': Decimal('749.25'),
            'is_recurring': False,
            'recurring_frequency': None,
            'created_at': '2024-01-15T10:30:00',
            'updated_at': '2024-01-15T10:30:00'
        }
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_create_transaction_success(self, mock_boto_resource):
        """Test successful transaction creation"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.put_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}
        
        client = DynamoDBClient()
        result = client.create_transaction(self.sample_transaction_data)
        
        # Verify put_item was called with correct structure
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']
        
        # Check key structure
        assert item['pk'] == f'USER#{self.test_user_id}'
        assert item['sk'] == f'TRANSACTION#{self.test_transaction_id}'
        assert item['gsi1_pk'] == f'ACCOUNT#{self.test_account_id}'
        assert item['gsi1_sk'].startswith('TRANSACTION#2024-01-15T10:30:00#')
        assert item['entity_type'] == 'transaction'
        
        # Check data conversion
        assert item['amount'] == Decimal('250.75')
        assert item['account_balance_after'] == Decimal('749.25')
        
        # Check condition expression to prevent duplicates
        assert call_args[1]['ConditionExpression'] is not None
        
        # Verify result conversion back to float
        assert result['amount'] == 250.75
        assert result['account_balance_after'] == 749.25
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_create_transaction_duplicate(self, mock_boto_resource):
        """Test transaction creation with duplicate ID"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        
        # Simulate conditional check failed (duplicate)
        mock_table.put_item.side_effect = ClientError(
            error_response={'Error': {'Code': 'ConditionalCheckFailedException'}},
            operation_name='PutItem'
        )
        
        client = DynamoDBClient()
        
        with pytest.raises(ValueError, match="Transaction already exists"):
            client.create_transaction(self.sample_transaction_data)
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_get_transaction_by_id_success(self, mock_boto_resource):
        """Test successful transaction retrieval"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.get_item.return_value = {
            'Item': self.expected_db_item
        }
        
        client = DynamoDBClient()
        result = client.get_transaction_by_id(self.test_user_id, self.test_transaction_id)
        
        # Verify get_item was called with correct key
        mock_table.get_item.assert_called_once_with(
            Key={
                'pk': f'USER#{self.test_user_id}',
                'sk': f'TRANSACTION#{self.test_transaction_id}'
            }
        )
        
        # Verify result conversion
        assert result is not None
        assert result['transaction_id'] == self.test_transaction_id
        assert result['amount'] == 250.75  # Converted from Decimal
        assert result['account_balance_after'] == 749.25
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_get_transaction_by_id_not_found(self, mock_boto_resource):
        """Test transaction retrieval when not found"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.get_item.return_value = {}  # No Item
        
        client = DynamoDBClient()
        result = client.get_transaction_by_id(self.test_user_id, self.test_transaction_id)
        
        assert result is None
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_update_transaction_success(self, mock_boto_resource):
        """Test successful transaction update"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        
        updated_item = self.expected_db_item.copy()
        updated_item['description'] = 'Updated description'
        updated_item['updated_at'] = '2024-01-16T10:30:00'
        
        mock_table.update_item.return_value = {
            'Attributes': updated_item
        }
        
        update_data = {
            'description': 'Updated description',
            'updated_at': '2024-01-16T10:30:00'
        }
        
        client = DynamoDBClient()
        result = client.update_transaction(self.test_user_id, self.test_transaction_id, update_data)
        
        # Verify update_item was called
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args
        
        # Check key
        assert call_args[1]['Key']['pk'] == f'USER#{self.test_user_id}'
        assert call_args[1]['Key']['sk'] == f'TRANSACTION#{self.test_transaction_id}'
        
        # Check condition expression
        assert call_args[1]['ConditionExpression'] is not None
        assert call_args[1]['ReturnValues'] == 'ALL_NEW'
        
        # Verify result
        assert result['description'] == 'Updated description'
        assert result['amount'] == 250.75  # Converted from Decimal
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_update_transaction_not_found(self, mock_boto_resource):
        """Test transaction update when transaction not found"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        
        mock_table.update_item.side_effect = ClientError(
            error_response={'Error': {'Code': 'ConditionalCheckFailedException'}},
            operation_name='UpdateItem'
        )
        
        update_data = {
            'description': 'Updated description',
            'updated_at': '2024-01-16T10:30:00'
        }
        
        client = DynamoDBClient()
        
        with pytest.raises(ValueError, match="Transaction not found"):
            client.update_transaction(self.test_user_id, self.test_transaction_id, update_data)
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_update_transaction_with_status(self, mock_boto_resource):
        """Test transaction update with reserved keyword (status)"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        
        updated_item = self.expected_db_item.copy()
        updated_item['status'] = 'cancelled'
        
        mock_table.update_item.return_value = {
            'Attributes': updated_item
        }
        
        update_data = {
            'status': 'cancelled',
            'updated_at': '2024-01-16T10:30:00'
        }
        
        client = DynamoDBClient()
        result = client.update_transaction(self.test_user_id, self.test_transaction_id, update_data)
        
        # Verify update expression handles reserved keyword
        call_args = mock_table.update_item.call_args
        assert 'ExpressionAttributeNames' in call_args[1]
        assert '#status' in call_args[1]['ExpressionAttributeNames']
        assert result['status'] == 'cancelled'
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_delete_transaction_success(self, mock_boto_resource):
        """Test successful transaction deletion"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.delete_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}
        
        client = DynamoDBClient()
        result = client.delete_transaction(self.test_user_id, self.test_transaction_id)
        
        # Verify delete_item was called with correct key
        mock_table.delete_item.assert_called_once_with(
            Key={
                'pk': f'USER#{self.test_user_id}',
                'sk': f'TRANSACTION#{self.test_transaction_id}'
            },
            ConditionExpression='attribute_exists(pk)'
        )
        
        assert result is True
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_delete_transaction_not_found(self, mock_boto_resource):
        """Test transaction deletion when not found"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        
        mock_table.delete_item.side_effect = ClientError(
            error_response={'Error': {'Code': 'ConditionalCheckFailedException'}},
            operation_name='DeleteItem'
        )
        
        client = DynamoDBClient()
        result = client.delete_transaction(self.test_user_id, self.test_transaction_id)
        
        assert result is False
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_list_user_transactions_all(self, mock_boto_resource):
        """Test listing all user transactions"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.query.return_value = {
            'Items': [self.expected_db_item]
        }
        
        client = DynamoDBClient()
        result = client.list_user_transactions(self.test_user_id)
        
        # Verify query was called correctly
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args
        
        assert call_args[1]['KeyConditionExpression'] is not None
        assert ':user_pk' in call_args[1]['ExpressionAttributeValues']
        assert call_args[1]['ExpressionAttributeValues'][':user_pk'] == f'USER#{self.test_user_id}'
        assert call_args[1]['ScanIndexForward'] is False  # Most recent first
        
        # Verify result
        assert len(result) == 1
        assert result[0]['transaction_id'] == self.test_transaction_id
        assert result[0]['amount'] == 250.75  # Converted from Decimal
    
    @patch('utils.dynamodb_client.boto3.resource')
    def test_list_user_transactions_by_account(self, mock_boto_resource):
        """Test listing transactions for specific account using GSI1"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.query.return_value = {
            'Items': [self.expected_db_item]
        }
        
        filters = {'account_id': self.test_account_id}
        
        client = DynamoDBClient()
        result = client.list_user_transactions(self.test_user_id, filters)
        
        # Verify GSI1 query was used
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args
        
        assert call_args[1]['IndexName'] == 'GSI1'
        assert call_args[1]['KeyConditionExpression'] is not None
        assert ':account_pk' in call_args[1]['ExpressionAttributeValues']
        assert call_args[1]['ExpressionAttributeValues'][':account_pk'] == f'ACCOUNT#{self.test_account_id}'
        
        # Verify result (should filter by user_id for data isolation)
        assert len(result) == 1
        assert result[0]['user_id'] == self.test_user_id
    
    @patch('utils.dynamodb_client.DynamoDBClient._filter_transactions')
    @patch('utils.dynamodb_client.boto3.resource')
    def test_list_user_transactions_with_filters(self, mock_boto_resource, mock_filter):
        """Test listing transactions with additional filters"""
        mock_table = Mock()
        mock_boto_resource.return_value.Table.return_value = mock_table
        mock_table.query.return_value = {
            'Items': [self.expected_db_item]
        }
        
        # Mock the filter function
        filtered_result = [self.expected_db_item]
        mock_filter.return_value = filtered_result
        
        filters = {
            'transaction_type': 'expense',
            'category': 'groceries',
            'date_from': '2024-01-01T00:00:00',
            'date_to': '2024-01-31T23:59:59'
        }
        
        client = DynamoDBClient()
        result = client.list_user_transactions(self.test_user_id, filters)
        
        # Verify filter function was called
        mock_filter.assert_called_once()
        filter_call_args = mock_filter.call_args
        assert filter_call_args[0][1] == filters  # Second argument should be filters
        
        assert len(result) == 1
    
    def test_filter_transactions_by_type(self):
        """Test transaction filtering by type"""
        transactions = [
            {'transaction_type': 'expense', 'amount': -100.0},
            {'transaction_type': 'income', 'amount': 500.0},
            {'transaction_type': 'expense', 'amount': -50.0}
        ]
        
        filters = {'transaction_type': 'expense'}
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        assert len(result) == 2
        assert all(t['transaction_type'] == 'expense' for t in result)
    
    def test_filter_transactions_by_category(self):
        """Test transaction filtering by category"""
        transactions = [
            {'category': 'groceries', 'amount': -100.0},
            {'category': 'transportation', 'amount': -50.0},
            {'category': 'groceries', 'amount': -75.0}
        ]
        
        filters = {'category': 'groceries'}
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        assert len(result) == 2
        assert all(t['category'] == 'groceries' for t in result)
    
    def test_filter_transactions_by_date_range(self):
        """Test transaction filtering by date range"""
        transactions = [
            {'transaction_date': '2024-01-10T10:00:00', 'amount': -100.0},
            {'transaction_date': '2024-01-20T10:00:00', 'amount': -50.0},
            {'transaction_date': '2024-02-05T10:00:00', 'amount': -75.0}
        ]
        
        filters = {
            'date_from': '2024-01-15T00:00:00',
            'date_to': '2024-01-31T23:59:59'
        }
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        assert len(result) == 1
        assert result[0]['transaction_date'] == '2024-01-20T10:00:00'
    
    def test_filter_transactions_by_amount_range(self):
        """Test transaction filtering by amount range"""
        transactions = [
            {'amount': -25.0, 'description': 'Small expense'},
            {'amount': -100.0, 'description': 'Medium expense'},
            {'amount': -500.0, 'description': 'Large expense'}
        ]
        
        filters = {
            'amount_min': 50.0,
            'amount_max': 200.0
        }
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        # Should match medium expense (amount=100, abs value within range)
        assert len(result) == 1
        assert result[0]['amount'] == -100.0
    
    def test_filter_transactions_by_search_term(self):
        """Test transaction filtering by search term"""
        transactions = [
            {'description': 'Grocery shopping', 'notes': None, 'reference_number': None},
            {'description': 'Gas station', 'notes': 'Weekly fill-up', 'reference_number': None},
            {'description': 'Restaurant', 'notes': None, 'reference_number': 'REF-GROCERY-123'}
        ]
        
        filters = {'search_term': 'grocery'}
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        # Should match both "Grocery shopping" and reference number
        assert len(result) == 2
        descriptions = [t['description'] for t in result]
        assert 'Grocery shopping' in descriptions
        assert 'Restaurant' in descriptions
    
    def test_filter_transactions_by_tags(self):
        """Test transaction filtering by tags (OR logic)"""
        transactions = [
            {'tags': ['food', 'grocery'], 'description': 'Supermarket'},
            {'tags': ['transport', 'fuel'], 'description': 'Gas station'},
            {'tags': ['food', 'restaurant'], 'description': 'Dining out'},
            {'tags': ['shopping'], 'description': 'Clothes shopping'}
        ]
        
        filters = {'tags': ['food', 'transport']}
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        # Should match transactions with 'food' OR 'transport' tags
        assert len(result) == 3
        descriptions = [t['description'] for t in result]
        assert 'Supermarket' in descriptions
        assert 'Gas station' in descriptions
        assert 'Dining out' in descriptions
        assert 'Clothes shopping' not in descriptions
    
    def test_filter_transactions_multiple_filters(self):
        """Test transaction filtering with multiple filters combined"""
        transactions = [
            {
                'transaction_type': 'expense',
                'category': 'groceries',
                'amount': -100.0,
                'transaction_date': '2024-01-15T10:00:00',
                'description': 'Weekly grocery shopping'
            },
            {
                'transaction_type': 'expense',
                'category': 'groceries',
                'amount': -50.0,
                'transaction_date': '2024-01-20T10:00:00',
                'description': 'Quick grocery run'
            },
            {
                'transaction_type': 'expense',
                'category': 'transportation',
                'amount': -100.0,
                'transaction_date': '2024-01-15T10:00:00',
                'description': 'Gas fill-up'
            }
        ]
        
        filters = {
            'transaction_type': 'expense',
            'category': 'groceries',
            'amount_min': 75.0,
            'date_from': '2024-01-10T00:00:00',
            'date_to': '2024-01-18T23:59:59'
        }
        
        client = DynamoDBClient()
        result = client._filter_transactions(transactions, filters)
        
        # Should match only the first transaction (meets all criteria)
        assert len(result) == 1
        assert result[0]['description'] == 'Weekly grocery shopping'
