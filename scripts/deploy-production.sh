#!/bin/bash

#########################################
#   PRODUCTION DEPLOYMENT SCRIPT
#   Blue/Green Strategy with Docker
#########################################

set -e

# Configuración
PROJECT_NAME="tecnologiaplus"
IMAGE_NAME="tecnologiaplus-backend"
NETWORK_NAME="${PROJECT_NAME}-network"
DB_CONTAINER_NAME="${PROJECT_NAME}-postgres"
BACKEND_CONTAINER_NAME="${PROJECT_NAME}-backend"

# Puertos
BLUE_PORT=3001
GREEN_PORT=3002
DB_PORT=5432

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Funciones utilitarias
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que Docker esté corriendo
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker no está corriendo. Por favor inicia Docker primero."
        exit 1
    fi
    log "✅ Docker está corriendo"
}

# Crear red si no existe
create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        log "🌐 Creando red Docker: $NETWORK_NAME"
        docker network create $NETWORK_NAME
    else
        log "🌐 Red Docker ya existe: $NETWORK_NAME"
    fi
}

# Verificar variables de entorno requeridas
check_env_vars() {
    local required_vars=(
        "DB_USERNAME"
        "DB_PASSWORD"
        "DB_NAME"
        "JWT_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Variable de entorno requerida no encontrada: $var"
            exit 1
        fi
    done
    log "✅ Variables de entorno verificadas"
}

# Deploy PostgreSQL
deploy_database() {
    if docker ps | grep -q $DB_CONTAINER_NAME; then
        log "🗄️ Base de datos ya está corriendo: $DB_CONTAINER_NAME"
        return
    fi
    
    log "🗄️ Desplegando PostgreSQL..."
    
    # Crear volumen para datos persistentes
    docker volume create ${PROJECT_NAME}-postgres-data || true
    
    docker run -d \
        --name $DB_CONTAINER_NAME \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $DB_PORT:5432 \
        -e POSTGRES_DB=${DB_NAME} \
        -e POSTGRES_USER=${DB_USERNAME} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD} \
        -v ${PROJECT_NAME}-postgres-data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # Esperar a que la base de datos esté lista
    log "⏳ Esperando a que PostgreSQL esté listo..."
    for i in {1..30}; do
        if docker exec $DB_CONTAINER_NAME pg_isready -U ${DB_USERNAME} -d ${DB_NAME} >/dev/null 2>&1; then
            log "✅ PostgreSQL está listo!"
            break
        fi
        echo "Intento $i/30: PostgreSQL no está listo aún..."
        sleep 5
    done
}

# Determinar el color actual y nuevo
determine_colors() {
    if docker ps | grep -q "${BACKEND_CONTAINER_NAME}-blue"; then
        CURRENT_COLOR="blue"
        NEW_COLOR="green"
        CURRENT_CONTAINER="${BACKEND_CONTAINER_NAME}-blue"
        NEW_CONTAINER="${BACKEND_CONTAINER_NAME}-green"
        NEW_PORT=$GREEN_PORT
    else
        CURRENT_COLOR="green"
        NEW_COLOR="blue"
        CURRENT_CONTAINER="${BACKEND_CONTAINER_NAME}-green"
        NEW_CONTAINER="${BACKEND_CONTAINER_NAME}-blue"
        NEW_PORT=$BLUE_PORT
    fi
    
    log "🔵🟢 Deployment Strategy: $CURRENT_COLOR -> $NEW_COLOR"
}

# Las migraciones ahora se ejecutan automáticamente al iniciar el contenedor

# Deploy del backend
deploy_backend() {
    local image=$1
    
    log "🚀 Desplegando backend: $NEW_COLOR ($NEW_CONTAINER)"
    
    # Parar y remover contenedor anterior del mismo color si existe
    if docker ps -a | grep -q $NEW_CONTAINER; then
        log "🛑 Removiendo contenedor existente: $NEW_CONTAINER"
        docker stop $NEW_CONTAINER >/dev/null 2>&1 || true
        docker rm $NEW_CONTAINER >/dev/null 2>&1 || true
    fi
    
    # Ejecutar nuevo contenedor con migraciones automáticas
    docker run -d \
        --name $NEW_CONTAINER \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $NEW_PORT:3000 \
        -e NODE_ENV=production \
        -e PORT=3000 \
        -e DB_HOST=$DB_CONTAINER_NAME \
        -e DB_PORT=5432 \
        -e DB_USERNAME=${DB_USERNAME} \
        -e DB_PASSWORD=${DB_PASSWORD} \
        -e DB_NAME=${DB_NAME} \
        -e JWT_SECRET=${JWT_SECRET} \
        -e CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME} \
        -e CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY} \
        -e CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET} \
        -e MAIL_HOST=${MAIL_HOST:-smtp.gmail.com} \
        -e MAIL_PORT=${MAIL_PORT:-587} \
        -e MAIL_USER=${MAIL_USER} \
        -e MAIL_PASS=${MAIL_PASS} \
        -e MAIL_FROM=${MAIL_FROM} \
        -e FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000} \
        $image \
        sh -c "
            echo '🔗 Waiting for PostgreSQL...' &&
            while ! nc -z $DB_CONTAINER_NAME 5432; do sleep 1; done &&
            echo '✅ PostgreSQL is ready!' &&
            echo '🔄 Running migrations...' &&
            pnpm run migration:run:prod &&
            echo '🌱 Running seeds...' &&
            pnpm run seed:prod &&
            echo '🚀 Starting production application...' &&
            pnpm run start:prod
        "
    
    log "✅ Contenedor $NEW_CONTAINER iniciado en puerto $NEW_PORT"
}

# Health check
health_check() {
    log "🏥 Verificando salud del nuevo contenedor..."
    
    for i in {1..30}; do
        if docker exec $NEW_CONTAINER curl -f http://localhost:3000/health >/dev/null 2>&1; then
            log "✅ Health check exitoso!"
            return 0
        fi
        echo "Intento $i/30: Servicio no está listo aún..."
        sleep 10
    done
    
    error "❌ Health check falló después de 5 minutos"
    return 1
}

# Switch traffic (Blue/Green)
switch_traffic() {
    log "🔄 Cambiando tráfico al nuevo contenedor..."
    
    # Aquí actualizarías la configuración del load balancer/proxy
    # Por simplicidad, solo mostramos el mensaje
    warn "📝 ACCIÓN MANUAL REQUERIDA:"
    warn "   Actualiza tu load balancer/proxy para apuntar al puerto $NEW_PORT"
    warn "   O modifica las reglas de firewall para redirigir el tráfico"
    
    read -p "¿Has actualizado la configuración del proxy? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warn "⚠️ Deployment pausado. El contenedor anterior sigue activo."
        return 1
    fi
    
    return 0
}

# Cleanup del contenedor anterior
cleanup_old_container() {
    if docker ps | grep -q "$CURRENT_CONTAINER"; then
        log "🧹 Removiendo contenedor anterior: $CURRENT_CONTAINER"
        docker stop $CURRENT_CONTAINER
        docker rm $CURRENT_CONTAINER
        log "✅ Contenedor anterior removido"
    fi
}

# Cleanup de imágenes no utilizadas
cleanup_images() {
    log "🧹 Limpiando imágenes no utilizadas..."
    docker image prune -f >/dev/null 2>&1 || true
    log "✅ Cleanup completado"
}

# Función principal
main() {
    local image=${1:-"${IMAGE_NAME}:latest"}
    
    log "🚀 Iniciando deployment de producción..."
    log "📦 Imagen: $image"
    
    # Verificaciones previas
    check_docker
    check_env_vars
    
    # Setup inicial
    create_network
    deploy_database
    
    # Preparar deployment
    determine_colors
    
    # Deploy del backend (incluye migraciones automáticas)
    deploy_backend $image
    
    # Verificar salud
    if ! health_check; then
        error "❌ Deployment falló en health check"
        log "🔄 Removiendo contenedor fallido..."
        docker stop $NEW_CONTAINER >/dev/null 2>&1 || true
        docker rm $NEW_CONTAINER >/dev/null 2>&1 || true
        exit 1
    fi
    
    # Switch de tráfico
    if switch_traffic; then
        cleanup_old_container
        log "🎉 ¡Deployment completado exitosamente!"
        log "🌐 Servicio corriendo en puerto $NEW_PORT"
    else
        warn "⚠️ Deployment completado pero el tráfico no fue cambiado"
        warn "   Contenedor anterior: $CURRENT_CONTAINER (activo)"
        warn "   Contenedor nuevo: $NEW_CONTAINER (listo para switch)"
    fi
    
    cleanup_images
    
    log "📊 Estado final:"
    docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Función de ayuda
usage() {
    echo "Uso: $0 [IMAGE_NAME:TAG]"
    echo ""
    echo "Ejemplos:"
    echo "  $0                                    # Usa imagen por defecto"
    echo "  $0 myregistry/backend:v1.2.3         # Usa imagen específica"
    echo ""
    echo "Variables de entorno requeridas:"
    echo "  DB_USERNAME, DB_PASSWORD, DB_NAME"
    echo "  JWT_SECRET"
    echo "  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    echo ""
    echo "Variables opcionales:"
    echo "  MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM"
    echo "  FRONTEND_URL"
}

# Manejar argumentos
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
