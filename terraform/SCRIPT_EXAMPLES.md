# 📖 Ejemplos de Uso - Scripts de Destrucción

## 🎯 Casos de Uso Comunes

### **1. Verificar qué recursos tengo actualmente**
```bash
# Verificación rápida sin destruir nada
./quick_verify.sh

# Output esperado:
# ✅ No se encontraron tablas DynamoDB
# ✅ No se encontraron funciones Lambda
# ✅ No se encontraron grupos de logs
# ...
```

### **2. Destruir completamente un entorno de desarrollo**
```bash
# Script completo con confirmaciones
./destroy_and_verify.sh dev

# Proceso:
# 1. Verifica prerequisitos ✓
# 2. Pide confirmación (escribir 'DESTROY') ⚠️
# 3. Ejecuta terraform destroy 🗑️
# 4. Verifica que todo se eliminó ✅
# 5. Ofrece limpieza manual si es necesario 🧹
```

### **3. Destruir entorno de staging/producción**
```bash
# Entorno staging
./destroy_and_verify.sh staging

# Entorno producción (¡MUCHO CUIDADO!)
./destroy_and_verify.sh production
```

## 🔄 Flujo de Trabajo Típico

### **Durante Desarrollo**
```bash
# 1. Desplegar cambios
terraform apply

# 2. Probar aplicación
curl https://tu-api.execute-api.mx-central-1.amazonaws.com/api/health

# 3. Cuando termines de desarrollar
./destroy_and_verify.sh dev
```

### **Para Limpieza de Entornos**
```bash
# 1. Ver qué hay desplegado
./quick_verify.sh

# 2. Si hay recursos viejos, destruir
./destroy_and_verify.sh

# 3. Confirmar limpieza
./quick_verify.sh
```

## 🚨 Escenarios de Error y Soluciones

### **Error: Credenciales AWS**
```bash
# Error mostrado:
❌ Credenciales AWS no configuradas o inválidas

# Solución:
aws configure
# Ingresa: Access Key, Secret Key, Region (us-east-1)
```

### **Error: Recursos bloqueados**
```bash
# Error mostrado:
❌ Error durante terraform destroy

# El script continuará y mostrará:
🔍 VERIFICACIÓN DE LIMPIEZA COMPLETA
❌ Se encontraron tablas DynamoDB remanentes:
finance-tracker-dev-users

# Opciones:
¿Quieres eliminar estas tablas manualmente? (y/N): y
```

### **Error: Sin permisos**
```bash
# Error mostrado:
AccessDenied: User is not authorized to perform dynamodb:DeleteTable

# Solución: Verificar permisos IAM del usuario
aws iam list-attached-user-policies --user-name tu-usuario
```

## 💡 Tips y Buenas Prácticas

### **Antes de Destruir Producción**
```bash
# 1. Backup de datos críticos
aws dynamodb create-backup --table-name finance-tracker-prod-users --backup-name manual-backup-$(date +%Y%m%d)

# 2. Verificar que tienes acceso para recrear
terraform plan -var="environment=production"

# 3. Notificar al equipo
echo "Destruyendo producción - Comunicado al equipo ✓"

# 4. Ejecutar destrucción
./destroy_and_verify.sh production
```

### **Para Desarrollo Diario**
```bash
# Script rápido para limpiar al final del día
#!/bin/bash
echo "🧹 Limpieza diaria de desarrollo"
cd terraform/
./destroy_and_verify.sh dev
echo "✅ Entorno dev limpio - No hay costos overnight"
```

### **Verificación de Costos**
```bash
# Después de destruir, verificar que no hay costos
aws ce get-dimension-values --dimension Service --time-period Start=2025-08-15,End=2025-08-16

# Ver facturación actual
aws ce get-cost-and-usage --time-period Start=2025-08-01,End=2025-08-16 --granularity MONTHLY --metrics BlendedCost
```

## ⏰ Cronograma Sugerido

### **Desarrollo Diario**
- **9:00 AM**: `terraform apply` (desplegar para trabajar)
- **6:00 PM**: `./destroy_and_verify.sh dev` (limpiar)

### **Testing Semanal**
- **Lunes**: Desplegar staging para testing
- **Viernes**: `./destroy_and_verify.sh staging` (limpiar)

### **Producción**
- **Solo cuando sea necesario**: Deployment planificado
- **Nunca destruir** sin backup y plan de contingencia

## 🎨 Personalización de Scripts

### **Cambiar colores de output**
```bash
# En los scripts, modificar estas variables:
RED='\033[0;31m'      # Errores
GREEN='\033[0;32m'    # Éxitos  
YELLOW='\033[1;33m'   # Advertencias
BLUE='\033[0;34m'     # Información
```

### **Cambiar confirmación requerida**
```bash
# En destroy_and_verify.sh, línea ~45:
# Cambiar de 'DESTROY' a algo más simple
if [ "$confirmation" != "YES" ]; then
```

### **Agregar notificaciones Slack/Discord**
```bash
# Al final del script destroy_and_verify.sh:
if [ "$verification_failed" = false ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"✅ Finance Tracker dev environment destroyed successfully"}' \
      YOUR_WEBHOOK_URL
fi
```
