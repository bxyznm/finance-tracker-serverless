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
        
        # Assertions - check key fields match
        assert result['user_id'] == self.sample_card_data['user_id']
        assert result['card_id'] == self.sample_card_data['card_id']
        assert result['name'] == self.sample_card_data['name']
        assert result['card_type'] == self.sample_card_data['card_type']
        assert result['credit_limit'] == self.sample_card_data['credit_limit']
        assert result['payment_due_date'] == self.sample_card_data['payment_due_date']
        assert result['cut_off_date'] == self.sample_card_data['cut_off_date']
        
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
        
        # Execute - now returns a list directly
        result = client.list_user_cards(self.test_user_id, include_inactive=False)
        
        # Assertions
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]['name'] == 'Tarjeta Principal'
        assert result[0]['card_type'] == 'credit'
        assert result[0]['status'] == 'active'
        
        # Check database call
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args[1]
        assert call_args['KeyConditionExpression']
        assert 'FilterExpression' in call_args  # Should filter for active cards
    
    @patch('boto3.resource')
    def test_list_user_cards_with_filters(self, mock_boto3_resource):
        """Test cards listing including inactive cards"""
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
        
        # Execute with include_inactive=True
        result = client.list_user_cards(self.test_user_id, include_inactive=True)
        
        # Assertions
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1
        
        # Verify NO filter expression was used (includes inactive)
        mock_table.query.assert_called_once()
        call_args = mock_table.query.call_args[1]
        assert 'FilterExpression' not in call_args
    
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
        result = client.list_user_cards(self.test_user_id, include_inactive=False)
        
        # Assertions
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 0
    
    @patch('boto3.resource')
    def test_list_user_cards_filters_malformed_items(self, mock_boto3_resource):
        """Test that list_user_cards filters out malformed items"""
        # Setup mocks with mix of valid and malformed items
        valid_item = self.sample_db_item.copy()
        
        # Malformed item 1: missing card_id
        malformed_item_1 = {
            'pk': f'USER#{self.test_user_id}',
            'sk': 'CARD#card_missing_id',
            'entity_type': 'card',
            'user_id': self.test_user_id,
            'name': 'Incomplete Card',
            # missing card_id, card_type, card_network, bank_name, etc.
        }
        
        # Malformed item 2: missing required fields
        malformed_item_2 = {
            'pk': f'USER#{self.test_user_id}',
            'sk': 'CARD#card_incomplete',
            'entity_type': 'card',
            'card_id': 'card_incomplete',
            'user_id': self.test_user_id,
            # missing name, card_type, card_network, bank_name, currency, status, timestamps
        }
        
        # Malformed item 3: empty required fields
        malformed_item_3 = {
            'pk': f'USER#{self.test_user_id}',
            'sk': 'CARD#card_empty',
            'entity_type': 'card',
            'card_id': '',  # empty
            'user_id': self.test_user_id,
            'name': '',  # empty
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': '',  # empty
            'currency': 'MXN',
            'status': 'active',
            'created_at': '2025-09-06T10:00:00Z',
            'updated_at': '2025-09-06T10:00:00Z'
        }
        
        mock_table = MagicMock()
        mock_table.query.return_value = {
            'Items': [valid_item, malformed_item_1, malformed_item_2, malformed_item_3],
            'Count': 4
        }
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute
        result = client.list_user_cards(self.test_user_id, include_inactive=False)
        
        # Assertions - should only return the valid item
        assert result is not None
        assert isinstance(result, list)
        assert len(result) == 1, "Should filter out malformed items and return only valid ones"
        assert result[0]['card_id'] == self.test_card_id
        assert result[0]['name'] == 'Tarjeta Principal'
    
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
        
        # Execute & Assert - should raise ValueError
        update_data = {'name': 'New Name'}
        with pytest.raises(ValueError, match="Card not found"):
            client.update_card(self.test_user_id, 'nonexistent_card', update_data)
    
    @patch('boto3.resource')
    def test_delete_card_success(self, mock_boto3_resource):
        """Test successful card soft deletion"""
        # Setup mocks
        mock_table = MagicMock()
        updated_item = self.sample_db_item.copy()
        updated_item['status'] = 'inactive'
        mock_table.update_item.return_value = {'Attributes': updated_item}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3_resource.return_value = mock_dynamodb
        
        # Create client
        client = DynamoDBClient()
        
        # Execute - soft delete now updates status to inactive
        result = client.delete_card(self.test_user_id, self.test_card_id, "2024-01-01T00:00:00Z")
        
        # Assertions
        assert result is True
        
        # Check database call - should call update_item (soft delete)
        mock_table.update_item.assert_called_once()
        call_args = mock_table.update_item.call_args[1]
        assert call_args['Key']['pk'] == f'USER#{self.test_user_id}'
        assert call_args['Key']['sk'] == f'CARD#{self.test_card_id}'
        assert ':status' in call_args['ExpressionAttributeValues']
        assert call_args['ExpressionAttributeValues'][':status'] == 'inactive'
    
    @patch('boto3.resource')
    def test_delete_card_not_found(self, mock_boto3_resource):
        """Test card deletion when card not found"""
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
        result = client.delete_card(self.test_user_id, 'nonexistent_card', "2024-01-01T00:00:00Z")
        
        # Assertions
        assert result is False


# Import unittest.mock for the mock.ANY usage
import unittest.mock
