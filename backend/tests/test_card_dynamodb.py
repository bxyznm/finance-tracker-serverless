"""
Tests for DynamoDB client card operations
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from botocore.exceptions import ClientError

# Add the src directory to the path for imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils.dynamodb_client import DynamoDBClient


class TestDynamoDBCardOperations:
    
    def setup_method(self):
        """Set up test data"""
        self.test_user_id = "user_123"
        self.test_card_id = "card_test123"
        
        # Sample card data
        self.sample_card_data = {
            'user_id': self.test_user_id,
            'card_id': self.test_card_id,
            'name': 'Tarjeta Principal',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 50000.0,
            'current_balance': 1000.0,
            'payment_due_date': 15,
            'cut_off_date': 1,
            'currency': 'MXN',
            'status': 'active',
            'description': 'Mi tarjeta principal',
            'created_at': '2025-09-06T10:00:00Z',
            'updated_at': '2025-09-06T10:00:00Z'
        }
        
        # DynamoDB item format
        self.sample_db_item = {
            'pk': f'USER#{self.test_user_id}',
            'sk': f'CARD#{self.test_card_id}',
            'gsi1_pk': f'CARD#{self.test_card_id}',
            'gsi1_sk': f'USER#{self.test_user_id}',
            'entity_type': 'card',
            **self.sample_card_data
        }
    
    @patch('boto3.resource')
    def test_create_card_success(self, mock_boto3_resource):
        """Test successful card creation"""
        # Setup mocks
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.create_card(self.sample_card_data)
        
        # Assertions
        assert result == self.sample_card_data
        mock_table.put_item.assert_called_once()
        
        # Check the item structure
        call_args = mock_table.put_item.call_args[1]['Item']
        assert call_args['pk'] == f'USER#{self.test_user_id}'
        assert call_args['sk'] == f'CARD#{self.test_card_id}'
        assert call_args['gsi1_pk'] == f'CARD#{self.test_card_id}'
        assert call_args['gsi1_sk'] == f'USER#{self.test_user_id}'
        assert call_args['entity_type'] == 'card'
        assert call_args['name'] == 'Tarjeta Principal'
        assert call_args['card_type'] == 'credit'
        assert call_args['credit_limit'] == 50000.0
        assert call_args['payment_due_date'] == 15
        assert call_args['cut_off_date'] == 1
    
    @patch('boto3.resource')
    def test_create_card_database_error(self, mock_boto3_resource):
        """Test card creation with database error"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException', 'Message': 'Test error'}},
            'PutItem'
        )
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute and assert exception
        with pytest.raises(Exception):
            client.create_card(self.sample_card_data)
    
    @patch('boto3.resource')
    def test_get_card_by_id_success(self, mock_boto3_resource):
        """Test successful card retrieval"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.get_item.return_value = {'Item': self.sample_db_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.get_card_by_id(self.test_user_id, self.test_card_id)
        
        # Assertions
        assert result is not None
        assert result['card_id'] == self.test_card_id
        assert result['name'] == 'Tarjeta Principal'
        assert result['card_type'] == 'credit'
        assert result['credit_limit'] == 50000.0
        assert result['payment_due_date'] == 15
        assert result['cut_off_date'] == 1
        
        # Check database call
        mock_table.get_item.assert_called_once_with(
            Key={
                'pk': f'USER#{self.test_user_id}',
                'sk': f'CARD#{self.test_card_id}'
            }
        )
    
    @patch('boto3.resource')
    def test_get_card_by_id_not_found(self, mock_boto3_resource):
        """Test card retrieval when not found"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.get_item.return_value = {}  # No item found
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.get_card_by_id(self.test_user_id, 'nonexistent_card')
        
        # Assertions
        assert result is None
    
    @patch('boto3.resource')
    def test_list_user_cards_success(self, mock_boto3_resource):
        """Test successful cards listing"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [self.sample_db_item],
            'Count': 1
        }
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.list_user_cards(self.test_user_id, {})
        
        # Assertions
        assert result is not None
        assert result['total_count'] == 1
        assert result['active_count'] == 1
        assert len(result['cards']) == 1
        assert result['cards'][0]['name'] == 'Tarjeta Principal'
        assert result['total_debt_by_currency']['MXN'] == 1000.0
        assert result['total_available_credit']['MXN'] == 49000.0  # 50000 - 1000
        
        # Check database call
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args[1]
        assert call_args['KeyConditionExpression']
        assert call_args['FilterExpression']
    
    @patch('boto3.resource')
    def test_list_user_cards_with_filters(self, mock_boto3_resource):
        """Test cards listing with filters"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [self.sample_db_item],
            'Count': 1
        }
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute with filters
        filters = {'status': 'active', 'type': 'credit'}
        result = client.list_user_cards(self.test_user_id, filters)
        
        # Assertions
        assert result is not None
        assert len(result['cards']) == 1
        
        # Verify filter expression was used
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args[1]
        assert call_args['FilterExpression']
    
    @patch('boto3.resource')
    def test_list_user_cards_empty(self, mock_boto3_resource):
        """Test cards listing when no cards exist"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [],
            'Count': 0
        }
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.list_user_cards(self.test_user_id, {})
        
        # Assertions
        assert result is not None
        assert result['total_count'] == 0
        assert result['active_count'] == 0
        assert len(result['cards']) == 0
        assert result['total_debt_by_currency'] == {}
        assert result['total_available_credit'] == {}
    
    @patch('boto3.resource')
    def test_update_card_success(self, mock_boto3_resource):
        """Test successful card update"""
        # Setup mocks
        updated_item = self.sample_db_item.copy()
        updated_item['name'] = 'Tarjeta Actualizada'
        updated_item['credit_limit'] = 75000.0
        updated_item['updated_at'] = '2025-09-06T11:00:00Z'
        
        mock_table = MagicMock()
        mock_table.update_item.return_value = {'Attributes': updated_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        update_data = {
            'name': 'Tarjeta Actualizada',
            'credit_limit': 75000.0
        }
        result = client.update_card(self.test_user_id, self.test_card_id, update_data)
        
        # Assertions
        assert result is not None
        assert result['name'] == 'Tarjeta Actualizada'
        assert result['credit_limit'] == 75000.0
        
        # Check database call
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]
        assert call_args['Key']['pk'] == f'USER#{self.test_user_id}'
        assert call_args['Key']['sk'] == f'CARD#{self.test_card_id}'
        assert 'UpdateExpression' in call_args
        assert 'ExpressionAttributeValues' in call_args
    
    @patch('boto3.resource')
    def test_update_card_not_found(self, mock_boto3_resource):
        """Test card update when card not found"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.update_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Item not found'}},
            'UpdateItem'
        )
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        update_data = {'name': 'New Name'}
        result = client.update_card(self.test_user_id, 'nonexistent_card', update_data)
        
        # Assertions
        assert result is None
    
    @patch('boto3.resource')
    def test_delete_card_success(self, mock_boto3_resource):
        """Test successful card deletion"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.delete_item.return_value = {'ResponseMetadata': {'HTTPStatusCode': 200}}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.delete_card(self.test_user_id, self.test_card_id, "2024-01-01T00:00:00Z")
        
        # Assertions
        assert result is True
        
        # Check database call
        mock_table.delete_item.assert_called_once_with(
            Key={
                'pk': f'USER#{self.test_user_id}',
                'sk': f'CARD#{self.test_card_id}'
            },
            ConditionExpression=unittest.mock.ANY
        )
    
    @patch('boto3.resource')
    def test_delete_card_not_found(self, mock_boto3_resource):
        """Test card deletion when card not found"""
        # Setup mocks
        mock_table = MagicMock()
        mock_table.delete_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException', 'Message': 'Item not found'}},
            'DeleteItem'
        )
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.delete_card(self.test_user_id, 'nonexistent_card', "2024-01-01T00:00:00Z")
        
        # Assertions
        assert result is False
    
    @patch('boto3.resource')
    def test_add_card_transaction_success(self, mock_boto3_resource):
        """Test successful transaction addition"""
        # Setup mocks
        updated_item = self.sample_db_item.copy()
        updated_item['current_balance'] = 1150.0  # 1000 + 150
        
        mock_table = MagicMock()
        mock_table.update_item.return_value = {'Attributes': updated_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        transaction_data = {
            'amount': 150.0,
            'description': 'Purchase at store',
            'transaction_type': 'purchase'
        }
        result = client.add_card_transaction(
            self.test_user_id, 
            self.test_card_id, 
            transaction_data
        )
        
        # Assertions
        assert result is not None
        assert result['card_id'] == self.test_card_id
        assert result['new_balance'] == 1150.0
        assert result['transaction']['amount'] == 150.0
        assert result['transaction']['description'] == 'Purchase at store'
        assert result['transaction']['transaction_type'] == 'purchase'
        
        # Check database call
        mock_table.update_item.assert_called_once()
    
    @patch('boto3.resource')
    def test_make_card_payment_success(self, mock_boto3_resource):
        """Test successful card payment"""
        # Setup mocks
        updated_item = self.sample_db_item.copy()
        updated_item['current_balance'] = 500.0  # 1000 - 500
        
        mock_table = MagicMock()
        mock_table.update_item.return_value = {'Attributes': updated_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        payment_data = {
            'amount': 500.0,
            'description': 'Monthly payment'
        }
        result = client.make_card_payment(
            self.test_user_id, 
            self.test_card_id, 
            payment_data
        )
        
        # Assertions
        assert result is not None
        assert result['card_id'] == self.test_card_id
        assert result['payment_amount'] == 500.0
        assert result['new_balance'] == 500.0
        
        # Check database call
        mock_table.update_item.assert_called_once()
    
    @patch('boto3.resource')
    def test_make_card_payment_insufficient_balance(self, mock_boto3_resource):
        """Test card payment with insufficient balance (overpayment)"""
        # Setup mocks - payment amount greater than balance
        updated_item = self.sample_db_item.copy()
        updated_item['current_balance'] = 0.0  # Payment of 1500 on balance of 1000
        
        mock_table = MagicMock()
        mock_table.update_item.return_value = {'Attributes': updated_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        payment_data = {
            'amount': 1500.0,  # More than current balance
            'description': 'Large payment'
        }
        result = client.make_card_payment(
            self.test_user_id, 
            self.test_card_id, 
            payment_data
        )
        
        # Assertions - should still work, just set balance to 0
        assert result is not None
        assert result['payment_amount'] == 1500.0
        assert result['new_balance'] == 0.0


# Import unittest.mock for the mock.ANY usage
import unittest.mock
