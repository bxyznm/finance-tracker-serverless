#!/usr/bin/env python3
"""
Script para probar los Lambda handlers localmente.
Simula un evento de API Gateway para testing.
"""

import json
import sys
import os
from typing import Dict, Any

# Agregar src al path para importar los handlers
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from handlers.health import lambda_handler


def create_api_gateway_event(
    http_method: str = "GET",
    path: str = "/health",
    headers: Dict[str, str] = None,
    query_params: Dict[str, str] = None,
    body: str = None
) -> Dict[str, Any]:
    """
    Crear un evento simulado de API Gateway.
    
    Args:
        http_method: Método HTTP
        path: Ruta del endpoint
        headers: Headers de la request
        query_params: Parámetros de query
        body: Cuerpo de la request
        
    Returns:
        Evento simulado de API Gateway
    """
    if headers is None:
        headers = {}
    
    return {
        "resource": path,
        "path": path,
        "httpMethod": http_method,
        "headers": headers,
        "multiValueHeaders": {},
        "queryStringParameters": query_params,
        "multiValueQueryStringParameters": {},
        "pathParameters": None,
        "stageVariables": None,
        "requestContext": {
            "path": f"/dev{path}",
            "accountId": "123456789012",
            "resourceId": "resource-id",
            "stage": "dev",
            "requestId": "test-request-id",
            "identity": {
                "sourceIp": "127.0.0.1",
                "userAgent": "test-user-agent"
            },
            "httpMethod": http_method,
            "apiId": "test-api-id"
        },
        "body": body,
        "isBase64Encoded": False
    }


class MockLambdaContext:
    """Mock de contexto Lambda para testing."""
    
    def __init__(self):
        self.function_name = "test-function"
        self.function_version = "$LATEST"
        self.invoked_function_arn = "arn:aws:lambda:mx-central-1:123456789012:function:test-function"
        self.memory_limit_in_mb = 128
        self.remaining_time_in_millis = lambda: 30000
        self.log_group_name = "/aws/lambda/test-function"
        self.log_stream_name = "test-stream"
        self.aws_request_id = "test-request-id"


def test_health_check():
    """Probar el endpoint de health check."""
    print("🏥 Probando Health Check...")
    print("=" * 50)
    
    # Crear evento simulado
    event = create_api_gateway_event()
    context = MockLambdaContext()
    
    try:
        # Llamar al handler
        response = lambda_handler(event, context)
        
        # Mostrar resultado
        print(f"Status Code: {response['statusCode']}")
        print("Headers:")
        for key, value in response['headers'].items():
            print(f"  {key}: {value}")
        
        print("\nBody:")
        body = json.loads(response['body'])
        print(json.dumps(body, indent=2, ensure_ascii=False))
        
        # Verificar resultado
        if response['statusCode'] == 200:
            print("\n✅ Health check exitoso!")
        else:
            print(f"\n❌ Health check falló con código {response['statusCode']}")
            
    except Exception as e:
        print(f"❌ Error ejecutando health check: {str(e)}")
        import traceback
        traceback.print_exc()


def main():
    """Función principal."""
    print("🚀 Finance Tracker - Test Local")
    print("================================")
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "health":
            test_health_check()
        else:
            print(f"Comando desconocido: {command}")
            print("Comandos disponibles: health")
    else:
        # Por defecto, probar health check
        test_health_check()


if __name__ == "__main__":
    main()
