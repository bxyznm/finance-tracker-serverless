# =============================================================================
# Módulo Frontend S3 Hosting - Finance Tracker México
# =============================================================================
# Este módulo crea SOLO un bucket S3 con hosting web estático
# Desplegado en la región mx-central-1 (México Central)
# Sin CloudFront - Para usar con Cloudflare Proxy

terraform {
  required_version = ">= 1.12.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-frontend-${var.environment}"
  
  common_tags = merge(var.common_tags, {
    Project     = var.project_name
    Environment = var.environment
    Component   = "frontend"
    ManagedBy   = "terraform"
    HostingType = "s3-website"
    Region      = "mx-central-1"
    Country     = "Mexico"
  })
}

# -----------------------------------------------------------------------------
# S3 Bucket para Frontend Hosting en México
# Nombre fijo para coincidir con dominio finance-tracker.brxvn.xyz
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket        = "finance-tracker.brxvn.xyz"
  force_destroy = true  # Permite destruir bucket con contenido
  tags          = local.common_tags
}

# Configuración de Website
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # Para SPAs con React Router
  }
}

# Configuración de acceso público
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Policy para acceso público de lectura
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# Versionado del bucket
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configuración de CORS para permitir requests desde dominios externos
resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# -----------------------------------------------------------------------------
# Archivo de configuración de React (config.js)
# -----------------------------------------------------------------------------

resource "aws_s3_object" "config_js" {
  bucket       = aws_s3_bucket.frontend.id
  key          = "config.js"
  content_type = "application/javascript"
  
  content = <<EOF
// Configuración automática generada por Terraform
// Desplegado desde México Central (mx-central-1)
window.CONFIG = {
  API_BASE_URL: '${var.api_gateway_url != "" ? var.api_gateway_url : "https://api.example.com"}',
  ENVIRONMENT: '${var.environment}',
  APP_NAME: 'Finance Tracker',
  VERSION: '1.0.0',
  // Configuración específica para México
  LOCALE: 'es-MX',
  CURRENCY: 'MXN',
  TIMEZONE: 'America/Mexico_City',
  REGION: 'mx-central-1',
  COUNTRY: 'México'
};

console.log('🇲🇽 Finance Tracker México Config loaded:', window.CONFIG);
EOF

  tags = local.common_tags
}
