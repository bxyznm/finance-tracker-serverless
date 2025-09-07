"""
Tests for card handlers
"""

import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add the src directory to the path for imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from handlers.cards import (
    create_card_handler, get_cards_handler, get_card_handler, 
    update_card_handler, delete_card_handler, 
    add_card_transaction_handler, make_card_payment_handler,
    lambda_handler, generate_card_id
)


class TestCardHandlers:
    
    def setup_method(self):
        """Set up test data"""
        self.mock_context = Mock()
        self.test_user_id = "user_123"
        self.test_card_id = "card_test123"
        
        # Mock user data from JWT - create a TokenPayload-like object
        self.mock_user_data = MagicMock()
        self.mock_user_data.user_id = self.test_user_id
        self.mock_user_data.email = 'test@example.com'
        
        # Sample card data
        self.sample_card_data = {
            'name': 'Tarjeta Principal',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 50000.0,
            'current_balance': 1000.0,
            'payment_due_date': 15,
            'cut_off_date': 1,
            'currency': 'MXN',
            'description': 'Mi tarjeta de crédito principal'
        }
        
        # Sample card response
        self.sample_card_response = {
            'card_id': self.test_card_id,
            'user_id': self.test_user_id,
            'name': 'Tarjeta Principal',
            'card_type': 'credit',
            'card_network': 'visa',
            'bank_name': 'BBVA',
            'credit_limit': 50000.0,
            'current_balance': 1000.0,
            'available_credit': 49000.0,
            'payment_due_date': 15,
            'cut_off_date': 1,
            'currency': 'MXN',
            'status': 'active',
            'description': 'Mi tarjeta de crédito principal',
            'days_until_due': 10,
            'created_at': '2025-09-06T10:00:00Z',
            'updated_at': '2025-09-06T10:00:00Z'
        }
        
        # Sample cards list response (for direct list usage)
        self.sample_cards_list = [self.sample_card_response]


class TestCreateCardHandler(TestCardHandlers):
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_create_card_success(self, mock_validate_token, mock_db_class):
        """Test successful card creation"""
        # Setup token validation mock
        mock_validate_token.return_value = self.mock_user_data
        
        # Setup database mock
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.create_card.return_value = self.sample_card_response
        
        # Create event
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'body': json.dumps(self.sample_card_data)
        }
        
        # Execute handler
        response = create_card_handler(event, self.mock_context)
        
        # Assertions
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        assert 'card' in body
        assert body['card']['name'] == 'Tarjeta Principal'
        assert body['card']['card_type'] == 'credit'
        assert body['card']['bank_name'] == 'BBVA'
        
        # Verify database call
        mock_db.create_card.assert_called_once()
        call_args = mock_db.create_card.call_args[0][0]
        assert call_args['name'] == 'Tarjeta Principal'
        assert call_args['user_id'] == self.test_user_id
        assert 'card_id' in call_args
        assert 'created_at' in call_args
        assert 'updated_at' in call_args
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_create_card_invalid_token(self, mock_validate_token, mock_db_class):
        """Test card creation with invalid token"""
        mock_validate_token.return_value = None
        
        event = {
            'headers': {'Authorization': 'Bearer invalid_token'},
            'body': json.dumps(self.sample_card_data)
        }
        
        response = create_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'error' in body
    
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_create_card_missing_body(self, mock_validate_token):
        """Test card creation with missing body"""
        mock_validate_token.return_value = self.mock_user_data
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'}
        }
        
        response = create_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'error' in body
    
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_create_card_invalid_data(self, mock_validate_token):
        """Test card creation with invalid data"""
        mock_validate_token.return_value = self.mock_user_data
        
        invalid_data = {
            'name': '',  # Invalid empty name
            'card_type': 'invalid_type',
            'card_network': 'visa',
            'bank_name': 'BBVA'
        }
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'body': json.dumps(invalid_data)
        }
        
        response = create_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'error' in body
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_create_card_database_error(self, mock_validate_token, mock_db_class):
        """Test card creation with database error"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.create_card.side_effect = Exception("Database error")
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'body': json.dumps(self.sample_card_data)
        }
        
        response = create_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'error' in body


class TestListCardsHandler(TestCardHandlers):
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_list_cards_success(self, mock_validate_token, mock_db_class):
        """Test successful cards listing"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.list_user_cards.return_value = self.sample_cards_list
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'queryStringParameters': {}
        }
        
        response = get_cards_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'cards' in body
        assert len(body['cards']) == 1
        assert body['cards'][0]['name'] == 'Tarjeta Principal'
        assert 'total_count' in body
        assert 'active_count' in body
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_list_cards_with_filters(self, mock_validate_token, mock_db_class):
        """Test cards listing with filters"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.list_user_cards.return_value = self.sample_cards_list
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'queryStringParameters': {
                'status': 'active',
                'type': 'credit'
            }
        }
        
        response = get_cards_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'cards' in body
    
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_list_cards_invalid_token(self, mock_validate_token):
        """Test cards listing with invalid token"""
        mock_validate_token.return_value = None
        
        event = {
            'headers': {'Authorization': 'Bearer invalid_token'}
        }
        
        response = get_cards_handler(event, self.mock_context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body


class TestGetCardHandler(TestCardHandlers):
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_get_card_success(self, mock_validate_token, mock_db_class):
        """Test successful card retrieval"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.get_card_by_id.return_value = self.sample_card_response
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': self.test_card_id}
        }
        
        response = get_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'card' in body
        assert body['card']['card_id'] == self.test_card_id
        assert body['card']['name'] == 'Tarjeta Principal'
        
        mock_db.get_card_by_id.assert_called_once_with(self.test_user_id, self.test_card_id)
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_get_card_not_found(self, mock_validate_token, mock_db_class):
        """Test card retrieval when card not found"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.get_card_by_id.return_value = None
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': 'nonexistent_card'}
        }
        
        response = get_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'error' in body
        assert 'not found' in body['error'].lower()
    
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_get_card_missing_card_id(self, mock_validate_token):
        """Test card retrieval with missing card_id"""
        mock_validate_token.return_value = self.mock_user_data
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {}
        }
        
        response = get_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body


class TestUpdateCardHandler(TestCardHandlers):
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_update_card_success(self, mock_validate_token, mock_db_class):
        """Test successful card update"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        
        updated_card = self.sample_card_response.copy()
        updated_card['name'] = 'Tarjeta Actualizada'
        updated_card['credit_limit'] = 75000.0
        mock_db.update_card.return_value = updated_card
        
        update_data = {
            'name': 'Tarjeta Actualizada',
            'credit_limit': 75000.0
        }
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': self.test_card_id},
            'body': json.dumps(update_data)
        }
        
        response = update_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'card' in body
        assert body['card']['name'] == 'Tarjeta Actualizada'
        assert body['card']['credit_limit'] == 75000.0
        
        mock_db.update_card.assert_called_once()
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_update_card_not_found(self, mock_validate_token, mock_db_class):
        """Test card update when card not found"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.update_card.return_value = None
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': 'nonexistent_card'},
            'body': json.dumps({'name': 'New Name'})
        }
        
        response = update_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'error' in body


class TestDeleteCardHandler(TestCardHandlers):
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_delete_card_success(self, mock_validate_token, mock_db_class):
        """Test successful card deletion"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.delete_card.return_value = True
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': self.test_card_id}
        }
        
        response = delete_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'message' in body
        assert 'deleted' in body['message'].lower()
        
        # Verify delete was called with user_id and card_id (ignoring timestamp)
        mock_db.delete_card.assert_called_once()
        call_args = mock_db.delete_card.call_args[0]
        assert call_args[0] == self.test_user_id
        assert call_args[1] == self.test_card_id
    
    @patch('handlers.cards.DynamoDBClient')
    @patch('utils.jwt_auth.validate_token_from_event')
    def test_delete_card_not_found(self, mock_validate_token, mock_db_class):
        """Test card deletion when card not found"""
        mock_validate_token.return_value = self.mock_user_data
        mock_db = MagicMock()
        mock_db_class.return_value = mock_db
        mock_db.delete_card.return_value = False
        
        event = {
            'headers': {'Authorization': 'Bearer valid_token'},
            'pathParameters': {'card_id': 'nonexistent_card'}
        }
        
        response = delete_card_handler(event, self.mock_context)
        
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'error' in body


# TODO: Implementar estos handlers y descomentar los tests
# class TestAddTransactionHandler(TestCardHandlers):
#     
#     @patch('utils.jwt_auth.decode_token')
#     @patch('handlers.cards.DynamoDBClient')
#     def test_add_transaction_success(self, mock_db_class, mock_decode_jwt):
#         """Test successful transaction addition"""
#         mock_decode_jwt.return_value = self.mock_user_data
#         mock_db = MagicMock()
#         mock_db_class.return_value = mock_db
#         
#         transaction_result = {
#             'card_id': self.test_card_id,
#             'new_balance': 1150.0,
#             'transaction': {
#                 'amount': 150.0,
#                 'description': 'Purchase at store',
#                 'transaction_type': 'purchase'
#             }
#         }
#         mock_db.add_card_transaction.return_value = transaction_result
#         
#         transaction_data = {
#             'amount': 150.0,
#             'description': 'Purchase at store',
#             'transaction_type': 'purchase'
#         }
#         
#         event = {
#             'headers': {'Authorization': 'Bearer valid_token'},
#             'pathParameters': {'card_id': self.test_card_id},
#             'body': json.dumps(transaction_data)
#         }
#         
#         response = add_transaction_handler(event, self.mock_context)
#         
#         assert response['statusCode'] == 200
#         body = json.loads(response['body'])
#         assert body['success'] is True
#         assert body['new_balance'] == 1150.0
#         assert body['transaction']['amount'] == 150.0
#         
#         mock_db.add_card_transaction.assert_called_once()
#     
#     @patch('utils.jwt_auth.decode_token')
#     def test_add_transaction_invalid_data(self, mock_decode_jwt):
#         """Test transaction addition with invalid data"""
#         mock_decode_jwt.return_value = self.mock_user_data
#         
#         invalid_data = {
#             'amount': -50.0,  # Invalid negative amount
#             'description': '',  # Invalid empty description
#             'transaction_type': 'invalid_type'
#         }
#         
#         event = {
#             'headers': {'Authorization': 'Bearer valid_token'},
#             'pathParameters': {'card_id': self.test_card_id},
#             'body': json.dumps(invalid_data)
#         }
#         
#         response = add_transaction_handler(event, self.mock_context)
#         
#         assert response['statusCode'] == 400
#         body = json.loads(response['body'])
#         assert body['success'] is False


# class TestMakePaymentHandler(TestCardHandlers):
#     
#     @patch('utils.jwt_auth.decode_token')
#     @patch('handlers.cards.DynamoDBClient')
#     def test_make_payment_success(self, mock_db_class, mock_decode_jwt):
#         """Test successful payment"""
#         mock_decode_jwt.return_value = self.mock_user_data
#         mock_db = MagicMock()
#         mock_db_class.return_value = mock_db
#         
#         payment_result = {
#             'card_id': self.test_card_id,
#             'payment_amount': 500.0,
#             'new_balance': 500.0
#         }
#         mock_db.make_card_payment.return_value = payment_result
#         
#         payment_data = {
#             'amount': 500.0,
#             'description': 'Monthly payment'
#         }
#         
#         event = {
#             'headers': {'Authorization': 'Bearer valid_token'},
#             'pathParameters': {'card_id': self.test_card_id},
#             'body': json.dumps(payment_data)
#         }
#         
#         response = make_payment_handler(event, self.mock_context)
#         
#         assert response['statusCode'] == 200
#         body = json.loads(response['body'])
#         assert body['success'] is True
#         assert body['payment_amount'] == 500.0
#         assert body['new_balance'] == 500.0
#         
#         mock_db.make_card_payment.assert_called_once()


class TestLambdaHandler(TestCardHandlers):
    
    @patch('handlers.cards.create_card_handler')
    def test_lambda_handler_create_route(self, mock_create_handler):
        """Test lambda handler routing to create card"""
        mock_create_handler.return_value = {'statusCode': 201}
        
        event = {
            'httpMethod': 'POST',
            'path': '/cards'
        }
        
        response = lambda_handler(event, self.mock_context)
        assert response['statusCode'] == 201
        mock_create_handler.assert_called_once_with(event, self.mock_context)
    
    @patch('handlers.cards.get_cards_handler')
    def test_lambda_handler_list_route(self, mock_list_handler):
        """Test lambda handler routing to list cards"""
        mock_list_handler.return_value = {'statusCode': 200}
        
        event = {
            'httpMethod': 'GET',
            'path': '/cards'
        }
        
        response = lambda_handler(event, self.mock_context)
        assert response['statusCode'] == 200
        mock_list_handler.assert_called_once_with(event, self.mock_context)
    
    @patch('handlers.cards.get_card_handler')
    def test_lambda_handler_get_route(self, mock_get_handler):
        """Test lambda handler routing to get card"""
        mock_get_handler.return_value = {'statusCode': 200}
        
        event = {
            'httpMethod': 'GET',
            'path': '/cards/card_123'
        }
        
        response = lambda_handler(event, self.mock_context)
        assert response['statusCode'] == 200
        mock_get_handler.assert_called_once_with(event, self.mock_context)
    
    def test_lambda_handler_invalid_route(self):
        """Test lambda handler with invalid route"""
        event = {
            'httpMethod': 'PATCH',
            'path': '/cards'
        }
        
        response = lambda_handler(event, self.mock_context)
        assert response['statusCode'] == 404
        body = json.loads(response['body'])
        assert 'not found' in body['error'].lower()


class TestUtilityFunctions:
    
    def test_generate_card_id(self):
        """Test card ID generation"""
        card_id = generate_card_id()
        assert card_id.startswith('card_')
        assert len(card_id) > 5
        
        # Test uniqueness
        card_id2 = generate_card_id()
        assert card_id != card_id2
