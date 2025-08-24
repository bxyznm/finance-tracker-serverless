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
# Si se deja vacío o null, usará "local-dev" por defecto
# dev_release_tag = "local-dev"  # Descomenta si tienes un release específico

# -----------------------------------------------------------------------------
# Configuración de Seguridad (REQUERIDA)
# -----------------------------------------------------------------------------

# JWT Secret Key - IMPORTANTE: En producción debe ser un secreto seguro
jwt_secret_key = "dev-jwt-secret-key-change-this-in-production"

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

# -----------------------------------------------------------------------------
# S3 Configuration
# -----------------------------------------------------------------------------

# Sufijo personalizado para el bucket S3 (se configurará automáticamente desde CI/CD)
# s3_bucket_suffix = "dev-persistent-suffix"

# -----------------------------------------------------------------------------
# Frontend y Dominio Personalizado
# -----------------------------------------------------------------------------

# Configuración de dominio personalizado (opcional)
# Descomenta y configura si tienes un dominio propio

# domain_name = "mifinanzas.com"              # Tu dominio principal
# frontend_subdomain = "app"                  # Subdominio para el frontend (app.mifinanzas.com)
# use_custom_domain = true                    # Habilitar dominio personalizado
# cloudflare_integration = true              # true = Cloudflare como proxy, false = AWS Certificate Manager

# EJEMPLO para configurar tu dominio:
domain_name = "brxvn.xyz"
frontend_subdomain = "financetracker" 
use_custom_domain = true
cloudflare_integration = true
