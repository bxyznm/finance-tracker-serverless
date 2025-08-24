# =============================================================================
# Outputs del Módulo Frontend - Solo S3 Website Hosting
# =============================================================================

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 del frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "ARN del bucket S3 del frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_website_endpoint" {
  description = "Endpoint del website S3 - ESTA ES LA URL PARA CLOUDFLARE"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "frontend_website_domain" {
  description = "Dominio del website S3 (sin protocolo)"
  value       = aws_s3_bucket_website_configuration.frontend.website_domain
}

output "frontend_url" {
  description = "URL completa del frontend S3 (HTTP)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "cloudflare_setup" {
  description = "Información para configurar Cloudflare"
  value = {
    website_endpoint = aws_s3_bucket_website_configuration.frontend.website_endpoint
    instructions = [
      "1. Ir a Cloudflare Dashboard → brxvn.xyz → DNS",
      "2. Crear registro CNAME:",
      "   Nombre: finance-tracker", 
      "   Destino: ${aws_s3_bucket_website_configuration.frontend.website_endpoint}",
      "3. Activar Cloudflare Proxy (nube naranja) = ON",
      "4. En SSL/TLS: Configurar modo 'Flexible'",
      "5. Esperar propagación DNS (5-10 minutos)",
      "6. Visitar https://finance-tracker.brxvn.xyz"
    ]
  }
}

output "deployment_info" {
  description = "Información de despliegue"
  value = {
    hosting_type    = "S3 Website Hosting + Cloudflare"
    bucket_name     = aws_s3_bucket.frontend.bucket
    website_url     = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
    custom_domain   = "https://finance-tracker.brxvn.xyz (después de configurar Cloudflare)"
    ssl_provider    = "Cloudflare"
    region          = aws_s3_bucket.frontend.region
  }
}
