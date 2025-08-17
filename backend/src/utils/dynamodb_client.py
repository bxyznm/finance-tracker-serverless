"""
Cliente DynamoDB para Finance Tracker
Implementa Single Table Design pattern para optimizar rendimiento y costos
"""

import boto3
import os
from typing import Dict, Any, Optional, List
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class DynamoDBClient:
    """Cliente para interactuar con DynamoDB usando Single Table Design"""
    
    def __init__(self):
        """Inicializar cliente DynamoDB"""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('DYNAMODB_TABLE', 'finance-tracker-dev-main')
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"DynamoDBClient inicializado con tabla: {self.table_name}")
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crear un nuevo usuario en DynamoDB
        
        Single Table Design:
        - pk: USER#{user_id}
        - sk: METADATA
        - gsi1pk: EMAIL#{email}
        - gsi1sk: USER#{user_id}
        """
        try:
            user_id = user_data['user_id']
            email = user_data['email']
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': 'METADATA',
                'gsi1_pk': f'EMAIL#{email}',
                'gsi1_sk': f'USER#{user_id}',
                'entity_type': 'user',
                'user_id': user_id,
                'name': user_data['name'],
                'email': email,
                'currency': user_data.get('currency', 'MXN'),
                'created_at': user_data['created_at'],
                'updated_at': user_data['updated_at'],
                'is_active': user_data.get('is_active', True)
            }
            
            # Usar ConditionExpression para evitar duplicados
            response = self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk)'
            )
            
            logger.info(f"Usuario creado exitosamente: {user_id}")
            return item
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Usuario ya existe: {user_id}")
                raise ValueError("El usuario ya existe")
            else:
                logger.error(f"Error creando usuario: {e}")
                raise
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Buscar usuario por email usando GSI1
        
        GSI1 permite buscar eficientemente por email:
        - gsi1pk: EMAIL#{email}
        """
        try:
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression='gsi1_pk = :email',
                ExpressionAttributeValues={
                    ':email': f'EMAIL#{email}'
                }
            )
            
            items = response.get('Items', [])
            if items:
                logger.info(f"Usuario encontrado por email: {email}")
                return items[0]
            else:
                logger.info(f"Usuario no encontrado por email: {email}")
                return None
                
        except ClientError as e:
            logger.error(f"Error buscando usuario por email {email}: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener usuario por ID usando partition key
        
        Acceso directo usando pk:
        - pk: USER#{user_id}
        - sk: METADATA
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                }
            )
            
            item = response.get('Item')
            if item:
                logger.info(f"Usuario encontrado por ID: {user_id}")
                return item
            else:
                logger.info(f"Usuario no encontrado por ID: {user_id}")
                return None
                
        except ClientError as e:
            logger.error(f"Error obteniendo usuario {user_id}: {e}")
            raise
    
    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualizar datos del usuario
        """
        try:
            # Construir expression dinámicamente
            update_expression = "SET "
            expression_values = {}
            expression_names = {}
            
            for field, value in update_data.items():
                if field not in ['user_id', 'pk', 'sk', 'gsi1_pk', 'gsi1_sk', 'entity_type']:
                    attr_name = f'#{field}'
                    attr_value = f':{field}'
                    update_expression += f'{attr_name} = {attr_value}, '
                    expression_names[attr_name] = field
                    expression_values[attr_value] = value
            
            # Remover última coma
            update_expression = update_expression.rstrip(', ')
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW',
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"Usuario actualizado: {user_id}")
            return response['Attributes']
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Usuario no encontrado para actualizar: {user_id}")
                raise ValueError("Usuario no encontrado")
            else:
                logger.error(f"Error actualizando usuario {user_id}: {e}")
                raise
    
    def delete_user(self, user_id: str, updated_at: str) -> bool:
        """
        Eliminar usuario (soft delete - marcar como inactivo)
        """
        try:
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'METADATA'
                },
                UpdateExpression='SET is_active = :inactive, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':timestamp': updated_at
                },
                ConditionExpression='attribute_exists(pk)'
            )
            
            logger.info(f"Usuario eliminado (soft delete): {user_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Usuario no encontrado para eliminar: {user_id}")
                return False
            else:
                logger.error(f"Error eliminando usuario {user_id}: {e}")
                raise
    
    def list_users(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Listar todos los usuarios activos
        """
        try:
            response = self.table.scan(
                FilterExpression='entity_type = :type AND is_active = :active',
                ExpressionAttributeValues={
                    ':type': 'user',
                    ':active': True
                },
                Limit=limit
            )
            
            users = response.get('Items', [])
            logger.info(f"Encontrados {len(users)} usuarios activos")
            return users
            
        except ClientError as e:
            logger.error(f"Error listando usuarios: {e}")
            raise
