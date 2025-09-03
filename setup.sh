#!/bin/bash

###################################################################################
#                                                                                 #
#    🚀 SETUP SCRIPT - TECNOLOGIA PLUS BACKEND                                   #
#    Quick setup for development environment                                     #
#                                                                                 #
###################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Funciones utilitarias
log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Banner
echo -e "${BLUE}"
echo "==================================================================================="
echo "                    🚀 TECNOLOGIA PLUS BACKEND SETUP"
echo "                     Quick development environment setup"
echo "==================================================================================="
echo -e "${NC}"

# Verificar Docker
log "🐳 Verificando Docker..."
if ! docker info >/dev/null 2>&1; then
    error "Docker no está corriendo. Por favor inicia Docker primero."
    exit 1
fi
log "✅ Docker está corriendo"

# Verificar Docker Compose
if ! docker-compose --version >/dev/null 2>&1; then
    error "Docker Compose no está instalado."
    exit 1
fi
log "✅ Docker Compose disponible"

# Configurar variables de entorno
log "📝 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp env.example .env
    log "✅ Archivo .env creado desde env.example"
    warn "📝 IMPORTANTE: Edita el archivo .env con tus configuraciones reales"
    warn "   Especialmente: JWT_SECRET, CLOUDINARY_* credentials"
else
    log "✅ Archivo .env ya existe"
fi

# Verificar pnpm (opcional)
if command -v pnpm >/dev/null 2>&1; then
    log "✅ pnpm disponible"
else
    warn "⚠️ pnpm no encontrado. Se usará npm/yarn en el contenedor"
fi

# Mostrar configuración
log "📋 Configuración detectada:"
echo "   - Docker: ✅ Disponible"
echo "   - Docker Compose: ✅ Disponible"
echo "   - Variables de entorno: ✅ Configuradas"

# Preguntar si iniciar servicios
echo ""
read -p "¿Quieres iniciar los servicios de desarrollo ahora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🚀 Iniciando servicios de desarrollo..."
    
    # Iniciar servicios
    docker-compose up --build -d
    
    # Esperar a que estén listos
    log "⏳ Esperando a que los servicios estén listos..."
    sleep 30
    
    # Verificar estado
    if docker-compose ps | grep -q "Up"; then
        log "🎉 ¡Servicios iniciados correctamente!"
        echo ""
        echo "🌐 Servicios disponibles:"
        echo "   - Backend API: http://localhost:3001"
        echo "   - Swagger Docs: http://localhost:3001/api"
        echo "   - PostgreSQL: localhost:5432"
        echo ""
        echo "📋 Comandos útiles:"
        echo "   make dev-logs    # Ver logs en tiempo real"
        echo "   make dev-stop    # Parar servicios"
        echo "   make health      # Verificar salud"
        echo "   make help        # Ver todos los comandos"
    else
        warn "⚠️ Algunos servicios pueden no estar funcionando correctamente"
        echo "Verifica con: docker-compose ps"
    fi
else
    log "👍 Setup completado. Para iniciar servicios después:"
    echo "   make dev         # o docker-compose up --build -d"
fi

echo ""
log "🎯 Siguiente pasos recomendados:"
echo "   1. Editar .env con tus configuraciones reales"
echo "   2. Verificar que los servicios funcionan: make health"
echo "   3. Ver la documentación: http://localhost:3001/api"
echo "   4. Revisar README.md para más información"

echo ""
log "✅ Setup completado exitosamente!"
