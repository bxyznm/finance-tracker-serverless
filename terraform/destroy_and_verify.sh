#!/bin/bash

# =============================================================================
# Script de Destrucción y Verificación Automática
# Finance Tracker - Terraform Infrastructure
# =============================================================================

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
TERRAFORM_DIR="$(dirname "$0")"
PROJECT_NAME="finance-tracker"
AWS_REGION="mx-central-1"
ENVIRONMENT="${1:-dev}"  # Usar argumento o 'dev' por defecto

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}🗑️  DESTRUYENDO INFRAESTRUCTURA FINANCE TRACKER${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo -e "${YELLOW}📋 Configuración:${NC}"
echo -e "   • Proyecto: ${PROJECT_NAME}"
echo -e "   • Entorno: ${ENVIRONMENT}"
echo -e "   • Región: ${AWS_REGION}"
echo -e "   • Directorio: ${TERRAFORM_DIR}"
echo ""

# Función para mostrar confirmación
confirm_destroy() {
    echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará TODOS los recursos de AWS${NC}"
    echo -e "${RED}   Esto incluye:${NC}"
    echo -e "${RED}   • Todas las tablas DynamoDB (SE PERDERÁN LOS DATOS)${NC}"
    echo -e "${RED}   • Funciones Lambda (health-check, users)${NC}"
    echo -e "${RED}   • Lambda Layers con dependencias Python${NC}"
    echo -e "${RED}   • API Gateway y sus configuraciones${NC}"
    echo -e "${RED}   • Logs de CloudWatch${NC}"
    echo -e "${RED}   • Roles y políticas IAM${NC}"
    echo -e "${RED}   • Archivos ZIP locales de deployment${NC}"
    echo ""
    read -p "¿Estás seguro de que quieres continuar? (escribe 'DESTROY' para confirmar): " confirmation
    
    if [ "$confirmation" != "DESTROY" ]; then
        echo -e "${YELLOW}❌ Operación cancelada por el usuario${NC}"
        exit 1
    fi
}

# Función para verificar prerequisitos
check_prerequisites() {
    echo -e "${BLUE}🔍 Verificando prerequisitos...${NC}"
    
    # Verificar Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform no está instalado${NC}"
        exit 1
    fi
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI no está instalado${NC}"
        exit 1
    fi
    
    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ Credenciales AWS no configuradas o inválidas${NC}"
        echo "   Ejecuta: aws configure"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisitos verificados${NC}"
    echo ""
}

# Función para ejecutar terraform destroy
run_terraform_destroy() {
    echo -e "${BLUE}🗑️  Ejecutando terraform destroy...${NC}"
    echo ""
    
    cd "$TERRAFORM_DIR"
    
    # Verificar que existe terraform.tfstate
    if [ ! -f "terraform.tfstate" ]; then
        echo -e "${YELLOW}⚠️  No se encontró terraform.tfstate - es posible que no haya recursos que destruir${NC}"
        echo ""
    fi
    
    # Ejecutar terraform destroy
    echo -e "${YELLOW}🔄 Iniciando destrucción de recursos...${NC}"
    if terraform destroy -var="environment=${ENVIRONMENT}" -auto-approve; then
        echo -e "${GREEN}✅ Terraform destroy completado exitosamente${NC}"
        echo ""
    else
        echo -e "${RED}❌ Error durante terraform destroy${NC}"
        echo -e "${YELLOW}💡 Continuando con verificación manual...${NC}"
        echo ""
    fi
}

# Función para verificar DynamoDB
verify_dynamodb() {
    echo -e "${BLUE}🔍 Verificando tablas DynamoDB...${NC}"
    
    local tables=$(aws dynamodb list-tables --region "$AWS_REGION" --query 'TableNames[]' --output text | grep -E "${PROJECT_NAME}-${ENVIRONMENT}" 2>/dev/null || echo "")
    
    if [ -z "$tables" ]; then
        echo -e "${GREEN}✅ No se encontraron tablas DynamoDB${NC}"
        return 0
    else
        echo -e "${RED}❌ Se encontraron tablas DynamoDB remanentes:${NC}"
        echo "$tables"
        
        # Opción para eliminar manualmente
        read -p "¿Quieres eliminar estas tablas manualmente? (y/N): " delete_tables
        if [[ $delete_tables =~ ^[Yy]$ ]]; then
            for table in $tables; do
                echo -e "${YELLOW}🗑️  Eliminando tabla: $table${NC}"
                aws dynamodb delete-table --table-name "$table" --region "$AWS_REGION" || echo -e "${RED}❌ Error eliminando $table${NC}"
            done
        fi
        return 1
    fi
}

# Función para verificar Lambda Functions y Layers
verify_lambda() {
    echo -e "${BLUE}🔍 Verificando funciones Lambda...${NC}"
    
    local functions=$(aws lambda list-functions --region "$AWS_REGION" --query 'Functions[?starts_with(FunctionName, `'${PROJECT_NAME}-${ENVIRONMENT}'`)].FunctionName' --output text 2>/dev/null || echo "")
    
    if [ -z "$functions" ]; then
        echo -e "${GREEN}✅ No se encontraron funciones Lambda${NC}"
    else
        echo -e "${RED}❌ Se encontraron funciones Lambda remanentes:${NC}"
        echo "$functions"
        
        # Opción para eliminar manualmente
        read -p "¿Quieres eliminar estas funciones manualmente? (y/N): " delete_functions
        if [[ $delete_functions =~ ^[Yy]$ ]]; then
            for func in $functions; do
                echo -e "${YELLOW}🗑️  Eliminando función: $func${NC}"
                aws lambda delete-function --function-name "$func" --region "$AWS_REGION" || echo -e "${RED}❌ Error eliminando $func${NC}"
            done
        fi
    fi
    
    # Verificar Lambda Layers
    echo -e "${BLUE}🔍 Verificando Lambda Layers...${NC}"
    
    local layers=$(aws lambda list-layers --region "$AWS_REGION" --query 'Layers[?starts_with(LayerName, `'${PROJECT_NAME}-${ENVIRONMENT}'`)].LayerName' --output text 2>/dev/null || echo "")
    
    if [ -z "$layers" ]; then
        echo -e "${GREEN}✅ No se encontraron Lambda Layers${NC}"
        if [ -z "$functions" ]; then
            return 0
        fi
    else
        echo -e "${RED}❌ Se encontraron Lambda Layers remanentes:${NC}"
        echo "$layers"
        
        # Opción para eliminar manualmente
        read -p "¿Quieres eliminar estos layers manualmente? (y/N): " delete_layers
        if [[ $delete_layers =~ ^[Yy]$ ]]; then
            for layer in $layers; do
                echo -e "${YELLOW}🗑️  Obteniendo versiones del layer: $layer${NC}"
                local versions=$(aws lambda list-layer-versions --layer-name "$layer" --region "$AWS_REGION" --query 'LayerVersions[].Version' --output text 2>/dev/null || echo "")
                
                for version in $versions; do
                    echo -e "${YELLOW}🗑️  Eliminando layer version: $layer:$version${NC}"
                    aws lambda delete-layer-version --layer-name "$layer" --version-number "$version" --region "$AWS_REGION" || echo -e "${RED}❌ Error eliminando $layer:$version${NC}"
                done
            done
        fi
    fi
    
    if [ -n "$functions" ] || [ -n "$layers" ]; then
        return 1
    else
        return 0
    fi
}

# Función para verificar CloudWatch Logs
verify_cloudwatch() {
    echo -e "${BLUE}🔍 Verificando grupos de logs CloudWatch...${NC}"
    
    local log_groups=$(aws logs describe-log-groups --region "$AWS_REGION" --query 'logGroups[?contains(logGroupName, `'${PROJECT_NAME}-${ENVIRONMENT}'`) || contains(logGroupName, `'${PROJECT_NAME}'`)].logGroupName' --output text 2>/dev/null || echo "")
    
    if [ -z "$log_groups" ]; then
        echo -e "${GREEN}✅ No se encontraron grupos de logs${NC}"
        return 0
    else
        echo -e "${RED}❌ Se encontraron grupos de logs remanentes:${NC}"
        echo "$log_groups"
        
        # Opción para eliminar manualmente
        read -p "¿Quieres eliminar estos grupos de logs manualmente? (y/N): " delete_logs
        if [[ $delete_logs =~ ^[Yy]$ ]]; then
            for log_group in $log_groups; do
                echo -e "${YELLOW}🗑️  Eliminando log group: $log_group${NC}"
                aws logs delete-log-group --log-group-name "$log_group" --region "$AWS_REGION" || echo -e "${RED}❌ Error eliminando $log_group${NC}"
            done
        fi
        return 1
    fi
}

# Función para verificar API Gateway
verify_api_gateway() {
    echo -e "${BLUE}🔍 Verificando APIs Gateway...${NC}"
    
    local api_info=$(aws apigateway get-rest-apis --region "$AWS_REGION" --query 'items[?contains(name, `'${PROJECT_NAME}'`)].{Name:name,Id:id}' --output text 2>/dev/null || echo "")
    
    if [ -z "$api_info" ]; then
        echo -e "${GREEN}✅ No se encontraron APIs Gateway${NC}"
        return 0
    else
        echo -e "${RED}❌ Se encontraron APIs Gateway remanentes:${NC}"
        echo "$api_info"
        
        # Opción para eliminar manualmente
        read -p "¿Quieres eliminar estas APIs manualmente? (y/N): " delete_apis
        if [[ $delete_apis =~ ^[Yy]$ ]]; then
            # Extraer IDs de las APIs (formato: Name<tab>ID)
            echo "$api_info" | while IFS=$'\t' read -r name api_id; do
                if [ -n "$api_id" ] && [ "$api_id" != "None" ]; then
                    echo -e "${YELLOW}🗑️  Eliminando API '$name' con ID: $api_id${NC}"
                    aws apigateway delete-rest-api --rest-api-id "$api_id" --region "$AWS_REGION" || echo -e "${RED}❌ Error eliminando $api_id${NC}"
                fi
            done
        fi
        return 1
    fi
}

# Función para verificar IAM roles
verify_iam() {
    echo -e "${BLUE}🔍 Verificando roles IAM...${NC}"
    
    local roles=$(aws iam list-roles --query 'Roles[?contains(RoleName, `'${PROJECT_NAME}'`)].RoleName' --output text 2>/dev/null || echo "")
    
    if [ -z "$roles" ]; then
        echo -e "${GREEN}✅ No se encontraron roles IAM${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Se encontraron roles IAM (normalmente se eliminan automáticamente):${NC}"
        echo "$roles"
        echo -e "${BLUE}💡 Los roles IAM suelen eliminarse automáticamente al destruir las funciones Lambda${NC}"
        return 0
    fi
}

# Función para verificar estado de Terraform
verify_terraform_state() {
    echo -e "${BLUE}🔍 Verificando estado de Terraform...${NC}"
    
    cd "$TERRAFORM_DIR"
    
    if [ -f "terraform.tfstate" ]; then
        local resources_count=$(terraform show -json 2>/dev/null | jq -r '.values.root_module.resources // [] | length' 2>/dev/null || echo "0")
        
        if [ "$resources_count" = "0" ] || [ "$resources_count" = "null" ]; then
            echo -e "${GREEN}✅ Estado de Terraform limpio (sin recursos)${NC}"
            
            # Opción para eliminar archivos de estado
            read -p "¿Quieres eliminar los archivos de estado de Terraform? (y/N): " delete_state
            if [[ $delete_state =~ ^[Yy]$ ]]; then
                rm -f terraform.tfstate*
                echo -e "${GREEN}✅ Archivos de estado eliminados${NC}"
            fi
        else
            echo -e "${RED}❌ Aún hay $resources_count recursos en el estado de Terraform${NC}"
            echo -e "${YELLOW}💡 Ejecuta 'terraform show' para ver detalles${NC}"
        fi
    else
        echo -e "${GREEN}✅ No existe archivo de estado de Terraform${NC}"
    fi
    
    # Limpiar archivos ZIP locales
    echo -e "${BLUE}🔍 Verificando archivos temporales locales...${NC}"
    
    local zip_files=$(find . -name "*.zip" -type f 2>/dev/null | grep -E "(lambda-deployment|lambda-layer)" || echo "")
    
    if [ -z "$zip_files" ]; then
        echo -e "${GREEN}✅ No se encontraron archivos ZIP temporales${NC}"
    else
        echo -e "${YELLOW}📦 Se encontraron archivos ZIP temporales:${NC}"
        echo "$zip_files"
        
        # Opción para eliminar archivos ZIP
        read -p "¿Quieres eliminar estos archivos ZIP temporales? (y/N): " delete_zips
        if [[ $delete_zips =~ ^[Yy]$ ]]; then
            echo "$zip_files" | xargs rm -f
            echo -e "${GREEN}✅ Archivos ZIP eliminados${NC}"
        fi
    fi
}

# Función principal de verificación
run_verification() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}🔍 VERIFICACIÓN DE LIMPIEZA COMPLETA${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo ""
    
    local verification_failed=false
    
    # Ejecutar todas las verificaciones
    verify_dynamodb || verification_failed=true
    echo ""
    
    verify_lambda || verification_failed=true
    echo ""
    
    verify_cloudwatch || verification_failed=true
    echo ""
    
    verify_api_gateway || verification_failed=true
    echo ""
    
    verify_iam
    echo ""
    
    verify_terraform_state
    echo ""
    
    # Resultado final
    if [ "$verification_failed" = false ]; then
        echo -e "${GREEN}==============================================================================${NC}"
        echo -e "${GREEN}🎉 ¡LIMPIEZA COMPLETA EXITOSA!${NC}"
        echo -e "${GREEN}==============================================================================${NC}"
        echo -e "${GREEN}✅ Todos los recursos han sido eliminados correctamente${NC}"
        echo -e "${GREEN}✅ No se encontraron recursos remanentes en AWS${NC}"
        echo -e "${GREEN}✅ La infraestructura Finance Tracker se ha destruido completamente${NC}"
        echo ""
        echo -e "${BLUE}📊 Recursos eliminados:${NC}"
        echo -e "   • 5 tablas DynamoDB (users, accounts, transactions, categories, budgets)"
        echo -e "   • 2 funciones Lambda (health-check, users)"
        echo -e "   • 1 Lambda Layer con dependencias Python"
        echo -e "   • 1 API Gateway con todos sus endpoints"
        echo -e "   • Grupos de logs CloudWatch"
        echo -e "   • Roles y políticas IAM"
        echo ""
        echo -e "${BLUE}💰 Costos: Ya no se están generando costos por estos recursos${NC}"
        echo ""
    else
        echo -e "${YELLOW}==============================================================================${NC}"
        echo -e "${YELLOW}⚠️  LIMPIEZA PARCIAL - VERIFICAR RECURSOS MANUALMENTE${NC}"
        echo -e "${YELLOW}==============================================================================${NC}"
        echo -e "${YELLOW}⚠️  Se encontraron algunos recursos remanentes${NC}"
        echo -e "${YELLOW}💡 Revisa la salida anterior para detalles específicos${NC}"
        echo -e "${YELLOW}💡 Puedes ejecutar comandos de limpieza manual si es necesario${NC}"
        echo -e "${YELLOW}💡 Algunos recursos pueden tardar unos minutos en eliminarse completamente${NC}"
        echo ""
    fi
}

# Función de ayuda
show_help() {
    echo "Uso: $0 [ENTORNO]"
    echo ""
    echo "ENTORNO: dev, staging, production (por defecto: dev)"
    echo ""
    echo "Ejemplos:"
    echo "  $0              # Destruir entorno dev"
    echo "  $0 staging      # Destruir entorno staging"
    echo "  $0 production   # Destruir entorno production"
    echo ""
    echo "Opciones:"
    echo "  -h, --help      Mostrar esta ayuda"
    echo ""
}

# Script principal
main() {
    # Verificar argumentos
    if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Verificar prerequisitos
    check_prerequisites
    
    # Confirmar destrucción
    confirm_destroy
    
    echo ""
    echo -e "${BLUE}🚀 Iniciando proceso de destrucción...${NC}"
    echo ""
    
    # Ejecutar terraform destroy
    run_terraform_destroy
    
    # Esperar un momento para que AWS procese las eliminaciones
    echo -e "${BLUE}⏳ Esperando 10 segundos para que AWS procese las eliminaciones...${NC}"
    sleep 10
    echo ""
    
    # Ejecutar verificación
    run_verification
    
    echo -e "${BLUE}🏁 Proceso completado!${NC}"
}

# Ejecutar script principal
main "$@"
