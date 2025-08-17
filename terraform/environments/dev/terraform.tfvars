# =============================================================================
# Finance Tracker Serverless - Variables para Desarrollo
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Básicas (REQUERIDAS)
# -----------------------------------------------------------------------------

# Información de GitHub
github_owner = "bxyznm"                    # Usuario de GitHub del propietario del repo
github_token = "PLACEHOLDER_TOKEN"        # Debes proporcionar tu token de GitHub real

# Opcional: Tag específico del prerelease para usar
# Si se deja vacío, usará el último prerelease disponible
dev_release_tag = ""

# -----------------------------------------------------------------------------
# Configuración del Proyecto (OPCIONAL)
# -----------------------------------------------------------------------------

project_name = "finance-tracker"
aws_region   = "us-east-1"

# -----------------------------------------------------------------------------
# Variables de Lambda (OPCIONAL) 
# -----------------------------------------------------------------------------

lambda_runtime = "python3.12"

# Variables de entorno adicionales para las funciones Lambda
lambda_environment_variables = {
  DEBUG_MODE  = "true"
  LOG_LEVEL   = "DEBUG"
  ENVIRONMENT = "dev"
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

cors_allowed_origins = ["*"]  # Para desarrollo, en producción debes especificar dominios específicos
