# =============================================================================
# Finance Tracker Serverless - Variables para Entorno Development
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Básicas
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker-serverless"
}

variable "aws_region" {
  description = "Región de AWS donde desplegar los recursos"
  type        = string
  default     = "mx-central-1"
}

# -----------------------------------------------------------------------------
# Variables de GitHub
# -----------------------------------------------------------------------------

variable "github_owner" {
  description = "Owner del repositorio de GitHub"
  type        = string
  default     = "bxyznm"
}

variable "github_repository" {
  description = "Nombre del repositorio de GitHub"
  type        = string
  default     = "finance-tracker-serverless"
}

variable "github_token" {
  description = "Token de GitHub para acceder a la API. Si no se proporciona, intentará usar la variable de entorno GITHUB_TOKEN"
  type        = string
  sensitive   = true
  default     = ""
}

variable "dev_release_tag" {
  description = "Tag específico del prerelease para desarrollo. Si está vacío, usa el último prerelease."
  type        = string
  default     = "vdev"
}

# -----------------------------------------------------------------------------
# Variables de Lambda
# -----------------------------------------------------------------------------

variable "lambda_runtime" {
  description = "Runtime de Python para Lambda"
  type        = string
  default     = "python3.12"
}

variable "lambda_environment_variables" {
  description = "Variables de entorno adicionales para las funciones Lambda"
  type        = map(string)
  default = {
    # Variables específicas para desarrollo
    ENVIRONMENT = "dev"
    DEBUG_MODE  = "true"
  }
}

# -----------------------------------------------------------------------------
# Variables de CORS
# -----------------------------------------------------------------------------

variable "cors_allowed_methods" {
  description = "Lista de métodos HTTP permitidos para CORS"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allowed_headers" {
  description = "Lista de headers permitidos para CORS"
  type        = list(string)
  default = [
    "Content-Type",
    "X-Amz-Date",
    "Authorization",
    "X-Api-Key",
    "X-Amz-Security-Token",
    "X-Amz-User-Agent"
  ]
}

variable "cors_allowed_origins" {
  description = "Lista de orígenes permitidos para CORS"
  type        = list(string)
  default     = ["*"] # Para desarrollo, en producción usar dominios específicos
}

# -----------------------------------------------------------------------------
# Variables de Tags
# -----------------------------------------------------------------------------

variable "common_tags" {
  description = "Tags comunes a aplicar a todos los recursos"
  type        = map(string)
  default = {
    CreatedBy   = "terraform"
    Environment = "dev"
    Purpose     = "development"
    AutoDestroy = "true"
  }
}
