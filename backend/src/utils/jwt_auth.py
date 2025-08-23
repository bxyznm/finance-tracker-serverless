"""
JWT Token utilities for user authentication
Handles token generation, validation, and middleware functionality
"""

import jwt
import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Union
from functools import wraps

# Configure logging
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

class JWTError(Exception):
    """Custom JWT exception"""
    pass

class TokenPayload:
    """Token payload structure for type safety"""
    
    def __init__(self, user_id: str, email: str, exp: int, iat: int, token_type: str = "access"):
        self.user_id = user_id
        self.email = email
        self.exp = exp
        self.iat = iat
        self.token_type = token_type
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JWT encoding"""
        return {
            'user_id': self.user_id,
            'email': self.email,
            'exp': self.exp,
            'iat': self.iat,
            'token_type': self.token_type
        }

def create_access_token(user_id: str, email: str) -> str:
    """
    Create a JWT access token for user authentication
    
    Args:
        user_id: The unique identifier for the user
        email: User's email address
        
    Returns:
        Encoded JWT token string
    """
    try:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = TokenPayload(
            user_id=user_id,
            email=email,
            iat=int(now.timestamp()),
            exp=int(expire.timestamp()),
            token_type="access"
        )
        
        token = jwt.encode(
            payload.to_dict(),
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM
        )
        
        logger.info(f"Access token created for user: {user_id}")
        return token
        
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise JWTError("Failed to create access token")

def create_refresh_token(user_id: str, email: str) -> str:
    """
    Create a JWT refresh token for token renewal
    
    Args:
        user_id: The unique identifier for the user
        email: User's email address
        
    Returns:
        Encoded JWT refresh token string
    """
    try:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = TokenPayload(
            user_id=user_id,
            email=email,
            iat=int(now.timestamp()),
            exp=int(expire.timestamp()),
            token_type="refresh"
        )
        
        token = jwt.encode(
            payload.to_dict(),
            JWT_SECRET_KEY,
            algorithm=JWT_ALGORITHM
        )
        
        logger.info(f"Refresh token created for user: {user_id}")
        return token
        
    except Exception as e:
        logger.error(f"Error creating refresh token: {str(e)}")
        raise JWTError("Failed to create refresh token")

def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token
    
    Args:
        token: The JWT token string to decode
        
    Returns:
        TokenPayload object with decoded information
        
    Raises:
        JWTError: If token is invalid, expired, or malformed
    """
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode the token
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        
        # Validate required fields
        required_fields = ['user_id', 'email', 'exp', 'iat']
        for field in required_fields:
            if field not in payload:
                raise JWTError(f"Missing required field: {field}")
        
        # Create and return TokenPayload
        token_payload = TokenPayload(
            user_id=payload['user_id'],
            email=payload['email'],
            exp=payload['exp'],
            iat=payload['iat'],
            token_type=payload.get('token_type', 'access')
        )
        
        logger.info(f"Token successfully decoded for user: {token_payload.user_id}")
        return token_payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise JWTError("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise JWTError("Invalid token")
    except JWTError:
        # Re-raise JWTError without wrapping it
        raise
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {str(e)}")
        raise JWTError("Failed to decode token")

def extract_token_from_event(event: Dict[str, Any]) -> Optional[str]:

    """
    Extract JWT token from Lambda event
    
    Args:
        event: AWS Lambda event object
        
    Returns:
        Token string if found, None otherwise
    """
    try:
        # Check Authorization header
        headers = event.get('headers', {})
        
        # Handle case-insensitive headers
        auth_header = None
        for key, value in headers.items():
            if key.lower() == 'authorization':
                auth_header = value
                break
        
        if auth_header:
            if auth_header.startswith('Bearer '):
                return auth_header[7:]  # Remove 'Bearer ' prefix
            else:
                return auth_header
        
        # Check query parameters as fallback
        query_params = event.get('queryStringParameters', {})
        if query_params and 'token' in query_params:
            return query_params['token']
        
        return None
        
    except Exception as e:
        logger.error(f"Error extracting token from event: {str(e)}")
        return None

def validate_token_from_event(event: Dict[str, Any]) -> Optional[TokenPayload]:
    """
    Extract and validate token from Lambda event
    
    Args:
        event: AWS Lambda event object
        
    Returns:
        TokenPayload if valid, None otherwise
    """
    try:
        token = extract_token_from_event(event)
        if not token:
            return None
        
        return decode_token(token)
        
    except JWTError:
        return None
    except Exception as e:
        logger.error(f"Unexpected error validating token: {str(e)}")
        return None

def require_auth(handler_func):
    """
    Decorator to require authentication for Lambda handlers
    
    Usage:
        @require_auth
        def my_handler(event, context, user_data):
            # user_data contains TokenPayload information
            pass
    """
    @wraps(handler_func)
    def wrapper(event: Dict[str, Any], context, *args, **kwargs):
        try:
            # Validate token
            token_payload = validate_token_from_event(event)
            if not token_payload:
                from utils.responses import create_response
                return create_response(401, {
                    "error": "Authentication required",
                    "message": "Valid JWT token must be provided"
                })
            
            # Call original handler with user data
            return handler_func(event, context, token_payload, *args, **kwargs)
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            from utils.responses import internal_server_error_response
            return internal_server_error_response("Authentication error")
    
    return wrapper

def create_token_response(user_id: str, email: str) -> Dict[str, Any]:
    """
    Create a complete token response with both access and refresh tokens
    
    Args:
        user_id: The unique identifier for the user
        email: User's email address
        
    Returns:
        Dictionary containing token information
    """
    try:
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id, email)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
            "user_id": user_id,
            "email": email
        }
        
    except Exception as e:
        logger.error(f"Error creating token response: {str(e)}")
        raise JWTError("Failed to create token response")

def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    Create a new access token using a valid refresh token
    
    Args:
        refresh_token: Valid refresh token string
        
    Returns:
        New token response dictionary
        
    Raises:
        JWTError: If refresh token is invalid or not a refresh token
    """
    try:
        # Decode refresh token
        token_payload = decode_token(refresh_token)
        
        # Verify it's a refresh token
        if token_payload.token_type != "refresh":
            raise JWTError("Invalid token type for refresh operation")
        
        # Create new access token
        new_access_token = create_access_token(token_payload.user_id, token_payload.email)
        
        return {
            "access_token": new_access_token,
            "token_type": "Bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user_id": token_payload.user_id,
            "email": token_payload.email
        }
        
    except JWTError:
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise JWTError("Failed to refresh token")

def get_token_info(token: str) -> Dict[str, Any]:
    """
    Get information about a token without validation (for debugging)
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary with token information
    """
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode without verification for info purposes
        unverified = jwt.decode(token, options={"verify_signature": False})
        
        return {
            "valid": True,
            "payload": unverified,
            "expires_at": datetime.fromtimestamp(unverified.get('exp', 0), tz=timezone.utc).isoformat(),
            "issued_at": datetime.fromtimestamp(unverified.get('iat', 0), tz=timezone.utc).isoformat(),
            "user_id": unverified.get('user_id'),
            "email": unverified.get('email'),
            "token_type": unverified.get('token_type', 'access')
        }
        
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }
