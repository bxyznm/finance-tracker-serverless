"""
Card handlers for AWS Lambda
Manages credit cards, debit cards, and related financial instruments
"""

import json
import logging
from typing import Dict, Any
from datetime import datetime, date
import secrets
from decimal import Decimal

from utils.responses import create_response
from utils.dynamodb_client import DynamoDBClient
from utils.jwt_auth import require_auth, TokenPayload
from models.card import (
    CardCreate, CardUpdate, CardResponse, CardTransaction, 
    CardPayment, CardBill, CardListResponse
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def generate_card_id() -> str:
    """Generate a unique card ID"""
    return f"card_{secrets.token_hex(8)}"

def generate_bill_id() -> str:
    """Generate a unique bill ID"""
    return f"bill_{secrets.token_hex(8)}"

def calculate_available_credit(credit_limit: float, current_balance: float) -> float:
    """Calculate available credit"""
    if credit_limit is None:
        return 0.0
    return max(0.0, credit_limit - current_balance)

# def is_card_expired(expiry_month: int, expiry_year: int) -> bool:
#     """Check if card is expired"""
#     today = date.today()
#     expiry_date = date(expiry_year, expiry_month, 1)
#     # Card expires at end of expiry month
#     return today > expiry_date

def days_until_payment_due(payment_due_date: int) -> int:
    """Calculate days until next payment due"""
    if payment_due_date is None:
        return None
    
    today = date.today()
    due_date = date(today.year, today.month, payment_due_date)
    
    # If due date has passed this month, calculate for next month
    if due_date < today:
        if today.month == 12:
            due_date = date(today.year + 1, 1, payment_due_date)
        else:
            due_date = date(today.year, today.month + 1, payment_due_date)
    
    return (due_date - today).days

@require_auth
def create_card_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Create a new card for the authenticated user
    POST /cards
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Creating card for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        card_data = CardCreate(**body)
        
        # Generate unique card ID
        card_id = generate_card_id()
        
        # Prepare data for database
        now = datetime.now().isoformat()
        db_data = {
            'user_id': user_id,
            'card_id': card_id,
            'name': card_data.name,
            'card_type': card_data.card_type,
            'card_network': card_data.card_network,
            'bank_name': card_data.bank_name,
            'credit_limit': Decimal(str(card_data.credit_limit)) if card_data.credit_limit else None,
            'current_balance': Decimal(str(card_data.current_balance)),
            'minimum_payment': Decimal(str(card_data.minimum_payment)) if card_data.minimum_payment else None,
            'payment_due_date': card_data.payment_due_date,
            'cut_off_date': card_data.cut_off_date,
            'apr': Decimal(str(card_data.apr)) if card_data.apr else None,
            'annual_fee': Decimal(str(card_data.annual_fee)) if card_data.annual_fee else None,
            'rewards_program': card_data.rewards_program,
            'currency': card_data.currency,
            'color': card_data.color,
            'description': card_data.description,
            'status': card_data.status,
            'created_at': now,
            'updated_at': now
        }
        
        # Save to database
        db_client = DynamoDBClient()
        created_card = db_client.create_card(db_data)
        
        # Calculate additional fields for response
        available_credit = calculate_available_credit(
            card_data.credit_limit or 0, 
            card_data.current_balance
        ) if card_data.credit_limit else None

        days_due = days_until_payment_due(card_data.payment_due_date)
        
        # Prepare response
        response_data = CardResponse(
            card_id=card_id,
            user_id=user_id,
            name=card_data.name,
            card_type=card_data.card_type,
            card_network=card_data.card_network,
            bank_name=card_data.bank_name,
            credit_limit=card_data.credit_limit,
            current_balance=card_data.current_balance,
            available_credit=available_credit,
            minimum_payment=card_data.minimum_payment,
            payment_due_date=card_data.payment_due_date,
            cut_off_date=card_data.cut_off_date,
            apr=card_data.apr,
            annual_fee=card_data.annual_fee,
            rewards_program=card_data.rewards_program,
            currency=card_data.currency,
            color=card_data.color,
            description=card_data.description,
            status=card_data.status,
            days_until_due=days_due,
            created_at=now,
            updated_at=now
        )
        
        logger.info(f"Card created successfully: {card_id}")
        return create_response(201, {"card": response_data.model_dump()})
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error creating card: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def get_cards_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Get all cards for the authenticated user
    GET /cards
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Getting cards for user: {user_id}")
        
        # Query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        status_filter = query_params.get('status')
        card_type_filter = query_params.get('type')
        include_inactive = status_filter == 'inactive' or status_filter is None
        
        # Get cards from database
        db_client = DynamoDBClient()
        cards = db_client.list_user_cards(user_id, include_inactive=include_inactive)
        
        # Apply filters
        if status_filter:
            cards = [card for card in cards if card.get('status') == status_filter]
        if card_type_filter:
            cards = [card for card in cards if card.get('card_type') == card_type_filter]
        
        # Convert to response format
        card_responses = []
        total_debt_by_currency = {}
        total_available_credit = {}
        active_count = 0
        
        for card in cards:
            # Calculate additional fields
            credit_limit = float(card.get('credit_limit', 0)) if card.get('credit_limit') else None
            current_balance = float(card.get('current_balance', 0))
            available_credit = calculate_available_credit(credit_limit or 0, current_balance) if credit_limit else None
            
            days_due = days_until_payment_due(card.get('payment_due_date'))
            
            card_response = CardResponse(
                card_id=card['card_id'],
                user_id=card['user_id'],
                name=card['name'],
                card_type=card['card_type'],
                card_network=card['card_network'],
                bank_name=card['bank_name'],
                credit_limit=credit_limit,
                current_balance=current_balance,
                available_credit=available_credit,
                minimum_payment=float(card.get('minimum_payment')) if card.get('minimum_payment') else None,
                payment_due_date=card.get('payment_due_date'),
                cut_off_date=card.get('cut_off_date'),
                apr=float(card.get('apr')) if card.get('apr') else None,
                annual_fee=float(card.get('annual_fee')) if card.get('annual_fee') else None,
                rewards_program=card.get('rewards_program'),
                currency=card['currency'],
                color=card.get('color'),
                description=card.get('description'),
                status=card['status'],
                days_until_due=days_due,
                created_at=card['created_at'],
                updated_at=card['updated_at']
            )
            
            card_responses.append(card_response)
            
            # Calculate totals
            currency = card['currency']
            if card['status'] == 'active':
                active_count += 1
                
                # Total debt (current balance)
                if currency not in total_debt_by_currency:
                    total_debt_by_currency[currency] = 0.0
                total_debt_by_currency[currency] += current_balance
                
                # Available credit
                if available_credit and available_credit > 0:
                    if currency not in total_available_credit:
                        total_available_credit[currency] = 0.0
                    total_available_credit[currency] += available_credit
        
        # Sort cards by created_at (newest first)
        card_responses.sort(key=lambda x: x.created_at, reverse=True)
        
        # Prepare response
        response_data = CardListResponse(
            cards=card_responses,
            total_count=len(card_responses),
            active_count=active_count,
            total_debt_by_currency=total_debt_by_currency,
            total_available_credit=total_available_credit
        )
        
        return create_response(200, response_data.model_dump())
        
    except Exception as e:
        logger.error(f"Error getting cards: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def get_card_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Get a specific card by ID
    GET /cards/{card_id}
    """
    try:
        user_id = user_data.user_id
        
        # Validate path parameters
        path_params = event.get('pathParameters', {}) or {}
        card_id = path_params.get('card_id')
        
        if not card_id:
            return create_response(400, {"error": "Missing required parameter: card_id"})
            
        logger.info(f"Getting card {card_id} for user: {user_id}")
        
        # Get card from database
        db_client = DynamoDBClient()
        card = db_client.get_card_by_id(user_id, card_id)
        
        if not card:
            return create_response(404, {"error": "Card not found"})
        
        # Calculate additional fields
        credit_limit = float(card.get('credit_limit', 0)) if card.get('credit_limit') else None
        current_balance = float(card.get('current_balance', 0))
        available_credit = calculate_available_credit(credit_limit or 0, current_balance) if credit_limit else None
        
        days_due = days_until_payment_due(card.get('payment_due_date'))
        
        # Prepare response
        response_data = CardResponse(
            card_id=card['card_id'],
            user_id=card['user_id'],
            name=card['name'],
            card_type=card['card_type'],
            card_network=card['card_network'],
            bank_name=card['bank_name'],
            credit_limit=credit_limit,
            current_balance=current_balance,
            available_credit=available_credit,
            minimum_payment=float(card.get('minimum_payment')) if card.get('minimum_payment') else None,
            payment_due_date=card.get('payment_due_date'),
            cut_off_date=card.get('cut_off_date'),
            apr=float(card.get('apr')) if card.get('apr') else None,
            annual_fee=float(card.get('annual_fee')) if card.get('annual_fee') else None,
            rewards_program=card.get('rewards_program'),
            currency=card['currency'],
            color=card.get('color'),
            description=card.get('description'),
            status=card['status'],
            days_until_due=days_due,
            created_at=card['created_at'],
            updated_at=card['updated_at']
        )
        
        return create_response(200, {"card": response_data.model_dump()})
        
    except Exception as e:
        logger.error(f"Error getting card: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def update_card_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Update a card
    PUT /cards/{card_id}
    """
    try:
        user_id = user_data.user_id
        card_id = event['pathParameters']['card_id']
        logger.info(f"Updating card {card_id} for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        update_data = CardUpdate(**body)
        
        # Get existing card
        db_client = DynamoDBClient()
        existing_card = db_client.get_card_by_id(user_id, card_id)
        
        if not existing_card:
            return create_response(404, {"error": "Card not found"})
        
        # Prepare update data
        update_fields = {}
        
        if update_data.name is not None:
            update_fields['name'] = update_data.name
        if update_data.bank_name is not None:
            update_fields['bank_name'] = update_data.bank_name
        if update_data.credit_limit is not None:
            update_fields['credit_limit'] = Decimal(str(update_data.credit_limit))
        if update_data.minimum_payment is not None:
            update_fields['minimum_payment'] = Decimal(str(update_data.minimum_payment))
        if update_data.payment_due_date is not None:
            update_fields['payment_due_date'] = update_data.payment_due_date
        if update_data.apr is not None:
            update_fields['apr'] = Decimal(str(update_data.apr))
        if update_data.annual_fee is not None:
            update_fields['annual_fee'] = Decimal(str(update_data.annual_fee))
        if update_data.rewards_program is not None:
            update_fields['rewards_program'] = update_data.rewards_program
        if update_data.color is not None:
            update_fields['color'] = update_data.color
        if update_data.description is not None:
            update_fields['description'] = update_data.description
        if update_data.status is not None:
            update_fields['status'] = update_data.status
            
        update_fields['updated_at'] = datetime.now().isoformat()
        
        # Update in database
        updated_card = db_client.update_card(user_id, card_id, update_fields)
        
        if not updated_card:
            return create_response(404, {"error": "Card not found"})
        
        # Calculate additional fields
        credit_limit = float(updated_card.get('credit_limit', 0)) if updated_card.get('credit_limit') else None
        current_balance = float(updated_card.get('current_balance', 0))
        available_credit = calculate_available_credit(credit_limit or 0, current_balance) if credit_limit else None
        
        days_due = days_until_payment_due(updated_card.get('payment_due_date'))
        
        # Prepare response
        response_data = CardResponse(
            card_id=updated_card['card_id'],
            user_id=updated_card['user_id'],
            name=updated_card['name'],
            card_type=updated_card['card_type'],
            card_network=updated_card['card_network'],
            bank_name=updated_card['bank_name'],
            credit_limit=credit_limit,
            current_balance=current_balance,
            available_credit=available_credit,
            minimum_payment=float(updated_card.get('minimum_payment')) if updated_card.get('minimum_payment') else None,
            payment_due_date=updated_card.get('payment_due_date'),
            cut_off_date=updated_card.get('cut_off_date'),
            apr=float(updated_card.get('apr')) if updated_card.get('apr') else None,
            annual_fee=float(updated_card.get('annual_fee')) if updated_card.get('annual_fee') else None,
            rewards_program=updated_card.get('rewards_program'),
            currency=updated_card['currency'],
            color=updated_card.get('color'),
            description=updated_card.get('description'),
            status=updated_card['status'],
            days_until_due=days_due,
            created_at=updated_card['created_at'],
            updated_at=updated_card['updated_at']
        )
        
        logger.info(f"Card updated successfully: {card_id}")
        return create_response(200, {"card": response_data.model_dump()})
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error updating card: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def delete_card_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Delete a card
    DELETE /cards/{card_id}
    """
    try:
        user_id = user_data.user_id
        card_id = event['pathParameters']['card_id']
        logger.info(f"Deleting card {card_id} for user: {user_id}")
        
        # Check if card exists and delete
        db_client = DynamoDBClient()
        now = datetime.now().isoformat()
        
        # Use soft delete (set status to inactive)
        success = db_client.delete_card(user_id, card_id, now)
        
        if not success:
            return create_response(404, {"error": "Card not found"})
        
        logger.info(f"Card deleted successfully: {card_id}")
        return create_response(200, {"message": "Card deleted successfully"})
        
    except Exception as e:
        logger.error(f"Error deleting card: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def add_card_transaction_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Add a transaction to a card (purchase, payment, etc.)
    POST /cards/{card_id}/transactions
    """
    try:
        user_id = user_data.user_id
        card_id = event['pathParameters']['card_id']
        logger.info(f"Adding transaction to card {card_id} for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        transaction_data = CardTransaction(**body)
        
        # Check if card exists and belongs to user
        db_client = DynamoDBClient()
        card = db_client.get_card_by_id(user_id, card_id)
        
        if not card:
            return create_response(404, {"error": "Card not found"})
        
        # Update card balance
        current_balance = float(card.get('current_balance', 0))
        
        # For purchases, fees, interest: add to balance (increase debt)
        # For payments, cashback, refunds: subtract from balance (reduce debt)
        if transaction_data.transaction_type in ['purchase', 'fee', 'interest']:
            new_balance = current_balance + abs(transaction_data.amount)
        else:  # payment, cashback, refund
            new_balance = current_balance - abs(transaction_data.amount)
        
        # Update card balance
        update_fields = {
            'current_balance': Decimal(str(new_balance)),
            'updated_at': datetime.now().isoformat()
        }
        
        db_client.update_card(user_id, card_id, update_fields)
        
        logger.info(f"Transaction added successfully to card: {card_id}")
        return create_response(200, {
            "message": "Transaction added successfully",
            "new_balance": new_balance
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error adding transaction: {str(e)}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def make_card_payment_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Make a payment towards a card
    POST /cards/{card_id}/payment
    """
    try:
        user_id = user_data.user_id
        card_id = event['pathParameters']['card_id']
        logger.info(f"Making payment for card {card_id} for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        payment_data = CardPayment(**body)
        
        # Check if card exists and belongs to user
        db_client = DynamoDBClient()
        card = db_client.get_card_by_id(user_id, card_id)
        
        if not card:
            return create_response(404, {"error": "Card not found"})
        
        # Update card balance (subtract payment from balance)
        current_balance = float(card.get('current_balance', 0))
        new_balance = current_balance - payment_data.amount
        
        # Update card balance
        update_fields = {
            'current_balance': Decimal(str(new_balance)),
            'updated_at': datetime.now().isoformat()
        }
        
        db_client.update_card(user_id, card_id, update_fields)
        
        logger.info(f"Payment made successfully for card: {card_id}")
        return create_response(200, {
            "message": "Payment made successfully",
            "payment_amount": payment_data.amount,
            "new_balance": new_balance
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error making payment: {str(e)}")
        return create_response(500, {"error": "Internal server error"})


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for cards API
    Routes requests to appropriate handler functions
    """
    try:
        logger.info(f"Cards handler - Event: {json.dumps(event, default=str)}")
        
        http_method = event.get('httpMethod')
        path = event.get('path', '').rstrip('/')
        
        # Remove API Gateway stage prefix if present
        if path.startswith('/api'):
            path = path[4:]  # Remove '/api'
        
        # Route to appropriate handler
        # The @require_auth decorator will handle authentication automatically
        if path == '/cards' and http_method == 'POST':
            return create_card_handler(event, context)
        elif path == '/cards' and http_method == 'GET':
            return get_cards_handler(event, context)
        elif path.startswith('/cards/') and http_method == 'GET':
            # Check if it's a specific card or has additional path segments
            path_parts = [p for p in path.split('/') if p]  # Remove empty parts
            if len(path_parts) == 2:  # /cards/{card_id}
                return get_card_handler(event, context)
        elif path.startswith('/cards/') and http_method == 'PUT':
            path_parts = [p for p in path.split('/') if p]
            if len(path_parts) == 2:  # /cards/{card_id}
                return update_card_handler(event, context)
        elif path.startswith('/cards/') and http_method == 'DELETE':
            path_parts = [p for p in path.split('/') if p]
            if len(path_parts) == 2:  # /cards/{card_id}
                return delete_card_handler(event, context)
        elif path.endswith('/transactions') and http_method == 'POST':
            return add_card_transaction_handler(event, context)
        elif path.endswith('/payment') and http_method == 'POST':
            return make_card_payment_handler(event, context)
        else:
            # Route not found
            logger.warning(f"Route not found: {http_method} {path}")
            return create_response(404, {"error": "Route not found"})
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_response(500, {"error": "Internal server error"})