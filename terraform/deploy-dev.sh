#!/bin/bash

# =============================================================================
# Finance Tracker Serverless - Deployment Script para Desarrollo
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
ENVIRONMENT="dev"
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

# Función para verificar prerrequisitos
check_prerequisites() {
    log "Verificando prerrequisitos..."
    
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
    
    # Verificar archivo terraform.tfvars
    if [ ! -f "${ENV_DIR}/terraform.tfvars" ]; then
        log_error "No se encontró el archivo terraform.tfvars en ${ENV_DIR}/"
        log_info "Copia terraform.tfvars.example como terraform.tfvars y configúralo"
        exit 1
    fi
    
    log_success "Todos los prerrequisitos están configurados"
}

# Función para mostrar información del entorno
show_environment_info() {
    echo
    echo -e "${PURPLE}🚀 Finance Tracker - Deployment de Desarrollo${NC}"
    echo -e "${PURPLE}================================================${NC}"
    echo
    log_info "Entorno: ${ENVIRONMENT}"
    log_info "Directorio: ${ENV_DIR}"
    log_info "Usuario AWS: $(aws sts get-caller-identity --query 'Arn' --output text)"
    log_info "Región: $(aws configure get region)"
    echo
}

# Función para deployment
deploy() {
    log "Iniciando deployment para entorno ${ENVIRONMENT}..."
    
    cd "${ENV_DIR}"
    
    # Terraform init
    log "Inicializando Terraform..."
    terraform init
    
    # Terraform plan
    log "Generando plan de Terraform..."
    terraform plan -out=tfplan
    
    # Confirmar deployment
    echo
    log_warning "¿Continuar con el deployment? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelado"
        rm -f tfplan
        exit 0
    fi
    
    # Terraform apply
    log "Aplicando cambios..."
    terraform apply tfplan
    
    # Limpiar plan file
    rm -f tfplan
    
    log_success "¡Deployment completado exitosamente!"
}

# Función para mostrar outputs
show_outputs() {
    cd "${ENV_DIR}"
    
    echo
    echo -e "${GREEN}📋 Información del Deployment${NC}"
    echo -e "${GREEN}==============================${NC}"
    
    # Health Check URL
    HEALTH_URL=$(terraform output -raw health_check_url 2>/dev/null || echo "No disponible")
    echo
    log_info "Health Check URL: ${HEALTH_URL}"
    
    # API Gateway URL
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "No disponible")
    log_info "API Gateway URL: ${API_URL}"
    
    # Mostrar summary si está disponible
    if terraform output dev_deployment_summary &>/dev/null; then
        echo
        terraform output -raw dev_deployment_summary
    fi
    
    echo
    log_info "Para ver todos los outputs: terraform output"
    log_info "Para logs de Lambda: terraform output -json useful_commands | jq -r '.view_lambda_logs.health'"
}

# Función para test básico
test_deployment() {
    cd "${ENV_DIR}"
    
    HEALTH_URL=$(terraform output -raw health_check_url 2>/dev/null)
    
    if [ -n "$HEALTH_URL" ]; then
        echo
        log "Probando el deployment..."
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_success "✅ Health check pasó correctamente"
            echo
            log_info "Respuesta del health check:"
            curl -s "$HEALTH_URL" | jq . 2>/dev/null || curl -s "$HEALTH_URL"
        else
            log_warning "⚠️  Health check falló. El deployment puede necesitar unos minutos para estar listo."
        fi
    fi
}

# Función para limpiar recursos (destroy)
destroy() {
    cd "${ENV_DIR}"
    
    echo
    log_warning "¿Estás seguro que quieres DESTRUIR todos los recursos del entorno ${ENVIRONMENT}? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Destrucción cancelada"
        exit 0
    fi
    
    log "Destruyendo recursos..."
    terraform destroy -auto-approve
    log_success "Recursos destruidos exitosamente"
}

# Función principal
main() {
    case "${1:-deploy}" in
        "deploy")
            show_environment_info
            check_prerequisites
            deploy
            show_outputs
            test_deployment
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
        *)
            echo "Uso: $0 [deploy|destroy|plan|outputs|test]"
            echo
            echo "Comandos:"
            echo "  deploy   - Desplegar el entorno de desarrollo (default)"
            echo "  destroy  - Destruir todos los recursos"
            echo "  plan     - Mostrar el plan de cambios"
            echo "  outputs  - Mostrar los outputs del deployment"
            echo "  test     - Probar el deployment"
            exit 1
            ;;
    esac
}

main "$@"
