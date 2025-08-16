"""
Tests for health check handler.
"""

import json
import pytest
from unittest.mock import MagicMock

# Import the handler
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from handlers.health import lambda_handler


class TestHealthHandler:
    """Test cases for health check handler."""
    
    def test_health_check_success(self):
        """Test successful health check."""
        # Arrange
        event = {
            "httpMethod": "GET",
            "path": "/health",
            "headers": {},
            "queryStringParameters": None,
            "body": None
        }
        context = MagicMock()
        
        # Act
        response = lambda_handler(event, context)
        
        # Assert
        assert response["statusCode"] == 200
        assert "application/json" in response["headers"]["Content-Type"]
        
        body = json.loads(response["body"])
        assert body["status"] == "healthy"
        assert body["message"] == "Finance Tracker API is running"
        assert "timestamp" in body
        assert body["version"] == "1.0.0"
    
    def test_health_check_cors_headers(self):
        """Test that CORS headers are present."""
        # Arrange
        event = {
            "httpMethod": "GET",
            "path": "/health",
            "headers": {},
            "queryStringParameters": None,
            "body": None
        }
        context = MagicMock()
        
        # Act
        response = lambda_handler(event, context)
        
        # Assert
        headers = response["headers"]
        assert headers["Access-Control-Allow-Origin"] == "*"
        assert "GET, POST, PUT, DELETE" in headers["Access-Control-Allow-Methods"]
        assert "Content-Type, Authorization" in headers["Access-Control-Allow-Headers"]


if __name__ == "__main__":
    pytest.main([__file__])
