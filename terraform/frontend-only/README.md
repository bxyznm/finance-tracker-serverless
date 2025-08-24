# Frontend-Only Infrastructure

Esta carpeta contiene la infraestructura **exclusivamente para el frontend**, completamente separada del backend.

## 🏗️ Estructura

```
terraform/frontend-only/
├── modules/frontend/          # Módulo reutilizable para frontend
│   ├── main.tf               # Recursos S3 + CloudFront
│   ├── variables.tf          # Variables del módulo
│   └── outputs.tf            # Outputs del módulo
└── environments/
    ├── dev/                  # Ambiente de desarrollo
    │   ├── main.tf          # Configuración dev
    │   └── variables.tf     # Variables dev
    └── prod/                 # Ambiente de producción
        ├── main.tf          # Configuración prod  
        └── variables.tf     # Variables prod
```

## 🔄 Estados de Terraform Separados

**Frontend-Only**:
- DEV: `s3://bucket/frontend-only/dev/terraform.tfstate`
- PROD: `s3://bucket/frontend-only/prod/terraform.tfstate`

**Backend** (existente):
- DEV: `s3://bucket/terraform-state/dev/terraform.tfstate`
- PROD: `s3://bucket/terraform-state/prod/terraform.tfstate`

## 🚀 Recursos Creados

- **S3 Bucket**: Para hosting del frontend
- **CloudFront Distribution**: CDN global
- **S3 Bucket Policy**: Permisos para CloudFront
- **OAC (Origin Access Control)**: Seguridad

## 📋 Uso

### Desplegar Frontend DEV
```bash
cd terraform/frontend-only/environments/dev
terraform init -backend-config="bucket=finance-tracker-serverless-tfstates"
terraform plan
terraform apply
```

### Desplegar Frontend PROD
```bash
cd terraform/frontend-only/environments/prod
terraform init -backend-config="bucket=finance-tracker-serverless-tfstates"
terraform plan
terraform apply
```

## 🔗 Integración con Backend

El frontend automáticamente obtiene la URL del API Gateway desde el estado del backend usando `terraform_remote_state`.
