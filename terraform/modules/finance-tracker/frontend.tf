# =============================================================================
# Frontend Infrastructure - S3 + CloudFront + Custom Domain
# =============================================================================

# -----------------------------------------------------------------------------
# Locals para construcción de nombres
# -----------------------------------------------------------------------------

// No se requieren locals para dominio personalizado ni SSL, solo S3 y Cloudflare

# -----------------------------------------------------------------------------
# S3 Bucket para hosting del frontend
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "${var.project_name}-frontend-${var.environment}"

  tags = {
    Name        = "${var.project_name}-frontend-${var.environment}"
    Environment = var.environment
    Purpose     = "Frontend Hosting"
  }
}

# Configuración de versionado del bucket
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configuración de encriptación del bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_encryption" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configuración de hosting de website estático
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # Para SPA routing
  }
}

