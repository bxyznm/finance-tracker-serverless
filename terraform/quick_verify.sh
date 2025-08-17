#!/bin/bash

# =============================================================================
# Script de Verificación Rápida (Solo Verificación)
# Finance Tracker - Verificar recursos remanentes sin destruir
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_NAME="finance-tracker"
AWS_REGION="mx-central-1"
ENVIRONMENT="${1:-dev}"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}🔍 VERIFICACIÓN RÁPIDA DE RECURSOS${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo -e "${YELLOW}📋 Buscando recursos de: ${PROJECT_NAME}-${ENVIRONMENT}${NC}"
echo -e "${YELLOW}🌍 Región: ${AWS_REGION}${NC}"
echo ""

# Verificar que AWS CLI esté configurado
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Credenciales AWS no configuradas${NC}"
    exit 1
fi

echo -e "${BLUE}🗃️  Verificando DynamoDB...${NC}"
aws dynamodb list-tables --region "$AWS_REGION" --query 'TableNames[]' --output table | grep -E "${PROJECT_NAME}" || echo -e "${GREEN}✅ No se encontraron tablas DynamoDB${NC}"

echo ""
echo -e "${BLUE}⚡ Verificando Lambda...${NC}"
aws lambda list-functions --region "$AWS_REGION" --query 'Functions[?starts_with(FunctionName, `'${PROJECT_NAME}'`)].{Name:FunctionName,Runtime:Runtime}' --output table || echo -e "${GREEN}✅ No se encontraron funciones Lambda${NC}"

echo ""
echo -e "${BLUE}📝 Verificando CloudWatch Logs...${NC}"
aws logs describe-log-groups --region "$AWS_REGION" --query 'logGroups[?contains(logGroupName, `'${PROJECT_NAME}'`)].logGroupName' --output table || echo -e "${GREEN}✅ No se encontraron grupos de logs${NC}"

echo ""
echo -e "${BLUE}🌐 Verificando API Gateway...${NC}"
aws apigateway get-rest-apis --region "$AWS_REGION" --query 'items[?contains(name, `'${PROJECT_NAME}'`)].{Name:name,Id:id,Created:createdDate}' --output table || echo -e "${GREEN}✅ No se encontraron APIs Gateway${NC}"

echo ""
echo -e "${BLUE}🔐 Verificando roles IAM...${NC}"
aws iam list-roles --query 'Roles[?contains(RoleName, `'${PROJECT_NAME}'`)].{RoleName:RoleName,Created:CreateDate}' --output table || echo -e "${GREEN}✅ No se encontraron roles IAM${NC}"

echo ""
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}✨ Verificación completada${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Mostrar ayuda adicional
echo ""
echo -e "${YELLOW}💡 Comandos útiles adicionales:${NC}"
echo -e "   • Ver estado Terraform: ${BLUE}terraform show${NC}"
echo -e "   • Ver costos actuales: ${BLUE}aws ce get-dimension-values --dimension Key --time-period Start=2025-08-01,End=2025-08-16${NC}"
echo -e "   • Destruir todo: ${BLUE}./destroy_and_verify.sh${NC}"
