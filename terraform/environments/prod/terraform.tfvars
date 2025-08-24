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
# Configuración de Seguridad (REQUERIDA)
# -----------------------------------------------------------------------------

# JWT Secret Key - CRÍTICO: En producción debe ser un secreto fuerte
# OPCIÓN 1: Especificar aquí (temporal para testing)
jwt_secret_key = "prod-super-secure-jwt-key-32-characters-minimum-length"

# OPCIÓN 2: Configurar desde variable de entorno (recomendado para producción)
# export TF_VAR_jwt_secret_key="tu-secreto-super-seguro-aqui"
# Cuando se use variable de entorno, comentar la línea de arriba

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

# TEMPORAL: Permitir CORS de todos los orígenes para testing
# TODO: Cambiar a dominios específicos en producción real
cors_allowed_origins = ["*"]

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

# -----------------------------------------------------------------------------
# S3 Configuration
# -----------------------------------------------------------------------------

# Sufijo personalizado para el bucket S3 (se configurará automáticamente desde CI/CD)
# s3_bucket_suffix = "prod-persistent-suffix"
