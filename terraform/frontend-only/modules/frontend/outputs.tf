# =============================================================================
# Outputs del Módulo Frontend
# =============================================================================

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 del frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "ARN del bucket S3 del frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_domain_name" {
  description = "Domain name del bucket S3"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "frontend_cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_cloudfront_domain_name" {
  description = "Domain name de CloudFront"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "URL completa del frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_cloudfront_arn" {
  description = "ARN de la distribución CloudFront"
  value       = aws_cloudfront_distribution.frontend.arn
}
