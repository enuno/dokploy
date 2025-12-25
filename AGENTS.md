# AI Coding Agent Configuration - Dokploy Templates + Cloudflare Integration

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**Project:** Dokploy Open Source Templates with Cloudflare Services Integration  
**Repository:** https://github.com/enuno/dokploy (Cloudflare-integrated fork)

---

## 🎯 Project Overview

This project creates **production-ready Dokploy application templates** with integrated Cloudflare services (Workers, Pages, Images, D1, R2, Analytics Engine, KV). Each template must be:

- **Self-contained** Docker Compose configuration
- **Cloudflare-optimized** with automatic DNS/routing setup
- **Tested** in staging before PR submission
- **Documented** with clear variable inheritance and environment requirements

### Skills-First Approach (v2.0+)

**As of December 2025, this project uses a skills-first approach:**

- **Generic agents** (Builder, Validator) instead of specialized agents
- **Progressive skill loading** for 35% token reduction
- **Portable skills** maintained in `.claude/skills/`
- **Command orchestration** via `/dokploy-create` command

See [12-Skills-First-Planning-and-Orchestration.md](./docs/claude/docs/best-practices/12-Skills-First-Planning-and-Orchestration.md) for full details.

### Technology Stack

| Layer | Tech | Version |
|-------|------|---------|
| **Template Engine** | docker-compose.yml + template.toml | TOML 0.5+ |
| **Language** | TypeScript (meta.json generation) | 5.0+ |
| **Container Orchestration** | Docker Compose | 3.8+ |
| **Service Mesh** | Traefik (via Dokploy) | 2.10+ |
| **Edge Services** | Cloudflare Workers/Pages/D1/R2/KV | Latest |
| **CI/CD** | GitHub Actions | Native |
| **Package Manager** | pnpm | 8.0+ |

### Project Structure (Skills-First)

```
dokploy/
├── AGENTS.md                        # This file (source of truth)
├── CLAUDE.md                        # Claude Code skills-first config
├── README.md                        # Project overview
├── .env.example                     # Environment variable template
├── .env.local                       # Local secrets (gitignored)
│
├── .claude/
│   ├── commands/
│   │   └── dokploy-create.md        # Primary template creation command (v2.0)
│   ├── skills/                      # Project-managed skills
│   │   ├── dokploy-compose-structure/
│   │   ├── dokploy-template-toml/
│   │   ├── dokploy-traefik-routing/
│   │   ├── dokploy-health-patterns/
│   │   ├── dokploy-cloudflare-integration/
│   │   ├── dokploy-environment-config/
│   │   ├── dokploy-security-hardening/
│   │   ├── dokploy-template-validation/
│   │   └── dokploy-multi-service/
│   └── agents/                      # Legacy (deprecated in v2.0)
│       └── dokploy-template-agent.md  # Replaced by skills
│
├── docs/
│   ├── claude/
│   │   └── docs/                    # Skills-first documentation
│   ├── MULTIAGENTPLAN.md            # Multi-agent orchestration (reference)
│   ├── STAGING.md                   # Staging environment setup
│   ├── API.md                       # Cloudflare API integration
│   ├── SECURITY.md                  # Security policies
│   └── DESIGNSYSTEM.md              # Dokploy template design patterns
│
├── .cursor/
│   ├── settings.json                # Cursor workspace configuration
│   └── rules/
│       ├── architect-agent.mdc      # System design rules
│       ├── builder-agent.mdc        # Implementation rules
│       ├── validator-agent.mdc      # Testing rules
│       └── cloudflare-expert.mdc    # Cloudflare integration rules
│
├── .windsurf/
│   └── rules/
│       ├── template-builder.mdc     # Dokploy template generation
│       └── cloudflare-integration.mdc # Cloudflare service setup
│
├── .github/
│   ├── copilot-instructions.md      # Organization-wide Copilot config
│   └── workflows/
│       ├── test-template.yml        # Template validation workflow
│       └── pr-review.yml            # PR review automation
│
├── blueprints/                      # Template definitions
│   ├── grafana/
│   │   ├── docker-compose.yml
│   │   ├── template.toml
│   │   ├── grafana.svg
│   │   └── cloudflare-worker.js     # Optional: CF Workers integration
│   ├── pocketbase/
│   │   ├── docker-compose.yml
│   │   ├── template.toml
│   │   ├── pocketbase.svg
│   │   └── cf-d1-migration.js       # Optional: CF D1 database setup
│   └── [new-template]/
│       ├── docker-compose.yml
│       ├── template.toml
│       ├── [template-name].svg
│       └── cloudflare-[service].js  # If applicable
│
├── tests/
│   ├── template-validation.test.ts  # Validate docker-compose syntax
│   ├── env-variables.test.ts        # Verify variable inheritance
│   ├── cloudflare-api.test.ts       # Test CF API integrations
│   └── staging-deployment.test.ts   # E2E staging tests
│
├── scripts/
│   ├── validate-template.js         # Validate docker-compose + template.toml
│   ├── generate-meta.js             # Generate/update meta.json entries
│   ├── test-cloudflare-integration.js
│   └── deploy-to-staging.sh         # Deploy to test Dokploy instance
│
└── meta.json                        # Central template metadata registry
```

---

## 📋 Universal Coding Standards

### 1. Naming Conventions

#### Files & Directories
- **Templates:** `lowercase-with-hyphens` (e.g., `grafana`, `pocketbase`, `plausible-analytics`)
- **Environment Variables:** `UPPER_CASE_WITH_UNDERSCORES` (e.g., `POSTGRES_PASSWORD`, `CF_API_TOKEN`)
- **Docker Services:** `lowercase` in `docker-compose.yml` (matches template.toml serviceName)
- **Cloudflare Services:** `cf_[service_type]_[name]` (e.g., `cf_worker_auth`, `cf_d1_main`)

#### Commits
```
Template: [type] [scope]: [description]

Types:
- feat:   New template or feature
- fix:    Bug in existing template
- docs:   Template documentation
- test:   Test coverage
- chore:  Meta updates, CI/CD

Examples:
✅ template: feat grafana: add cloudflare cdn integration
✅ template: fix pocketbase: correct postgres env vars
✅ docs: scribe pocketbase: update cloudflare worker setup
✅ test: validator: add cf api endpoint testing
```

### 2. Dokploy Template Structure (Mandatory)

Every template **MUST** follow this exact structure:

#### `docker-compose.yml`
```yaml
# ✅ CORRECT
version: "3.8"
services:
  service-name:                    # lowercase, matches template.toml serviceName
    image: org/image:version       # specific version (no 'latest')
    restart: unless-stopped
    environment:
      - KEY=${VARIABLE_NAME}       # Use template.toml variables
    volumes:
      - volume-name:/path
    # ❌ NO: ports, container_name, networks (dokploy-network)

volumes:
  volume-name: {}

networks:
  # ❌ NO: explicit networks
```

#### `template.toml`
```toml
# ✅ CORRECT structure
[variables]
main_domain = "${domain}"
postgres_password = "${password:32}"
cf_api_token = "${CF_API_TOKEN}"         # References env var, not auto-generated
admin_email = "${email}"

[config]
# Domains section (routes via Traefik)
[[config.domains]]
serviceName = "service-name"               # MUST match docker-compose service name
port = 8000
host = "${main_domain}"
path = "/"

# Environment variables section
[config.env]
# Reference variables defined above
DATABASE_PASSWORD = "${postgres_password}"
CLOUDFLARE_API_TOKEN = "${cf_api_token}"
ADMIN_EMAIL = "${admin_email}"

# Mounts section (persistent files)
[[config.mounts]]
filePath = "/config/config.json"
content = """
{
  "admin_email": "${admin_email}",
  "api_token": "${cf_api_token}"
}
"""
```

### 3. Cloudflare Integration Standards

#### Required Cloudflare Variables (template.toml)
```toml
[variables]
# Cloudflare authentication
cf_account_id = "${CF_ACCOUNT_ID}"          # User provides
cf_api_token = "${CF_API_TOKEN}"            # User provides (sensitive)
cf_zone_id = "${CF_ZONE_ID}"                # For specific domain
cf_domain = "${domain}"                     # Main domain from Dokploy

# Workers configuration (if applicable)
cf_worker_env = "production"                # or "staging"
cf_worker_kv_namespace = "${uuid}"          # Auto-generated KV binding

# Database configuration (if using D1)
cf_d1_database_id = "${uuid}"               # CF D1 database ID

# R2 storage (if applicable)
cf_r2_bucket_name = "dokploy-${uuid}"       # Auto-generated bucket name
cf_r2_access_key = "${CF_R2_ACCESS_KEY}"    # User provides

[config.env]
# NEVER hardcode CF credentials; always reference variables
CLOUDFLARE_ACCOUNT_ID = "${cf_account_id}"
CLOUDFLARE_API_TOKEN = "${cf_api_token}"
CLOUDFLARE_ZONE_ID = "${cf_zone_id}"
D1_DATABASE_ID = "${cf_d1_database_id}"
R2_BUCKET = "${cf_r2_bucket_name}"
```

#### Cloudflare Worker File Pattern
If template includes Workers:
```javascript
// blueprints/[template]/cloudflare-worker.js
// This is a CODE REFERENCE, not executable within Dokploy
// Users will manually deploy via: wrangler deploy

export default {
  async fetch(request, env, ctx) {
    // Worker logic
    const cfApiToken = env.CLOUDFLARE_API_TOKEN;
    const d1Db = env.D1;
    const kvStore = env.KV_STORE;
    
    // Integrate with service via ${cf_domain}
    const serviceUrl = `https://${env.CF_DOMAIN}`;
    return fetch(serviceUrl, request);
  },
};
```

### 4. Variable Inheritance & Helpers

#### Built-in Helpers (Dokploy)
| Helper | Output | Example |
|--------|--------|---------|
| `${domain}` | Auto-generated domain | `grafana-xyz123.dokploy.cloud` |
| `${password:32}` | 32-byte random password | `aB3xKq2pL9mW8nV5xY1zQ4dF` |
| `${base64:32}` | 32-byte base64 string | `YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eWo=` |
| `${hash}` | SHA256 hash | `5e884898da28047...` |
| `${uuid}` | RFC4122 UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `${randomPort}` | Random port 3000-9999 | `5432` |
| `${email}` | Random email | `user-xyz@example.com` |
| `${username}` | Lowercase username | `adminuser123` |
| `${timestamp}` | Current epoch ms | `1703348400000` |
| `${jwt:secret_var:payload_var}` | JWT token | See Dokploy docs |

#### ❌ DO NOT
```toml
# ❌ WRONG: Hardcoding values
postgres_password = "password123"

# ❌ WRONG: Circular references
api_token = "${api_token}"

# ❌ WRONG: Undefined variable references
db_url = "${UNDEFINED_VAR}"
```

#### ✅ DO
```toml
# ✅ CORRECT: Use helpers
postgres_password = "${password:32}"

# ✅ CORRECT: Chain from upstream variables
main_domain = "${domain}"
api_url = "https://${main_domain}/api"

# ✅ CORRECT: Reference env vars that user provides
cf_api_token = "${CF_API_TOKEN}"  # User sets via .env
```

### 5. Testing Standards

#### Unit Tests (template validation)
```bash
# Run template syntax validation
npm run test -- tests/template-validation.test.ts

# Test specific template
npm run test -- tests/template-validation.test.ts --grep "grafana"

# Test variable inheritance
npm run test -- tests/env-variables.test.ts
```

#### Integration Tests (Cloudflare APIs)
```bash
# Test CF API integration (requires CF_API_TOKEN)
npm run test:cloudflare

# Test staging deployment
npm run test:staging -- --template=grafana
```

#### Required Test Coverage
- ✅ Template syntax validation (docker-compose + template.toml)
- ✅ Variable inheritance and resolution
- ✅ Cloudflare API endpoint reachability
- ✅ Staging deployment E2E
- ✅ Service health checks post-deployment

### 6. CLI Commands (ALL AGENTS)

#### Template Validation
```bash
# Validate single template
npm run validate -- blueprints/grafana

# Validate all templates
npm run validate:all

# Lint docker-compose files
npm run lint:docker blueprints/grafana/docker-compose.yml

# Lint template.toml syntax
npm run lint:toml blueprints/grafana/template.toml
```

#### Testing
```bash
# Run unit tests
npm run test

# Run with coverage (must achieve >80%)
npm run test:coverage

# Test Cloudflare integration (requires CF_API_TOKEN env var)
npm run test:cloudflare

# E2E staging deployment test
npm run test:staging --template=grafana
```

#### Build & Generate
```bash
# Generate/update meta.json from all templates
npm run generate:meta

# Build template base64 for import
npm run build:template blueprints/grafana

# Generate docs from template.toml
npm run docs:generate blueprints/grafana
```

#### Linting & Formatting
```bash
# Format all files (Prettier)
npm run format

# Format specific template
npm run format -- blueprints/grafana

# Lint TypeScript (meta.json scripts, tests)
npm run lint:ts

# Type check
npm run type-check
```

#### Git Workflow
```bash
# Create feature branch for new template
git checkout -b template/new-app-name

# Before submitting PR, validate completely
npm run validate:all && npm run test:coverage

# Create commit with proper message format
git commit -m "template: feat [app-name]: description"

# Push and open PR with template checklist filled
git push origin template/new-app-name
```

---

## 🔒 Tool Permissions & Security Boundaries

### ✅ Allowed Without Prompt

**File Operations**
- Read any file in repository
- List directories and files
- Search file contents (grep, ripgrep)

**Code Operations**
- Type check single files: `npm run type-check path/to/file.ts`
- Format single files: `npm run format -- path/to/file.ts`
- Lint single files: `npm run lint:ts -- path/to/file.ts`
- Run unit tests for single file: `npm run test -- path/to/file.test.ts`

**Template Operations**
- Validate template syntax: `npm run validate -- blueprints/[template]`
- Generate template base64: `npm run build:template blueprints/[template]`
- Create new template files in `blueprints/[new-template]/`

**Documentation**
- Generate/update markdown docs
- Update README.md, contributing guides
- Create CHANGELOG entries

### ⚠️ Ask First

**Package Management**
- Install dependencies: `pnpm install [package]`
- Update package.json scripts
- Lock file changes: `pnpm install`

**Test Execution**
- Run full test suite: `npm run test:coverage`
- Execute Cloudflare API tests (requires credentials)
- Run E2E staging tests

**Git Operations**
- Commit changes: `git commit`
- Push to branch: `git push`
- Create branches

**Credential Management**
- Read .env.local or secrets
- Access Cloudflare API tokens
- Create/modify environment variables

**Dangerous Operations**
- Delete files or directories
- Modify lock files manually
- Change CI/CD workflows
- Modify security policies

### 🚫 Forbidden (Never Execute)

- `npm install -g` (global installs)
- `sudo` commands
- `rm -rf` (recursive deletion)
- Direct database mutations outside tests
- Production deployments without human approval
- Cloudflare zone modifications (test only in staging)
- Commit and push in single operation without review

---

## 🏗️ Dokploy Template Design Patterns

### Pattern 1: Simple Web Service (Grafana-like)

**Use when:** Single container, simple configuration, minimal dependencies

```yaml
# docker-compose.yml
version: "3.8"
services:
  grafana:
    image: grafana/grafana:10.2.0
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - GF_SECURITY_ADMIN_USER=${ADMIN_USER}
      - GF_INSTALL_PLUGINS=${PLUGINS}
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage: {}
```

```toml
# template.toml
[variables]
main_domain = "${domain}"
admin_password = "${password:32}"
admin_user = "${username}"
plugins = "grafana-piechart-panel"

[config]
[[config.domains]]
serviceName = "grafana"
port = 3000
host = "${main_domain}"

[config.env]
ADMIN_PASSWORD = "${admin_password}"
ADMIN_USER = "${admin_user}"
PLUGINS = "${plugins}"
```

### Pattern 2: Application + Database Stack (Pocketbase + Postgres)

**Use when:** App requires persistent database, multi-container orchestration

```yaml
# docker-compose.yml
version: "3.8"
services:
  pocketbase:
    image: ghcr.io/pocketbase/pocketbase:latest
    environment:
      - PB_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY}
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    volumes:
      - pb-data:/pb_data
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pb-data: {}
  postgres-data: {}
```

```toml
# template.toml
[variables]
main_domain = "${domain}"
db_user = "${username}"
db_password = "${password:32}"
db_name = "pocketbase"
pb_encryption_key = "${base64:32}"

[config]
[[config.domains]]
serviceName = "pocketbase"
port = 8090
host = "${main_domain}"

[[config.domains]]
serviceName = "postgres"  # Internal, not exposed
port = 5432

[config.env]
DB_USER = "${db_user}"
DB_PASSWORD = "${db_password}"
DB_NAME = "${db_name}"
PB_ENCRYPTION_KEY = "${pb_encryption_key}"
DATABASE_URL = "postgres://${db_user}:${db_password}@postgres:5432/${db_name}"
```

### Pattern 3: Cloudflare-Integrated Service (Workers + D1)

**Use when:** App uses Cloudflare services (Workers, D1, R2, KV)

```yaml
# docker-compose.yml
version: "3.8"
services:
  api:
    image: myorg/api:1.0.0
    environment:
      - CF_ACCOUNT_ID=${CF_ACCOUNT_ID}
      - CF_API_TOKEN=${CF_API_TOKEN}
      - CF_D1_DB_ID=${CF_D1_DB_ID}
      - CF_WORKER_URL=https://${CF_DOMAIN}/worker
    restart: unless-stopped

  # Optional: Local dev/test DB for non-CF environments
  sqlite:
    image: nateraw/sqlite:latest
    volumes:
      - sqlite-data:/data
    profiles:
      - dev  # Only in dev, not in production
```

```toml
# template.toml
[variables]
main_domain = "${domain}"
cf_account_id = "${CF_ACCOUNT_ID}"
cf_api_token = "${CF_API_TOKEN}"
cf_d1_db_id = "${CF_D1_DB_ID}"
cf_worker_env = "production"

[config]
[[config.domains]]
serviceName = "api"
port = 3000
host = "${main_domain}"
path = "/api"

[config.env]
CF_ACCOUNT_ID = "${cf_account_id}"
CF_API_TOKEN = "${cf_api_token}"
CF_D1_DB_ID = "${cf_d1_db_id}"
CF_WORKER_URL = "https://${main_domain}/worker"
NODE_ENV = "production"

# Mount Cloudflare Worker configuration
[[config.mounts]]
filePath = "/app/wrangler.toml"
content = """
name = "dokploy-worker"
main = "src/index.js"
env = "${cf_worker_env}"

[[env.production.d1_databases]]
binding = "D1"
database_id = "${cf_d1_db_id}"

[env.production]
routes = [
  { pattern = "${main_domain}/worker", zone_name = "${CF_ZONE}" }
]
"""
```

---

## 📦 meta.json Registry Format

```json
[
  {
    "id": "grafana",
    "name": "Grafana",
    "version": "10.2.0",
    "description": "Grafana is an open-source platform for monitoring and observability.",
    "logo": "grafana.svg",
    "links": {
      "github": "https://github.com/grafana/grafana",
      "website": "https://grafana.com/",
      "docs": "https://grafana.com/docs/"
    },
    "tags": ["monitoring", "observability", "dashboards"],
    "cloudflare": {
      "supported_services": ["Workers", "Pages"],
      "optional": true,
      "documentation": "docs/templates/grafana-cloudflare.md"
    }
  }
]
```

---

## 🔑 Environment Variables & Secrets

### .env.example (Tracked in Git)
```bash
# Dokploy Instance
DOKPLOY_API_KEY=your-api-key-here

# Cloudflare Credentials (never commit)
CF_ACCOUNT_ID=
CF_API_TOKEN=
CF_ZONE_ID=
CF_R2_ACCESS_KEY=
CF_R2_SECRET_KEY=

# Staging Environment
STAGING_DOKPLOY_URL=https://staging.dokploy.local
STAGING_CF_API_TOKEN=

# Testing
TEST_TEMPLATE_NAME=grafana
TEST_TIMEOUT=30000
```

### .env.local (Gitignored)
```bash
# Template of .env.example with actual values populated locally
CF_API_TOKEN=your-real-token-here
CF_ACCOUNT_ID=your-account-id
# Never commit to version control
```

### .aiignore (AI Tool Exclusions)
```
.env.local
.env.production.local
secrets.json
ai-agent.config.json
node_modules/
.next/
dist/
build/
coverage/
*.lock
.git/
.DS_Store
*.pem
*.key
```

---

## ✅ Dos and Don'ts

### Dos ✅

1. **Always validate before committing**
   ```bash
   npm run validate:all && npm run test:coverage
   ```

2. **Use specific versions** in docker-compose
   ```yaml
   image: grafana/grafana:10.2.0  # ✅ Good
   image: grafana/grafana:latest  # ❌ Bad
   ```

3. **Document Cloudflare requirements** in template comments
   ```yaml
   # This template integrates with Cloudflare D1
   # Prerequisites: CF_ACCOUNT_ID, CF_API_TOKEN, CF_D1_DB_ID
   ```

4. **Test variable inheritance** across all contexts
   ```bash
   npm run test -- tests/env-variables.test.ts
   ```

5. **Use meaningful commit messages** with scope
   ```bash
   git commit -m "template: feat grafana: add cloudflare cdn proxy"
   ```

6. **Reference Dokploy staging in PRs** with deployment results
   > Preview: https://dokploy-staging.example.com/template/grafana-xyz

### Don'ts ❌

1. **Don't hardcode credentials**
   ```toml
   # ❌ WRONG
   cf_api_token = "sk_live_abc123xyz"
   
   # ✅ CORRECT
   cf_api_token = "${CF_API_TOKEN}"
   ```

2. **Don't use `latest` Docker tags**
   ```yaml
   # ❌
   image: postgres:latest
   
   # ✅
   image: postgres:16-alpine
   ```

3. **Don't expose internal services**
   ```yaml
   # ❌ WRONG: Postgres exposed to internet
   services:
     postgres:
       ports:
         - "5432:5432"
   
   # ✅ CORRECT: Internal only, no ports exposed
   ```

4. **Don't modify docker-compose after template.toml is set**
   - Update both in sync
   - Variable references must match exactly

5. **Don't skip tests before PR submission**
   ```bash
   # ❌ NO: Committing untested templates
   
   # ✅ YES: Full validation before push
   npm run validate:all && npm run test:coverage && git push
   ```

6. **Don't reference undefined variables**
   ```toml
   # ❌ WRONG
   some_url = "https://${undefined_domain}/api"
   
   # ✅ CORRECT
   my_domain = "${domain}"
   some_url = "https://${my_domain}/api"
   ```

---

## 🔗 API Documentation References

| Service | Docs | Notes |
|---------|------|-------|
| **Dokploy** | [docs.dokploy.com](https://docs.dokploy.com) | Template structure, variables, Docker Compose |
| **Cloudflare API** | [developers.cloudflare.com/api](https://developers.cloudflare.com/api) | D1, R2, KV, Workers, Pages |
| **Cloudflare D1** | [developers.cloudflare.com/d1](https://developers.cloudflare.com/d1) | Database setup, migrations |
| **Cloudflare Workers** | [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers) | Serverless functions |
| **Cloudflare R2** | [developers.cloudflare.com/r2](https://developers.cloudflare.com/r2) | Object storage |
| **Cloudflare KV** | [developers.cloudflare.com/kv](https://developers.cloudflare.com/kv) | Key-value store |
| **Docker Compose** | [docs.docker.com/compose](https://docs.docker.com/compose) | Compose spec v3.8+ |
| **TOML Spec** | [toml.io](https://toml.io) | Template.toml syntax |

---

## 📊 Git Workflow & Commit Standards

### Branch Naming
```
template/[app-name]           # New template
feature/[feature-name]        # Feature addition
bugfix/[issue-id]             # Bug fix
chore/[task-name]             # Maintenance
docs/[doc-title]              # Documentation
```

### Commit Message Format
```
[scope]: [type] [description]

Scope: template, docs, test, chore
Type: feat, fix, docs, test, refactor

Examples:
✅ template: feat grafana: add cloudflare image optimization
✅ template: fix pocketbase: correct d1 database migration
✅ docs: scribe grafana: update cloudflare setup guide
✅ test: validator: add cf api reachability tests
```

### PR Checklist
```markdown
## Template Submission Checklist

- [ ] Validated locally: `npm run validate:all && npm run test:coverage`
- [ ] Staging deployed: [Link to staging preview]
- [ ] Service accessible and functioning
- [ ] All environment variables documented
- [ ] Cloudflare integration tested (if applicable)
- [ ] meta.json entry added
- [ ] No secrets or credentials in code
- [ ] Follows naming conventions
- [ ] Follows design patterns from DESIGNSYSTEM.md
```

---

## 🛡️ Security & Audit Logging

### Never Commit
- `.env.local` (local secrets)
- `*.pem`, `*.key` (SSH keys)
- `CF_API_TOKEN`, `CF_R2_SECRET_KEY` (Cloudflare credentials)
- Database passwords in code
- Any PII or sensitive data

### Audit Trail
All agent modifications are logged:
```
.audit/
├── CLAUDE_sessions.log
├── CURSOR_edits.log
├── COPILOT_completions.log
└── CLINE_executions.log
```

### Review Requirements
- All templates reviewed by at least 1 maintainer before merge
- All Cloudflare integrations tested in staging
- Security scan: `npm run security:audit`

---

## 📝 Version Control & Changelog

### Versioning Scheme: Semantic (Project Level)
```
v1.0.0
  ↓
MAJOR.MINOR.PATCH

- MAJOR: Breaking changes to template structure
- MINOR: New templates, new features
- PATCH: Bug fixes, documentation updates
```

### CHANGELOG.md Format
```markdown
## [1.0.0] - 2025-12-24

### Added
- New: Grafana template with Cloudflare CDN integration
- New: Pocketbase + PostgreSQL stack template
- Feature: Cloudflare D1 database migration support

### Fixed
- Fixed: Variable inheritance in multi-service templates
- Fixed: template.toml TOML syntax validation

### Changed
- Refactored: meta.json generation script
- Updated: Dokploy version to 0.25.6
```

---

## 🎓 Quick Reference

### Most Common Tasks

| Task | Command | Agent |
|------|---------|-------|
| **New Template** | `mkdir blueprints/[name] && npm run generate:meta` | Architect |
| **Validate All** | `npm run validate:all` | Validator |
| **Test Cloudflare** | `CF_API_TOKEN=xxx npm run test:cloudflare` | Researcher |
| **Deploy Staging** | `npm run deploy:staging --template=grafana` | DevOps |
| **Update Docs** | `npm run docs:generate blueprints/grafana` | Scribe |
| **Format Code** | `npm run format` | Builder |
| **Type Check** | `npm run type-check` | Validator |

---

## 📞 Contact & Support

- **GitHub Issues:** [github.com/enuno/dokploy/issues](https://github.com/enuno/dokploy/issues)
- **Dokploy Discord:** [discord.gg/dokploy](https://discord.gg/dokploy)
- **Cloudflare Docs:** [developers.cloudflare.com](https://developers.cloudflare.com)

---

**Last Updated:** December 24, 2025  
**Maintained By:** Ryno Crypto Mining Services - ServerDomes Network Engineering  
**Contributors:** [See contributors.md](./contributors.md)
