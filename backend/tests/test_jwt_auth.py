"""
Tests for JWT authentication utilities
Tests token generation, validation, middleware, and error handling
"""

import pytest
import jwt
import time
import json
import sys
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import JWT utilities
from utils.jwt_auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    extract_token_from_event,
    validate_token_from_event,
    create_token_response,
    refresh_access_token,
    get_token_info,
    JWTError,
    TokenPayload,
    JWT_SECRET_KEY,
    JWT_ALGORITHM
)

class TestTokenPayload:
    """Test TokenPayload class"""
    
    def test_token_payload_creation(self):
        """Test creating TokenPayload instance"""
        payload = TokenPayload(
            user_id="user123",
            email="test@example.com",
            exp=1234567890,
            iat=1234567800
        )
        
        assert payload.user_id == "user123"
        assert payload.email == "test@example.com"
        assert payload.exp == 1234567890
        assert payload.iat == 1234567800
        assert payload.token_type == "access"
    
    def test_token_payload_to_dict(self):
        """Test converting TokenPayload to dictionary"""
        payload = TokenPayload(
            user_id="user123",
            email="test@example.com",
            exp=1234567890,
            iat=1234567800,
            token_type="refresh"
        )
        
        expected = {
            'user_id': "user123",
            'email': "test@example.com",
            'exp': 1234567890,
            'iat': 1234567800,
            'token_type': "refresh"
        }
        
        assert payload.to_dict() == expected

class TestTokenCreation:
    """Test token creation functions"""
    
    def test_create_access_token_success(self):
        """Test successful access token creation"""
        user_id = "user123"
        email = "test@example.com"
        
        token = create_access_token(user_id, email)
        
        # Verify token is a string
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode token to verify contents
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        assert payload['user_id'] == user_id
        assert payload['email'] == email
        assert payload['token_type'] == "access"
        assert 'exp' in payload
        assert 'iat' in payload
    
    def test_create_refresh_token_success(self):
        """Test successful refresh token creation"""
        user_id = "user456"
        email = "refresh@example.com"
        
        token = create_refresh_token(user_id, email)
        
        # Verify token is a string
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode token to verify contents
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        assert payload['user_id'] == user_id
        assert payload['email'] == email
        assert payload['token_type'] == "refresh"
        assert 'exp' in payload
        assert 'iat' in payload
        
        # Verify refresh token has longer expiry than access token
        access_token = create_access_token(user_id, email)
        access_payload = jwt.decode(access_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        assert payload['exp'] > access_payload['exp']
    
    def test_create_token_response(self):
        """Test creating complete token response"""
        user_id = "user789"
        email = "complete@example.com"
        
        response = create_token_response(user_id, email)
        
        # Verify response structure
        assert 'access_token' in response
        assert 'refresh_token' in response
        assert response['token_type'] == "Bearer"
        assert 'expires_in' in response
        assert response['user_id'] == user_id
        assert response['email'] == email
        
        # Verify tokens are valid
        access_payload = jwt.decode(response['access_token'], JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        refresh_payload = jwt.decode(response['refresh_token'], JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        assert access_payload['user_id'] == user_id
        assert refresh_payload['user_id'] == user_id

class TestTokenValidation:
    """Test token validation and decoding"""
    
    def test_decode_valid_token(self):
        """Test decoding valid token"""
        user_id = "user123"
        email = "valid@example.com"
        
        token = create_access_token(user_id, email)
        decoded = decode_token(token)
        
        assert isinstance(decoded, TokenPayload)
        assert decoded.user_id == user_id
        assert decoded.email == email
        assert decoded.token_type == "access"
    
    def test_decode_token_with_bearer_prefix(self):
        """Test decoding token with Bearer prefix"""
        user_id = "user123"
        email = "bearer@example.com"
        
        token = create_access_token(user_id, email)
        bearer_token = f"Bearer {token}"
        
        decoded = decode_token(bearer_token)
        
        assert decoded.user_id == user_id
        assert decoded.email == email
    
    def test_decode_expired_token(self):
        """Test decoding expired token"""
        user_id = "user123"
        email = "expired@example.com"
        
        # Create token with past expiry
        past_time = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': int(past_time.timestamp()),
            'iat': int(past_time.timestamp()) - 3600,
            'token_type': 'access'
        }
        
        expired_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        with pytest.raises(JWTError, match="Token has expired"):
            decode_token(expired_token)
    
    def test_decode_invalid_token(self):
        """Test decoding invalid token"""
        with pytest.raises(JWTError, match="Invalid token"):
            decode_token("invalid.token.here")
    
    def test_decode_token_missing_fields(self):
        """Test decoding token with missing required fields"""
        # Create token missing user_id
        payload = {
            'email': 'missing@example.com',
            'exp': int((datetime.now(timezone.utc) + timedelta(minutes=30)).timestamp()),
            'iat': int(datetime.now(timezone.utc).timestamp())
        }
        
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        with pytest.raises(JWTError, match="Missing required field: user_id"):
            decode_token(token)

class TestTokenExtraction:
    """Test token extraction from Lambda events"""
    
    def test_extract_token_from_authorization_header(self):
        """Test extracting token from Authorization header"""
        token = "sample.jwt.token"
        event = {
            'headers': {
                'Authorization': f'Bearer {token}'
            }
        }
        
        extracted = extract_token_from_event(event)
        assert extracted == token
    
    def test_extract_token_case_insensitive_header(self):
        """Test extracting token with case-insensitive headers"""
        token = "sample.jwt.token"
        event = {
            'headers': {
                'authorization': f'Bearer {token}'  # lowercase
            }
        }
        
        extracted = extract_token_from_event(event)
        assert extracted == token
    
    def test_extract_token_without_bearer_prefix(self):
        """Test extracting token without Bearer prefix"""
        token = "sample.jwt.token"
        event = {
            'headers': {
                'Authorization': token  # no Bearer prefix
            }
        }
        
        extracted = extract_token_from_event(event)
        assert extracted == token
    
    def test_extract_token_from_query_params(self):
        """Test extracting token from query parameters"""
        token = "sample.jwt.token"
        event = {
            'headers': {},
            'queryStringParameters': {
                'token': token
            }
        }
        
        extracted = extract_token_from_event(event)
        assert extracted == token
    
    def test_extract_token_not_found(self):
        """Test when no token is found"""
        event = {
            'headers': {},
            'queryStringParameters': {}
        }
        
        extracted = extract_token_from_event(event)
        assert extracted is None
    
    def test_validate_token_from_event_success(self):
        """Test successful token validation from event"""
        user_id = "user123"
        email = "event@example.com"
        token = create_access_token(user_id, email)
        
        event = {
            'headers': {
                'Authorization': f'Bearer {token}'
            }
        }
        
        payload = validate_token_from_event(event)
        
        assert payload is not None
        assert payload.user_id == user_id
        assert payload.email == email
    
    def test_validate_token_from_event_no_token(self):
        """Test validation when no token present"""
        event = {
            'headers': {}
        }
        
        payload = validate_token_from_event(event)
        assert payload is None
    
    def test_validate_token_from_event_invalid_token(self):
        """Test validation with invalid token"""
        event = {
            'headers': {
                'Authorization': 'Bearer invalid.token'
            }
        }
        
        payload = validate_token_from_event(event)
        assert payload is None

class TestTokenRefresh:
    """Test token refresh functionality"""
    
    def test_refresh_access_token_success(self):
        """Test successful token refresh"""
        user_id = "user123"
        email = "refresh@example.com"
        
        refresh_token = create_refresh_token(user_id, email)
        new_tokens = refresh_access_token(refresh_token)
        
        # Verify response structure
        assert 'access_token' in new_tokens
        assert new_tokens['token_type'] == "Bearer"
        assert 'expires_in' in new_tokens
        assert new_tokens['user_id'] == user_id
        assert new_tokens['email'] == email
        
        # Verify new access token is valid
        decoded = decode_token(new_tokens['access_token'])
        assert decoded.user_id == user_id
        assert decoded.email == email
        assert decoded.token_type == "access"
    
    def test_refresh_with_access_token_fails(self):
        """Test that refresh fails when using access token"""
        user_id = "user123"
        email = "wrong@example.com"
        
        access_token = create_access_token(user_id, email)
        
        with pytest.raises(JWTError, match="Invalid token type for refresh operation"):
            refresh_access_token(access_token)
    
    def test_refresh_with_invalid_token_fails(self):
        """Test refresh with invalid token"""
        with pytest.raises(JWTError):
            refresh_access_token("invalid.token.here")

class TestTokenInfo:
    """Test token information utility"""
    
    def test_get_token_info_valid(self):
        """Test getting info from valid token"""
        user_id = "user123"
        email = "info@example.com"
        token = create_access_token(user_id, email)
        
        info = get_token_info(token)
        
        assert info['valid'] is True
        assert 'payload' in info
        assert 'expires_at' in info
        assert 'issued_at' in info
        assert info['user_id'] == user_id
        assert info['email'] == email
        assert info['token_type'] == "access"
    
    def test_get_token_info_invalid(self):
        """Test getting info from invalid token"""
        info = get_token_info("invalid.token")
        
        assert info['valid'] is False
        assert 'error' in info
    
    def test_get_token_info_with_bearer_prefix(self):
        """Test getting info with Bearer prefix"""
        user_id = "user123"
        email = "bearer@example.com"
        token = create_access_token(user_id, email)
        bearer_token = f"Bearer {token}"
        
        info = get_token_info(bearer_token)
        
        assert info['valid'] is True
        assert info['user_id'] == user_id

class TestErrorHandling:
    """Test error handling in JWT utilities"""
    
    def test_jwt_error_inheritance(self):
        """Test JWTError is proper exception"""
        with pytest.raises(JWTError):
            raise JWTError("Test error")
        
        with pytest.raises(Exception):
            raise JWTError("Test error")
    
    @patch('utils.jwt_auth.jwt.encode')
    def test_create_access_token_error(self, mock_encode):
        """Test error handling in token creation"""
        mock_encode.side_effect = Exception("JWT encode error")
        
        with pytest.raises(JWTError, match="Failed to create access token"):
            create_access_token("user123", "test@example.com")
    
    @patch('utils.jwt_auth.jwt.encode')
    def test_create_token_response_error(self, mock_encode):
        """Test error handling in token response creation"""
        mock_encode.side_effect = Exception("JWT encode error")
        
        with pytest.raises(JWTError, match="Failed to create token response"):
            create_token_response("user123", "test@example.com")

class TestIntegration:
    """Integration tests for JWT functionality"""
    
    def test_complete_authentication_flow(self):
        """Test complete authentication flow"""
        user_id = "user123"
        email = "integration@example.com"
        
        # 1. Create token response (login)
        tokens = create_token_response(user_id, email)
        
        # 2. Validate access token
        access_payload = decode_token(tokens['access_token'])
        assert access_payload.user_id == user_id
        assert access_payload.email == email
        
        # 3. Use token in Lambda event
        event = {
            'headers': {
                'Authorization': f"Bearer {tokens['access_token']}"
            }
        }
        
        validated_payload = validate_token_from_event(event)
        assert validated_payload is not None
        assert validated_payload.user_id == user_id
        
        # 4. Refresh token
        new_tokens = refresh_access_token(tokens['refresh_token'])
        new_payload = decode_token(new_tokens['access_token'])
        assert new_payload.user_id == user_id
    
    def test_token_expiry_simulation(self):
        """Test token behavior with time-based expiry"""
        user_id = "user123"
        email = "expiry@example.com"
        
        # Create tokens
        tokens = create_token_response(user_id, email)
        
        # Verify access token info shows reasonable expiry
        info = get_token_info(tokens['access_token'])
        expires_at = datetime.fromisoformat(info['expires_at'].replace('Z', '+00:00'))
        issued_at = datetime.fromisoformat(info['issued_at'].replace('Z', '+00:00'))
        
        # Should expire within reasonable time frame (30 minutes for access token)
        time_diff = expires_at - issued_at
        assert timedelta(minutes=25) < time_diff < timedelta(minutes=35)
    
    def test_different_token_types(self):
        """Test that access and refresh tokens have different properties"""
        user_id = "user123"
        email = "types@example.com"
        
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id, email)
        
        access_info = get_token_info(access_token)
        refresh_info = get_token_info(refresh_token)
        
        assert access_info['token_type'] == "access"
        assert refresh_info['token_type'] == "refresh"
        
        # Refresh token should expire later than access token
        access_exp = datetime.fromisoformat(access_info['expires_at'].replace('Z', '+00:00'))
        refresh_exp = datetime.fromisoformat(refresh_info['expires_at'].replace('Z', '+00:00'))
        
        assert refresh_exp > access_exp

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
