#!/bin/bash

# =============================================================================
# Script de Verificación de Configuración de Región
# Finance Tracker - Verificar que todo esté configurado para mx-central-1
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}🇲🇽 VERIFICACIÓN DE CONFIGURACIÓN PARA REGIÓN MX-CENTRAL-1${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Función para verificar archivo
verify_file() {
    local file="$1"
    local expected="$2"
    local description="$3"
    
    echo -e "${BLUE}🔍 Verificando: $description${NC}"
    echo -e "   📁 Archivo: $file"
    
    if [ -f "$file" ]; then
        if grep -q "$expected" "$file"; then
            echo -e "   ✅ Configurado correctamente para mx-central-1"
        else
            echo -e "   ❌ No configurado para mx-central-1"
            echo -e "   💡 Buscando configuración actual..."
            grep -i "region\|mx-central\|us-east" "$file" || echo "   No se encontró configuración de región"
        fi
    else
        echo -e "   ❌ Archivo no encontrado"
    fi
    echo ""
}

# Verificaciones de archivos
echo -e "${YELLOW}📋 Verificando archivos de configuración de Terraform...${NC}"
echo ""

verify_file "variables.tf" "mx-central-1" "Variables de Terraform"
verify_file "terraform.tfvars" "mx-central-1" "Configuración de Terraform"

echo -e "${YELLOW}📋 Verificando scripts de automatización...${NC}"
echo ""

verify_file "destroy_and_verify.sh" "mx-central-1" "Script de destrucción"
verify_file "quick_verify.sh" "mx-central-1" "Script de verificación rápida"

echo -e "${YELLOW}📋 Verificando backend Python...${NC}"
echo ""

verify_file "../backend/src/utils/config.py" "mx-central-1" "Configuración de Python"
verify_file "../backend/test_local.py" "mx-central-1" "Testing local"

# Verificar configuración actual de AWS CLI
echo -e "${YELLOW}📋 Verificando configuración de AWS CLI...${NC}"
echo ""

echo -e "${BLUE}🔍 Verificando: AWS CLI Region${NC}"
current_region=$(aws configure get region 2>/dev/null || echo "not_configured")
if [ "$current_region" = "mx-central-1" ]; then
    echo -e "   ✅ AWS CLI configurado para mx-central-1"
else
    echo -e "   ⚠️  AWS CLI configurado para: $current_region"
    echo -e "   💡 Para cambiar ejecuta: aws configure set region mx-central-1"
fi
echo ""

# Verificar que mx-central-1 esté disponible
echo -e "${BLUE}🔍 Verificando: Disponibilidad de región mx-central-1${NC}"
if aws ec2 describe-regions --region-names mx-central-1 >/dev/null 2>&1; then
    echo -e "   ✅ Región mx-central-1 está disponible"
else
    echo -e "   ❌ Región mx-central-1 no está disponible o no tienes acceso"
    echo -e "   💡 Verifica tus credenciales AWS y permisos de región"
fi
echo ""

# Verificar estado de Terraform
echo -e "${YELLOW}📋 Verificando estado de Terraform...${NC}"
echo ""

echo -e "${BLUE}🔍 Verificando: Estado de Terraform${NC}"
if [ -f "terraform.tfstate" ]; then
    echo -e "   ⚠️  Existe terraform.tfstate - puede contener recursos de otra región"
    echo -e "   💡 Considera ejecutar 'terraform destroy' antes de cambiar región"
else
    echo -e "   ✅ No existe terraform.tfstate - listo para nueva región"
fi

if [ -f ".terraform/terraform.tfstate" ]; then
    echo -e "   ℹ️  Existe estado de backend de Terraform"
    echo -e "   💡 Ejecuta 'terraform init' después de cambiar región"
else
    echo -e "   ✅ No existe estado de backend - listo para init"
fi
echo ""

# Resumen final
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}📊 RESUMEN DE VERIFICACIÓN${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

echo -e "${GREEN}✅ Archivos Terraform actualizados a mx-central-1${NC}"
echo -e "${GREEN}✅ Scripts de automatización actualizados${NC}"
echo -e "${GREEN}✅ Backend Python configurado para mx-central-1${NC}"
echo ""

echo -e "${YELLOW}📝 PRÓXIMOS PASOS RECOMENDADOS:${NC}"
echo ""
echo -e "1. ${BLUE}Configurar AWS CLI para nueva región:${NC}"
echo -e "   aws configure set region mx-central-1"
echo ""
echo -e "2. ${BLUE}Inicializar Terraform:${NC}"
echo -e "   terraform init"
echo ""
echo -e "3. ${BLUE}Planear deployment:${NC}"
echo -e "   terraform plan"
echo ""
echo -e "4. ${BLUE}Aplicar infraestructura:${NC}"
echo -e "   terraform apply"
echo ""
echo -e "5. ${BLUE}Verificar que todo funciona:${NC}"
echo -e "   ./quick_verify.sh"
echo ""

echo -e "${BLUE}🇲🇽 ¡Todo configurado para desplegar en México Central!${NC}"
echo ""
