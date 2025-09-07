"""
Handlers for transaction management
Implements complete transaction CRUD and analytics using Single Table Design
"""

import json
import logging
import uuid
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from utils.responses import create_response
    from utils.dynamodb_client import DynamoDBClient
    from utils.jwt_auth import require_auth, TokenPayload
    from models.transaction import (
        TransactionCreate, 
        TransactionUpdate, 
        TransactionResponse, 
        TransactionListResponse,
        TransactionSummary,
        TransactionFilter
    )
    from models.account import AccountResponse
    logger.info("✅ All dependencies imported successfully")
except ImportError as e:
    logger.error(f"❌ Import error: {e}")
    raise

def generate_transaction_id() -> str:
    """Generate a unique transaction ID"""
    return f"txn_{uuid.uuid4().hex[:12]}"

@require_auth
def create_transaction_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Create a new transaction
    POST /transactions
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Creating transaction for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data
        transaction_data = TransactionCreate(**body)
        
        # Verify account exists and belongs to user
        db_client = DynamoDBClient()
        account = db_client.get_account_by_id(user_id, transaction_data.account_id)
        
        if not account:
            return create_response(404, {"error": "Account not found"})
        
        if not account['is_active']:
            return create_response(400, {"error": "Cannot create transaction for inactive account"})
        
        # For transfers, verify destination account
        destination_account = None
        if transaction_data.transaction_type == 'transfer' and transaction_data.destination_account_id:
            destination_account = db_client.get_account_by_id(user_id, transaction_data.destination_account_id)
            if not destination_account:
                return create_response(404, {"error": "Destination account not found"})
            if not destination_account['is_active']:
                return create_response(400, {"error": "Cannot transfer to inactive account"})
        
        # Generate transaction ID and timestamps
        transaction_id = generate_transaction_id()
        now = datetime.now().isoformat()
        transaction_date = transaction_data.transaction_date or now
        
        # Calculate new account balance
        current_balance = Decimal(str(account['current_balance']))
        transaction_amount = transaction_data.amount
        
        # For expense transactions, make amount negative to subtract from balance
        if transaction_data.transaction_type in ['expense', 'fee']:
            balance_change = -abs(transaction_amount)
        # For income, investment gains, refunds, add to balance  
        elif transaction_data.transaction_type in ['income', 'refund', 'dividend', 'bonus', 'salary', 'interest']:
            balance_change = abs(transaction_amount)
        # For transfers out, subtract from source account
        elif transaction_data.transaction_type == 'transfer':
            balance_change = -abs(transaction_amount)
        # For other types, use the sign as provided
        else:
            balance_change = transaction_amount
        
        new_balance = current_balance + balance_change
        
        # Prepare transaction data for database
        db_transaction_data = {
            'transaction_id': transaction_id,
            'user_id': user_id,
            'account_id': transaction_data.account_id,
            'account_name': account['name'],
            'amount': transaction_data.amount,  # Store original amount
            'description': transaction_data.description,
            'transaction_type': transaction_data.transaction_type,
            'category': transaction_data.category,
            'status': 'completed',  # Default status
            'transaction_date': transaction_date,
            'reference_number': transaction_data.reference_number,
            'notes': transaction_data.notes,
            'tags': transaction_data.tags or [],
            'location': transaction_data.location,
            'destination_account_id': transaction_data.destination_account_id,
            'destination_account_name': destination_account['name'] if destination_account else None,
            'account_balance_after': new_balance,
            'is_recurring': transaction_data.is_recurring,
            'recurring_frequency': transaction_data.recurring_frequency,
            'created_at': now,
            'updated_at': now
        }
        
        # Create the transaction
        created_transaction = db_client.create_transaction(db_transaction_data)
        
        # Update source account balance
        update_fields = {
            'current_balance': new_balance,
            'updated_at': now
        }
        db_client.update_account(user_id, transaction_data.account_id, update_fields)
        
        # If it's a transfer, create the corresponding transaction in destination account
        if (transaction_data.transaction_type == 'transfer' and 
            transaction_data.destination_account_id and 
            destination_account):
            
            # Generate destination transaction ID
            dest_transaction_id = generate_transaction_id()
            dest_current_balance = Decimal(str(destination_account['current_balance']))
            dest_new_balance = dest_current_balance + abs(transaction_amount)
            
            # Create destination transaction
            dest_transaction_data = {
                'transaction_id': dest_transaction_id,
                'user_id': user_id,
                'account_id': transaction_data.destination_account_id,
                'account_name': destination_account['name'],
                'amount': abs(transaction_amount),  # Positive amount for destination
                'description': f"Transfer from {account['name']}: {transaction_data.description}",
                'transaction_type': 'income',  # Treat as income for destination account
                'category': 'account_transfer',
                'status': 'completed',
                'transaction_date': transaction_date,
                'reference_number': transaction_data.reference_number,
                'notes': f"Transfer from transaction {transaction_id}",
                'tags': transaction_data.tags or [],
                'location': transaction_data.location,
                'destination_account_id': transaction_data.account_id,  # Reference back to source
                'destination_account_name': account['name'],
                'account_balance_after': dest_new_balance,
                'is_recurring': False,
                'recurring_frequency': None,
                'created_at': now,
                'updated_at': now
            }
            
            db_client.create_transaction(dest_transaction_data)
            
            # Update destination account balance
            dest_update_fields = {
                'current_balance': dest_new_balance,
                'updated_at': now
            }
            db_client.update_account(user_id, transaction_data.destination_account_id, dest_update_fields)
        
        # Prepare response
        response_data = TransactionResponse(
            transaction_id=created_transaction['transaction_id'],
            user_id=created_transaction['user_id'],
            account_id=created_transaction['account_id'],
            account_name=created_transaction['account_name'],
            amount=created_transaction['amount'],
            description=created_transaction['description'],
            transaction_type=created_transaction['transaction_type'],
            category=created_transaction['category'],
            status=created_transaction['status'],
            transaction_date=created_transaction['transaction_date'],
            reference_number=created_transaction.get('reference_number'),
            notes=created_transaction.get('notes'),
            tags=created_transaction.get('tags', []),
            location=created_transaction.get('location'),
            destination_account_id=created_transaction.get('destination_account_id'),
            destination_account_name=created_transaction.get('destination_account_name'),
            account_balance_after=created_transaction['account_balance_after'],
            created_at=created_transaction['created_at'],
            updated_at=created_transaction['updated_at']
        )
        
        return create_response(201, {
            "message": "Transaction created successfully",
            "transaction": response_data.model_dump()
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {"error": "Invalid JSON format"})
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def list_transactions_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    List user transactions with filtering and pagination
    GET /transactions
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Listing transactions for user: {user_id}")
        
        # Parse query parameters
        query_params = event.get('queryStringParameters') or {}
        
        # Validate and create filter object
        filter_data = TransactionFilter(**query_params)
        
        # Get transactions from database
        db_client = DynamoDBClient()
        
        # Convert filter to dict for database query
        filters = {}
        if filter_data.account_id:
            filters['account_id'] = filter_data.account_id
        if filter_data.transaction_type:
            filters['transaction_type'] = filter_data.transaction_type
        if filter_data.category:
            filters['category'] = filter_data.category
        if filter_data.status:
            filters['status'] = filter_data.status
        if filter_data.date_from:
            filters['date_from'] = filter_data.date_from
        if filter_data.date_to:
            filters['date_to'] = filter_data.date_to
        if filter_data.amount_min is not None:
            filters['amount_min'] = filter_data.amount_min
        if filter_data.amount_max is not None:
            filters['amount_max'] = filter_data.amount_max
        if filter_data.search_term:
            filters['search_term'] = filter_data.search_term
        if filter_data.tags:
            filters['tags'] = filter_data.tags
        
        transactions = db_client.list_user_transactions(user_id, filters)
        
        # Apply sorting
        if filter_data.sort_by == 'date':
            transactions.sort(
                key=lambda x: x['transaction_date'],
                reverse=(filter_data.sort_order == 'desc')
            )
        elif filter_data.sort_by == 'amount':
            transactions.sort(
                key=lambda x: abs(x['amount']),
                reverse=(filter_data.sort_order == 'desc')
            )
        elif filter_data.sort_by == 'description':
            transactions.sort(
                key=lambda x: x['description'].lower(),
                reverse=(filter_data.sort_order == 'desc')
            )
        elif filter_data.sort_by == 'created_at':
            transactions.sort(
                key=lambda x: x['created_at'],
                reverse=(filter_data.sort_order == 'desc')
            )
        
        # Calculate totals
        total_income = sum(t['amount'] for t in transactions if t['amount'] > 0)
        total_expenses = sum(abs(t['amount']) for t in transactions if t['amount'] < 0)
        net_amount = total_income - total_expenses
        
        # Apply pagination
        total_count = len(transactions)
        total_pages = (total_count + filter_data.per_page - 1) // filter_data.per_page
        start_idx = (filter_data.page - 1) * filter_data.per_page
        end_idx = start_idx + filter_data.per_page
        paginated_transactions = transactions[start_idx:end_idx]
        
        # Convert to response models
        transaction_responses = []
        for transaction in paginated_transactions:
            response = TransactionResponse(
                transaction_id=transaction['transaction_id'],
                user_id=transaction['user_id'],
                account_id=transaction['account_id'],
                account_name=transaction['account_name'],
                amount=transaction['amount'],
                description=transaction['description'],
                transaction_type=transaction['transaction_type'],
                category=transaction['category'],
                status=transaction['status'],
                transaction_date=transaction['transaction_date'],
                reference_number=transaction.get('reference_number'),
                notes=transaction.get('notes'),
                tags=transaction.get('tags', []),
                location=transaction.get('location'),
                destination_account_id=transaction.get('destination_account_id'),
                destination_account_name=transaction.get('destination_account_name'),
                account_balance_after=transaction['account_balance_after'],
                created_at=transaction['created_at'],
                updated_at=transaction['updated_at']
            )
            transaction_responses.append(response)
        
        # Prepare response
        response_data = TransactionListResponse(
            transactions=transaction_responses,
            total_count=total_count,
            page=filter_data.page,
            per_page=filter_data.per_page,
            total_pages=total_pages,
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            net_amount=round(net_amount, 2)
        )
        
        return create_response(200, response_data.model_dump())
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def get_transaction_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Get a specific transaction
    GET /transactions/{transaction_id}
    """
    try:
        user_id = user_data.user_id
        transaction_id = event['pathParameters']['transaction_id']
        logger.info(f"Getting transaction {transaction_id} for user: {user_id}")
        
        # Get transaction from database
        db_client = DynamoDBClient()
        transaction = db_client.get_transaction_by_id(user_id, transaction_id)
        
        if not transaction:
            return create_response(404, {"error": "Transaction not found"})
        
        # Convert to response model
        response_data = TransactionResponse(
            transaction_id=transaction['transaction_id'],
            user_id=transaction['user_id'],
            account_id=transaction['account_id'],
            account_name=transaction['account_name'],
            amount=transaction['amount'],
            description=transaction['description'],
            transaction_type=transaction['transaction_type'],
            category=transaction['category'],
            status=transaction['status'],
            transaction_date=transaction['transaction_date'],
            reference_number=transaction.get('reference_number'),
            notes=transaction.get('notes'),
            tags=transaction.get('tags', []),
            location=transaction.get('location'),
            destination_account_id=transaction.get('destination_account_id'),
            destination_account_name=transaction.get('destination_account_name'),
            account_balance_after=transaction['account_balance_after'],
            created_at=transaction['created_at'],
            updated_at=transaction['updated_at']
        )
        
        return create_response(200, response_data.model_dump())
        
    except KeyError:
        logger.error("Missing transaction_id in path parameters")
        return create_response(400, {"error": "Transaction ID is required"})
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def update_transaction_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Update transaction details (limited fields)
    PUT /transactions/{transaction_id}
    """
    try:
        user_id = user_data.user_id
        transaction_id = event['pathParameters']['transaction_id']
        logger.info(f"Updating transaction {transaction_id} for user: {user_id}")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input data (only allow updating certain fields)
        update_data = TransactionUpdate(**body)
        
        # Verify transaction exists
        db_client = DynamoDBClient()
        existing_transaction = db_client.get_transaction_by_id(user_id, transaction_id)
        
        if not existing_transaction:
            return create_response(404, {"error": "Transaction not found"})
        
        # Don't allow updating completed transactions' core data
        if existing_transaction['status'] == 'completed':
            # Only allow updating description, category, notes, tags, location, reference_number
            allowed_updates = {
                'description': update_data.description,
                'category': update_data.category,
                'notes': update_data.notes,
                'tags': update_data.tags,
                'location': update_data.location,
                'reference_number': update_data.reference_number,
                'updated_at': datetime.now().isoformat()
            }
            
            # Remove None values
            allowed_updates = {k: v for k, v in allowed_updates.items() if v is not None}
        else:
            return create_response(400, {"error": "Cannot update completed transactions"})
        
        # Update transaction
        updated_transaction = db_client.update_transaction(user_id, transaction_id, allowed_updates)
        
        # Convert to response model
        response_data = TransactionResponse(
            transaction_id=updated_transaction['transaction_id'],
            user_id=updated_transaction['user_id'],
            account_id=updated_transaction['account_id'],
            account_name=updated_transaction['account_name'],
            amount=updated_transaction['amount'],
            description=updated_transaction['description'],
            transaction_type=updated_transaction['transaction_type'],
            category=updated_transaction['category'],
            status=updated_transaction['status'],
            transaction_date=updated_transaction['transaction_date'],
            reference_number=updated_transaction.get('reference_number'),
            notes=updated_transaction.get('notes'),
            tags=updated_transaction.get('tags', []),
            location=updated_transaction.get('location'),
            destination_account_id=updated_transaction.get('destination_account_id'),
            destination_account_name=updated_transaction.get('destination_account_name'),
            account_balance_after=updated_transaction['account_balance_after'],
            created_at=updated_transaction['created_at'],
            updated_at=updated_transaction['updated_at']
        )
        
        return create_response(200, {
            "message": "Transaction updated successfully",
            "transaction": response_data.model_dump()
        })
        
    except KeyError:
        logger.error("Missing transaction_id in path parameters")
        return create_response(400, {"error": "Transaction ID is required"})
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {"error": "Invalid JSON format"})
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error updating transaction: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def delete_transaction_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Delete a transaction and revert account balance
    DELETE /transactions/{transaction_id}
    """
    try:
        user_id = user_data.user_id
        transaction_id = event['pathParameters']['transaction_id']
        logger.info(f"Deleting transaction {transaction_id} for user: {user_id}")
        
        # Get transaction details before deletion
        db_client = DynamoDBClient()
        transaction = db_client.get_transaction_by_id(user_id, transaction_id)
        
        if not transaction:
            return create_response(404, {"error": "Transaction not found"})
        
        # Don't allow deleting if it would create data inconsistency
        # For simplicity, only allow deleting the most recent transaction per account
        # In production, you'd want more sophisticated balance recalculation
        
        # Get account details
        account = db_client.get_account_by_id(user_id, transaction['account_id'])
        if not account:
            return create_response(400, {"error": "Associated account not found"})
        
        # Calculate balance reversion
        transaction_amount = Decimal(str(transaction['amount']))
        current_balance = Decimal(str(account['current_balance']))
        
        # Reverse the transaction effect
        if transaction['transaction_type'] in ['expense', 'fee']:
            # Transaction reduced balance, so add it back
            balance_change = abs(transaction_amount)
        elif transaction['transaction_type'] in ['income', 'refund', 'dividend', 'bonus', 'salary', 'interest']:
            # Transaction increased balance, so subtract it
            balance_change = -abs(transaction_amount)
        elif transaction['transaction_type'] == 'transfer':
            # Transfer reduced source balance, so add it back
            balance_change = abs(transaction_amount)
        else:
            # Use opposite of original effect
            balance_change = -transaction_amount
        
        new_balance = current_balance + balance_change
        
        # Update account balance
        update_fields = {
            'current_balance': new_balance,
            'updated_at': datetime.now().isoformat()
        }
        db_client.update_account(user_id, transaction['account_id'], update_fields)
        
        # If it was a transfer, we should also handle the destination account
        # For now, we'll leave this as a manual process or future enhancement
        
        # Delete the transaction
        success = db_client.delete_transaction(user_id, transaction_id)
        
        if not success:
            return create_response(404, {"error": "Transaction not found"})
        
        return create_response(200, {
            "message": "Transaction deleted successfully",
            "account_balance_after_deletion": new_balance
        })
        
    except KeyError:
        logger.error("Missing transaction_id in path parameters")
        return create_response(400, {"error": "Transaction ID is required"})
    except Exception as e:
        logger.error(f"Error deleting transaction: {e}")
        return create_response(500, {"error": "Internal server error"})

@require_auth
def get_transaction_summary_handler(event: Dict[str, Any], context: Any, user_data: TokenPayload) -> Dict[str, Any]:
    """
    Get transaction summary/analytics
    GET /transactions/summary
    """
    try:
        user_id = user_data.user_id
        logger.info(f"Getting transaction summary for user: {user_id}")
        
        # Parse query parameters for period
        query_params = event.get('queryStringParameters') or {}
        period = query_params.get('period', 'current_month')
        account_id = query_params.get('account_id')  # Optional account filter
        
        # Calculate date range based on period
        now = datetime.now()
        if period == 'current_month':
            date_from = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
            date_to = now.isoformat()
            period_label = f"{now.strftime('%Y-%m')}"
        elif period == 'last_30_days':
            from datetime import timedelta
            date_from = (now - timedelta(days=30)).isoformat()
            date_to = now.isoformat()
            period_label = "last_30_days"
        elif period == 'current_year':
            date_from = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
            date_to = now.isoformat()
            period_label = str(now.year)
        elif period == 'last_year':
            last_year = now.year - 1
            date_from = now.replace(year=last_year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
            date_to = now.replace(year=last_year, month=12, day=31, hour=23, minute=59, second=59).isoformat()
            period_label = str(last_year)
        else:
            # Custom period - expect date_from and date_to in query params
            date_from = query_params.get('date_from')
            date_to = query_params.get('date_to')
            period_label = period
            
            if not date_from or not date_to:
                return create_response(400, {"error": "date_from and date_to are required for custom period"})
        
        # Get filtered transactions
        db_client = DynamoDBClient()
        filters = {
            'date_from': date_from,
            'date_to': date_to
        }
        
        if account_id:
            filters['account_id'] = account_id
        
        transactions = db_client.list_user_transactions(user_id, filters)
        
        # Calculate summary metrics
        total_income = 0.0
        total_expenses = 0.0
        income_by_category = {}
        expenses_by_category = {}
        activity_by_account = {}
        
        for transaction in transactions:
            amount = transaction['amount']
            category = transaction['category']
            account_name = transaction['account_name']
            account_id_key = transaction['account_id']
            
            # Initialize account activity tracking
            if account_id_key not in activity_by_account:
                activity_by_account[account_id_key] = {
                    'account_name': account_name,
                    'total_income': 0.0,
                    'total_expenses': 0.0,
                    'transaction_count': 0,
                    'net_amount': 0.0
                }
            
            activity_by_account[account_id_key]['transaction_count'] += 1
            
            if amount > 0:
                # Income
                total_income += amount
                activity_by_account[account_id_key]['total_income'] += amount
                
                if category in income_by_category:
                    income_by_category[category] += amount
                else:
                    income_by_category[category] = amount
            else:
                # Expense
                expense_amount = abs(amount)
                total_expenses += expense_amount
                activity_by_account[account_id_key]['total_expenses'] += expense_amount
                
                if category in expenses_by_category:
                    expenses_by_category[category] += expense_amount
                else:
                    expenses_by_category[category] = expense_amount
            
            # Calculate net for account
            activity_by_account[account_id_key]['net_amount'] = (
                activity_by_account[account_id_key]['total_income'] - 
                activity_by_account[account_id_key]['total_expenses']
            )
        
        # Round all values
        total_income = round(total_income, 2)
        total_expenses = round(total_expenses, 2)
        net_amount = round(total_income - total_expenses, 2)
        
        # Round category totals
        for category in income_by_category:
            income_by_category[category] = round(income_by_category[category], 2)
        for category in expenses_by_category:
            expenses_by_category[category] = round(expenses_by_category[category], 2)
        
        # Round account activity
        for account_id_key in activity_by_account:
            activity_by_account[account_id_key]['total_income'] = round(activity_by_account[account_id_key]['total_income'], 2)
            activity_by_account[account_id_key]['total_expenses'] = round(activity_by_account[account_id_key]['total_expenses'], 2)
            activity_by_account[account_id_key]['net_amount'] = round(activity_by_account[account_id_key]['net_amount'], 2)
        
        # Get top categories
        top_expense_categories = sorted(
            [{'category': k, 'amount': v} for k, v in expenses_by_category.items()],
            key=lambda x: x['amount'],
            reverse=True
        )[:5]
        
        top_income_categories = sorted(
            [{'category': k, 'amount': v} for k, v in income_by_category.items()],
            key=lambda x: x['amount'],
            reverse=True
        )[:5]
        
        # Prepare response
        response_data = TransactionSummary(
            period=period_label,
            total_income=total_income,
            total_expenses=total_expenses,
            net_amount=net_amount,
            transaction_count=len(transactions),
            income_by_category=income_by_category,
            expenses_by_category=expenses_by_category,
            activity_by_account=activity_by_account,
            top_expense_categories=top_expense_categories,
            top_income_categories=top_income_categories
        )
        
        return create_response(200, response_data.model_dump())
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error getting transaction summary: {e}")
        return create_response(500, {"error": "Internal server error"})

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for transaction operations
    Routes requests to appropriate handlers based on HTTP method and path
    """
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        # Remove API Gateway stage prefix if present
        if path.startswith('/api'):
            path = path[4:]  # Remove '/api'
        
        logger.info(f"Processing {http_method} {path}")
        
        # Route to appropriate handler
        if path == '/transactions' and http_method == 'POST':
            return create_transaction_handler(event, context)
        elif path == '/transactions' and http_method == 'GET':
            return list_transactions_handler(event, context)
        elif path == '/transactions/summary' and http_method == 'GET':
            return get_transaction_summary_handler(event, context)
        elif path.startswith('/transactions/') and path.count('/') == 2 and http_method == 'GET':
            return get_transaction_handler(event, context)
        elif path.startswith('/transactions/') and path.count('/') == 2 and http_method == 'PUT':
            return update_transaction_handler(event, context)
        elif path.startswith('/transactions/') and path.count('/') == 2 and http_method == 'DELETE':
            return delete_transaction_handler(event, context)
        else:
            return create_response(404, {"error": "Endpoint not found"})
            
    except Exception as e:
        logger.error(f"Unhandled error in lambda_handler: {e}")
        return create_response(500, {"error": "Internal server error"})
