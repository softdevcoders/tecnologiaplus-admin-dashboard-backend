#!/bin/bash

#########################################
#   ROLLBACK SCRIPT
#   Emergency rollback for production
#########################################

set -e

# Configuración
PROJECT_NAME="tecnologiaplus"
BACKEND_CONTAINER_NAME="${PROJECT_NAME}-backend"

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

# Verificar estado actual
check_current_state() {
    log "🔍 Verificando estado actual de los contenedores..."
    
    # Buscar contenedores blue/green
    BLUE_CONTAINER="${BACKEND_CONTAINER_NAME}-blue"
    GREEN_CONTAINER="${BACKEND_CONTAINER_NAME}-green"
    
    BLUE_RUNNING=$(docker ps --filter "name=${BLUE_CONTAINER}" --format "{{.Names}}" 2>/dev/null || echo "")
    GREEN_RUNNING=$(docker ps --filter "name=${GREEN_CONTAINER}" --format "{{.Names}}" 2>/dev/null || echo "")
    
    BLUE_EXISTS=$(docker ps -a --filter "name=${BLUE_CONTAINER}" --format "{{.Names}}" 2>/dev/null || echo "")
    GREEN_EXISTS=$(docker ps -a --filter "name=${GREEN_CONTAINER}" --format "{{.Names}}" 2>/dev/null || echo "")
    
    echo "📊 Estado actual:"
    echo "  🔵 Blue container: ${BLUE_EXISTS:-"No existe"} ${BLUE_RUNNING:+"(Corriendo)"}"
    echo "  🟢 Green container: ${GREEN_EXISTS:-"No existe"} ${GREEN_RUNNING:+"(Corriendo)"}"
    
    # Determinar contenedor activo y el anterior
    if [ -n "$BLUE_RUNNING" ] && [ -z "$GREEN_RUNNING" ]; then
        CURRENT_CONTAINER=$BLUE_CONTAINER
        PREVIOUS_CONTAINER=$GREEN_CONTAINER
        CURRENT_COLOR="blue"
        PREVIOUS_COLOR="green"
        CURRENT_PORT=3001
        PREVIOUS_PORT=3002
    elif [ -n "$GREEN_RUNNING" ] && [ -z "$BLUE_RUNNING" ]; then
        CURRENT_CONTAINER=$GREEN_CONTAINER
        PREVIOUS_CONTAINER=$BLUE_CONTAINER
        CURRENT_COLOR="green"
        PREVIOUS_COLOR="blue"
        CURRENT_PORT=3002
        PREVIOUS_PORT=3001
    elif [ -n "$BLUE_RUNNING" ] && [ -n "$GREEN_RUNNING" ]; then
        warn "⚠️ Ambos contenedores están corriendo. Esto sugiere un deployment en progreso."
        echo "¿Cuál quieres mantener? (blue/green):"
        echo "1) Blue (puerto 3001)"
        echo "2) Green (puerto 3002)"
        read -p "Selecciona (1/2): " choice
        
        case $choice in
            1)
                CURRENT_CONTAINER=$BLUE_CONTAINER
                PREVIOUS_CONTAINER=$GREEN_CONTAINER
                CURRENT_COLOR="blue"
                PREVIOUS_COLOR="green"
                CURRENT_PORT=3001
                PREVIOUS_PORT=3002
                ;;
            2)
                CURRENT_CONTAINER=$GREEN_CONTAINER
                PREVIOUS_CONTAINER=$BLUE_CONTAINER
                CURRENT_COLOR="green"
                PREVIOUS_COLOR="blue"
                CURRENT_PORT=3002
                PREVIOUS_PORT=3001
                ;;
            *)
                error "Selección inválida"
                exit 1
                ;;
        esac
    else
        error "❌ No se encontraron contenedores en ejecución"
        log "Contenedores disponibles para iniciar:"
        if [ -n "$BLUE_EXISTS" ]; then
            echo "  🔵 $BLUE_CONTAINER (detenido)"
        fi
        if [ -n "$GREEN_EXISTS" ]; then
            echo "  🟢 $GREEN_CONTAINER (detenido)"
        fi
        
        if [ -z "$BLUE_EXISTS" ] && [ -z "$GREEN_EXISTS" ]; then
            error "No hay contenedores de backup disponibles para rollback"
            exit 1
        fi
        
        ask_which_to_start
        return
    fi
    
    log "📍 Estado detectado:"
    log "  Activo: $CURRENT_COLOR ($CURRENT_CONTAINER) en puerto $CURRENT_PORT"
    log "  Anterior: $PREVIOUS_COLOR ($PREVIOUS_CONTAINER)"
}

# Preguntar cuál contenedor iniciar cuando ambos están detenidos
ask_which_to_start() {
    echo "¿Qué contenedor quieres iniciar?"
    if [ -n "$BLUE_EXISTS" ]; then
        echo "1) Blue container"
    fi
    if [ -n "$GREEN_EXISTS" ]; then
        echo "2) Green container"
    fi
    
    read -p "Selecciona (1/2): " choice
    
    case $choice in
        1)
            if [ -n "$BLUE_EXISTS" ]; then
                CONTAINER_TO_START=$BLUE_CONTAINER
                COLOR_TO_START="blue"
                PORT_TO_START=3001
            else
                error "Blue container no existe"
                exit 1
            fi
            ;;
        2)
            if [ -n "$GREEN_EXISTS" ]; then
                CONTAINER_TO_START=$GREEN_CONTAINER
                COLOR_TO_START="green"
                PORT_TO_START=3002
            else
                error "Green container no existe"
                exit 1
            fi
            ;;
        *)
            error "Selección inválida"
            exit 1
            ;;
    esac
    
    start_stopped_container
}

# Iniciar un contenedor detenido
start_stopped_container() {
    log "🚀 Iniciando $COLOR_TO_START container..."
    
    docker start $CONTAINER_TO_START
    
    # Health check
    log "🏥 Verificando salud del contenedor..."
    for i in {1..20}; do
        if docker exec $CONTAINER_TO_START curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log "✅ Contenedor $COLOR_TO_START está saludable!"
            log "🌐 Servicio disponible en puerto $PORT_TO_START"
            
            warn "📝 ACCIÓN MANUAL REQUERIDA:"
            warn "   Actualiza tu load balancer/proxy para apuntar al puerto $PORT_TO_START"
            
            return 0
        fi
        echo "Intento $i/20: Servicio no está listo aún..."
        sleep 5
    done
    
    error "❌ Health check falló"
    return 1
}

# Rollback rápido (intercambiar blue/green)
quick_rollback() {
    log "🔄 Iniciando rollback rápido..."
    
    # Verificar que el contenedor anterior existe
    if ! docker ps -a --filter "name=${PREVIOUS_CONTAINER}" --format "{{.Names}}" | grep -q "$PREVIOUS_CONTAINER"; then
        error "❌ Contenedor anterior ($PREVIOUS_CONTAINER) no encontrado"
        log "No es posible hacer rollback automático"
        exit 1
    fi
    
    # Iniciar el contenedor anterior
    log "🚀 Iniciando contenedor anterior: $PREVIOUS_COLOR"
    docker start $PREVIOUS_CONTAINER >/dev/null 2>&1 || {
        error "❌ No se pudo iniciar el contenedor anterior"
        exit 1
    }
    
    # Health check del contenedor anterior
    log "🏥 Verificando salud del contenedor anterior..."
    for i in {1..20}; do
        if docker exec $PREVIOUS_CONTAINER curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log "✅ Contenedor anterior está saludable!"
            break
        fi
        echo "Intento $i/20: Servicio no está listo aún..."
        sleep 5
    done
    
    if ! docker exec $PREVIOUS_CONTAINER curl -f http://localhost:3001/health >/dev/null 2>&1; then
        error "❌ El contenedor anterior no está saludable"
        error "Cancelando rollback..."
        docker stop $PREVIOUS_CONTAINER >/dev/null 2>&1 || true
        exit 1
    fi
    
    # Mostrar información para switch manual
    warn "📝 ROLLBACK LISTO - ACCIÓN MANUAL REQUERIDA:"
    warn "   1. Actualiza tu load balancer/proxy para apuntar al puerto $PREVIOUS_PORT"
    warn "   2. Verifica que el servicio funciona correctamente"
    warn "   3. Una vez confirmado, ejecuta: $0 confirm-rollback"
    
    log "📊 Estado después del rollback:"
    log "  🔄 Nuevo activo: $PREVIOUS_COLOR ($PREVIOUS_CONTAINER) en puerto $PREVIOUS_PORT"
    log "  ⏸️  Anterior: $CURRENT_COLOR ($CURRENT_CONTAINER) en puerto $CURRENT_PORT (aún corriendo)"
}

# Confirmar rollback (limpiar el contenedor anterior)
confirm_rollback() {
    check_current_state
    
    log "🔄 Confirmando rollback..."
    
    if [ -n "$BLUE_RUNNING" ] && [ -n "$GREEN_RUNNING" ]; then
        read -p "¿Estás seguro de que quieres parar el contenedor en $CURRENT_COLOR? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "🛑 Parando contenedor anterior: $CURRENT_CONTAINER"
            docker stop $CURRENT_CONTAINER
            log "✅ Rollback confirmado y completado"
        else
            log "❌ Rollback cancelado"
        fi
    else
        warn "⚠️ No hay contenedores duales corriendo. No hay nada que confirmar."
    fi
}

# Listar rollbacks disponibles
list_available() {
    log "📋 Contenedores disponibles para rollback:"
    
    echo ""
    echo "🔵 Blue containers:"
    docker images --filter "reference=*tecnologiaplus-backend*" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep -E "(blue|Blue)" || echo "  Ninguno encontrado"
    
    echo ""
    echo "🟢 Green containers:"
    docker images --filter "reference=*tecnologiaplus-backend*" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep -E "(green|Green)" || echo "  Ninguno encontrado"
    
    echo ""
    echo "📦 Todas las imágenes del backend:"
    docker images --filter "reference=*tecnologiaplus-backend*" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
}

# Rollback a una imagen específica
rollback_to_image() {
    local image=$1
    
    if [ -z "$image" ]; then
        error "❌ Debes especificar una imagen"
        echo "Uso: $0 rollback-to-image IMAGE:TAG"
        exit 1
    fi
    
    # Verificar que la imagen existe
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
        error "❌ Imagen no encontrada: $image"
        log "Imágenes disponibles:"
        docker images --filter "reference=*tecnologiaplus-backend*" --format "{{.Repository}}:{{.Tag}}"
        exit 1
    fi
    
    log "🔄 Haciendo rollback a imagen: $image"
    
    # Ejecutar el script de deployment con la imagen específica
    if [ -f "./scripts/deploy-production.sh" ]; then
        warn "📝 Ejecutando deployment con imagen específica..."
        ./scripts/deploy-production.sh "$image"
    else
        error "❌ Script de deployment no encontrado"
        error "Ejecuta manualmente: docker run ... $image"
        exit 1
    fi
}

# Función principal
main() {
    local action=${1:-"quick"}
    
    case $action in
        "quick"|"")
            check_current_state
            if [ -n "${CURRENT_CONTAINER:-}" ]; then
                quick_rollback
            fi
            ;;
            
        "confirm"|"confirm-rollback")
            confirm_rollback
            ;;
            
        "list"|"available")
            list_available
            ;;
            
        "rollback-to-image")
            rollback_to_image "$2"
            ;;
            
        "status")
            check_current_state
            ;;
            
        *)
            usage
            exit 1
            ;;
    esac
}

# Función de ayuda
usage() {
    echo "Uso: $0 [ACCIÓN] [PARÁMETROS]"
    echo ""
    echo "Acciones disponibles:"
    echo "  quick                     - Rollback rápido al contenedor anterior (por defecto)"
    echo "  confirm                   - Confirmar rollback (parar contenedor actual)"
    echo "  status                    - Ver estado actual de contenedores"
    echo "  list                      - Listar imágenes disponibles para rollback"
    echo "  rollback-to-image IMAGE   - Rollback a una imagen específica"
    echo ""
    echo "Ejemplos:"
    echo "  $0                                          # Rollback rápido"
    echo "  $0 quick                                    # Rollback rápido"
    echo "  $0 confirm                                  # Confirmar rollback"
    echo "  $0 status                                   # Ver estado"
    echo "  $0 list                                     # Ver imágenes disponibles"
    echo "  $0 rollback-to-image myimage:v1.0.0        # Rollback a imagen específica"
    echo ""
    echo "Flujo típico de emergencia:"
    echo "  1. $0 quick              # Inicia rollback"
    echo "  2. Verificar en navegador"
    echo "  3. $0 confirm            # Confirmar si todo está bien"
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
