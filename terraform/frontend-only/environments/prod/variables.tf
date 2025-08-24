# =============================================================================
# Variables para Frontend PROD Environment
# =============================================================================

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "mx-central-1"
}

variable "backend_state_bucket" {
  description = "Bucket donde está el estado del backend"
  type        = string
  default     = "finance-tracker-serverless-tfstates"
}
