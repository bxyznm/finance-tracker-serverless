# =============================================================================
# Finance Tracker Serverless - Variables para Producción
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Básicas (REQUERIDAS)
# -----------------------------------------------------------------------------

# Información de GitHub
github_owner = "bxyznm"                    # Usuario de GitHub del propietario del repo

# Token de GitHub: En producción se usa automáticamente desde el environment de CI/CD
# En CI/CD se configura automáticamente desde secrets.GITHUB_TOKEN o variables de entorno
# Para uso local, descomenta y agrega tu token: github_token = "ghp_tu_token_aqui"

# -----------------------------------------------------------------------------
# Configuración del Proyecto (OPCIONAL)
# -----------------------------------------------------------------------------

project_name = "finance-tracker"
aws_region   = "mx-central-1"  # Región específica para producción

# -----------------------------------------------------------------------------
# Variables de Lambda (OPCIONAL) 
# -----------------------------------------------------------------------------

lambda_runtime = "python3.12"

# Variables de entorno para las funciones Lambda en producción
lambda_environment_variables = {
  LOG_LEVEL   = "INFO"          # Menos verboso que desarrollo
  ENVIRONMENT = "prod"
  DEBUG_MODE  = "false"         # Deshabilitado en producción
}

# -----------------------------------------------------------------------------
# Configuración de CORS (OPCIONAL)
# -----------------------------------------------------------------------------

cors_allowed_methods = [
  "GET",
  "POST",
  "PUT", 
  "DELETE",
  "OPTIONS"
]

cors_allowed_headers = [
  "Content-Type",
  "X-Amz-Date",
  "Authorization",
  "X-Api-Key",
  "X-Amz-Security-Token",
  "X-Amz-User-Agent"
]

# IMPORTANTE: En producción, especifica dominios específicos en lugar de "*"
cors_allowed_origins = ["https://tu-dominio-frontend.com"]

# -----------------------------------------------------------------------------
# Configuración de DynamoDB (PRODUCCIÓN)
# -----------------------------------------------------------------------------

use_provisioned_capacity = false  # Pay-per-request para flexibilidad inicial

# -----------------------------------------------------------------------------
# Configuración de Monitoreo (PRODUCCIÓN)
# -----------------------------------------------------------------------------

sns_alert_topic_arn = ""  # Agregar ARN del tópico SNS si existe

# -----------------------------------------------------------------------------
# Tags Comunes (PRODUCCIÓN)
# -----------------------------------------------------------------------------

common_tags = {
  CreatedBy    = "terraform"
  Environment  = "prod"
  Purpose      = "production"
  CostCenter   = "finance-tracker"
  Critical     = "true"
  Monitoring   = "enabled"
  Backup       = "enabled"
}
