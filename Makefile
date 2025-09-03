###################################################################################
#                                                                                 #
#    🛠️ MAKEFILE - TECNOLOGIA PLUS BACKEND                                       #
#    Quick commands for development and deployment                                #
#                                                                                 #
###################################################################################

.PHONY: help dev dev-logs dev-stop dev-clean build test lint docker-build docker-run deploy-prod deploy-staging rollback

#==================================================================================
#  HELP - Show available commands
#==================================================================================
help: ## 📋 Show this help message
	@echo "🛠️  TecnologiaPlus Backend - Available Commands"
	@echo "================================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

#==================================================================================
#  DEVELOPMENT
#==================================================================================
dev: ## 🚀 Start development environment with docker-compose
	cp env.example .env 2>/dev/null || true
	docker-compose up --build -d
	@echo "✅ Development environment started!"
	@echo "🌐 Backend: http://localhost:3001"
	@echo "📚 Swagger: http://localhost:3001/api"

dev-logs: ## 📋 Show development logs
	docker-compose logs -f backend

dev-stop: ## 🛑 Stop development environment
	docker-compose down

dev-clean: ## 🧹 Clean development environment (removes volumes)
	docker-compose down -v
	docker system prune -f

#==================================================================================
#  LOCAL COMMANDS
#==================================================================================
install: ## 📦 Install dependencies
	pnpm install

build: ## 🏗️ Build the application
	pnpm run build

test: ## 🧪 Run tests
	pnpm run test

test-e2e: ## 🔬 Run e2e tests
	pnpm run test:e2e

lint: ## 🔍 Run linter
	pnpm run lint

lint-fix: ## 🔧 Fix linting issues
	pnpm run lint --fix

#==================================================================================
#  DATABASE
#==================================================================================
migration-generate: ## 📊 Generate new migration
	pnpm run migration:generate

migration-run: ## ⬆️ Run migrations
	pnpm run migration:run

migration-revert: ## ⬇️ Revert last migration
	pnpm run migration:revert

seed: ## 🌱 Run database seeds
	pnpm run seed

db-reset: ## 🔄 Reset database (WARNING: destroys data)
	pnpm run db:reset

#==================================================================================
#  DOCKER BUILDS
#==================================================================================
docker-build: ## 🐳 Build Docker image for development
	docker build --target development -t tecnologiaplus-backend:dev .

docker-build-prod: ## 🐳 Build Docker image for production
	docker build --target production -t tecnologiaplus-backend:prod .

docker-run: ## 🏃 Run Docker container locally
	docker run -p 3001:3001 tecnologiaplus-backend:dev

#==================================================================================
#  PRODUCTION TESTING
#==================================================================================
prod-test: ## 🎯 Test production build locally
	cp env.example .env.prod-test 2>/dev/null || true
	docker-compose -f docker-compose.prod-test.yml --env-file .env.prod-test up --build -d
	@echo "✅ Production test environment started!"
	@echo "🌐 Backend: http://localhost:3002"
	@echo "📚 Swagger: http://localhost:3002/api"
	@echo "🗄️ PostgreSQL: localhost:5500"

prod-test-logs: ## 📋 Show production test logs
	docker-compose -f docker-compose.prod-test.yml logs -f backend

prod-test-stop: ## 🛑 Stop production test environment
	docker-compose -f docker-compose.prod-test.yml down

prod-test-clean: ## 🧹 Clean production test environment
	docker-compose -f docker-compose.prod-test.yml down -v
	docker system prune -f

prod-test-migrate: ## ⬆️ Run migrations in production test
	docker-compose -f docker-compose.prod-test.yml --profile migration up migration

#==================================================================================
#  PRODUCTION DEPLOYMENT
#==================================================================================
deploy-dev-script: ## 🚀 Deploy using dev script (Docker only)
	./scripts/deploy-dev.sh

deploy-prod: ## 🚀 Deploy to production (requires production setup)
	@echo "⚠️  This command should only be run on production servers"
	@read -p "Are you sure you want to deploy to production? (y/N): " confirm && [ "$$confirm" = "y" ]
	./scripts/deploy-production.sh

deploy-staging: ## 🎭 Deploy to staging
	@echo "🎭 Deploying to staging environment..."
	# This would typically be handled by GitHub Actions

rollback: ## 🔄 Emergency rollback
	@echo "🚨 Emergency rollback initiated"
	./scripts/rollback.sh

rollback-confirm: ## ✅ Confirm rollback
	./scripts/rollback.sh confirm

#==================================================================================
#  UTILITIES
#==================================================================================
health: ## 🏥 Check application health
	curl -f http://localhost:3001/health || echo "❌ Health check failed"

logs-prod: ## 📋 Show production logs (blue/green)
	@echo "🔵 Blue container logs:"
	docker logs tecnologiaplus-backend-blue 2>/dev/null || echo "Blue container not running"
	@echo "🟢 Green container logs:"
	docker logs tecnologiaplus-backend-green 2>/dev/null || echo "Green container not running"

status: ## 📊 Show system status
	@echo "📊 Container Status:"
	docker ps --filter "name=tecnologiaplus" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers running"
	@echo ""
	@echo "💾 Volume Status:"
	docker volume ls --filter "name=tecnologiaplus" || echo "No volumes found"

clean-all: ## 🧹 Clean everything (containers, images, volumes)
	@echo "⚠️  This will remove ALL tecnologiaplus containers, images, and volumes"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker stop $$(docker ps -q --filter "name=tecnologiaplus") 2>/dev/null || true
	docker rm $$(docker ps -aq --filter "name=tecnologiaplus") 2>/dev/null || true
	docker rmi $$(docker images -q --filter "reference=*tecnologiaplus*") 2>/dev/null || true
	docker volume rm $$(docker volume ls -q --filter "name=tecnologiaplus") 2>/dev/null || true
	docker system prune -f

#==================================================================================
#  EXAMPLES & DOCUMENTATION
#==================================================================================
examples: ## 📖 Show usage examples
	@echo "📖 Common Usage Examples:"
	@echo ""
	@echo "🚀 Quick Development Start:"
	@echo "   make dev                    # Start everything"
	@echo "   make dev-logs              # Watch logs"
	@echo "   make dev-stop              # Stop when done"
	@echo ""
	@echo "🔧 Development Workflow:"
	@echo "   make install               # Install dependencies"
	@echo "   make lint                  # Check code"
	@echo "   make test                  # Run tests"
	@echo "   make build                 # Build for production"
	@echo ""
	@echo "🐳 Docker Workflow:"
	@echo "   make docker-build          # Build image"
	@echo "   make docker-run            # Run container"
	@echo ""
	@echo "🚀 Production Deployment:"
	@echo "   make deploy-dev-script     # Deploy with Docker scripts"
	@echo "   make rollback              # Emergency rollback"
	@echo ""
	@echo "📊 Monitoring:"
	@echo "   make health                # Check health"
	@echo "   make status                # System status"
	@echo "   make logs-prod             # Production logs"

#==================================================================================
#  DEFAULT TARGET
#==================================================================================
.DEFAULT_GOAL := help
