"""
HTTP response utilities for Lambda handlers.
Common functions to generate standardized responses.
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def create_response(
    status_code: int,
    body: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a standardized HTTP response for Lambda.
    
    Args:
        status_code: HTTP status code
        body: Response body
        headers: Additional headers
        
    Returns:
        Response formatted for API Gateway
    """
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
    
    if headers:
        default_headers.update(headers)
    
    # Add timestamp to all responses
    if isinstance(body, dict):
        body["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "statusCode": status_code,
        "headers": default_headers,
        "body": json.dumps(body, ensure_ascii=False, default=str)
    }


def success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """
    Create success response (200).
    
    Args:
        data: Data to return
        message: Descriptive message
        
    Returns:
        HTTP 200 response
    """
    return create_response(200, {
        "success": True,
        "message": message,
        "data": data
    })


def created_response(data: Any, message: str = "Resource created") -> Dict[str, Any]:
    """
    Create resource created response (201).
    
    Args:
        data: Created resource data
        message: Descriptive message
        
    Returns:
        HTTP 201 response
    """
    return create_response(201, {
        "success": True,
        "message": message,
        "data": data
    })


def bad_request_response(message: str, errors: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Create bad request response (400).
    
    Args:
        message: Error message
        errors: Specific error details
        
    Returns:
        HTTP 400 response
    """
    body = {
        "success": False,
        "message": message,
        "error_code": "BAD_REQUEST"
    }
    
    if errors:
        body["errors"] = errors
    
    return create_response(400, body)


def unauthorized_response(message: str = "Unauthorized") -> Dict[str, Any]:
    """
    Create unauthorized response (401).
    
    Args:
        message: Error message
        
    Returns:
        HTTP 401 response
    """
    return create_response(401, {
        "success": False,
        "message": message,
        "error_code": "UNAUTHORIZED"
    })


def forbidden_response(message: str = "Forbidden") -> Dict[str, Any]:
    """
    Create forbidden response (403).
    
    Args:
        message: Error message
        
    Returns:
        HTTP 403 response
    """
    return create_response(403, {
        "success": False,
        "message": message,
        "error_code": "FORBIDDEN"
    })


def not_found_response(message: str = "Resource not found") -> Dict[str, Any]:
    """
    Create not found response (404).
    
    Args:
        message: Error message
        
    Returns:
        HTTP 404 response
    """
    return create_response(404, {
        "success": False,
        "message": message,
        "error_code": "NOT_FOUND"
    })


def internal_server_error_response(
    message: str = "Internal server error",
    error_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create internal server error response (500).
    
    Args:
        message: Error message
        error_id: Unique error ID for tracking
        
    Returns:
        HTTP 500 response
    """
    body = {
        "success": False,
        "message": message,
        "error_code": "INTERNAL_SERVER_ERROR"
    }
    
    if error_id:
        body["error_id"] = error_id
    
    return create_response(500, body)


def handle_cors_preflight() -> Dict[str, Any]:
    """
    Handle CORS preflight requests (OPTIONS).
    
    Returns:
        HTTP 200 response for OPTIONS
    """
    return create_response(200, {}, {
        "Access-Control-Max-Age": "86400"
    })
