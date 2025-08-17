"""
Handlers para gestión de usuarios
Implementa CRUD completo usando Single Table Design
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional
from datetime import datetime

# Importaciones locales
from utils.responses import create_response, internal_server_error_response
from utils.dynamodb_client import DynamoDBClient
from models import User, UserCreate, UserUpdate, create_user_from_input

# Configurar logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Cliente DynamoDB
db_client = DynamoDBClient()

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Handler principal para todas las operaciones de usuarios
    """
    try:
        logger.info(f"Procesando evento: {event}")
        
        http_method = event.get('httpMethod', '')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body', '{}')
        
        # Parsear body si existe
        if body and body != '{}':
            try:
                body_data = json.loads(body)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON body: {e}")
                return create_response(400, {"error": "Invalid JSON in request body"})
        else:
            body_data = {}
        
        # Routing basado en método HTTP
        if http_method == 'POST':
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
        logger.error(f"Error en lambda_handler: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def create_user_handler(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Crear un nuevo usuario
    """
    try:
        logger.info(f"Creando usuario con datos: {data}")
        
        # Validar datos usando Pydantic
        user_create = UserCreate(**data)
        
        # Verificar si el email ya existe
        existing_user = db_client.get_user_by_email(user_create.email)
        if existing_user:
            return create_response(409, {
                "error": "El email ya está registrado",
                "email": user_create.email
            })
        
        # Crear el usuario usando la función auxiliar
        user_data = create_user_from_input(user_create)
        created_user = db_client.create_user(user_data)
        
        # Convertir a modelo User para la respuesta
        user_response = User.from_dynamodb_item(created_user)
        
        logger.info(f"Usuario creado exitosamente: {user_response.user_id}")
        return create_response(201, {
            "message": "Usuario creado exitosamente",
            "user": user_response.model_dump()
        })
        
    except ValueError as e:
        logger.error(f"Error de validación: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error creando usuario: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def get_user_handler(user_id: str) -> Dict[str, Any]:
    """
    Obtener un usuario por ID
    """
    try:
        logger.info(f"Obteniendo usuario: {user_id}")
        
        user = db_client.get_user_by_id(user_id)
        if not user:
            return create_response(404, {
                "error": "Usuario no encontrado",
                "user_id": user_id
            })
        
        # Respuesta sin contraseña
        user_response = user.copy()
        user_response.pop('password_hash', None)
        
        return create_response(200, {"user": user_response})
        
    except Exception as e:
        logger.error(f"Error obteniendo usuario {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def update_user_handler(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Actualizar un usuario existente
    """
    try:
        logger.info(f"Actualizando usuario {user_id} con datos: {data}")
        
        # Verificar si el usuario existe
        existing_user = db_client.get_user_by_id(user_id)
        if not existing_user:
            return create_response(404, {
                "error": "Usuario no encontrado",
                "user_id": user_id
            })
        
        # Si se está actualizando el email, verificar que no exista
        if 'email' in data and data['email'] != existing_user.get('email'):
            user_with_email = db_client.get_user_by_email(data['email'])
            if user_with_email:
                return create_response(409, {
                    "error": "El email ya está registrado",
                    "email": data['email']
                })
        
        # Actualizar el usuario
        user_update = UserUpdate(**data)
        updated_user = db_client.update_user(user_id, user_update)
        
        # Respuesta sin contraseña
        user_response = updated_user.dict()
        user_response.pop('password_hash', None)
        
        logger.info(f"Usuario actualizado exitosamente: {user_id}")
        return create_response(200, {
            "message": "Usuario actualizado exitosamente",
            "user": user_response
        })
        
    except ValueError as e:
        logger.error(f"Error de validación: {str(e)}")
        return create_response(400, {"error": str(e)})
    except Exception as e:
        logger.error(f"Error actualizando usuario {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def delete_user_handler(user_id: str) -> Dict[str, Any]:
    """
    Eliminar un usuario
    """
    try:
        logger.info(f"Eliminando usuario: {user_id}")
        
        # Verificar si el usuario existe
        existing_user = db_client.get_user_by_id(user_id)
        if not existing_user:
            return create_response(404, {
                "error": "Usuario no encontrado",
                "user_id": user_id
            })
        
        # Eliminar el usuario (soft delete)
        updated_at = datetime.now().isoformat()
        db_client.delete_user(user_id, updated_at)
        
        logger.info(f"Usuario eliminado exitosamente: {user_id}")
        return create_response(200, {
            "message": "Usuario eliminado exitosamente",
            "user_id": user_id
        })
        
    except Exception as e:
        logger.error(f"Error eliminando usuario {user_id}: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")

def get_user_summary_handler() -> Dict[str, Any]:
    """
    Obtener resumen de usuarios (para testing/admin)
    """
    try:
        logger.info("Obteniendo resumen de usuarios")
        
        # Por ahora retornamos un resumen simple
        # En el futuro podríamos implementar paginación, filtros, etc.
        
        return create_response(200, {
            "message": "Endpoint de usuarios activo",
            "timestamp": datetime.utcnow().isoformat(),
            "available_operations": [
                "POST /users - Crear usuario",
                "GET /users/{user_id} - Obtener usuario",
                "PUT /users/{user_id} - Actualizar usuario",
                "DELETE /users/{user_id} - Eliminar usuario"
            ]
        })
        
    except Exception as e:
        logger.error(f"Error obteniendo resumen de usuarios: {str(e)}", exc_info=True)
        return internal_server_error_response("Error interno del servidor")
