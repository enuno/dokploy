---
description: "Create production-ready Dokploy template using skills-first approach with Cloudflare-first defaults"
allowed-tools: ["Read", "Search", "Edit", "Write", "Bash", "WebSearch", "WebFetch", "Skill"]
author: "Home Lab Infrastructure Team"
version: "2.1.0"
complexity: "complex"
category: "infrastructure"
tags: ["dokploy", "docker-compose", "cloudflare", "template-generation"]
token_budget: "30000-45000"
status: "active"
---

# Create Dokploy Template (Skills-First + Cloudflare-First)

Create a complete, production-ready Dokploy template for `$ARGUMENTS` using progressive skill loading for optimal token efficiency. **Defaults to Cloudflare services** for all external integrations.

## Invocation

```bash
/dokploy-create [application-name]
/dokploy-create [application-url]  # GitHub/Docker Hub URL
```

**Examples:**
```bash
/dokploy-create gitea
/dokploy-create nextcloud
/dokploy-create https://github.com/paperless-ngx/paperless-ngx
/dokploy-create https://hub.docker.com/r/vaultwarden/server
```

---

## Workflow Architecture

**Multi-Phase Execution with Progressive Skill Loading:**

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Discovery (No Skills)                         │
│  • Research application (WebSearch, WebFetch)           │
│  • Identify dependencies, storage needs, ports          │
│  • Output: Requirements document                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Architecture (Load: dokploy-multi-service)    │
│  • Design service dependency graph                      │
│  • Plan network topology                                │
│  • SELECT CLOUDFLARE SERVICES (R2, Workers, D1, etc.)   │
│  • Output: Architecture design document                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Generation (Load 6 Skills Progressively)      │
│  1. dokploy-compose-structure → Base YAML               │
│  2. dokploy-traefik-routing → Routing labels            │
│  3. dokploy-health-patterns → Health checks             │
│  4. dokploy-cloudflare-integration → CF SERVICES ⭐     │
│  5. dokploy-environment-config → Env vars               │
│  6. dokploy-template-toml → Template config             │
│  • Output: Complete docker-compose.yml + template.toml  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 4: Validation (Load 2 Skills Sequentially)       │
│  1. dokploy-security-hardening → Security review        │
│  2. dokploy-template-validation → Convention check      │
│  • Final: docker compose config (syntax validation)     │
│  • Output: Validation reports + fixes                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 5: Documentation (No Skills)                     │
│  • Generate comprehensive README.md                     │
│  • Include Cloudflare setup guide (if applicable)       │
│  • Output: Complete documentation                       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 6: Index Update (No Skills)                      │
│  • Update blueprints/README.md table                    │
│  • Insert in alphabetical order                         │
│  • Output: Updated repository index                     │
└─────────────────────────────────────────────────────────┘

Feedback Loops:
• Phase 3 ↔ Phase 4: Iterative refinement if validation fails
• Phase 2 → Phase 3: Architecture adjustments if needed
```

---

## Cloudflare-First Integration Strategy

**DEFAULT TO CLOUDFLARE FOR ALL EXTERNAL SERVICES:**

### Cloudflare Service Selection Matrix

| Application Need | Cloudflare Service | Alternative (Avoid) | When to Use CF |
|------------------|-------------------|---------------------|----------------|
| **Object Storage** | R2 | MinIO, AWS S3, local storage | Files, uploads, media, backups |
| **Database (serverless)** | D1 | SQLite, PostgreSQL | Small apps, edge compute |
| **Key-Value Store** | KV | Redis (for simple K/V) | Sessions, cache, config |
| **SSL Certificates** | DNS-01 Challenge | HTTP-01, self-signed | Wildcard certs, internal services |
| **Admin Access** | Zero Trust Access | Basic auth, VPN | Secure admin panels |
| **API Gateway** | Workers | NGINX, API Gateway | Authentication, rate limiting |
| **CDN/Caching** | Cloudflare CDN | Local caching only | Static assets, media |
| **Email Routing** | Email Workers | SMTP relay services | Transactional emails |
| **Analytics** | Web Analytics | Self-hosted analytics | Privacy-focused tracking |

### Phase-Specific Cloudflare Integration

**Phase 2 (Architecture):**
```
When designing service architecture, ALWAYS ASK:
1. Does this app need file storage? → Consider R2
2. Does this app need SSL certs? → Use DNS-01 challenge
3. Does admin panel need protection? → Consider Zero Trust
4. Does this app serve static assets? → Consider CF CDN
5. Does this app need serverless functions? → Consider Workers
```

**Phase 3 (Generation - Skill 4):**
```
dokploy-cloudflare-integration skill adds:
• R2 bucket configuration (if storage needed)
• DNS-01 challenge for Let's Encrypt (if wildcard/internal)
• Zero Trust application config (if admin access)
• Worker stubs (if API gateway/auth needed)
• KV namespace bindings (if session storage)
```

### Cloudflare Configuration Examples

**R2 Storage Integration:**
```yaml
# In docker-compose.yml
environment:
  S3_ENDPOINT: https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com
  S3_BUCKET: ${R2_BUCKET_NAME}
  S3_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID}
  S3_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY}
  S3_REGION: auto
```

**DNS-01 Challenge for Traefik:**
```yaml
labels:
  - "traefik.http.routers.app.tls.certresolver=cloudflare"
  - "traefik.http.routers.app.tls.domains[0].main=${DOMAIN}"
  - "traefik.http.routers.app.tls.domains[0].sans=*.${DOMAIN}"
environment:
  CF_DNS_API_TOKEN: ${CF_DNS_API_TOKEN:?Set Cloudflare DNS API token}
```

**Zero Trust Access:**
```yaml
labels:
  - "traefik.http.routers.admin.middlewares=cloudflare-access@docker"
  - "traefik.http.middlewares.cloudflare-access.forwardauth.address=https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/authorized"
  - "traefik.http.middlewares.cloudflare-access.forwardauth.trustForwardHeader=true"
```

---

## Phase-by-Phase Workflow

### Phase 1: Discovery & Requirements Analysis

**Purpose:** Gather all necessary context about the application

**Actions:**
1. **Research Application:**
   ```
   IF user provided URL:
     - WebFetch the repository README
     - Identify official Docker image
     - Find docker-compose examples
   ELSE IF user provided app name:
     - WebSearch "[app-name] docker compose"
     - WebSearch "[app-name] official docker image"
     - Check Docker Hub / GitHub Container Registry
   ```

2. **Identify Requirements:**
   - [ ] Docker image (official source, version)
   - [ ] Dependencies (PostgreSQL, MongoDB, Redis, etc.)
   - [ ] Storage needs (volumes, object storage)
   - [ ] Ports (web UI, API, other protocols)
   - [ ] Environment variables (required configuration)
   - [ ] **Cloudflare opportunities** (storage, auth, SSL, CDN)

3. **Create Requirements Document:**
   ```markdown
   # Requirements: [Application Name]

   ## Application
   - Name: [name]
   - Docker Image: [registry/image:version]
   - Official Source: [URL]

   ## Dependencies
   - Database: [PostgreSQL 16 | MongoDB 7 | MySQL 8 | None]
   - Cache: [Redis 7 | None]
   - Helpers: [list any helper services]

   ## Storage Needs
   - Volumes: [list required volumes]
   - Object Storage: [Yes - use R2 | No]

   ## Cloudflare Integration
   - R2 Storage: [Yes | No] - [Reason]
   - DNS Challenge: [Yes | No] - [Reason]
   - Zero Trust: [Yes | No] - [Reason]
   - Workers: [Yes | No] - [Reason]

   ## Configuration
   - Required Env Vars: [list]
   - Optional Env Vars: [list]
   - Secrets: [list]
   ```

**Success Criteria:**
- [ ] Docker image identified with specific version
- [ ] All dependencies listed
- [ ] Cloudflare services evaluated for each integration point
- [ ] Storage strategy defined (volumes + R2 if applicable)

**Phase 1 Output:** Requirements document

---

### Phase 2: Architecture Design

**Load Skill:** `dokploy-multi-service`

**Purpose:** Design service architecture and Cloudflare integration

**Actions:**
1. **Design Service Dependency Graph:**
   ```
   Example (3-tier app):
   app → postgres (required, service_healthy)
   app → redis (required, service_healthy)
   app → r2-storage (external, Cloudflare R2)
   ```

2. **Plan Network Topology:**
   ```
   Internal Network (app-net):
   - App service
   - PostgreSQL
   - Redis

   External Network (dokploy-network):
   - App service (for Traefik routing)

   External Services (Cloudflare):
   - R2 bucket for file storage
   - Zero Trust for admin protection
   ```

3. **Select Cloudflare Services:**
   ```markdown
   ## Cloudflare Services for [App Name]

   ### R2 Storage
   - Use Case: User uploads, media files, backups
   - Bucket Name: ${R2_BUCKET_NAME}
   - Required Credentials: Access Key ID, Secret Access Key

   ### DNS-01 Challenge
   - Use Case: Wildcard SSL certificate for *.${DOMAIN}
   - Required: CF_DNS_API_TOKEN with Zone:DNS:Edit permission

   ### Zero Trust Access
   - Use Case: Protect /admin path with authentication
   - Required: Cloudflare Access application setup
   ```

4. **Design Health Check Strategy:**
   - PostgreSQL: `pg_isready` command
   - Redis: `redis-cli ping` command
   - App: HTTP health endpoint check
   - Helpers: `service_started` (no health check needed)

**Success Criteria:**
- [ ] Service dependency graph is acyclic
- [ ] Network isolation properly designed
- [ ] Cloudflare services selected with rationale
- [ ] Health checks defined for all required dependencies

**Phase 2 Output:** Architecture design document

---

### Phase 3: Template Generation

**Load Skills Progressively** (in order):

#### Step 3.1: Base Structure
**Load:** `dokploy-compose-structure`

**Generate:**
```yaml
services:
  app:
    image: [app-image:version]
    restart: always
    depends_on: [...]
    volumes: [...]
    environment: [...]
    networks:
      - app-net
      - dokploy-network

  postgres:
    image: postgres:16-alpine
    restart: always
    volumes: [...]
    environment: [...]
    networks:
      - app-net

volumes:
  [volume-definitions]

networks:
  app-net:
    driver: bridge
  dokploy-network:
    external: true
```

#### Step 3.2: Traefik Routing
**Load:** `dokploy-traefik-routing`

**Add to services.app.labels:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.app.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.app.entrypoints=websecure"
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
  - "traefik.http.services.app.loadbalancer.server.port=8080"
  - "traefik.docker.network=dokploy-network"
```

#### Step 3.3: Health Checks
**Load:** `dokploy-health-patterns`

**Add health checks to all services:**
```yaml
# App service
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s

# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U user -d db"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

#### Step 3.4: Cloudflare Integration ⭐
**Load:** `dokploy-cloudflare-integration`

**This is the CRITICAL step for Cloudflare-first approach**

**Add Cloudflare configurations based on Phase 2 decisions:**

**If using R2 Storage:**
```yaml
# services.app.environment
S3_ENDPOINT: https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com
S3_BUCKET: ${R2_BUCKET_NAME}
S3_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID:?Set R2 access key}
S3_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY:?Set R2 secret key}
S3_REGION: auto
S3_USE_PATH_STYLE: "true"
```

**If using DNS-01 Challenge:**
```yaml
# services.app.environment (for Traefik DNS challenge)
CF_DNS_API_TOKEN: ${CF_DNS_API_TOKEN:?Set Cloudflare DNS API token}

# services.app.labels (update certresolver)
- "traefik.http.routers.app.tls.certresolver=cloudflare"
- "traefik.http.routers.app.tls.domains[0].main=${DOMAIN}"
- "traefik.http.routers.app.tls.domains[0].sans=*.${DOMAIN}"
```

**If using Zero Trust:**
```yaml
# services.app.labels (add middleware)
- "traefik.http.routers.admin.rule=Host(`${DOMAIN}`) && PathPrefix(`/admin`)"
- "traefik.http.routers.admin.middlewares=cloudflare-access@docker"
- "traefik.http.middlewares.cloudflare-access.forwardauth.address=https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/authorized"
- "traefik.http.middlewares.cloudflare-access.forwardauth.trustForwardHeader=true"
```

**If using Workers (create stub):**
```javascript
// cloudflare-worker.js (created in template directory)
export default {
  async fetch(request, env) {
    // Worker logic for auth, rate limiting, etc.
    return fetch(request);
  }
}
```

#### Step 3.5: Environment Configuration
**Load:** `dokploy-environment-config`

**Organize environment variables by category:**
```yaml
environment:
  # Domain Configuration
  APP_DOMAIN: ${DOMAIN:?Set your domain}
  APP_URL: https://${DOMAIN}

  # Database Connection
  DATABASE_URL: postgresql://${DB_USER:-app}:${DB_PASS}@postgres:5432/${DB_NAME:-app}

  # Cloudflare R2 Storage (if applicable)
  S3_ENDPOINT: https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com
  S3_BUCKET: ${R2_BUCKET_NAME}
  S3_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID:?Set R2 access key}
  S3_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY:?Set R2 secret key}

  # Application Secrets
  SECRET_KEY: ${SECRET_KEY:?Set secret key}
  JWT_SECRET: ${JWT_SECRET:?Set JWT secret}

  # Optional Configuration
  DEBUG: ${DEBUG:-false}
  LOG_LEVEL: ${LOG_LEVEL:-info}
```

#### Step 3.6: Template Configuration
**Load:** `dokploy-template-toml`

**Generate template.toml:**
```toml
# [Application Name] - Brief description
# Official: [GitHub/Docker Hub URL]

[variables]
domain = "${domain}"
db_password = "${password:32}"
secret_key = "${base64:64}"
jwt_secret = "${base64:48}"

# Cloudflare R2 (if applicable)
r2_bucket_name = ""
r2_access_key_id = ""
r2_secret_access_key = ""
cf_account_id = ""

# Cloudflare DNS Challenge (if applicable)
cf_dns_api_token = ""

# Cloudflare Zero Trust (if applicable)
cf_team_name = ""

[[config.domains]]
serviceName = "app"
port = 8080
host = "${domain}"

[config.env]
DOMAIN = "${domain}"
DB_PASS = "${db_password}"
SECRET_KEY = "${secret_key}"
JWT_SECRET = "${jwt_secret}"

# Cloudflare R2 variables (if applicable)
R2_BUCKET_NAME = "${r2_bucket_name}"
R2_ACCESS_KEY_ID = "${r2_access_key_id}"
R2_SECRET_ACCESS_KEY = "${r2_secret_access_key}"
CF_ACCOUNT_ID = "${cf_account_id}"
```

**Success Criteria:**
- [ ] docker-compose.yml is syntactically valid
- [ ] All Cloudflare services configured per Phase 2 design
- [ ] template.toml has all variables mapped correctly
- [ ] No hardcoded secrets or credentials
- [ ] Image versions pinned (no :latest)

**Phase 3 Output:** Complete docker-compose.yml + template.toml + cloudflare-worker.js (if applicable)

---

### Phase 4: Security & Compliance Validation

#### Step 4.1: Security Review
**Load:** `dokploy-security-hardening`

**Validate:**
- [ ] No hardcoded secrets in compose file
- [ ] All secrets use `${VAR:?message}` syntax
- [ ] Databases on internal network only
- [ ] Web services properly isolated
- [ ] Image versions pinned
- [ ] Cloudflare credentials handled securely

**Common Cloudflare Security Issues:**
```yaml
# WRONG - Hardcoded R2 credentials
S3_ACCESS_KEY_ID: "abc123"

# CORRECT - Use variables
S3_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID:?Set R2 access key}
```

#### Step 4.2: Convention Compliance
**Load:** `dokploy-template-validation`

**Validate:**
- [ ] YAML syntax valid
- [ ] Network structure correct (app-net + dokploy-network)
- [ ] Health checks present for all dependencies
- [ ] Traefik labels complete (6 mandatory labels)
- [ ] Volume names follow conventions
- [ ] Service names match across depends_on and environment

#### Step 4.3: Syntax Validation
**Run:**
```bash
docker compose -f blueprints/[app-name]/docker-compose.yml config
```

**Expected:** May fail due to missing env vars (this is CORRECT behavior)

**Success Criteria:**
- [ ] All security checks passed
- [ ] All convention validations passed
- [ ] docker compose config shows resolved YAML (ignoring missing vars)
- [ ] Cloudflare integrations validated

**Phase 4 Output:** Validation reports with any fixes applied

---

### Phase 5: Documentation Generation

**Purpose:** Create comprehensive user-facing documentation

**Generate README.md with:**

1. **Overview Section:**
   ```markdown
   # [Application Name]

   Brief description of what the application does.

   ## Overview

   [Application] is a [description]. Run your own instance with this
   production-ready Dokploy template featuring:

   - Cloudflare R2 integration for scalable object storage
   - Automatic SSL with Cloudflare DNS-01 challenge
   - Zero Trust access protection for admin panel
   - Production-grade health checks and monitoring
   ```

2. **Architecture Diagram:**
   ```markdown
   ## Architecture

   ```
   ┌──────────────┐     ┌──────────────┐
   │     App      │────▶│  PostgreSQL  │
   │  (web UI)    │     │  (internal)  │
   └──────────────┘     └──────────────┘
          │
          ├────▶ Cloudflare R2 (storage)
          │
          └────▶ Cloudflare Zero Trust (auth)
          │
          ▼
     HTTPS (Traefik + CF DNS)
   ```
   ```

3. **Cloudflare Setup Guide (CRITICAL SECTION):**
   ```markdown
   ## Cloudflare Configuration

   This template uses Cloudflare services for production-grade features:

   ### R2 Object Storage (Required)

   1. Create R2 bucket:
      - Go to Cloudflare Dashboard → R2
      - Click "Create bucket"
      - Name: `[app-name]-storage`
      - Region: Automatic

   2. Generate R2 API tokens:
      - Go to R2 → Manage R2 API Tokens
      - Click "Create API token"
      - Permissions: Object Read & Write
      - Copy Access Key ID and Secret Access Key

   3. Configure in Dokploy:
      - R2_BUCKET_NAME: `[app-name]-storage`
      - R2_ACCESS_KEY_ID: [from step 2]
      - R2_SECRET_ACCESS_KEY: [from step 2]
      - CF_ACCOUNT_ID: Found in Cloudflare Dashboard URL

   ### DNS-01 Challenge for SSL (Optional)

   For wildcard certificates or internal services:

   1. Create DNS API token:
      - Cloudflare Dashboard → Profile → API Tokens
      - Create Token → Edit zone DNS template
      - Zone Resources: Include → Specific zone → [your domain]
      - Copy token

   2. Configure in Dokploy:
      - CF_DNS_API_TOKEN: [token from step 1]

   ### Zero Trust Access (Optional)

   For admin panel protection:

   1. Set up Cloudflare Access:
      - Cloudflare Dashboard → Zero Trust → Access
      - Create application for `${DOMAIN}/admin`
      - Configure identity providers

   2. Configure in Dokploy:
      - CF_TEAM_NAME: Your team name from Zero Trust dashboard
   ```

4. **Standard Sections:**
   - Requirements (resources, prerequisites)
   - Configuration variables table
   - Deployment steps
   - Post-deployment verification
   - Troubleshooting (include Cloudflare-specific issues)

**Success Criteria:**
- [ ] README.md is comprehensive (>300 lines)
- [ ] Cloudflare setup guide included with step-by-step instructions
- [ ] Architecture diagram shows Cloudflare integration
- [ ] All configuration variables documented
- [ ] Troubleshooting section covers common Cloudflare issues

**Phase 5 Output:** Complete README.md with Cloudflare focus

---

### Phase 6: Repository Index Update

**Purpose:** Add new template to blueprints/README.md

**Actions:**
1. **Read** current `blueprints/README.md`
2. **Count Services** from docker-compose.yml
3. **Write Description** (60-100 chars, unique, mentions Cloudflare if integrated)
4. **Find Alphabetical Position** in table
5. **Insert New Row:**
   ```markdown
   | [app-name](/blueprints/app-name/) | Description with Cloudflare R2/Zero Trust integration | 3 (app, postgres, redis) | Ready |
   ```

**Example:**
```markdown
| [paperless-ngx](/blueprints/paperless-ngx/) | Document management system with OCR | 5 (web, postgres, redis, tika, gotenberg) | Ready |
| [vaultwarden](/blueprints/vaultwarden/) | Self-hosted Bitwarden with Cloudflare R2 backup | 1 (vaultwarden) | Ready |
| [warp-docker](/blueprints/warp-docker/) | Cloudflare WARP client in Docker for WireGuard VPN access | 4 | Ready |
```

**Success Criteria:**
- [ ] Row inserted in correct alphabetical position
- [ ] Description mentions Cloudflare if integrated
- [ ] Service count is accurate
- [ ] Table formatting preserved

**Phase 6 Output:** Updated blueprints/README.md

---

## Pre-Execution Validation

**Run these checks before starting Phase 1:**

```bash
# Check 1: Verify skills are available
ls .claude/skills/dokploy-* | wc -l
# Expected: 10 skills

# Check 2: Verify blueprints directory exists
[ -d "blueprints" ] && echo "OK" || echo "ERROR: blueprints/ not found"

# Check 3: Verify docker compose is available
docker compose version
# Expected: Docker Compose version v2.x.x or higher
```

**Validation Checklist:**
- [ ] All 10 dokploy skills present in `.claude/skills/`
- [ ] `blueprints/` directory exists
- [ ] Docker Compose v2.x+ installed
- [ ] Network connectivity for WebSearch/WebFetch

---

## Error Handling Patterns

### Phase 1 Errors

**Error: No Docker Image Found**
```
Symptom: Cannot find official Docker image for application
Action: Ask user: "What Docker image should I use for [app]?"
Recovery: Use user-provided image, verify on Docker Hub
```

**Error: Dependencies Unknown**
```
Symptom: Application documentation unclear about database
Action: Ask user: "Does [app] require a database? (PostgreSQL/MongoDB/MySQL/None)"
Recovery: Proceed with user-specified database
```

### Phase 2 Errors

**Error: Circular Dependencies Detected**
```
Symptom: Service A depends on B, B depends on A
Action: Redesign architecture to break cycle
Recovery: Use async communication or remove dependency
```

**Error: Cloudflare Service Selection Unclear**
```
Symptom: Unsure if app needs R2 vs local volumes
Action: Ask user: "Does [app] need object storage for uploads/files? (Yes → R2 | No → volumes)"
Recovery: Proceed with user choice
```

### Phase 3 Errors

**Error: Skill Not Found**
```
Symptom: dokploy-[skill-name] not in .claude/skills/
Action: Fall back to manual pattern from AGENTS.md
Recovery: Generate component using best practices from docs
```

**Error: Variable Conflict in template.toml**
```
Symptom: Variable name already used in different context
Action: Rename variable with prefix: [service]_[variable]
Recovery: Update all references in docker-compose.yml
```

### Phase 4 Errors

**Error: Validation Failure**
```
Symptom: Security check fails (e.g., hardcoded password found)
Action: Loop back to Phase 3, fix issue
Recovery: Re-run validation until all checks pass
Iteration Limit: 3 attempts, then request human review
```

**Error: docker compose config Fails with Real Error**
```
Symptom: Syntax error in YAML (not missing vars)
Action: Fix YAML syntax error
Recovery: Re-run validation
```

### Phase 5 Errors

**Error: README.md Template Generation Incomplete**
```
Symptom: Missing sections in documentation
Action: Re-generate missing sections
Recovery: Ensure all required sections present
```

### Phase 6 Errors

**Error: Table Formatting Broken**
```
Symptom: Markdown table misaligned after insertion
Action: Re-align table columns
Recovery: Verify with markdown preview
```

---

## Quality Checklist

**Before marking template as complete, verify ALL items:**

### docker-compose.yml
- [ ] All images have pinned versions (no `:latest`)
- [ ] All services have `restart: always`
- [ ] All services have health checks (except helpers)
- [ ] Two networks: `[app]-net` (bridge) + `dokploy-network` (external)
- [ ] Databases/caches on internal network only
- [ ] Web services on both networks
- [ ] Named volumes (no bind mounts except for config)
- [ ] Required vars use `:?` syntax with clear messages
- [ ] Optional vars use `:-` syntax with sensible defaults
- [ ] **Cloudflare services configured if needed**

### template.toml
- [ ] Variables section complete
- [ ] Domain configuration correct
- [ ] Environment organized by category
- [ ] Secrets use password/base64 generators
- [ ] **Cloudflare credentials left blank for user input**
- [ ] Service names match docker-compose.yml

### Cloudflare Integration (if applicable)
- [ ] R2 configuration complete with all required env vars
- [ ] DNS-01 challenge configured correctly
- [ ] Zero Trust middleware labels correct
- [ ] Worker stub created (if needed)
- [ ] Cloudflare setup guide in README.md
- [ ] All CF credentials use variable syntax (no hardcoding)

### README.md (template)
- [ ] Overview and features
- [ ] Architecture diagram shows Cloudflare services
- [ ] **Cloudflare setup guide** (step-by-step)
- [ ] Configuration table with all variables
- [ ] Post-deployment steps
- [ ] Troubleshooting section (includes CF issues)
- [ ] Resource requirements documented

### blueprints/README.md (index)
- [ ] Template added in alphabetical order
- [ ] Row properly formatted (4 columns aligned)
- [ ] Description mentions Cloudflare if integrated
- [ ] Service count matches docker-compose.yml
- [ ] Status is "Ready"

### Security
- [ ] No hardcoded secrets anywhere
- [ ] Cloudflare credentials handled securely
- [ ] Databases not on dokploy-network
- [ ] Proper certificate resolver configured
- [ ] Health endpoints don't expose sensitive data

---

## Success Metrics

### Token Efficiency
- **Target:** 30,000-45,000 tokens per template
- **Baseline (multi-agent):** 75,000+ tokens
- **Reduction:** 35-40% vs traditional approach

### Quality Metrics
- **Template Completeness:** 100% (all files generated)
- **Convention Compliance:** 100% (all checks pass)
- **Cloudflare Integration:** 90%+ (when applicable)
- **Documentation Quality:** >300 lines README with CF guide

### Time Efficiency
- **Phase 1 (Discovery):** ~5-10 minutes
- **Phase 2 (Architecture):** ~3-5 minutes
- **Phase 3 (Generation):** ~10-15 minutes (6 skills)
- **Phase 4 (Validation):** ~5-7 minutes (2 skills)
- **Phase 5 (Documentation):** ~8-12 minutes
- **Phase 6 (Index Update):** ~2-3 minutes
- **Total:** ~33-52 minutes end-to-end

---

## Integration with Other Workflows

### Command Integration

| Command | Relationship | Usage Pattern |
|---------|--------------|---------------|
| `/start-session` | Prerequisite | Run before template creation |
| `/plan` | Alternative | For complex templates needing planning |
| `/test-all` | Follow-up | Test generated docker-compose locally |
| `/docs` | Follow-up | Generate additional documentation |

### Skill Dependencies

This command requires these skills in `.claude/skills/`:

| Skill | Phase | Critical? |
|-------|-------|-----------|
| dokploy-multi-service | 2 | Yes |
| dokploy-compose-structure | 3.1 | Yes |
| dokploy-traefik-routing | 3.2 | Yes |
| dokploy-health-patterns | 3.3 | Yes |
| **dokploy-cloudflare-integration** | **3.4** | **Yes (when CF needed)** |
| dokploy-environment-config | 3.5 | Yes |
| dokploy-template-toml | 3.6 | Yes |
| dokploy-security-hardening | 4.1 | Yes |
| dokploy-template-validation | 4.2 | Yes |

---

## Troubleshooting

### Issue 1: Cloudflare R2 Configuration Unclear

**Symptoms:** Unsure when to use R2 vs local volumes

**Decision Matrix:**
```
Use R2 when:
- App handles user uploads (files, images, videos)
- App needs shared storage across instances
- App generates backups that should be off-server
- App serves media files (benefit from CF CDN)

Use local volumes when:
- App only stores config/database files
- Storage needs are small (<10GB)
- No external access to files needed
```

**Solution:** Ask user about use case, default to R2 if in doubt

### Issue 2: DNS-01 vs HTTP-01 Challenge

**Symptoms:** Unsure which Let's Encrypt challenge to use

**Decision Matrix:**
```
Use DNS-01 (Cloudflare) when:
- Need wildcard certificate (*.domain.com)
- Service not publicly accessible yet
- Running on internal network (Tailscale, etc.)

Use HTTP-01 (default) when:
- Simple single-domain setup
- Service already publicly accessible
- No Cloudflare account available
```

**Solution:** Default to HTTP-01, offer DNS-01 as upgrade

### Issue 3: Zero Trust vs Basic Auth

**Symptoms:** Unclear when to use Cloudflare Access

**Decision Matrix:**
```
Use Zero Trust (Cloudflare Access) when:
- Protecting sensitive admin panels
- Need SSO/OAuth integration
- Want audit logs of access
- Multi-user admin access needed

Use Basic Auth when:
- Simple single-user access
- No Cloudflare account
- Testing/development environment
```

**Solution:** Offer as optional enhancement, not default

### Issue 4: Skill Loading Failure

**Symptoms:** dokploy-[skill-name] not found

**Diagnosis:**
```bash
# Check if skill exists
ls .claude/skills/dokploy-cloudflare-integration/SKILL.md

# Check skill registry
cat .claude/skills/registry.json | grep cloudflare
```

**Solution:** Fall back to manual pattern from AGENTS.md or project docs

### Issue 5: Template Validation Fails

**Symptoms:** Phase 4 validation finds issues

**Common Issues:**
```
1. Hardcoded Cloudflare credentials
   Fix: Replace with ${VAR:?message} syntax

2. R2 endpoint uses wrong format
   Fix: https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com

3. DNS-01 certresolver not configured
   Fix: Add CF_DNS_API_TOKEN environment variable

4. Zero Trust middleware malformed
   Fix: Verify team name and path configuration
```

**Recovery:** Loop back to Phase 3, fix issue, re-validate (max 3 iterations)

---

## Examples

### Example 1: Simple App (Vaultwarden)

**Input:** `/dokploy-create vaultwarden`

**Phase 1:** Discover that Vaultwarden is password manager, needs optional R2 for backups

**Phase 2:** Architecture - single service, R2 optional, Zero Trust optional for admin

**Phase 3:** Generate single-service compose with R2 integration option

**Phase 4:** Validate - all checks pass

**Phase 5:** Document with Cloudflare R2 backup setup guide

**Cloudflare Integration:**
- R2: Optional (for backup storage)
- DNS-01: No (simple single domain)
- Zero Trust: Optional (for /admin protection)

**Token Usage:** ~28,000 tokens (simple template)

### Example 2: Complex Stack (Paperless-ngx)

**Input:** `/dokploy-create paperless-ngx`

**Phase 1:** Discover 5-service stack (web, postgres, redis, tika, gotenberg)

**Phase 2:** Architecture - multi-service with R2 for document storage

**Phase 3:** Generate complete stack with R2 integration for documents/media

**Phase 4:** Validate - initial failure (missing health check), fix, re-validate

**Phase 5:** Document comprehensive setup with R2 document storage guide

**Cloudflare Integration:**
- R2: Yes (document and media storage)
- DNS-01: Optional (if wildcard needed)
- Zero Trust: Recommended (for sensitive documents)

**Token Usage:** ~42,000 tokens (complex template with iteration)

### Example 3: GitHub URL Input (AR.IO Gateway)

**Input:** `/dokploy-create https://github.com/ar-io/ar-io-node`

**Phase 1:** WebFetch repository README, discover 4-service stack with complex requirements

**Phase 2:** Architecture - envoy + core + redis + observer, DNS-01 for wildcard

**Phase 3:** Generate with Cloudflare DNS-01 challenge (needs wildcard for ArNS)

**Phase 4:** Validate - all checks pass

**Phase 5:** Document with ArNS DNS setup guide

**Cloudflare Integration:**
- R2: Yes (for Arweave data storage - massive scale)
- DNS-01: Yes (ArNS requires wildcard certs)
- Zero Trust: Optional (for admin API)

**Token Usage:** ~38,000 tokens (complex with Cloudflare DNS)

---

## Version History

### 2.1.0 (2025-12-26)

**Major Enhancements:**
- Added formal phased workflow architecture with visual diagram
- Expanded Cloudflare-first integration strategy with decision matrices
- Added comprehensive error handling patterns for all phases
- Included pre-execution validation checks
- Added success metrics and token budget tracking
- Enhanced troubleshooting section with Cloudflare-specific issues
- Documented integration with other commands and workflows

**Cloudflare Improvements:**
- Added Cloudflare Service Selection Matrix
- Expanded Phase 2 Cloudflare integration questions
- Enhanced Phase 3.4 with R2, DNS-01, Zero Trust, Workers examples
- Added dedicated Cloudflare setup guide requirements for documentation
- Included Cloudflare-specific security validations
- Added troubleshooting decision matrices for CF service selection

**Quality Improvements:**
- Added per-phase success criteria
- Included quality checklist with Cloudflare items
- Documented expected token usage ranges
- Added time efficiency metrics per phase

**Known Limitations:**
- Cloudflare Workers skill not yet implemented (manual stubs created)
- Token budget varies significantly with template complexity (28K-45K)

**Future Enhancements:**
- Cloudflare D1 integration skill
- Cloudflare KV namespace binding skill
- Automated Cloudflare resource provisioning
- Template testing framework integration

### 2.0.0 (2024-12-01)

**Initial skills-first release:**
- Progressive skill loading (6 generation skills, 2 validation skills)
- Cloudflare defaults for external services
- 35% token reduction vs multi-agent approach

---

## Appendix: Cloudflare Quick Reference

### R2 Setup Commands

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create [bucket-name]

# Generate R2 API token
# (Done via Dashboard → R2 → Manage R2 API Tokens)
```

### DNS API Token Permissions

Required permissions for DNS-01 challenge:
```
Zone → DNS → Edit
Zone Resources → Include → Specific zone → [your-domain.com]
```

### Zero Trust Application Config

```yaml
# Example Access Policy
Name: [App Name] Admin Panel
Application Domain: ${DOMAIN}/admin
Identity Providers: [Google, GitHub, Email]
Policies:
  - Name: Allow Admins
    Action: Allow
    Include: Emails ending in @yourdomain.com
```

---

**Document Maintained By:** Home Lab Infrastructure Team
**Review Cycle:** Quarterly or upon Cloudflare service updates
**Next Review:** March 2025
**Contact:** See repository issues for questions
