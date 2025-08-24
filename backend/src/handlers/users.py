"""
Handlers for user management
Implements complete CRUD using Single Table Design
"""

import json
import logging
import uuid
import sys
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging first
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Debug imports - log what's available
logger.info(f"Python path: {sys.path}")
logger.info("Attempting to import dependencies...")

try:
    # Try importing pydantic first with detailed error info
    import pydantic
    logger.info(f"✅ pydantic imported successfully, version: {pydantic.__version__}")
except ImportError as e:
    logger.error(f"❌ Failed to import pydantic: {e}")
    logger.error(f"Available modules: {[name for name in sys.modules.keys() if 'pydantic' in name.lower()]}")
    raise

try:
    # Local imports with error handling
    from utils.responses import create_response, internal_server_error_response
    from utils.dynamodb_client import DynamoDBClient
    from utils.jwt_auth import create_token_response, require_auth, validate_token_from_event
    from models import User, UserCreate, UserUpdate, create_user_from_input
    logger.info("✅ All local imports successful")
except ImportError as e:
    logger.error(f"❌ Failed to import local modules: {e}")
    raise

# DynamoDB client
db_client = DynamoDBClient()

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main handler for user management operations (CRUD only)
    Authentication endpoints moved to auth handler
    """
    try:
        logger.info(f"Processing users event: {event}")
        
        http_method = event.get('httpMethod', '')
        path_parameters = event.get('pathParameters') or {}
        path = event.get('path', '')
        body = event.get('body', '{}')
        
        # Parse body if it exists
        if body and body != '{}':
            try:
                body_data = json.loads(body)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON body: {e}")
                return create_response(400, {"error": "Invalid JSON in request body"})
        else:
            body_data = {}
        
        # Routing based on HTTP method and path - only CRUD operations
        if http_method == 'GET':
            user_id = path_parameters.get('user_id')
            if user_id:
                return get_user_handler(user_id, event)
            else:
                return get_user_summary_handler(event)
        elif http_method == 'PUT':
            user_id = path_parameters.get('user_id')
            if not user_id:
                return create_response(400, {"error": "user_id is required for PUT requests"})
            return update_user_handler(user_id, body_data, event)
        elif http_method == 'DELETE':
            user_id = path_parameters.get('user_id')
            if not user_id:
                return create_response(400, {"error": "user_id is required for DELETE requests"})
            return delete_user_handler(user_id, event)
        else:
            return create_response(405, {"error": f"Method {http_method} not allowed for users endpoint"})
            
    except Exception as e:
        logger.error(f"Error in users lambda_handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def get_user_handler(user_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get a user by ID - requires authentication
    """
    try:
        # Validate authentication
        token_payload = validate_token_from_event(event)
        if not token_payload:
            return create_response(401, {
                "error": "Authentication required",
                "message": "Valid JWT token must be provided"
            })
        
        # Check if user is requesting their own data or is admin
        # For now, users can only access their own data
        if token_payload.user_id != user_id:
            return create_response(403, {
                "error": "Access denied",
                "message": "You can only access your own user data"
            })
        
        logger.info(f"Getting user: {user_id}")
        
        user = db_client.get_user_by_id(user_id)
        if not user:
            return create_response(404, {
                "error": "User not found",
                "user_id": user_id
            })
        
        # Convert to User model for response (without password)
        user_response = User.from_dynamodb_item(user)
        
        return create_response(200, {"user": user_response.model_dump()})
        
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def update_user_handler(user_id: str, data: Dict[str, Any], event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing user with security validations - requires authentication
    """
    try:
        from models.user import verify_password, hash_password
        
        # Validate authentication
        token_payload = validate_token_from_event(event)
        if not token_payload:
            return create_response(401, {
                "error": "Authentication required",
                "message": "Valid JWT token must be provided"
            })
        
        # Check if user is updating their own data
        if token_payload.user_id != user_id:
            return create_response(403, {
                "error": "Access denied",
                "message": "You can only update your own user data"
            })
        
        logger.info(f"Updating user {user_id}")
        
        # Check if user exists
        existing_user = db_client.get_user_by_id(user_id)
        if not existing_user:
            return create_response(404, {
                "error": "User not found",
                "user_id": user_id
            })
        
        # Validate data using Pydantic
        user_update = UserUpdate(**data)
        
        # For sensitive changes (email or password), verify current password
        sensitive_changes = user_update.email or user_update.new_password
        if sensitive_changes and not user_update.current_password:
            return create_response(400, {
                "error": "Current password required",
                "message": "To change email or password, you must provide your current password"
            })
        
        # Verify current password if provided
        if user_update.current_password:
            if not verify_password(user_update.current_password, existing_user.get('password_hash', '')):
                return create_response(401, {
                    "error": "Incorrect current password"
                })
        
        # If updating email, check that it doesn't exist
        if user_update.email and user_update.email.lower() != existing_user.get('email', '').lower():
            user_with_email = db_client.get_user_by_email(user_update.email.lower())
            if user_with_email:
                return create_response(409, {
                    "error": "Email is already registered",
                    "email": user_update.email
                })
        
        # Prepare data for update
        update_data = {}
        if user_update.name:
            update_data['name'] = user_update.name
        if user_update.email:
            update_data['email'] = user_update.email.lower()
        if user_update.currency:
            update_data['currency'] = user_update.currency
        if user_update.new_password:
            update_data['password_hash'] = hash_password(user_update.new_password)
        
        # Add update timestamp
        update_data['updated_at'] = datetime.now().isoformat()
        
        # Update the user
        updated_user = db_client.update_user(user_id, update_data)
        
        # Convert to User model for response (without password)
        user_response = User.from_dynamodb_item(updated_user)
        
        logger.info(f"User updated successfully: {user_id}")
        return create_response(200, {
            "message": "User updated successfully",
            "user": user_response.model_dump(),
            "updated_fields": list(update_data.keys())
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {
            "error": "Invalid update data", 
            "details": str(e)
        })
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")
        
    except ValueError as e:
        logger.error(f"Error de validación: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error actualizando usuario {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def delete_user_handler(user_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Delete a user - requires authentication
    """
    try:
        # Validate authentication
        token_payload = validate_token_from_event(event)
        if not token_payload:
            return create_response(401, {
                "error": "Authentication required",
                "message": "Valid JWT token must be provided"
            })
        
        # Check if user is deleting their own account
        if token_payload.user_id != user_id:
            return create_response(403, {
                "error": "Access denied",
                "message": "You can only delete your own account"
            })
        
        logger.info(f"Deleting user: {user_id}")
        
        # Check if user exists
        existing_user = db_client.get_user_by_id(user_id)
        if not existing_user:
            return create_response(404, {
                "error": "User not found",
                "user_id": user_id
            })
        
        # Delete user (soft delete)
        updated_at = datetime.now().isoformat()
        db_client.delete_user(user_id, updated_at)
        
        logger.info(f"User deleted successfully: {user_id}")
        return create_response(200, {
            "message": "User account deleted successfully",
            "user_id": user_id
        })
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def get_user_summary_handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get user summary and available endpoints - requires authentication
    """
    try:
        # Validate authentication for this endpoint
        token_payload = validate_token_from_event(event)
        if not token_payload:
            return create_response(401, {
                "error": "Authentication required",
                "message": "Valid JWT token must be provided"
            })
        
        logger.info("Getting user summary")
        
        return create_response(200, {
            "message": "Finance Tracker Users API",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
            "authenticated_user": {
                "user_id": token_payload.user_id,
                "email": token_payload.email
            },
            "features": [
                "JWT token-based authentication",
                "User registration with password validation",
                "Login with brute force attack protection", 
                "Password encryption with bcrypt",
                "Email and data validation",
                "User soft delete",
                "Secure profile updates",
                "Token refresh capability"
            ],
            "available_operations": [
                "POST /users - Register new user",
                "POST /users/login - Log in",
                "POST /users/refresh-token - Refresh access token",
                "GET /users - Get user summary (authenticated)",
                "GET /users/{user_id} - Get user by ID (authenticated)",
                "PUT /users/{user_id} - Update user (authenticated)",
                "DELETE /users/{user_id} - Delete user (authenticated)"
            ],
            "supported_currencies": ["MXN", "USD", "EUR", "CAD"],
            "security_features": [
                "JWT access tokens (30 min expiry)",
                "JWT refresh tokens (7 days expiry)",
                "Account lockout after 5 failed login attempts",
                "Password hashing with bcrypt",
                "Email normalization",
                "Request validation with pydantic"
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting user summary: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")
