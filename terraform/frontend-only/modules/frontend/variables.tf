# =============================================================================
# Variables para el Módulo Frontend
# =============================================================================

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker"
}

variable "environment" {
  description = "Ambiente de despliegue (dev, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment debe ser 'dev' o 'prod'."
  }
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "mx-central-1"
}

variable "common_tags" {
  description = "Tags comunes para todos los recursos"
  type        = map(string)
  default     = {}
}

variable "api_gateway_url" {
  description = "URL del API Gateway del backend (para configurar REACT_APP_API_URL)"
  type        = string
  default     = ""
}

# Variables opcionales para dominio personalizado (futuro)
variable "domain_name" {
  description = "Dominio personalizado para el frontend"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN del certificado SSL para dominio personalizado"
  type        = string
  default     = ""
}
