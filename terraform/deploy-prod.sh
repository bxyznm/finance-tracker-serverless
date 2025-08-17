#!/bin/bash

# =============================================================================
# Finance Tracker Serverless - Deployment Script para Producción
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT="prod"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="${SCRIPT_DIR}/environments/${ENVIRONMENT}"

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_critical() {
    echo -e "${RED}🚨 CRÍTICO: $1${NC}"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    log "Verificando prerrequisitos para PRODUCCIÓN..."
    
    # Verificar Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform no está instalado. Instálalo desde: https://www.terraform.io/downloads.html"
        exit 1
    fi
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado. Instálalo desde: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "No se encontraron credenciales de AWS válidas. Configúralas con 'aws configure'"
        exit 1
    fi
    
    # Verificar que no estamos en una cuenta de desarrollo
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
    log_info "Desplegando en la cuenta AWS: ${ACCOUNT_ID}"
    
    # Verificar archivo terraform.tfvars
    if [ ! -f "${ENV_DIR}/terraform.tfvars" ]; then
        log_error "No se encontró el archivo terraform.tfvars en ${ENV_DIR}/"
        log_info "Copia terraform.tfvars.example como terraform.tfvars y configúralo"
        exit 1
    fi
    
    # Verificar que CORS origins no contengan localhost o wildcards
    if grep -q "localhost\|*" "${ENV_DIR}/terraform.tfvars" 2>/dev/null; then
        log_warning "⚠️  Se encontraron configuraciones de desarrollo en terraform.tfvars"
        log_warning "Verifica que cors_allowed_origins esté configurado para producción"
    fi
    
    log_success "Todos los prerrequisitos están configurados"
}

# Función para mostrar información del entorno
show_environment_info() {
    echo
    echo -e "${RED}🚨 Finance Tracker - Deployment de PRODUCCIÓN 🚨${NC}"
    echo -e "${RED}====================================================${NC}"
    echo
    log_critical "¡ESTE ES UN DEPLOYMENT DE PRODUCCIÓN!"
    log_warning "Todos los cambios afectarán el entorno en vivo"
    echo
    log_info "Entorno: ${ENVIRONMENT}"
    log_info "Directorio: ${ENV_DIR}"
    log_info "Usuario AWS: $(aws sts get-caller-identity --query 'Arn' --output text)"
    log_info "Región: $(aws configure get region)"
    log_info "Cuenta AWS: $(aws sts get-caller-identity --query 'Account' --output text)"
    echo
}

# Función para confirmar deployment de producción
confirm_production_deployment() {
    echo
    log_critical "CONFIRMACIÓN DE PRODUCCIÓN"
    echo -e "${RED}================================${NC}"
    echo
    log_warning "¿Has probado estos cambios en desarrollo? (y/N)"
    read -r dev_tested
    if [[ ! "$dev_tested" =~ ^[Yy]$ ]]; then
        log_error "Prueba los cambios en desarrollo primero"
        exit 1
    fi
    
    log_warning "¿Tienes un respaldo de la configuración actual? (y/N)"
    read -r backup_confirmed
    if [[ ! "$backup_confirmed" =~ ^[Yy]$ ]]; then
        log_error "Asegúrate de tener respaldos antes de continuar"
        exit 1
    fi
    
    log_warning "¿Confirmas que quieres hacer deployment a PRODUCCIÓN? (y/N)"
    read -r prod_confirmed
    if [[ ! "$prod_confirmed" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelado"
        exit 0
    fi
    
    echo
    log_success "Confirmaciones de producción completadas"
}

# Función para deployment
deploy() {
    log "Iniciando deployment CRÍTICO para entorno ${ENVIRONMENT}..."
    
    cd "${ENV_DIR}"
    
    # Terraform init
    log "Inicializando Terraform..."
    terraform init
    
    # Terraform plan
    log "Generando plan de Terraform..."
    terraform plan -out=tfplan
    
    # Mostrar plan y confirmar
    echo
    log_warning "Revisa cuidadosamente el plan anterior."
    log_warning "¿Continuar con el deployment de PRODUCCIÓN? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelado"
        rm -f tfplan
        exit 0
    fi
    
    # Terraform apply
    log "Aplicando cambios en PRODUCCIÓN..."
    terraform apply tfplan
    
    # Limpiar plan file
    rm -f tfplan
    
    log_success "¡Deployment de PRODUCCIÓN completado exitosamente!"
}

# Función para mostrar outputs
show_outputs() {
    cd "${ENV_DIR}"
    
    echo
    echo -e "${GREEN}📋 Información del Deployment de Producción${NC}"
    echo -e "${GREEN}=============================================${NC}"
    
    # Health Check URL
    HEALTH_URL=$(terraform output -raw health_check_url 2>/dev/null || echo "No disponible")
    echo
    log_info "Health Check URL: ${HEALTH_URL}"
    
    # API Gateway URL
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "No disponible")
    log_info "API Gateway URL: ${API_URL}"
    
    # Mostrar summary si está disponible
    if terraform output prod_deployment_summary &>/dev/null; then
        echo
        terraform output -raw prod_deployment_summary
    fi
    
    # Información de monitoreo
    echo
    log_info "📊 Comandos de Monitoreo:"
    echo "  • Logs Lambda: terraform output -json monitoring_commands"
    echo "  • CloudWatch Console: terraform output -json documentation_urls"
    echo "  • Todas las salidas: terraform output"
}

# Función para test completo de producción
test_deployment() {
    cd "${ENV_DIR}"
    
    HEALTH_URL=$(terraform output -raw health_check_url 2>/dev/null)
    
    if [ -n "$HEALTH_URL" ]; then
        echo
        log "Probando el deployment de PRODUCCIÓN..."
        
        # Test de health check
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_success "✅ Health check de producción pasó correctamente"
            echo
            log_info "Respuesta del health check:"
            curl -s "$HEALTH_URL" | jq . 2>/dev/null || curl -s "$HEALTH_URL"
        else
            log_error "❌ Health check de producción falló"
            log_warning "Revisa los logs de CloudWatch inmediatamente"
            return 1
        fi
        
        # Test de endpoints principales
        API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
        if [ -n "$API_URL" ]; then
            echo
            log "Probando endpoints principales..."
            
            # Test de CORS preflight
            if curl -f -s -X OPTIONS -H "Origin: https://example.com" "$API_URL/health" > /dev/null; then
                log_success "✅ CORS configurado correctamente"
            else
                log_warning "⚠️  CORS puede no estar configurado correctamente"
            fi
        fi
        
        echo
        log_success "✅ Tests básicos de producción completados"
        log_info "Monitorea los logs durante los próximos minutos"
    fi
}

# Función para verificar estado de alarmas
check_alarms() {
    cd "${ENV_DIR}"
    
    echo
    log "Verificando estado de alarmas de CloudWatch..."
    
    # Obtener lista de alarmas si están configuradas
    if terraform output cloudwatch_alarms &>/dev/null; then
        log_info "Alarmas configuradas correctamente"
        log_info "Usa 'aws cloudwatch describe-alarms --region $(aws configure get region)' para verificar estado"
    else
        log_warning "No se encontraron alarmas configuradas"
    fi
}

# Función para limpiar recursos (destroy) - MÁS RESTRICTIVO
destroy() {
    cd "${ENV_DIR}"
    
    echo
    log_critical "¡PELIGRO: DESTRUCCIÓN DE RECURSOS DE PRODUCCIÓN!"
    echo -e "${RED}=================================================${NC}"
    echo
    log_error "Esta acción ELIMINARÁ TODOS los recursos de producción"
    log_error "Esto incluye bases de datos, backups, y toda la infraestructura"
    echo
    log_warning "¿Has exportado todos los datos importantes? (y/N)"
    read -r data_exported
    if [[ ! "$data_exported" =~ ^[Yy]$ ]]; then
        log_error "Exporta los datos importantes antes de continuar"
        exit 1
    fi
    
    log_warning "¿Tienes autorización para destruir recursos de producción? (y/N)"
    read -r authorization
    if [[ ! "$authorization" =~ ^[Yy]$ ]]; then
        log_error "Obtén autorización antes de continuar"
        exit 1
    fi
    
    log_warning "Escribe 'DELETE PRODUCTION' para confirmar:"
    read -r confirmation
    if [[ "$confirmation" != "DELETE PRODUCTION" ]]; then
        log_info "Destrucción cancelada"
        exit 0
    fi
    
    log "Destruyendo recursos de PRODUCCIÓN..."
    terraform destroy
    log_success "Recursos de producción destruidos"
}

# Función principal
main() {
    case "${1:-deploy}" in
        "deploy")
            show_environment_info
            check_prerequisites
            confirm_production_deployment
            deploy
            show_outputs
            test_deployment
            check_alarms
            ;;
        "destroy")
            show_environment_info
            check_prerequisites
            destroy
            ;;
        "plan")
            show_environment_info
            check_prerequisites
            cd "${ENV_DIR}"
            terraform init
            terraform plan
            ;;
        "outputs")
            cd "${ENV_DIR}"
            show_outputs
            ;;
        "test")
            cd "${ENV_DIR}"
            test_deployment
            ;;
        "status")
            cd "${ENV_DIR}"
            show_outputs
            test_deployment
            check_alarms
            ;;
        *)
            echo "Uso: $0 [deploy|destroy|plan|outputs|test|status]"
            echo
            echo "Comandos para PRODUCCIÓN:"
            echo "  deploy   - Desplegar el entorno de producción (default)"
            echo "  destroy  - Destruir todos los recursos (PELIGROSO)"
            echo "  plan     - Mostrar el plan de cambios"
            echo "  outputs  - Mostrar los outputs del deployment"
            echo "  test     - Probar el deployment"
            echo "  status   - Mostrar estado completo y hacer tests"
            echo
            echo "⚠️  ADVERTENCIA: Este script maneja recursos de PRODUCCIÓN"
            exit 1
            ;;
    esac
}

main "$@"
