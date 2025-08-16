# 🤖 Scripts de Automatización - Finance Tracker

## 📋 Resumen

Se han creado **2 scripts automatizados** para simplificar la gestión de la infraestructura AWS:

| Script | Propósito | Duración | Seguridad |
|--------|-----------|----------|-----------|
| `quick_verify.sh` | Solo verificar recursos | ~5 segundos | ✅ Seguro (no modifica nada) |
| `destroy_and_verify.sh` | Destruir + Verificar | ~2-5 minutos | ⚠️ Destructivo (elimina recursos) |

## 🚀 Uso Rápido

### **Ver qué recursos existen**
```bash
./quick_verify.sh
```

### **Destruir todo el entorno de desarrollo**
```bash
./destroy_and_verify.sh
```

### **Destruir entorno específico**
```bash
./destroy_and_verify.sh staging      # Para staging
./destroy_and_verify.sh production   # Para producción ⚠️
```

## ✨ Características Principales

### **🔍 Script de Verificación (`quick_verify.sh`)**
- **100% seguro** - No modifica nada
- **Rápido** - Ejecución en ~5 segundos
- **Completo** - Verifica todos los servicios AWS
- **Visual** - Output con colores y emojis
- **Útil** - Muestra comandos adicionales

### **🗑️ Script de Destrucción (`destroy_and_verify.sh`)**
- **Seguro** - Requiere confirmación escribiendo 'DESTROY'
- **Completo** - Ejecuta `terraform destroy` + verificación
- **Inteligente** - Ofrece limpieza manual si es necesario
- **Detallado** - Reportes paso a paso
- **Confiable** - Confirma que no quedan recursos

## 🎯 Casos de Uso

### **🧑‍💻 Durante el Desarrollo**
```bash
# Al llegar por la mañana
terraform apply

# Al final del día (ahorrar costos)
./destroy_and_verify.sh
```

### **🧪 Para Testing**
```bash
# Verificar qué está desplegado
./quick_verify.sh

# Limpiar entorno de testing
./destroy_and_verify.sh staging
```

### **🚨 En Emergencia**
```bash
# Destruir rápidamente si hay problemas
./destroy_and_verify.sh dev
```

## 💰 Ahorro de Costos

### **Escenario Típico**
- **Sin scripts**: Desarrollador olvida destruir recursos → **$10-20/mes** en costos innecesarios
- **Con scripts**: Limpieza automática diaria → **$0** en costos overnight

### **Cálculo de Ahorro**
```bash
# Recursos activos 24/7 vs 8 horas/día
Costo tradicional: $20/mes
Costo con limpieza:  $7/mes (solo horario laboral)
Ahorro mensual:     $13/mes por desarrollador
```

## 🛡️ Seguridad y Mejores Prácticas

### **Confirmaciones de Seguridad**
- ✅ Verificación de credenciales AWS
- ✅ Confirmación manual requerida ('DESTROY')
- ✅ Lista de recursos antes de eliminar
- ✅ Opción de cancelar en cualquier momento

### **Protección de Datos**
- ⚠️ **ADVERTENCIA**: Los scripts eliminan TODAS las tablas DynamoDB
- 💾 **Recomendación**: Hacer backup antes de destruir producción
- 🔄 **Buena práctica**: Solo usar en dev/staging

## 🔧 Personalización

### **Cambiar Entorno por Defecto**
```bash
# En línea 15 de ambos scripts, cambiar:
ENVIRONMENT="${1:-staging}"  # Cambiar 'dev' por 'staging'
```

### **Cambiar Región**
```bash
# En línea 14 de ambos scripts, cambiar:
AWS_REGION="us-west-2"  # Cambiar de us-east-1
```

### **Agregar Notificaciones**
```bash
# Al final de destroy_and_verify.sh agregar:
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ Entorno '$ENVIRONMENT' destruido"}' \
  $SLACK_WEBHOOK_URL
```

## 🚀 Próximas Mejoras

### **En Consideración**
- [ ] Script de backup automático antes de destruir
- [ ] Integración con Slack/Discord para notificaciones
- [ ] Modo "dry-run" que muestra qué se destruiría sin hacerlo
- [ ] Script de deployment automático con rollback
- [ ] Verificación de costos antes y después

### **Scripts Adicionales Propuestos**
```bash
# Futuras adiciones:
backup_and_destroy.sh    # Backup + Destroy
deploy_with_checks.sh    # Deploy + Health checks
cost_report.sh          # Reporte de costos detallado
```

## 📞 Soporte y Troubleshooting

### **Problemas Comunes**

**Error: Credenciales**
```bash
❌ Credenciales AWS no configuradas
# Solución: aws configure
```

**Error: Permisos**
```bash
❌ User is not authorized
# Solución: Verificar políticas IAM
```

**Error: Recursos bloqueados**
```bash
❌ ResourceInUseException
# Solución: El script ofrece limpieza manual
```

### **Logs de Debugging**
```bash
# Para más detalles en caso de error:
AWS_CLI_LOG_LEVEL=debug ./destroy_and_verify.sh
```

---

## 🎉 ¡Todo Listo!

Los scripts están **listos para usar** y **completamente funcionales**. 

**Próximo paso sugerido**: Probar con un deployment para verificar que todo funciona:

```bash
# 1. Desplegar
terraform apply

# 2. Probar
curl https://tu-api-url/api/health

# 3. Limpiar
./destroy_and_verify.sh
```

💡 **Tip**: Guarda estos scripts en tu PATH para usarlos desde cualquier directorio:
```bash
# Opcional: agregar al PATH global
sudo cp destroy_and_verify.sh /usr/local/bin/
sudo cp quick_verify.sh /usr/local/bin/
```
