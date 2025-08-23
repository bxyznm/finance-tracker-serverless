"""
Health Check Handler
Simple endpoint to verify that the API is working correctly.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler for API health check.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        Response with API status
    """
    try:
        logger.info("Health check endpoint called")
        
        response_body = {
            "status": "healthy",
            "message": "Finance Tracker API is running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": "dev"  # TODO: Get from environment variables
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",  # Basic CORS
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        
        error_response = {
            "status": "error",
            "message": "Internal server error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(error_response)
        }
