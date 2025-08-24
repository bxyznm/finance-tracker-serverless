# =============================================================================
# Frontend Infrastructure - S3 + CloudFront + Custom Domain
# =============================================================================

# -----------------------------------------------------------------------------
# Locals para construcción de nombres
# -----------------------------------------------------------------------------

locals {
  frontend_domain = var.use_custom_domain ? "${var.frontend_subdomain}.${var.domain_name}" : ""
  use_ssl_cert    = var.use_custom_domain && !var.cloudflare_integration
}

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

# Bloquear acceso público directo (CloudFront será el único acceso)
resource "aws_s3_bucket_public_access_block" "frontend_pab" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# SSL Certificate (Solo si no usamos Cloudflare como proxy)
# -----------------------------------------------------------------------------

# Certificate SSL para CloudFront (Solo para AWS Certificate Manager)
# IMPORTANTE: Este certificado debe crearse manualmente en us-east-1 si se usa dominio personalizado
resource "aws_acm_certificate" "frontend_cert" {
  count = local.use_ssl_cert ? 1 : 0
  
  domain_name              = local.frontend_domain
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method        = "DNS"

  tags = {
    Name        = "${var.project_name}-frontend-cert-${var.environment}"
    Environment = var.environment
    Domain      = local.frontend_domain
    Note        = "For CloudFront - create in us-east-1"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Validación del certificado (requiere configuración manual en DNS)
resource "aws_acm_certificate_validation" "frontend_cert_validation" {
  count = local.use_ssl_cert ? 1 : 0
  
  certificate_arn = aws_acm_certificate.frontend_cert[0].arn
  
  # Timeout para validación manual
  timeouts {
    create = "10m"
  }
}

# -----------------------------------------------------------------------------
# CloudFront Distribution para CDN
# -----------------------------------------------------------------------------

# Origin Access Control para CloudFront
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "${var.project_name}-frontend-oac-${var.environment}"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
    origin_id                = "S3-${aws_s3_bucket.frontend_bucket.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${var.project_name} Frontend Distribution - ${var.environment}"
  
  # Aliases para dominio personalizado
  aliases = var.use_custom_domain ? [local.frontend_domain] : []

  # Configuración de cache para SPA
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend_bucket.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 día
    max_ttl     = 31536000 # 1 año
  }

  # Cache para archivos estáticos (JS, CSS, imágenes)
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"
    compress         = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000 # 1 año
    max_ttl     = 31536000 # 1 año
  }

  # Configuración para manejo de errores SPA
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_100" # Solo EE.UU., Canadá y Europa

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Configuración de certificado SSL
  viewer_certificate {
    # Si no usamos dominio personalizado
    cloudfront_default_certificate = !var.use_custom_domain
    
    # Si usamos dominio personalizado con certificado AWS
    acm_certificate_arn      = local.use_ssl_cert ? aws_acm_certificate_validation.frontend_cert_validation[0].certificate_arn : null
    ssl_support_method       = local.use_ssl_cert ? "sni-only" : null
    minimum_protocol_version = local.use_ssl_cert ? "TLSv1.2_2021" : null
  }

  tags = {
    Name        = "${var.project_name}-frontend-distribution-${var.environment}"
    Environment = var.environment
    Purpose     = "Frontend CDN"
    Domain      = var.use_custom_domain ? local.frontend_domain : "cloudfront-default"
  }

  depends_on = [aws_s3_bucket.frontend_bucket]
}

# Política del bucket para permitir acceso solo a CloudFront
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_cloudfront_distribution.frontend_distribution]
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 para el frontend"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "frontend_bucket_arn" {
  description = "ARN del bucket S3 para el frontend"
  value       = aws_s3_bucket.frontend_bucket.arn
}

output "frontend_cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "frontend_cloudfront_domain_name" {
  description = "Domain name de CloudFront para acceder al frontend"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "frontend_url" {
  description = "URL completa del frontend"
  value       = var.use_custom_domain ? "https://${local.frontend_domain}" : "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "ssl_certificate_arn" {
  description = "ARN del certificado SSL (si se usa)"
  value       = local.use_ssl_cert ? aws_acm_certificate.frontend_cert[0].arn : null
}

output "dns_validation_records" {
  description = "Records DNS necesarios para validar el certificado SSL"
  value = local.use_ssl_cert ? {
    for dvo in aws_acm_certificate.frontend_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}
}
