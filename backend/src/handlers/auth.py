"""
Handlers for authentication operations
Implements login, register, and refresh token endpoints
"""

import json
import logging
import sys
from typing import Dict, Any

# Configure logging first
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

try:
    # Local imports with error handling
    from utils.responses import create_response, internal_server_error_response
    from utils.dynamodb_client import DynamoDBClient
    from utils.jwt_auth import create_token_response
    from models import User, UserCreate, UserLogin, create_user_from_input
    logger.info("✅ All local imports successful")
except ImportError as e:
    logger.error(f"❌ Failed to import local modules: {e}")
    raise

# DynamoDB client
db_client = DynamoDBClient()

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main handler for all authentication operations
    """
    try:
        logger.info(f"Processing auth event: {event}")
        
        http_method = event.get('httpMethod', '')
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
        
        # Routing based on path
        if http_method == 'POST':
            # POST /auth/login - Authentication
            if path.endswith('/login'):
                return login_user_handler(body_data)
            # POST /auth/refresh - Token refresh
            elif path.endswith('/refresh'):
                return refresh_token_handler(body_data)
            # POST /auth/register - Registration
            elif path.endswith('/register'):
                return register_user_handler(body_data)
            else:
                return create_response(404, {"error": "Auth endpoint not found"})
        else:
            return create_response(405, {"error": f"Method {http_method} not allowed"})
            
    except Exception as e:
        logger.error(f"Error in auth lambda_handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Internal server error")

def register_user_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Register a new user with enhanced security validations
    """
    try:
        logger.info(f"Registering user with email: {data.get('email', 'N/A')}")
        
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
        
        # Create user using model function
        user_dict = create_user_from_input(user_create)
        
        # Store user in database
        created_user = db_client.create_user(user_dict)
        logger.info(f"User registered successfully: {created_user.get('user_id')}")
        
        # Return user data without password
        response_data = {key: value for key, value in created_user.items() 
                        if key not in ['password_hash', 'password']}
        
        # Create JWT tokens
        token_response = create_token_response(
            user_id=created_user['user_id'],
            email=created_user['email']
        )
        
        # Combine user data with tokens
        response_data.update(token_response)
        
        return create_response(201, response_data)
        
    except ValueError as e:
        logger.warning(f"Validation error during registration: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error during user registration: {str(e)}", exc_info=True)
        return internal_server_error_response("Registration failed")

def login_user_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Authenticate user and return JWT tokens
    """
    try:
        logger.info(f"Login attempt for email: {data.get('email', 'N/A')}")
        
        # Validate login data
        login_data = UserLogin(**data)
        
        # Normalize email
        email_normalized = login_data.email.lower()
        
        # Get user from database
        user = db_client.get_user_by_email(email_normalized)
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email_normalized}")
            return create_response(401, {"error": "Invalid credentials"})
        
        # Check if user is active
        if not user.get('is_active', True):
            logger.warning(f"Login attempt for inactive user: {email_normalized}")
            return create_response(401, {"error": "User account not found or disabled"})
        
        # Verify password
        from models.user import verify_password
        stored_password_hash = user.get('password_hash', '')
        if not verify_password(login_data.password, stored_password_hash):
            logger.warning(f"Failed login attempt for email: {email_normalized}")
            return create_response(401, {"error": "Invalid credentials"})
        
        # Update last login
        db_client.update_user_last_login(user['user_id'])
        
        # Create token response
        token_response = create_token_response(
            user_id=user['user_id'],
            email=user['email']
        )
        
        # Add user info to response
        user_info = {key: value for key, value in user.items() 
                    if key not in ['password_hash', 'password']}
        
        response_data = {
            **token_response,
            'user': user_info
        }
        
        logger.info(f"User logged in successfully: {user['user_id']}")
        return create_response(200, response_data)
        
    except ValueError as e:
        logger.warning(f"Validation error during login: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error during login: {str(e)}", exc_info=True)
        return internal_server_error_response("Login failed")

def refresh_token_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Refresh JWT tokens using refresh token
    """
    try:
        refresh_token = data.get('refresh_token')
        if not refresh_token:
            return create_response(400, {"error": "refresh_token is required"})
        
        # Import JWT utilities
        from utils.jwt_auth import refresh_access_token
        
        # Refresh the token using existing function
        try:
            new_token_data = refresh_access_token(refresh_token)
            
            logger.info(f"Tokens refreshed successfully for user: {new_token_data.get('user_id')}")
            return create_response(200, new_token_data)
                
        except Exception as e:
            logger.warning(f"Invalid refresh token: {str(e)}")
            return create_response(401, {"error": "Invalid or expired refresh token"})
        
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}", exc_info=True)
        return internal_server_error_response("Token refresh failed")
