# 🔧 Configuración Manual de Variables del Repositorio

Este documento explica cómo configurar manualmente las variables del repositorio para el sistema de persistencia de buckets S3, en caso de que el workflow de CI/CD no pueda crearlas automáticamente debido a permisos.

## 🎯 ¿Cuándo usar esto?

Si ves este error en los logs del workflow:
```
failed to set variable "PROD_S3_BUCKET_SUFFIX": HTTP 403: Resource not accessible by integration
```

O si ves esta advertencia en el summary:
```
⚠️ Warning: Could not save S3 bucket suffix. Next deployment will create a new bucket.
```

## 📋 Variables Requeridas

Necesitas configurar estas variables en tu repositorio de GitHub:

### Para Desarrollo:
- **Variable**: `DEV_S3_BUCKET_SUFFIX`
- **Valor**: El sufijo generado que aparece en los logs (ej: `dev-123456-abc123`)

### Para Producción:
- **Variable**: `PROD_S3_BUCKET_SUFFIX`
- **Valor**: El sufijo generado que aparece en los logs (ej: `prod-123456-abc123`)

## 🛠️ Configuración Manual

### Método 1: GitHub Web UI

1. **Ve a tu repositorio** en GitHub.com
2. **Navega** a `Settings` → `Secrets and variables` → `Actions`
3. **Haz clic** en la pestaña `Variables`
4. **Haz clic** en `New repository variable`
5. **Completa**:
   - Name: `DEV_S3_BUCKET_SUFFIX` (o `PROD_S3_BUCKET_SUFFIX`)
   - Value: El valor del sufijo de los logs
6. **Haz clic** en `Add variable`

### Método 2: GitHub CLI

```bash
# Para desarrollo
gh variable set DEV_S3_BUCKET_SUFFIX --body "dev-123456-abc123"

# Para producción
gh variable set PROD_S3_BUCKET_SUFFIX --body "prod-123456-abc123"
```

### Método 3: REST API

```bash
# Configurar token
export GITHUB_TOKEN="tu_token_personal_aqui"
export REPO="bxyznm/finance-tracker-serverless"

# Para desarrollo
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/variables" \
  -d '{"name":"DEV_S3_BUCKET_SUFFIX","value":"dev-123456-abc123"}'

# Para producción
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO/actions/variables" \
  -d '{"name":"PROD_S3_BUCKET_SUFFIX","value":"prod-123456-abc123"}'
```

## 🔍 Cómo encontrar los valores

### En los logs del workflow:

Busca líneas como:
```
Saving bucket suffix as repository variable: prod-39211-594e10
```

### En los outputs de Terraform:

```bash
terraform output -raw s3_deployment_bucket | jq -r .suffix
```

### En AWS Console:

Ve a S3 y busca buckets con nombre como:
- `finance-tracker-dev-deployment-assets-XXXXXX`
- `finance-tracker-prod-deployment-assets-XXXXXX`

El sufijo es la parte `XXXXXX` al final.

## 🔐 Permisos Necesarios

Para que el workflow pueda crear variables automáticamente, necesitas:

1. **Permisos del repositorio**:
   - Settings → Actions → General
   - "Workflow permissions" → "Read and write permissions"

2. **Token con permisos adecuados** (si usas PAT):
   - `repo` scope
   - `write:packages` scope

## ✅ Verificación

Una vez configuradas las variables, puedes verificar que funcionan:

1. **Ve** a Settings → Secrets and variables → Actions → Variables
2. **Confirma** que existen:
   - `DEV_S3_BUCKET_SUFFIX`
   - `PROD_S3_BUCKET_SUFFIX` (si usas prod)
3. **Ejecuta** el workflow nuevamente

## 🚀 Beneficios

Una vez configurado correctamente:

- ✅ **Reutilización** de buckets S3 existentes
- ✅ **Sin duplicación** de recursos
- ✅ **Costos optimizados**
- ✅ **Deployments consistentes**

## ❓ Troubleshooting

### Error: Variable already exists
Si ya existe la variable, actualízala en lugar de crearla:
```bash
# GitHub CLI
gh variable set DEV_S3_BUCKET_SUFFIX --body "nuevo-valor"

# REST API - usa PATCH en lugar de POST
curl -X PATCH \
  "https://api.github.com/repos/$REPO/actions/variables/DEV_S3_BUCKET_SUFFIX" \
  -d '{"value":"nuevo-valor"}'
```

### Error: 404 Not Found
Verifica que:
- El repositorio existe y tienes acceso
- El token tiene los permisos correctos
- La URL del API es correcta

---

**Nota**: Una vez que configures las variables manualmente la primera vez, el sistema debería funcionar automáticamente en deployments futuros.
