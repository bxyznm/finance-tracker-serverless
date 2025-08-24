"""
Account handlers for AWS Lambda
Manages bank accounts and financial accounts
"""

import json
import logging
from typing import Dict, Any
from datetime import datetime
import secrets
from decimal import Decimal

from utils.responses import create_response
from utils.dynamodb_client import DynamoDBClient
from utils.jwt_auth import require_auth, TokenPayload
from models.account import (
    AccountCreate, AccountUpdate, AccountResponse, 
    AccountBalance, AccountListResponse
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def generate_account_id() -> str:
    """Generate a unique account ID"""
    return f"acc_{secrets.token_hex(8)}"

@require_auth
def create_account_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Create a new account for the authenticated user
    POST /accounts
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Creating account for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        account_data = AccountCreate(**body)
        
        # Generate unique account ID
        account_id = generate_account_id()
        
        # Prepare data for database
        now = datetime.now().isoformat()
        db_data = {
            'user_id': user_id,
            'account_id': account_id,
            'name': account_data.name,
            'account_type': account_data.account_type,
            'bank_name': account_data.bank_name,
            'bank_code': account_data.bank_code,
            'currency': account_data.currency,
            'initial_balance': Decimal(str(account_data.initial_balance)),
            'is_active': account_data.is_active,
            'description': account_data.description,
            'color': account_data.color,
            'created_at': now,
            'updated_at': now
        }
        
        # Save to database
        db_client = DynamoDBClient()
        created_account = db_client.create_account(db_data)
        
        # Prepare response
        response_data = AccountResponse(
            account_id=created_account['account_id'],
            user_id=created_account['user_id'],
            name=created_account['name'],
            account_type=created_account['account_type'],
            bank_name=created_account['bank_name'],
            bank_code=created_account.get('bank_code'),
            currency=created_account['currency'],
            current_balance=created_account['current_balance'],
            is_active=created_account['is_active'],
            description=created_account.get('description'),
            color=created_account.get('color'),
            created_at=created_account['created_at'],
            updated_at=created_account['updated_at']
        )
        
        return create_response(201, {
            "message": "Account created successfully",
            "account": response_data.model_dump()
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {"error": "Invalid JSON format"})
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def list_accounts_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    List all accounts for the authenticated user
    GET /accounts
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Listing accounts for user: {user_id}")
        
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        include_inactive = query_params.get('include_inactive', 'false').lower() == 'true'
        
        # Get accounts from database
        db_client = DynamoDBClient()
        accounts = db_client.list_user_accounts(user_id, include_inactive)
        
        # Convert to response models
        account_responses = []
        total_balance_by_currency = {}
        active_count = 0
        
        for account in accounts:
            account_response = AccountResponse(
                account_id=account['account_id'],
                user_id=account['user_id'],
                name=account['name'],
                account_type=account['account_type'],
                bank_name=account['bank_name'],
                bank_code=account.get('bank_code'),
                currency=account['currency'],
                current_balance=account['current_balance'],
                is_active=account['is_active'],
                description=account.get('description'),
                color=account.get('color'),
                created_at=account['created_at'],
                updated_at=account['updated_at']
            )
            account_responses.append(account_response)
            
            # Count active accounts
            if account['is_active']:
                active_count += 1
                
                # Sum balances by currency (only active accounts)
                currency = account['currency']
                balance = account['current_balance']
                if currency in total_balance_by_currency:
                    total_balance_by_currency[currency] += balance
                else:
                    total_balance_by_currency[currency] = balance
        
        # Round balances to 2 decimal places
        for currency in total_balance_by_currency:
            total_balance_by_currency[currency] = round(total_balance_by_currency[currency], 2)
        
        # Prepare response
        response_data = AccountListResponse(
            accounts=account_responses,
            total_count=len(account_responses),
            active_count=active_count,
            total_balance_by_currency=total_balance_by_currency
        )
        
        return create_response(200, response_data.model_dump())
        
    except Exception as e:
        logger.error(f"Error listing accounts: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def get_account_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Get a specific account by ID
    GET /accounts/{account_id}
    """
    try:
        user_id = user_data.user_id
        account_id = event['pathParameters']['account_id']
        
        logger.info(f"Getting account {account_id} for user: {user_id}")
        
        # Get account from database
        db_client = DynamoDBClient()
        account = db_client.get_account_by_id(user_id, account_id)
        
        if not account:
            return create_response(404, {"error": "Account not found"})
        
        # Convert to response model
        response_data = AccountResponse(
            account_id=account['account_id'],
            user_id=account['user_id'],
            name=account['name'],
            account_type=account['account_type'],
            bank_name=account['bank_name'],
            bank_code=account.get('bank_code'),
            currency=account['currency'],
            current_balance=account['current_balance'],
            is_active=account['is_active'],
            description=account.get('description'),
            color=account.get('color'),
            created_at=account['created_at'],
            updated_at=account['updated_at']
        )
        
        return create_response(200, response_data.model_dump())
        
    except KeyError:
        logger.error("Missing account_id in path parameters")
        return create_response(400, {"error": "Account ID is required"})
    except Exception as e:
        logger.error(f"Error getting account: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def update_account_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Update an account
    PUT /accounts/{account_id}
    """
    try:
        user_id = user_data.user_id
        account_id = event['pathParameters']['account_id']
        
        logger.info(f"Updating account {account_id} for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        update_data = AccountUpdate(**body)
        
        # Prepare data for database (only include non-None values)
        db_update_data = {}
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            if value is not None:
                db_update_data[field] = value
        
        # Always update the timestamp
        db_update_data['updated_at'] = datetime.now().isoformat()
        
        # Update in database
        db_client = DynamoDBClient()
        updated_account = db_client.update_account(user_id, account_id, db_update_data)
        
        # Convert to response model
        response_data = AccountResponse(
            account_id=updated_account['account_id'],
            user_id=updated_account['user_id'],
            name=updated_account['name'],
            account_type=updated_account['account_type'],
            bank_name=updated_account['bank_name'],
            bank_code=updated_account.get('bank_code'),
            currency=updated_account['currency'],
            current_balance=updated_account['current_balance'],
            is_active=updated_account['is_active'],
            description=updated_account.get('description'),
            color=updated_account.get('color'),
            created_at=updated_account['created_at'],
            updated_at=updated_account['updated_at']
        )
        
        return create_response(200, {
            "message": "Account updated successfully",
            "account": response_data.model_dump()
        })
        
    except KeyError:
        logger.error("Missing account_id in path parameters")
        return create_response(400, {"error": "Account ID is required"})
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {"error": "Invalid JSON format"})
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        if "not found" in str(e):
            return create_response(404, {"error": "Account not found"})
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error updating account: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def delete_account_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Delete an account (soft delete)
    DELETE /accounts/{account_id}
    """
    try:
        user_id = user_data.user_id
        account_id = event['pathParameters']['account_id']
        
        logger.info(f"Deleting account {account_id} for user: {user_id}")
        
        # Delete from database (soft delete)
        db_client = DynamoDBClient()
        success = db_client.delete_account(
            user_id, 
            account_id, 
            datetime.now().isoformat()
        )
        
        if not success:
            return create_response(404, {"error": "Account not found"})
        
        return create_response(200, {
            "message": "Account deleted successfully",
            "account_id": account_id
        })
        
    except KeyError:
        logger.error("Missing account_id in path parameters")
        return create_response(400, {"error": "Account ID is required"})
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth 
def update_balance_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Update account balance
    PATCH /accounts/{account_id}/balance
    """
    try:
        user_id = user_data.user_id
        account_id = event['pathParameters']['account_id']
        
        logger.info(f"Updating balance for account {account_id}, user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        balance_data = AccountBalance(**body)
        
        # Update balance in database
        db_client = DynamoDBClient()
        updated_account = db_client.update_account_balance(
            user_id, 
            account_id, 
            Decimal(str(balance_data.amount)),
            datetime.now().isoformat()
        )
        
        # Convert to response model
        response_data = AccountResponse(
            account_id=updated_account['account_id'],
            user_id=updated_account['user_id'],
            name=updated_account['name'],
            account_type=updated_account['account_type'],
            bank_name=updated_account['bank_name'],
            bank_code=updated_account.get('bank_code'),
            currency=updated_account['currency'],
            current_balance=updated_account['current_balance'],
            is_active=updated_account['is_active'],
            description=updated_account.get('description'),
            color=updated_account.get('color'),
            created_at=updated_account['created_at'],
            updated_at=updated_account['updated_at']
        )
        
        return create_response(200, {
            "message": "Account balance updated successfully",
            "account": response_data.model_dump(),
            "change": {
                "amount": balance_data.amount,
                "description": balance_data.description
            }
        })
        
    except KeyError:
        logger.error("Missing account_id in path parameters")
        return create_response(400, {"error": "Account ID is required"})
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {"error": "Invalid JSON format"})
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        if "not found" in str(e):
            return create_response(404, {"error": "Account not found or inactive"})
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error updating account balance: {e}")
        return create_response(500, {"error": "Internal server error"})

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for account operations
    Routes requests to appropriate handlers based on HTTP method and path
    """
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        # Remove API Gateway stage prefix if present
        if path.startswith('/api'):
            path = path[4:]  # Remove '/api'
        
        # Route to appropriate handler
        # The @require_auth decorator will handle authentication automatically
        if path == '/accounts' and http_method == 'POST':
            return create_account_handler(event, context)
        elif path == '/accounts' and http_method == 'GET':
            return list_accounts_handler(event, context)
        elif path.startswith('/accounts/') and path.count('/') == 2 and http_method == 'GET':
            return get_account_handler(event, context)
        elif path.startswith('/accounts/') and path.count('/') == 2 and http_method == 'PUT':
            return update_account_handler(event, context)
        elif path.startswith('/accounts/') and path.count('/') == 2 and http_method == 'DELETE':
            return delete_account_handler(event, context)
        elif path.endswith('/balance') and http_method == 'PATCH':
            return update_balance_handler(event, context)
        else:
            return create_response(404, {"error": "Endpoint not found"})
            
    except Exception as e:
        logger.error(f"Unhandled error in lambda_handler: {e}")
        return create_response(500, {"error": "Internal server error"})
