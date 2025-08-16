"""
Utilidades de respuesta HTTP para Lambda handlers.
Funciones comunes para generar respuestas estandarizadas.
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
    Crear una respuesta HTTP estandarizada para Lambda.
    
    Args:
        status_code: Código de estado HTTP
        body: Cuerpo de la respuesta
        headers: Headers adicionales
        
    Returns:
        Respuesta formateada para API Gateway
    """
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
    
    if headers:
        default_headers.update(headers)
    
    # Agregar timestamp a todas las respuestas
    if isinstance(body, dict):
        body["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "statusCode": status_code,
        "headers": default_headers,
        "body": json.dumps(body, ensure_ascii=False, default=str)
    }


def success_response(data: Any, message: str = "Success") -> Dict[str, Any]:
    """
    Crear respuesta de éxito (200).
    
    Args:
        data: Datos a retornar
        message: Mensaje descriptivo
        
    Returns:
        Respuesta HTTP 200
    """
    return create_response(200, {
        "success": True,
        "message": message,
        "data": data
    })


def created_response(data: Any, message: str = "Resource created") -> Dict[str, Any]:
    """
    Crear respuesta de recurso creado (201).
    
    Args:
        data: Datos del recurso creado
        message: Mensaje descriptivo
        
    Returns:
        Respuesta HTTP 201
    """
    return create_response(201, {
        "success": True,
        "message": message,
        "data": data
    })


def bad_request_response(message: str, errors: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Crear respuesta de solicitud incorrecta (400).
    
    Args:
        message: Mensaje de error
        errors: Detalles específicos de errores
        
    Returns:
        Respuesta HTTP 400
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
    Crear respuesta de no autorizado (401).
    
    Args:
        message: Mensaje de error
        
    Returns:
        Respuesta HTTP 401
    """
    return create_response(401, {
        "success": False,
        "message": message,
        "error_code": "UNAUTHORIZED"
    })


def forbidden_response(message: str = "Forbidden") -> Dict[str, Any]:
    """
    Crear respuesta de prohibido (403).
    
    Args:
        message: Mensaje de error
        
    Returns:
        Respuesta HTTP 403
    """
    return create_response(403, {
        "success": False,
        "message": message,
        "error_code": "FORBIDDEN"
    })


def not_found_response(message: str = "Resource not found") -> Dict[str, Any]:
    """
    Crear respuesta de no encontrado (404).
    
    Args:
        message: Mensaje de error
        
    Returns:
        Respuesta HTTP 404
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
    Crear respuesta de error interno del servidor (500).
    
    Args:
        message: Mensaje de error
        error_id: ID único del error para tracking
        
    Returns:
        Respuesta HTTP 500
    """
    body = {
        "success": False,
        "message": message,
        "error_code": "INTERNAL_SERVER_ERROR"
    }
    
    if error_id:
        body["error_id"] = error_id
    
    return create_response(500, body)


def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    """
    Generic error response function.
    
    Args:
        message: Error message
        status_code: HTTP status code for the error
        
    Returns:
        HTTP error response
    """
    return create_response(status_code, {
        "success": False,
        "message": message
    })


def not_found_response(message: str = "Resource not found") -> Dict[str, Any]:
    """
    Create a 404 not found response.
    
    Args:
        message: Error message
        
    Returns:
        HTTP 404 response
    """
    return create_response(404, {
        "success": False,
        "message": message
    })


def handle_cors_preflight() -> Dict[str, Any]:
    """
    Manejar solicitudes CORS preflight (OPTIONS).
    
    Returns:
        Respuesta HTTP 200 para OPTIONS
    """
    return create_response(200, {}, {
        "Access-Control-Max-Age": "86400"
    })
