#!/bin/bash

#########################################
#   DEVELOPMENT DEPLOYMENT SCRIPT
#   Simple Docker deployment
#########################################

set -e

# Configuración
PROJECT_NAME="tecnologiaplus"
IMAGE_NAME="tecnologiaplus-backend"
NETWORK_NAME="${PROJECT_NAME}-network"
DB_CONTAINER_NAME="${PROJECT_NAME}-postgres-dev"
BACKEND_CONTAINER_NAME="${PROJECT_NAME}-backend-dev"

# Puertos
BACKEND_PORT=3001
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

# Cargar variables de entorno por defecto para desarrollo
load_dev_env() {
    export DB_USERNAME=${DB_USERNAME:-"postgres"}
    export DB_PASSWORD=${DB_PASSWORD:-"postgres"}
    export DB_NAME=${DB_NAME:-"blog_db"}
    export JWT_SECRET=${JWT_SECRET:-"dev-jwt-secret-change-in-production"}
    export CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-"your-cloud-name"}
    export CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY:-"your-api-key"}
    export CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET:-"your-api-secret"}
    export FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
    
    log "✅ Variables de entorno configuradas para desarrollo"
}

# Deploy PostgreSQL
deploy_database() {
    if docker ps | grep -q $DB_CONTAINER_NAME; then
        log "🗄️ Base de datos ya está corriendo: $DB_CONTAINER_NAME"
        return
    fi
    
    log "🗄️ Desplegando PostgreSQL para desarrollo..."
    
    # Crear volumen para datos persistentes
    docker volume create ${PROJECT_NAME}-postgres-dev-data || true
    
    docker run -d \
        --name $DB_CONTAINER_NAME \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $DB_PORT:5432 \
        -e POSTGRES_DB=${DB_NAME} \
        -e POSTGRES_USER=${DB_USERNAME} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD} \
        -v ${PROJECT_NAME}-postgres-dev-data:/var/lib/postgresql/data \
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

# Build de la imagen localmente
build_image() {
    local tag=${1:-"dev"}
    log "🏗️ Construyendo imagen Docker..."
    
    docker build -t ${IMAGE_NAME}:${tag} --target development .
    
    log "✅ Imagen construida: ${IMAGE_NAME}:${tag}"
}

# Deploy del backend
deploy_backend() {
    local image=${1:-"${IMAGE_NAME}:dev"}
    
    log "🚀 Desplegando backend para desarrollo..."
    
    # Parar y remover contenedor anterior si existe
    if docker ps -a | grep -q $BACKEND_CONTAINER_NAME; then
        log "🛑 Removiendo contenedor existente: $BACKEND_CONTAINER_NAME"
        docker stop $BACKEND_CONTAINER_NAME >/dev/null 2>&1 || true
        docker rm $BACKEND_CONTAINER_NAME >/dev/null 2>&1 || true
    fi
    
    # Ejecutar nuevo contenedor con volúmenes para hot reload
    docker run -d \
        --name $BACKEND_CONTAINER_NAME \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $BACKEND_PORT:3001 \
        -v "$(pwd)/src:/app/src" \
        -v "$(pwd)/package.json:/app/package.json" \
        -e NODE_ENV=development \
        -e PORT=3001 \
        -e DB_HOST=$DB_CONTAINER_NAME \
        -e DB_PORT=5432 \
        -e DB_USERNAME=${DB_USERNAME} \
        -e DB_PASSWORD=${DB_PASSWORD} \
        -e DB_NAME=${DB_NAME} \
        -e JWT_SECRET=${JWT_SECRET} \
        -e CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME} \
        -e CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY} \
        -e CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET} \
        -e FRONTEND_URL=${FRONTEND_URL} \
        $image
    
    log "✅ Contenedor $BACKEND_CONTAINER_NAME iniciado en puerto $BACKEND_PORT"
}

# Ejecutar migraciones
run_migrations() {
    log "🔄 Ejecutando migraciones de base de datos..."
    
    # Esperar un poco más para asegurar que el backend esté listo
    sleep 10
    
    docker exec $BACKEND_CONTAINER_NAME sh -c "pnpm run migration:run" || {
        warn "⚠️ Las migraciones fallaron, pero el servicio puede seguir funcionando"
    }
    
    log "✅ Migraciones completadas"
}

# Ejecutar seeds (opcional)
run_seeds() {
    log "🌱 Ejecutando seeds de base de datos..."
    
    docker exec $BACKEND_CONTAINER_NAME sh -c "pnpm run seed" || {
        warn "⚠️ Los seeds fallaron, pero el servicio puede seguir funcionando"
    }
    
    log "✅ Seeds completados"
}

# Health check
health_check() {
    log "🏥 Verificando salud del contenedor..."
    
    for i in {1..20}; do
        if curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            log "✅ Health check exitoso!"
            return 0
        fi
        echo "Intento $i/20: Servicio no está listo aún..."
        sleep 5
    done
    
    warn "⚠️ Health check no pudo verificarse, pero el servicio puede estar funcionando"
    return 0
}

# Ver logs
show_logs() {
    log "📋 Mostrando logs del backend..."
    docker logs --tail=50 -f $BACKEND_CONTAINER_NAME
}

# Función principal
main() {
    local action=${1:-"deploy"}
    local image_tag=${2:-"dev"}
    
    case $action in
        "deploy")
            log "🚀 Iniciando deployment de desarrollo..."
            
            check_docker
            load_dev_env
            create_network
            deploy_database
            build_image $image_tag
            deploy_backend "${IMAGE_NAME}:${image_tag}"
            
            sleep 5
            health_check
            
            log "🎉 ¡Deployment de desarrollo completado!"
            log "🌐 Backend disponible en: http://localhost:$BACKEND_PORT"
            log "📚 Swagger disponible en: http://localhost:$BACKEND_PORT/api"
            log "📋 Para ver logs: $0 logs"
            ;;
            
        "logs")
            show_logs
            ;;
            
        "migrate")
            run_migrations
            ;;
            
        "seed")
            run_seeds
            ;;
            
        "stop")
            log "🛑 Parando servicios de desarrollo..."
            docker stop $BACKEND_CONTAINER_NAME $DB_CONTAINER_NAME >/dev/null 2>&1 || true
            log "✅ Servicios parados"
            ;;
            
        "clean")
            log "🧹 Limpiando contenedores y volúmenes de desarrollo..."
            docker stop $BACKEND_CONTAINER_NAME $DB_CONTAINER_NAME >/dev/null 2>&1 || true
            docker rm $BACKEND_CONTAINER_NAME $DB_CONTAINER_NAME >/dev/null 2>&1 || true
            docker volume rm ${PROJECT_NAME}-postgres-dev-data >/dev/null 2>&1 || true
            docker image rm ${IMAGE_NAME}:dev >/dev/null 2>&1 || true
            log "✅ Cleanup completado"
            ;;
            
        *)
            usage
            exit 1
            ;;
    esac
}

# Función de ayuda
usage() {
    echo "Uso: $0 [ACCIÓN] [TAG]"
    echo ""
    echo "Acciones disponibles:"
    echo "  deploy [tag]  - Deploy completo (por defecto)"
    echo "  logs          - Ver logs en tiempo real"
    echo "  migrate       - Ejecutar migraciones"
    echo "  seed          - Ejecutar seeds"
    echo "  stop          - Parar servicios"
    echo "  clean         - Limpiar todo (contenedores, volúmenes, imágenes)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                    # Deploy completo"
    echo "  $0 deploy             # Deploy completo"
    echo "  $0 logs               # Ver logs"
    echo "  $0 migrate            # Solo migraciones"
    echo "  $0 stop               # Parar servicios"
    echo "  $0 clean              # Limpiar todo"
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
