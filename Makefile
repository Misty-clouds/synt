.DEFAULT_GOAL := help
COMPOSE := docker compose

## ---- Local development ----

.PHONY: install
install: ## Install all workspace dependencies
	pnpm install

.PHONY: dev
dev: ## Run all apps in watch mode (turbo)
	pnpm dev

.PHONY: build
build: ## Build all apps (turbo)
	pnpm build

.PHONY: lint
lint: ## Lint all apps
	pnpm lint

.PHONY: test
test: ## Run all tests
	pnpm test

.PHONY: lockfile
lockfile: ## Regenerate pnpm-lock.yaml without installing
	pnpm install --lockfile-only

## ---- Docker / infra ----

.PHONY: up
up: ## Build and start the full stack (traefik + web + api)
	$(COMPOSE) up -d --build

.PHONY: down
down: ## Stop and remove the stack
	$(COMPOSE) down

.PHONY: restart
restart: down up ## Recreate the stack

.PHONY: docker-build
docker-build: ## Build images without starting containers
	$(COMPOSE) build

.PHONY: logs
logs: ## Tail logs from all services
	$(COMPOSE) logs -f

.PHONY: logs-traefik
logs-traefik: ## Tail Traefik logs (useful for cert/routing issues)
	$(COMPOSE) logs -f traefik

.PHONY: ps
ps: ## Show running containers
	$(COMPOSE) ps

.PHONY: config
config: ## Validate and render the compose config
	$(COMPOSE) config

.PHONY: clean
clean: ## Stop the stack and remove images + volumes
	$(COMPOSE) down --rmi local --volumes --remove-orphans

## ---- Meta ----

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
