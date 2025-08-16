"""
User management Lambda handler for Finance Tracker API.

This module provides CRUD operations for user management:
- POST /users: Create a new user
- GET /users/{user_id}: Get user by ID
- PUT /users/{user_id}: Update existing user
- DELETE /users/{user_id}: Delete user

All operations interact with DynamoDB and include proper error handling,
input validation using Pydantic models, and structured JSON responses.
"""

import json
import logging
from typing import Dict, Any
from uuid import uuid4
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

from src.models.user import UserCreateRequest, UserResponse, UserUpdateRequest
from src.utils.config import get_config
from src.utils.responses import success_response, created_response, error_response, not_found_response

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def get_dynamodb_table():
    """Get DynamoDB users table with current configuration"""
    config = get_config()
    dynamodb = boto3.resource('dynamodb', region_name=config.aws_region)
    return dynamodb.Table(config.users_table_name)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for user operations.
    
    Routes HTTP requests to appropriate handlers based on HTTP method and path.
    
    Args:
        event: AWS Lambda event containing HTTP request information
        context: AWS Lambda context object
        
    Returns:
        Dict containing HTTP response with status code, headers, and body
    """
    try:
        http_method = event.get('httpMethod', '')
        path_parameters = event.get('pathParameters') or {}
        user_id = path_parameters.get('user_id')
        
        logger.info(f"Processing {http_method} request for user operations")
        
        # Route to appropriate handler
        if http_method == 'POST':
            return create_user(event)
        elif http_method == 'GET' and user_id:
            return get_user(user_id)
        elif http_method == 'PUT' and user_id:
            return update_user(user_id, event)
        elif http_method == 'DELETE' and user_id:
            return delete_user(user_id)
        else:
            return error_response(
                message="Method not allowed or invalid path",
                status_code=405
            )
            
    except Exception as e:
        logger.error(f"Unhandled error in lambda_handler: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )


def create_user(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user in the system.
    
    Args:
        event: Lambda event containing user data in body
        
    Returns:
        Dict containing HTTP response with created user data or error
    """
    try:
        # Parse and validate request body
        body = event.get('body')
        if not body:
            return error_response(
                message="Request body is required",
                status_code=400
            )
            
        if isinstance(body, str):
            body = json.loads(body)
        elif body is None:
            body = {}
            
        # Validate using Pydantic model
        user_request = UserCreateRequest(**body)
        
        # Check if user with this email already exists
        if _user_exists_by_email(user_request.email):
            return error_response(
                message="User with this email already exists",
                status_code=409
            )
        
        # Generate unique user ID and timestamps
        user_id = str(uuid4())
        current_time = datetime.utcnow().isoformat()
        
        # Prepare user data for DynamoDB
        user_data = {
            'user_id': user_id,
            'first_name': user_request.first_name,
            'last_name': user_request.last_name,
            'email': user_request.email,
            'phone_number': user_request.phone_number,
            'birth_date': user_request.birth_date,
            'created_at': current_time,
            'updated_at': current_time,
            'is_active': True
        }
        
        # Remove None values
        user_data = {k: v for k, v in user_data.items() if v is not None}
        
        # Save to DynamoDB
        table = get_dynamodb_table()
        table.put_item(Item=user_data)
        
        # Create response using UserResponse model
        user_response = UserResponse(**user_data)
        
        logger.info(f"User created successfully: {user_id}")
        
        # Handle model serialization for both Pydantic v1 and v2
        response_data = user_response.model_dump() if hasattr(user_response, 'model_dump') else user_response.dict()
        
        return created_response(
            data=response_data,
            message="User created successfully"
        )
        
    except json.JSONDecodeError:
        return error_response(
            message="Invalid JSON in request body",
            status_code=400
        )
    except ValueError as e:
        return error_response(
            message=f"Validation error: {str(e)}",
            status_code=400
        )
    except ClientError as e:
        logger.error(f"DynamoDB error in create_user: {str(e)}")
        return error_response(
            message="Database error occurred",
            status_code=500
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_user: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )


def get_user(user_id: str) -> Dict[str, Any]:
    """
    Retrieve a user by their ID.
    
    Args:
        user_id: Unique identifier for the user
        
    Returns:
        Dict containing HTTP response with user data or error
    """
    try:
        # Get user from DynamoDB
        table = get_dynamodb_table()
        response = table.get_item(
            Key={'user_id': user_id}
        )
        
        if 'Item' not in response:
            return not_found_response("User not found")
        
        user_data = response['Item']
        
        # Convert to response model
        user_response = UserResponse(**user_data)
        
        logger.info(f"User retrieved successfully: {user_id}")
        return success_response(
            data=user_response.model_dump(),
            message="User retrieved successfully"
        )
        
    except ClientError as e:
        logger.error(f"DynamoDB error in get_user: {str(e)}")
        return error_response(
            message="Database error occurred",
            status_code=500
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_user: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )


def update_user(user_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing user's information.
    
    Args:
        user_id: Unique identifier for the user
        event: Lambda event containing updated user data in body
        
    Returns:
        Dict containing HTTP response with updated user data or error
    """
    try:
        # Parse and validate request body
        body = event.get('body')
        if not body:
            return error_response(
                message="Request body is required",
                status_code=400
            )
            
        if isinstance(body, str):
            body = json.loads(body)
        elif body is None:
            body = {}
            
        # Validate using Pydantic model
        update_request = UserUpdateRequest(**body)
        
        # Check if user exists
        table = get_dynamodb_table()
        existing_user = table.get_item(
            Key={'user_id': user_id}
        )
        
        if 'Item' not in existing_user:
            return not_found_response("User not found")
        
        user_data = existing_user['Item']
        
        # Prepare update expression and values
        update_expression = "SET updated_at = :updated_at"
        expression_values = {
            ':updated_at': datetime.utcnow().isoformat()
        }
        expression_names = {}
        
        # Add fields to update if they are provided
        if update_request.first_name is not None:
            update_expression += ", first_name = :first_name"
            expression_values[':first_name'] = update_request.first_name
            
        if update_request.last_name is not None:
            update_expression += ", last_name = :last_name"
            expression_values[':last_name'] = update_request.last_name
            
        if update_request.phone_number is not None:
            update_expression += ", phone_number = :phone_number"
            expression_values[':phone_number'] = update_request.phone_number
            
        if update_request.birth_date is not None:
            update_expression += ", birth_date = :birth_date"
            expression_values[':birth_date'] = update_request.birth_date
        
        # Update user in DynamoDB
        update_params = {
            'Key': {'user_id': user_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if expression_names:
            update_params['ExpressionAttributeNames'] = expression_names
        
        response = table.update_item(**update_params)
        updated_user = response['Attributes']
        
        # Convert to response model
        user_response = UserResponse(**updated_user)
        
        logger.info(f"User updated successfully: {user_id}")
        return success_response(
            data=user_response.model_dump(),
            message="User updated successfully"
        )
        
    except json.JSONDecodeError:
        return error_response(
            message="Invalid JSON in request body",
            status_code=400
        )
    except ValueError as e:
        return error_response(
            message=f"Validation error: {str(e)}",
            status_code=400
        )
    except ClientError as e:
        logger.error(f"DynamoDB error in update_user: {str(e)}")
        return error_response(
            message="Database error occurred",
            status_code=500
        )
    except Exception as e:
        logger.error(f"Unexpected error in update_user: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )


def delete_user(user_id: str) -> Dict[str, Any]:
    """
    Delete a user from the system (soft delete by setting is_active to False).
    
    Args:
        user_id: Unique identifier for the user to delete
        
    Returns:
        Dict containing HTTP response confirming deletion or error
    """
    try:
        # Check if user exists first
        table = get_dynamodb_table()
        existing_user = table.get_item(
            Key={'user_id': user_id}
        )
        
        if 'Item' not in existing_user:
            return not_found_response("User not found")
        
        # Soft delete by setting is_active to False
        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET is_active = :is_active, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':is_active': False,
                ':updated_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"User soft deleted successfully: {user_id}")
        return success_response(
            data={'user_id': user_id, 'is_active': False},
            message="User deleted successfully"
        )
        
    except ClientError as e:
        logger.error(f"DynamoDB error in delete_user: {str(e)}")
        return error_response(
            message="Database error occurred",
            status_code=500
        )
    except Exception as e:
        logger.error(f"Unexpected error in delete_user: {str(e)}")
        return error_response(
            message="Internal server error",
            status_code=500
        )


def _user_exists_by_email(email: str) -> bool:
    """
    Check if a user with the given email already exists.
    Uses the EmailIndex GSI for efficient lookup.
    
    Args:
        email: Email address to check
        
    Returns:
        bool: True if user exists, False otherwise
    """
    try:
        table = get_dynamodb_table()
        response = table.query(
            IndexName='EmailIndex',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': email},
            Select='COUNT'
        )
        
        return response.get('Count', 0) > 0
        
    except ClientError as e:
        logger.error(f"DynamoDB error in _user_exists_by_email: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in _user_exists_by_email: {str(e)}")
        return False
