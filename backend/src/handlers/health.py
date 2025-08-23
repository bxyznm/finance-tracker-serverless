"""
Health check handler with dependency verification
"""

import json
import logging
import sys
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Health check endpoint with dependency verification
    """
    logger.info("Health check initiated")
    
    health_status = {
        "status": "healthy",
        "timestamp": context.aws_request_id if context else "local",
        "dependencies": {},
        "python_info": {
            "version": sys.version,
            "path": sys.path[:3]  # First 3 paths to avoid too much data
        }
    }
    
    # Test critical dependencies
    dependencies_to_test = [
        ("pydantic", "pydantic"),
        ("boto3", "boto3"),
        ("fastapi", "fastapi"),
        ("bcrypt", "bcrypt"),
    ]
    
    for dep_name, import_name in dependencies_to_test:
        try:
            module = __import__(import_name)
            version = getattr(module, '__version__', 'unknown')
            health_status["dependencies"][dep_name] = {
                "status": "✅ available",
                "version": version
            }
            logger.info(f"✅ {dep_name} v{version} imported successfully")
        except ImportError as e:
            health_status["dependencies"][dep_name] = {
                "status": "❌ missing",
                "error": str(e)
            }
            health_status["status"] = "degraded"
            logger.error(f"❌ Failed to import {dep_name}: {e}")
    
    # Test local imports
    try:
        from utils.responses import create_response
        from utils.dynamodb_client import DynamoDBClient
        health_status["local_imports"] = "✅ successful"
        logger.info("✅ Local imports successful")
    except ImportError as e:
        health_status["local_imports"] = f"❌ failed: {str(e)}"
        health_status["status"] = "unhealthy"
        logger.error(f"❌ Local import failed: {e}")
    
    # Return appropriate response
    try:
        from utils.responses import create_response
        return create_response(200, health_status)
    except ImportError:
        # Fallback response if utils.responses is not available
        return {
            'statusCode': 200,
            'body': json.dumps(health_status),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }

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
