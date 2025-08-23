"""
DynamoDB Client for Finance Tracker
Implements Single Table Design pattern to optimize performance and costs
"""

import boto3
import os
from typing import Dict, Any, Optional, List
from botocore.exceptions import ClientError
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
