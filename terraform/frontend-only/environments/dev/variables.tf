# =============================================================================
# Variables para Frontend DEV Environment
# =============================================================================

variable "aws_region" {
  description = "Región de AWS - México Central"
  type        = string
  default     = "mx-central-1"  # Región de México
}

variable "backend_state_bucket" {
  description = "Bucket donde está el estado del backend"
  type        = string
  default     = "finance-tracker-serverless-tfstates"
}
