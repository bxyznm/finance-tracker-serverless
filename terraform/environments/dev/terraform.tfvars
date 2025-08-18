# =============================================================================
# Finance Tracker Serverless - Variables para Desarrollo
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Básicas (REQUERIDAS)
# -----------------------------------------------------------------------------

# Información de GitHub
github_owner = "bxyznm"                    # Usuario de GitHub del propietario del repo

# Token de GitHub: se puede configurar de 3 maneras (en orden de prioridad):
# 1. Variable de entorno: export GITHUB_TOKEN="tu_token_aqui"
# 2. Descomentar la línea siguiente: github_token = "tu_token_aqui"  
# 3. En CI/CD se configura automáticamente desde secrets.GITHUB_TOKEN

# github_token = "ghp_tu_token_personal_aqui"  # Descomenta y agrega tu token si no usas variables de entorno

# Opcional: Tag específico del prerelease para usar
# Si se deja vacío, usará el último prerelease disponible
dev_release_tag = "vdev-main-23"  # Usar el tag más reciente que tiene los assets layer.zip y code.zip

# -----------------------------------------------------------------------------
# Configuración del Proyecto (OPCIONAL)
# -----------------------------------------------------------------------------

project_name = "finance-tracker"
aws_region   = "mx-central-1"

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
