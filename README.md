# 🚀 TecnologiaPlus Dashboard Backend

Backend API para el sistema de gestión de contenido de TecnologiaPlus. Construido con NestJS, TypeORM y PostgreSQL.

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [🛠️ Desarrollo](#️-desarrollo)
- [🐳 Docker](#-docker)
- [🚀 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [🔧 Configuración](#-configuración)

## 🚀 Inicio Rápido

### Opción 1: Con Make (Recomendado)
```bash
# Mostrar comandos disponibles
make help

# Iniciar desarrollo con Docker
make dev

# Ver logs
make dev-logs
```

### Opción 2: Con Docker Compose
```bash
# Copiar variables de entorno
cp env.example .env

# Iniciar servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f backend
```

### Opción 3: Local (Node.js)
```bash
# Instalar dependencias
pnpm install

# Configurar base de datos PostgreSQL
# Editar .env con tus credenciales

# Ejecutar migraciones
pnpm run migration:run

# Ejecutar seeds (opcional)
pnpm run seed

# Iniciar en desarrollo
pnpm run start:dev
```

## 🛠️ Desarrollo

### Comandos Útiles
```bash
# Desarrollo
make dev                # Iniciar con Docker
make dev-logs          # Ver logs
make dev-stop          # Parar servicios
make dev-clean         # Limpiar todo

# Testing
make test              # Tests unitarios
make test-e2e          # Tests e2e
make lint              # Linter
make lint-fix          # Fix linting

# Base de datos
make migration-generate # Nueva migración
make migration-run     # Ejecutar migraciones
make seed              # Ejecutar seeds
make db-reset          # Reset completo (⚠️ destruye datos)

# Docker builds
make docker-build      # Build desarrollo
make docker-build-prod # Build producción

# Testing de producción
make prod-test         # Test build de producción
make prod-test-logs    # Ver logs de test
make prod-test-stop    # Parar test
make prod-test-clean   # Limpiar test

# Utilidades
make health            # Health check
make status            # Estado del sistema
```

### Estructura del Proyecto
```
src/
├── modules/           # Módulos de negocio
│   ├── auth/         # Autenticación y autorización
│   ├── users/        # Gestión de usuarios
│   ├── articles/     # Gestión de artículos
│   ├── categories/   # Categorías
│   └── tags/         # Tags/etiquetas
├── core/             # Funcionalidades core
│   ├── database/     # Configuración BD y migraciones
│   ├── config/       # Configuración de la app
│   ├── mail/         # Servicio de email
│   └── cloudinary/   # Servicio de imágenes
└── main.ts           # Punto de entrada
```

## 🐳 Docker

### Configuraciones Disponibles

#### Multi-stage Dockerfile
- **base**: Dependencias comunes
- **development**: Hot reload para desarrollo
- **build**: Stage de construcción
- **production**: Imagen optimizada para producción
- **testing**: Para CI/CD

#### Docker Compose Environments

##### 1. **docker-compose.yml** (Desarrollo)
- **PostgreSQL**: Puerto 5432
- **Backend**: Puerto 3001 con hot reload
- **Target**: `development`

##### 2. **docker-compose.prod-test.yml** (Testing de Producción)
- **PostgreSQL**: Puerto 5433
- **Backend**: Puerto 3002 optimizado
- **Target**: `production`

### Uso de Docker

#### Desarrollo
```bash
# Desarrollo completo
docker-compose up --build -d

# Solo base de datos
docker-compose up postgres -d
```

#### Testing de Producción
```bash
# Test completo de build de producción
make prod-test

# Comandos directos
docker-compose -f docker-compose.prod-test.yml up --build -d
docker-compose -f docker-compose.prod-test.yml logs -f backend
docker-compose -f docker-compose.prod-test.yml down
```

#### Builds Específicos
```bash
# Build específico
docker build --target production -t backend:prod .
docker build --target development -t backend:dev .
```

## 🚀 Deployment

### Ambientes Disponibles
- **Development**: `develop` branch
- **Staging**: `staging` branch  
- **Production**: `main` branch

### GitHub Actions CI/CD
El proyecto incluye workflow completo:
1. **Tests y Linting** automático
2. **Build y Push** a Docker Hub
3. **Blue/Green Deployment** sin downtime
4. **Rollback automático** en caso de fallo

### Deployment Manual
```bash
# Desarrollo (Docker scripts)
make deploy-dev-script

# Producción (solo en servidor)
make deploy-prod

# Rollback de emergencia
make rollback
make rollback-confirm
```

### Blue/Green Strategy
- **Blue**: Puerto 3001
- **Green**: Puerto 3002
- **Automático**: Switch sin downtime
- **Rollback**: Instantáneo en emergencias

## 📚 API Documentation

### Endpoints Principales
- **Swagger UI**: `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001/health`

### Módulos API
- `/auth` - Autenticación (login, register, refresh)
- `/users` - Gestión de usuarios
- `/articles` - CRUD de artículos
- `/categories` - Gestión de categorías
- `/tags` - Gestión de tags
- `/images` - Upload y gestión de imágenes

### Autenticación
```bash
# Login
POST /auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Usar token en headers
Authorization: Bearer <your-jwt-token>
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=blog_db

# Aplicación
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Configuración de Producción
Ver [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) para:
- Configuración de self-hosted runners
- Setup de load balancer/reverse proxy
- Configuración de secretos en GitHub
- Monitoreo y observabilidad
- Procedimientos de emergencia

## 🔍 Troubleshooting

### Problemas Comunes
```bash
# Contenedor no inicia
make logs-prod

# Base de datos no conecta
make status
docker exec tecnologiaplus-postgres-dev pg_isready -U postgres

# Health check falla
make health
curl -v http://localhost:3001/health

# Limpiar todo
make clean-all
```

### Reset Completo
```bash
# Parar todo
make dev-stop

# Limpiar volúmenes y containers
make dev-clean

# Iniciar desde cero
make dev
```

## 📊 Monitoreo

### Health Checks
- **Endpoint**: `/health`
- **Docker**: Health checks integrados
- **CI/CD**: Verificación automática

### Logs
```bash
# Desarrollo
make dev-logs

# Producción
make logs-prod

# Específico
docker logs tecnologiaplus-backend-dev
```

### Métricas
```bash
# Estado general
make status

# Uso de recursos
docker stats

# Espacio en disco
docker system df
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Pull Request

## 📝 Comandos de Ejemplo

```bash
# Desarrollo rápido
make dev && make dev-logs

# Testing completo
make test && make test-e2e && make lint

# Testing de producción local
make prod-test && make prod-test-logs

# Deploy completo
make docker-build-prod && make deploy-prod

# Rollback de emergencia
make rollback && make rollback-confirm

# Limpieza
make dev-clean && make prod-test-clean && make clean-all
```

## 📞 Soporte

- **Documentación completa**: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- **Issues**: GitHub Issues
- **Email**: dev@tecnologiaplus.com

---

**Tecnología Plus** - Soluciones tecnológicas innovadoras