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
    from models import User, UserCreate, UserUpdate, create_user_from_input
    logger.info("✅ All local imports successful")
except ImportError as e:
    logger.error(f"❌ Failed to import local modules: {e}")
    raise

# DynamoDB client
db_client = DynamoDBClient()

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main handler for all user operations
    """
    try:
        logger.info(f"Processing event: {event}")
        
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
        
        # Routing based on HTTP method and path
        if http_method == 'POST':
            # POST /users/login - Authentication
            if path.endswith('/login'):
                return login_user_handler(body_data)
            # POST /users - Registration
            else:
                return create_user_handler(body_data)
        elif http_method == 'GET':
            user_id = path_parameters.get('user_id')
            if user_id:
                return get_user_handler(user_id)
            else:
                return get_user_summary_handler()
        elif http_method == 'PUT':
            user_id = path_parameters.get('user_id')
            if not user_id:
                return create_response(400, {"error": "user_id is required for PUT requests"})
            return update_user_handler(user_id, body_data)
        elif http_method == 'DELETE':
            user_id = path_parameters.get('user_id')
            if not user_id:
                return create_response(400, {"error": "user_id is required for DELETE requests"})
            return delete_user_handler(user_id)
        else:
            return create_response(405, {"error": f"Method {http_method} not allowed"})
            
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def create_user_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user with enhanced security validations
    """
    try:
        logger.info(f"Creating user with email: {data.get('email', 'N/A')}")
        
        # Validate data using Pydantic
        user_create = UserCreate(**data)
        
        # Normalize email to lowercase
        email_normalized = user_create.email.lower()
        
        # Check if email already exists
        existing_user = db_client.get_user_by_email(email_normalized)
        if existing_user:
            logger.warning(f"Registration attempt with existing email: {email_normalized}")
            return create_response(409, {
                "error": "Email is already registered",
                "message": "If you already have an account, try logging in or recovering your password"
            })
        
        # Create user using helper function
        user_data = create_user_from_input(user_create)
        created_user = db_client.create_user(user_data)
        
        # Convert to User model for response (without password)
        user_response = User.from_dynamodb_item(created_user)
        
        logger.info(f"User created successfully: {user_response.user_id}")
        return create_response(201, {
            "message": "User created successfully",
            "user": user_response.model_dump(),
            "next_steps": [
                "Verify your email to fully activate your account",
                "Log in with your credentials"
            ]
        })
        
    except ValueError as e:
        logger.error(f"Validation error in registration: {str(e)}")
        return create_response(400, {
            "error": "Invalid registration data",
            "details": str(e)
        })
    except Exception as e:
        logger.error(f"Internal error creating user: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def login_user_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Authenticate user (new login function)
    """
    try:
        from models.user import UserLogin, verify_password
        
        logger.info(f"Login attempt for email: {data.get('email', 'N/A')}")
        
        # Validate login data
        login_data = UserLogin(**data)
        email_normalized = login_data.email.lower()
        
        # Find user by email
        user = db_client.get_user_by_email(email_normalized)
        if not user:
            logger.warning(f"Login attempt with unregistered email: {email_normalized}")
            return create_response(401, {
                "error": "Invalid credentials",
                "message": "Email or password incorrect"
            })
        
        # Check if account is active
        if not user.get('is_active', True):
            logger.warning(f"Login attempt with inactive account: {email_normalized}")
            return create_response(403, {
                "error": "Inactive account",
                "message": "Your account has been deactivated. Contact support"
            })
        
        # Verify password
        if not verify_password(login_data.password, user.get('password_hash', '')):
            # Increment failed attempts
            failed_attempts = user.get('failed_login_attempts', 0) + 1
            db_client.update_failed_login_attempts(user['user_id'], failed_attempts)
            
            logger.warning(f"Incorrect password for user: {email_normalized} (attempts: {failed_attempts})")
            
            # Block account after 5 failed attempts
            if failed_attempts >= 5:
                db_client.deactivate_user_temporarily(user['user_id'])
                logger.warning(f"Account temporarily blocked due to failed attempts: {email_normalized}")
                return create_response(423, {
                    "error": "Account blocked",
                    "message": "Too many failed attempts. Your account has been temporarily blocked"
                })
            
            return create_response(401, {
                "error": "Invalid credentials",
                "message": "Email or password incorrect"
            })
        
        # Successful login - reset failed attempts and update last login
        db_client.successful_login(user['user_id'])
        
        # Convert to User model for response (without password)
        user_response = User.from_dynamodb_item(user)
        
        logger.info(f"Successful login for user: {user_response.user_id}")
        
        # TODO: Generate JWT token here when we implement complete authentication
        return create_response(200, {
            "message": "Successful login",
            "user": user_response.model_dump(),
            "access_token": "TODO_JWT_TOKEN",  # Placeholder for JWT
            "token_type": "bearer"
        })
        
    except ValueError as e:
        logger.error(f"Validation error in login: {str(e)}")
        return create_response(400, {
            "error": "Invalid login data",
            "details": str(e)
        })
    except Exception as e:
        logger.error(f"Internal error in login: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")
        
    except ValueError as e:
        logger.error(f"Error de validación: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error creando usuario: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def get_user_handler(user_id: str) -> Dict[str, Any]:
    """
    Get a user by ID
    """
    try:
        logger.info(f"Getting user: {user_id}")
        
        user = db_client.get_user_by_id(user_id)
        if not user:
            return create_response(404, {
                "error": "User not found",
                "user_id": user_id
            })
        
        # Response without password
        user_response = user.copy()
        user_response.pop('password_hash', None)
        
        return create_response(200, {"user": user_response})
        
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def update_user_handler(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing user with security validations
    """
    try:
        from models.user import verify_password, hash_password
        
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

def delete_user_handler(user_id: str) -> Dict[str, Any]:
    """
    Delete a user
    """
    try:
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
            "message": "User deleted successfully",
            "user_id": user_id
        })
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def get_user_summary_handler() -> Dict[str, Any]:
    """
    Get user summary and available endpoints
    """
    try:
        logger.info("Getting user summary")
        
        return create_response(200, {
            "message": "Finance Tracker Users API",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "features": [
                "User registration with password validation",
                "Login with brute force attack protection", 
                "Password encryption with bcrypt",
                "Email and data validation",
                "User soft delete",
                "Secure profile updates"
            ],
            "available_operations": [
                "POST /users - Register new user",
                "POST /users/login - Log in",
                "GET /users/{user_id} - Get user by ID",
                "PUT /users/{user_id} - Update user",
                "DELETE /users/{user_id} - Delete user (soft delete)"
            ],
            "supported_currencies": ["MXN", "USD", "EUR", "CAD"],
            "security_features": [
                "Passwords must be at least 8 characters",
                "Include uppercase, lowercase, numbers and symbols",
                "Maximum 5 login attempts before temporary lockout",
                "Secure password hashing with bcrypt"
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting user summary: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")
