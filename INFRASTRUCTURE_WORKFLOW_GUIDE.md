# 🚀 Guía de Uso del Workflow de Infraestructura

Esta guía te explica cómo usar el workflow de infraestructura mejorado que incluye persistencia de buckets S3 y capacidades de destrucción.

## 📋 Operaciones Disponibles

### 🔄 **Deploy** (Despliegue)
Crea o actualiza la infraestructura en AWS.

### 🗑️ **Destroy** (Destrucción)  
Elimina completamente la infraestructura de AWS y limpia las variables del repositorio.

## 🎯 Ejecución Automática

El workflow se ejecuta automáticamente después del workflow de "Deployment":

- **PR a main** → Crea prerelease → **Despliega DEV automáticamente**
- **Push a main** → Crea release → **Despliega PROD automáticamente**

## ⚡ Ejecución Manual

Ve a **Actions** → **Infrastructure Deployment** → **Run workflow**

### Parámetros:

#### **Environment** (Requerido)
- `dev` - Ambiente de desarrollo
- `prod` - Ambiente de producción

#### **Operation** (Requerido)
- `deploy` - Desplegar infraestructura
- `destroy` - Destruir infraestructura

#### **Release Tag** (Opcional)
- Vacío = usa el release más reciente
- `vdev-main-23` = usa un tag específico

#### **Destroy First** (Solo para deploy)
- `false` = Deploy normal
- `true` = Destruir primero, luego desplegar (recreación completa)

## 🛠️ Casos de Uso Comunes

### 1. 🚀 Desplegar Development
```yaml
Environment: dev
Operation: deploy
Release Tag: (vacío)
```

### 2. 🚀 Desplegar Production
```yaml
Environment: prod
Operation: deploy
Release Tag: (vacío)
```

### 3. 🗑️ Limpiar Development
```yaml
Environment: dev
Operation: destroy
```

### 4. 🚨 Emergencia - Limpiar Production
```yaml
Environment: prod
Operation: destroy
```
⚠️ **CUIDADO**: Esto eliminará todos los datos de producción permanentemente.

### 5. 🔄 Recrear Infraestructura
```yaml
Environment: dev/prod
Operation: deploy
Destroy First: true
```

### 6. 📌 Usar Release Específico
```yaml
Environment: dev
Operation: deploy
Release Tag: vdev-main-22
```

## 🔍 Entendiendo el Sistema de Buckets S3

### **¿Qué hace el sistema?**

1. **Primera vez**: Crea bucket con sufijo único → Guarda sufijo como variable del repo
2. **Siguientes veces**: Usa el mismo bucket → No duplica recursos
3. **Al destruir**: Elimina bucket → Limpia variable del repo

### **Variables del Repositorio**

El sistema maneja automáticamente estas variables:

- `DEV_S3_BUCKET_SUFFIX` - Sufijo del bucket de desarrollo
- `PROD_S3_BUCKET_SUFFIX` - Sufijo del bucket de producción

### **Nombres de Bucket Generados**

```
finance-tracker-dev-deployment-assets-dev-123456-abc123
finance-tracker-prod-deployment-assets-prod-654321-def456
```

## 📊 Monitoreo y Outputs

### **Durante Deploy**
- ✅ URL de la API Gateway
- ✅ URL de Health Check
- ✅ Nombre del bucket S3
- ✅ Tag del release usado
- ✅ Información del ambiente

### **Durante Destroy**
- 🗑️ Recursos eliminados
- 🧹 Variables limpiadas
- ⚠️ Advertencias sobre pérdida de datos

## 🚨 Consideraciones de Seguridad

### **Development Environment**
- ⚡ Deploy/destroy rápido
- 🔄 Datos pueden perderse sin problema
- 🧪 Para pruebas y desarrollo

### **Production Environment**
- 🔒 Requiere ambiente "production" 
- ⏰ Confirmación de 10 segundos antes de destruir
- ⚠️ Pérdida de datos permanente
- 📊 Incluye monitoreo y alertas

## ❓ Troubleshooting

### **Error: "Resource not accessible by integration"**
- Configura manualmente las variables del repositorio
- Ve el archivo `REPOSITORY_VARIABLES_SETUP.md`

### **Error: "Bucket already exists"**
- Ejecuta `destroy` primero
- O usa `Destroy First: true` en deploy

### **Error: "No bucket suffix found"**
- La infraestructura puede no existir
- El destroy continuará de todos modos

### **Workflow no se ejecuta automáticamente**
- Verifica que el workflow "Deployment" haya completado exitosamente
- Revisa los permisos del repositorio

## 🎯 Mejores Prácticas

### **Para Development**
```bash
# Ciclo típico de desarrollo:
1. Hacer cambios → PR → Auto-deploy a DEV
2. Probar en DEV
3. Merge a main → Auto-deploy a PROD
4. Si hay problemas → Destroy DEV → Redeploy
```

### **Para Production**
```bash
# Solo para emergencias o mantenimiento:
1. Nunca hacer destroy sin respaldo
2. Usar destroy solo para limpieza completa
3. Preferir updates incrementales
```

### **Para Limpieza**
```bash
# Limpieza periódica:
1. Destroy DEV cuando no se use
2. Deploy DEV cuando se necesite
3. Mantener PROD siempre activo
```

## 🔗 Enlaces Útiles

- **Acciones**: [GitHub Actions](https://github.com/bxyznm/finance-tracker-serverless/actions)
- **Variables**: Settings → Secrets and variables → Actions → Variables
- **Releases**: [GitHub Releases](https://github.com/bxyznm/finance-tracker-serverless/releases)
- **AWS Console**: Para verificar recursos creados/eliminados

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Desarrollo Normal
```
1. Haces cambios en código
2. Creas PR → Se ejecuta deployment → Se crea prerelease
3. Se ejecuta infrastructure deployment automáticamente en DEV
4. Pruebas la API en DEV
5. Merge PR → Se ejecuta deployment → Se crea release
6. Se ejecuta infrastructure deployment automáticamente en PROD
```

### Ejemplo 2: Limpieza de Recursos
```
1. Actions → Infrastructure Deployment → Run workflow
2. Environment: dev
3. Operation: destroy
4. ✅ Run workflow
5. Todos los recursos DEV eliminados
6. Variables del repo limpiadas
```

### Ejemplo 3: Recreación Completa
```
1. Actions → Infrastructure Deployment → Run workflow  
2. Environment: dev
3. Operation: deploy
4. Destroy First: true
5. ✅ Run workflow
6. Se destruye todo → Se vuelve a crear todo
```

¡El sistema está diseñado para ser robusto y manejar todos estos casos automáticamente!
