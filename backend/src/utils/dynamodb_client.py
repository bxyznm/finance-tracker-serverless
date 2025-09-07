"""
DynamoDB Client for Finance Tracker
Implements Single Table Design pattern to optimize performance and costs
"""

import boto3
import os
from typing import Dict, Any, Optional, List
from botocore.exceptions import ClientError
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class DynamoDBClient:
    """Client to interact with DynamoDB using Single Table Design"""
    
    def __init__(self):
        """Initialize DynamoDB client"""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('DYNAMODB_TABLE', 'finance-tracker-dev-main')
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"DynamoDBClient initialized with table: {self.table_name}")
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user in DynamoDB
        
        Single Table Design:
        - pk: USER#{user_id}
        - sk: METADATA
        - gsi1pk: EMAIL#{email}
        - gsi1sk: USER#{user_id}
        """
        try:
            user_id = user_data['user_id']
            email = user_data['email']
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': 'METADATA',
                'gsi1_pk': f'EMAIL#{email}',
                'gsi1_sk': f'USER#{user_id}',
                'entity_type': 'user',
                'user_id': user_id,
                'name': user_data['name'],
                'email': email,
                'currency': user_data.get('currency', 'MXN'),
                'password_hash': user_data['password_hash'],
                'created_at': user_data['created_at'],
                'updated_at': user_data['updated_at'],
                'is_active': user_data.get('is_active', True),
                'email_verified': user_data.get('email_verified', False),
                'failed_login_attempts': user_data.get('failed_login_attempts', 0),
                'last_login_at': user_data.get('last_login_at')
            }
            
            # Use ConditionExpression to avoid duplicates
            response = self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk)'
            )
            
            logger.info(f"User created successfully: {user_id}")
            return item
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"User already exists: {user_id}")
                raise ValueError("User already exists")
            else:
                logger.error(f"Error creating user: {e}")
                raise
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Find user by email using GSI1
        
        GSI1 allows efficient search by email:
        - gsi1pk: EMAIL#{email}
        """
        try:
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression='gsi1_pk = :email',
                ExpressionAttributeValues={
                    ':email': f'EMAIL#{email}'
                }
            )
            
            items = response.get('Items', [])
            if items:
                logger.info(f"User found by email: {email}")
                return items[0]
            else:
                logger.info(f"User not found by email: {email}")
                return None
                
        except ClientError as e:
            logger.error(f"Error searching user by email {email}: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID using partition key
        
        Direct access using pk:
        - pk: USER#{user_id}
        - sk: METADATA
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                }
            )
            
            item = response.get('Item')
            if item:
                logger.info(f"User found by ID: {user_id}")
                return item
            else:
                logger.info(f"User not found by ID: {user_id}")
                return None
                
        except ClientError as e:
            logger.error(f"Error getting user {user_id}: {e}")
            raise
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user data
        """
        try:
            # Build expression dynamically
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for field, value in update_data.items():
                if field not in ['user_id', 'pk', 'sk', 'gsi1_pk', 'gsi1_sk', 'entity_type']:
                    attr_name = f'#{field}'
                    attr_value = f':{field}'
                    update_expression += f'{attr_name} = {attr_value}, '
                    expression_names[attr_name] = field
                    expression_values[attr_value] = value
            
            # Remove last comma
            update_expression = update_expression.rstrip(', ')
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"User updated: {user_id}")
            return response['Attributes']
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"User not found for update: {user_id}")
                raise ValueError("User not found")
            else:
                logger.error(f"Error updating user {user_id}: {e}")
                raise
    
    def delete_user(self, user_id: str, updated_at: str) -> bool:
        """
        Delete user (soft delete - mark as inactive)
        """
        try:
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression='SET is_active = :inactive, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':timestamp': updated_at
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"User deleted (soft delete): {user_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"User not found for deletion: {user_id}")
                return False
            else:
                logger.error(f"Error deleting user {user_id}: {e}")
                raise
    
    def list_users(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List all active users
        """
        try:
            response = self.table.scan(
                FilterExpression='entity_type = :type AND is_active = :active',
                ExpressionAttributeValues={
                    ':type': 'user',
                    ':active': True
                },
                Limit=limit
            )
            
            users = response.get('Items', [])
            logger.info(f"Found {len(users)} active users")
            return users
            
        except ClientError as e:
            logger.error(f"Error listing users: {e}")
            raise

    def update_failed_login_attempts(self, user_id: str, attempts: int) -> bool:
        """
        Update number of failed login attempts
        """
        try:
            from datetime import datetime
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression='SET failed_login_attempts = :attempts, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':attempts': attempts,
                    ':timestamp': datetime.now().isoformat()
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"Failed attempts updated for user {user_id}: {attempts}")
            return True
            
        except ClientError as e:
            logger.error(f"Error updating failed attempts for {user_id}: {e}")
            return False

    def successful_login(self, user_id: str) -> bool:
        """
        Record successful login - resets failed attempts and updates last login
        """
        try:
            from datetime import datetime
            
            now = datetime.now().isoformat()
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression='SET failed_login_attempts = :zero, last_login_at = :timestamp, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':zero': 0,
                    ':timestamp': now
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"Successful login recorded for user: {user_id}")
            return True
            
        except ClientError as e:
            logger.error(f"Error recording successful login for {user_id}: {e}")
            return False

    def deactivate_user_temporarily(self, user_id: str) -> bool:
        """
        Temporarily deactivate user due to failed attempts
        """
        try:
            from datetime import datetime, timedelta
            
            # In a complete implementation, we could add a temporary block timestamp
            # For now we just deactivate the account
            now = datetime.now().isoformat()
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression='SET is_active = :inactive, updated_at = :timestamp, blocked_until = :blocked_until',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':timestamp': now,
                    ':blocked_until': (datetime.now() + timedelta(hours=1)).isoformat()  # Block for 1 hour
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.warning(f"User temporarily blocked: {user_id}")
            return True
            
        except ClientError as e:
            logger.error(f"Error temporarily blocking user {user_id}: {e}")
            return False

    # -----------------------------------------------------------------------------
    # Account Operations
    # -----------------------------------------------------------------------------
    
    def create_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new account for a user
        
        Single Table Design for Account:
        - pk: USER#{user_id}
        - sk: ACCOUNT#{account_id}  
        - gsi1_pk: ACCOUNT#{account_id}
        - gsi1_sk: USER#{user_id}
        - entity_type: account
        """
        try:
            user_id = account_data['user_id']
            account_id = account_data['account_id']
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': f'ACCOUNT#{account_id}',
                'gsi1_pk': f'ACCOUNT#{account_id}',
                'gsi1_sk': f'USER#{user_id}',
                'entity_type': 'account',
                'user_id': user_id,
                'account_id': account_id,
                'name': account_data['name'],
                'account_type': account_data['account_type'],
                'bank_name': account_data['bank_name'],
                'bank_code': account_data.get('bank_code'),
                'currency': account_data['currency'],
                'current_balance': account_data.get('initial_balance', 0.0),
                'is_active': account_data.get('is_active', True),
                'description': account_data.get('description'),
                'color': account_data.get('color'),
                'created_at': account_data['created_at'],
                'updated_at': account_data['updated_at']
            }
            
            # Use ConditionExpression to avoid duplicates
            response = self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
            )
            
            logger.info(f"Account created successfully: {account_id} for user {user_id}")
            return item
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Account already exists: {account_id}")
                raise ValueError("Account already exists")
            else:
                logger.error(f"Error creating account: {e}")
                raise
    
    def get_account_by_id(self, user_id: str, account_id: str) -> Optional[Dict[str, Any]]:
        """
        Get account by ID for a specific user
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'ACCOUNT#{account_id}'
                }
            )
            
            item = response.get('Item')
            if item and item.get('entity_type') == 'account':
                logger.info(f"Account found: {account_id} for user {user_id}")
                return item
            else:
                logger.info(f"Account not found: {account_id} for user {user_id}")
                return None
                
        except ClientError as e:
            logger.error(f"Error getting account {account_id} for user {user_id}: {e}")
            raise
    
    def list_user_accounts(self, user_id: str, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        List all accounts for a user
        """
        try:
            # Query all items for user that start with ACCOUNT#
            response = self.table.query(
                KeyConditionExpression='pk = :pk AND begins_with(sk, :sk_prefix)',
                ExpressionAttributeValues={
                    ':pk': f'USER#{user_id}',
                    ':sk_prefix': 'ACCOUNT#'
                }
            )
            
            accounts = response.get('Items', [])
            
            # Filter by active status if needed
            if not include_inactive:
                accounts = [acc for acc in accounts if acc.get('is_active', True)]
            
            logger.info(f"Found {len(accounts)} accounts for user {user_id}")
            return accounts
            
        except ClientError as e:
            logger.error(f"Error listing accounts for user {user_id}: {e}")
            raise
    
    def update_account(self, user_id: str, account_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update account data
        """
        try:
            # Build expression dynamically
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for field, value in update_data.items():
                if field not in ['user_id', 'account_id', 'pk', 'sk', 'gsi1_pk', 'gsi1_sk', 'entity_type']:
                    attr_name = f'#{field}'
                    attr_value = f':{field}'
                    update_expression += f'{attr_name} = {attr_value}, '
                    expression_names[attr_name] = field
                    expression_values[attr_value] = value
            
            # Remove last comma
            update_expression = update_expression.rstrip(', ')
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'ACCOUNT#{account_id}'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)'
            )
            
            logger.info(f"Account updated: {account_id} for user {user_id}")
            return response['Attributes']
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Account not found for update: {account_id} for user {user_id}")
                raise ValueError("Account not found")
            else:
                logger.error(f"Error updating account {account_id} for user {user_id}: {e}")
                raise
    
    def delete_account(self, user_id: str, account_id: str, updated_at: str) -> bool:
        """
        Delete account (soft delete - mark as inactive)
        """
        try:
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'ACCOUNT#{account_id}'
                },
                UpdateExpression='SET is_active = :inactive, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':timestamp': updated_at
                },
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)'
            )
            
            logger.info(f"Account deleted (soft delete): {account_id} for user {user_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Account not found for deletion: {account_id} for user {user_id}")
                return False
            else:
                logger.error(f"Error deleting account {account_id} for user {user_id}: {e}")
                raise
    
    def update_account_balance(self, user_id: str, account_id: str, amount: float, updated_at: str) -> Dict[str, Any]:
        """
        Update account balance by adding/subtracting amount
        """
        try:
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'ACCOUNT#{account_id}'
                },
                UpdateExpression='SET current_balance = current_balance + :amount, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':amount': amount,
                    ':timestamp': updated_at,
                    ':active': True
                },
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk) AND is_active = :active'
            )
            
            logger.info(f"Account balance updated: {account_id} for user {user_id}, amount: {amount}")
            return response['Attributes']
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Account not found or inactive for balance update: {account_id} for user {user_id}")
                raise ValueError("Account not found or inactive")
            else:
                logger.error(f"Error updating balance for account {account_id}, user {user_id}: {e}")
                raise

    # -------------------------------------------------------------------------
    # Card Methods
    # -------------------------------------------------------------------------

    def create_card(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new card for a user
        
        Single Table Design for Card:
        - pk: USER#{user_id}
        - sk: CARD#{card_id}  
        - gsi1_pk: CARD#{card_id}
        - gsi1_sk: USER#{user_id}
        - entity_type: card
        """
        try:
            user_id = card_data['user_id']
            card_id = card_data['card_id']
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': f'CARD#{card_id}',
                'gsi1_pk': f'CARD#{card_id}',
                'gsi1_sk': f'USER#{user_id}',
                'entity_type': 'card',
                'user_id': user_id,
                'card_id': card_id,
                'name': card_data['name'],
                'card_type': card_data['card_type'],
                'card_network': card_data['card_network'],
                'bank_name': card_data['bank_name'],
                'credit_limit': card_data.get('credit_limit'),
                'current_balance': card_data.get('current_balance', 0.0),
                'minimum_payment': card_data.get('minimum_payment'),
                'payment_due_date': card_data.get('payment_due_date'),
                'cut_off_date': card_data.get('cut_off_date'),
                'apr': card_data.get('apr'),
                'annual_fee': card_data.get('annual_fee'),
                'rewards_program': card_data.get('rewards_program'),
                'currency': card_data['currency'],
                'color': card_data.get('color'),
                'description': card_data.get('description'),
                'status': card_data.get('status', 'active'),
                'created_at': card_data['created_at'],
                'updated_at': card_data['updated_at']
            }
            
            # Put item to DynamoDB
            self.table.put_item(Item=item)
            
            logger.info(f"Card created: {card_id} for user {user_id}")
            return item
            
        except ClientError as e:
            logger.error(f"Error creating card {card_data.get('card_id')} for user {card_data.get('user_id')}: {e}")
            raise

    def get_card_by_id(self, user_id: str, card_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific card by user_id and card_id
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'CARD#{card_id}'
                }
            )
            
            item = response.get('Item')
            if item and item.get('entity_type') == 'card':
                logger.info(f"Card found: {card_id} for user {user_id}")
                return item
            else:
                logger.warning(f"Card not found: {card_id} for user {user_id}")
                return None
                
        except ClientError as e:
            logger.error(f"Error getting card {card_id} for user {user_id}: {e}")
            raise

    def list_user_cards(self, user_id: str, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        List all cards for a user
        """
        try:
            query_params = {
                'KeyConditionExpression': 'pk = :pk AND begins_with(sk, :sk_prefix)',
                'ExpressionAttributeValues': {
                    ':pk': f'USER#{user_id}',
                    ':sk_prefix': 'CARD#'
                }
            }
            
            if not include_inactive:
                query_params['FilterExpression'] = '#status = :status'
                query_params['ExpressionAttributeNames'] = {'#status': 'status'}
                query_params['ExpressionAttributeValues'][':status'] = 'active'
            
            response = self.table.query(**query_params)
            cards = [item for item in response['Items'] if item.get('entity_type') == 'card']
            
            logger.info(f"Found {len(cards)} cards for user {user_id}")
            return cards
            
        except ClientError as e:
            logger.error(f"Error listing cards for user {user_id}: {e}")
            raise

    def update_card(self, user_id: str, card_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a card's information
        """
        try:
            # Build update expression
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for key, value in update_data.items():
                if key not in ['user_id', 'card_id', 'pk', 'sk', 'entity_type']:
                    attr_name = f"#{key}"
                    attr_value = f":{key}"
                    update_expression += f"{attr_name} = {attr_value}, "
                    expression_names[attr_name] = key
                    expression_values[attr_value] = value
            
            # Remove trailing comma and space
            update_expression = update_expression.rstrip(', ')
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'CARD#{card_id}'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ConditionExpression='attribute_exists(pk) AND entity_type = :entity_type',
                ReturnValues='ALL_NEW'
            )
            
            logger.info(f"Card updated: {card_id} for user {user_id}")
            return response['Attributes']
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Card not found for update: {card_id} for user {user_id}")
                raise ValueError("Card not found")
            else:
                logger.error(f"Error updating card {card_id} for user {user_id}: {e}")
                raise

    def delete_card(self, user_id: str, card_id: str, updated_at: str) -> bool:
        """
        Soft delete a card by setting status to inactive
        """
        try:
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'CARD#{card_id}'
                },
                UpdateExpression='SET #status = :status, updated_at = :updated_at',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'inactive',
                    ':updated_at': updated_at
                },
                ConditionExpression='attribute_exists(pk) AND entity_type = :entity_type',
                ReturnValues='ALL_NEW'
            )
            
            logger.info(f"Card deleted (soft): {card_id} for user {user_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Card not found for deletion: {card_id} for user {user_id}")
                return False
            else:
                logger.error(f"Error deleting card {card_id} for user {user_id}: {e}")
                raise

    # ===========================
    # TRANSACTION OPERATIONS
    # ===========================

    def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new transaction in DynamoDB
        
        Single Table Design:
        - pk: USER#{user_id}
        - sk: TRANSACTION#{transaction_id}
        - gsi1_pk: ACCOUNT#{account_id}
        - gsi1_sk: TRANSACTION#{transaction_date}#{transaction_id}
        """
        try:
            transaction_id = transaction_data['transaction_id']
            user_id = transaction_data['user_id']
            account_id = transaction_data['account_id']
            transaction_date = transaction_data['transaction_date']
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': f'TRANSACTION#{transaction_id}',
                'gsi1_pk': f'ACCOUNT#{account_id}',
                'gsi1_sk': f'TRANSACTION#{transaction_date}#{transaction_id}',
                'entity_type': 'transaction',
                'transaction_id': transaction_id,
                'user_id': user_id,
                'account_id': account_id,
                'account_name': transaction_data['account_name'],
                'amount': Decimal(str(transaction_data['amount'])),
                'description': transaction_data['description'],
                'transaction_type': transaction_data['transaction_type'],
                'category': transaction_data['category'],
                'status': transaction_data['status'],
                'transaction_date': transaction_date,
                'reference_number': transaction_data.get('reference_number'),
                'notes': transaction_data.get('notes'),
                'tags': transaction_data.get('tags', []),
                'location': transaction_data.get('location'),
                'destination_account_id': transaction_data.get('destination_account_id'),
                'destination_account_name': transaction_data.get('destination_account_name'),
                'account_balance_after': Decimal(str(transaction_data['account_balance_after'])),
                'is_recurring': transaction_data.get('is_recurring', False),
                'recurring_frequency': transaction_data.get('recurring_frequency'),
                'created_at': transaction_data['created_at'],
                'updated_at': transaction_data['updated_at']
            }
            
            # Use ConditionExpression to avoid duplicates
            response = self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
            )
            
            logger.info(f"Transaction created successfully: {transaction_id}")
            
            # Convert Decimal back to float for response
            item['amount'] = float(item['amount'])
            item['account_balance_after'] = float(item['account_balance_after'])
            
            return item
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Transaction already exists: {transaction_id}")
                raise ValueError("Transaction already exists")
            else:
                logger.error(f"Error creating transaction: {e}")
                raise

    def get_transaction_by_id(self, user_id: str, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'TRANSACTION#{transaction_id}'
                }
            )
            
            item = response.get('Item')
            if item:
                # Convert Decimal to float
                item['amount'] = float(item['amount'])
                item['account_balance_after'] = float(item['account_balance_after'])
                logger.info(f"Transaction found: {transaction_id}")
                return item
            else:
                logger.info(f"Transaction not found: {transaction_id}")
                return None
                
        except ClientError as e:
            logger.error(f"Error getting transaction {transaction_id}: {e}")
            raise

    def update_transaction(self, user_id: str, transaction_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update transaction details"""
        try:
            # Build update expression dynamically
            update_expression = "SET updated_at = :updated_at"
            expression_values = {':updated_at': update_data['updated_at']}
            expression_names = {}
            
            # Add fields to update
            for key, value in update_data.items():
                if key != 'updated_at' and value is not None:
                    if key in ['status']:  # Reserved keywords
                        attr_name = f'#{key}'
                        expression_names[attr_name] = key
                        update_expression += f', {attr_name} = :{key}'
                    else:
                        update_expression += f', {key} = :{key}'
                    expression_values[f':{key}'] = value
            
            # Update item
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'TRANSACTION#{transaction_id}'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames=expression_names if expression_names else None,
                ConditionExpression='attribute_exists(pk)',
                ReturnValues='ALL_NEW'
            )
            
            updated_item = response['Attributes']
            
            # Convert Decimal to float
            updated_item['amount'] = float(updated_item['amount'])
            updated_item['account_balance_after'] = float(updated_item['account_balance_after'])
            
            logger.info(f"Transaction updated successfully: {transaction_id}")
            return updated_item
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Transaction not found for update: {transaction_id}")
                raise ValueError("Transaction not found")
            else:
                logger.error(f"Error updating transaction {transaction_id}: {e}")
                raise

    def delete_transaction(self, user_id: str, transaction_id: str) -> bool:
        """Delete transaction"""
        try:
            self.table.delete_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'TRANSACTION#{transaction_id}'
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"Transaction deleted successfully: {transaction_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Transaction not found for deletion: {transaction_id}")
                return False
            else:
                logger.error(f"Error deleting transaction {transaction_id}: {e}")
                raise

    def list_user_transactions(self, user_id: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        List user transactions with optional filtering
        
        Uses pk = USER#{user_id} and sk begins_with TRANSACTION#
        For account-specific queries, uses GSI1
        """
        try:
            transactions = []
            
            # If filtering by account_id, use GSI1 for better performance
            if filters and filters.get('account_id'):
                account_id = filters['account_id']
                
                # Query GSI1 for account transactions
                response = self.table.query(
                    IndexName='GSI1',
                    KeyConditionExpression='gsi1_pk = :account_pk',
                    ExpressionAttributeValues={
                        ':account_pk': f'ACCOUNT#{account_id}'
                    },
                    ScanIndexForward=False  # Most recent first
                )
                
                # Filter by user_id to ensure data isolation
                for item in response.get('Items', []):
                    if item.get('user_id') == user_id:
                        # Convert Decimal to float
                        item['amount'] = float(item['amount'])
                        item['account_balance_after'] = float(item['account_balance_after'])
                        transactions.append(item)
            
            else:
                # Query all user transactions
                response = self.table.query(
                    KeyConditionExpression='pk = :user_pk AND begins_with(sk, :transaction_prefix)',
                    ExpressionAttributeValues={
                        ':user_pk': f'USER#{user_id}',
                        ':transaction_prefix': 'TRANSACTION#'
                    },
                    ScanIndexForward=False  # Most recent first
                )
                
                for item in response.get('Items', []):
                    # Convert Decimal to float
                    item['amount'] = float(item['amount'])
                    item['account_balance_after'] = float(item['account_balance_after'])
                    transactions.append(item)
            
            # Apply additional filters
            if filters:
                transactions = self._filter_transactions(transactions, filters)
            
            logger.info(f"Found {len(transactions)} transactions for user: {user_id}")
            return transactions
            
        except ClientError as e:
            logger.error(f"Error listing transactions for user {user_id}: {e}")
            raise

    def _filter_transactions(self, transactions: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to transaction list"""
        filtered = transactions
        
        # Filter by transaction type
        if filters.get('transaction_type'):
            filtered = [t for t in filtered if t['transaction_type'] == filters['transaction_type']]
        
        # Filter by category
        if filters.get('category'):
            filtered = [t for t in filtered if t['category'] == filters['category']]
        
        # Filter by status
        if filters.get('status'):
            filtered = [t for t in filtered if t['status'] == filters['status']]
        
        # Filter by date range
        if filters.get('date_from') or filters.get('date_to'):
            date_from = filters.get('date_from')
            date_to = filters.get('date_to')
            
            filtered_by_date = []
            for t in filtered:
                t_date = t['transaction_date']
                
                # Check date range
                if date_from and t_date < date_from:
                    continue
                if date_to and t_date > date_to:
                    continue
                
                filtered_by_date.append(t)
            
            filtered = filtered_by_date
        
        # Filter by amount range
        if filters.get('amount_min') is not None or filters.get('amount_max') is not None:
            amount_min = filters.get('amount_min')
            amount_max = filters.get('amount_max')
            
            filtered_by_amount = []
            for t in filtered:
                amount = abs(t['amount'])  # Use absolute value for range comparison
                
                if amount_min is not None and amount < amount_min:
                    continue
                if amount_max is not None and amount > amount_max:
                    continue
                
                filtered_by_amount.append(t)
            
            filtered = filtered_by_amount
        
        # Filter by search term (description, notes, reference_number)
        if filters.get('search_term'):
            search_term = filters['search_term'].lower()
            filtered_by_search = []
            
            for t in filtered:
                if (search_term in t['description'].lower() or
                    (t.get('notes') and search_term in t['notes'].lower()) or
                    (t.get('reference_number') and search_term in t['reference_number'].lower())):
                    filtered_by_search.append(t)
            
            filtered = filtered_by_search
        
        # Filter by tags
        if filters.get('tags'):
            filter_tags = set(filters['tags'])
            filtered_by_tags = []
            
            for t in filtered:
                t_tags = set(t.get('tags', []))
                if filter_tags.intersection(t_tags):  # OR logic
                    filtered_by_tags.append(t)
            
            filtered = filtered_by_tags
        
        return filtered
