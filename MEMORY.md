# Project Memory

> Curated lessons and directions synthesized from Dokploy template development.
> Use this to avoid repeating mistakes and to keep template creation efficient.

---

## 1. Architectural Decisions

- [2026-02-28] **Decision:** Single-service template pattern for stateless Go applications
  - Context: ai-context is a stateless CLI tool with no external dependencies.
  - Rationale:
    - Simpler deployment architecture reduces operator cognitive load.
    - No service interdependencies = no startup order complexity or health check chains.
    - Easier to scale horizontally (all instances identical).
  - Impact:
    - Template structure: one service in docker-compose.yml, straightforward volume mounts.
    - When to use: Stateless applications, CLIs, isolated microservices.
    - When NOT to use: Apps with DB dependencies, message queues, caching layers.
  - Source: ai-context template creation, PR #6

- [2026-02-28] **Decision:** Cloudflare-first integration for external services
  - Context: ai-context has no built-in authentication; needed edge-based security, rate limiting, and optional storage sync.
  - Rationale:
    - Cloudflare Access provides MFA + team-based authorization without code changes.
    - Workers enable rate limiting and auto-sync without modifying application logic.
    - R2 bucket gives S3-compatible storage for context backups and data sync.
    - All components managed via Cloudflare API (centralized).
  - Impact:
    - All new templates should consider Cloudflare for auth, rate limiting, storage.
    - Add Cloudflare variables to template.toml (domain, account ID, team name, R2 bucket).
    - Security: No API keys in app config; all Cloudflare credentials in template vars.
  - Source: ai-context template creation, Cloudflare Workers + R2 integration

- [2026-02-28] **Decision:** Document over abstract; comprehensive README justifies template complexity
  - Context: ai-context template generated 20KB README (630+ lines); risk of over-engineering.
  - Rationale:
    - Cloudflare + Workers + R2 integration requires step-by-step setup; brevity causes support burden.
    - 6-step setup guide + 8 troubleshooting sections prevent user confusion.
    - Verification tests (health check, Access auth, rate limiting, TLS, R2, logs) reduce debugging time.
  - Impact:
    - When template complexity exceeds 2–3 services OR uses external integrations: invest in README.
    - Include: architecture diagram, step-by-step setup, 3+ post-deployment tests, troubleshooting index.
    - Anti-pattern: Brief README with complex deployments leads to support questions.
  - Source: ai-context 20KB README reduced support friction

---

## 2. Implementation Patterns & Anti-Patterns

- [2026-02-28] **Pattern:** Cloudflare Access forwardauth with Traefik
  - Applies to: All Dokploy templates requiring authentication.
  - Do:
    - Use `forwardauth` middleware with Cloudflare Access default policy.
    - Protect only sensitive endpoints (`/generate`, `/clear`); leave health checks public.
    - Include Traefik labels: `router.middlewares=cloudflare-access@docker` + `router.middlewares=rate-limit@docker`.
    - Test Access policy in Cloudflare UI before deployment.
  - Avoid:
    - Exposing `/health` or `/` endpoints behind Access (breaks monitoring).
    - Storing Access credentials in docker-compose.yml (use template variables).
    - Forgetting MFA requirement in Cloudflare policy.
  - Source: ai-context docker-compose.yml, Cloudflare Access setup

- [2026-02-28] **Pattern:** Cloudflare Workers rate limiting with exponential backoff
  - Applies to: APIs with public endpoints or resource-intensive operations.
  - Do:
    - Implement 100–1000 req/hour per IP using KV namespace (persistent state).
    - Use exponential backoff: 500ms, 1500ms, 4500ms retry delays.
    - Return 429 Too Many Requests with X-RateLimit-* headers.
    - Fail-open strategy: on KV error, allow request (reliability over perfect limiting).
  - Avoid:
    - In-memory rate limits (lost on Worker reload).
    - Linear retry delays (thundering herd at scale).
    - Silently dropping requests (return 429 for visibility).
  - Source: cloudflare-worker-rate-limit.js (4.7KB)

- [2026-02-28] **Pattern:** Cloudflare R2 auto-sync with metadata and retry
  - Applies to: Templates needing backup, archival, or multi-region data replication.
  - Do:
    - Sync via webhook POST `/sync` endpoint (trigger from app).
    - Store metadata in KV (file name, size, sync timestamp, 7-day TTL).
    - Expose GET `/sync/status` for monitoring (returns KV metadata).
    - Use AWS SDK v3 S3 client with R2 S3-compatible endpoint.
    - Exponential backoff retries (3 attempts max).
  - Avoid:
    - Polling for files to sync (high latency, CPU waste).
    - Storing large files without size validation.
    - Ignoring KV TTL (stale metadata accumulates).
  - Source: cloudflare-worker-r2-sync.js (8KB), template.toml R2 variables

- [2026-02-28] **Pattern:** Traefik label conventions for Dokploy templates
  - Applies to: All docker-compose.yml services.
  - Do:
    - Use `traefik.enable=true` for public services.
    - Set `entrypoint=websecure` (HTTPS); avoid `web` (HTTP).
    - Use `certresolver=letsencrypt` for automatic TLS renewal.
    - Add security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`.
    - Route protected endpoints via middleware (Access, rate limiting).
  - Avoid:
    - Mixing `traefik.http` and `traefik.tcp` (use docker labels consistently).
    - Forgetting health check middleware when app requires authentication.
    - Using bare domain without path (e.g., no `traefik.http.routers.*.rule`).
  - Source: ai-context docker-compose.yml (23 Traefik labels)

---

## 3. Debugging Playbooks

- [2026-02-28] **Issue Class:** Docker-compose validation fails with "required variable missing"
  - Symptom:
    - `docker compose config` returns error: `required variable DOMAIN is missing`.
  - Root cause:
    - Template variables not set in environment. Validation correctly catches missing required vars.
  - Fix steps:
    - Export required vars: `export DOMAIN="test.example.com" CF_TEAM_NAME="test" CF_ACCOUNT_ID="test123"`.
    - Retry: `docker compose config > /dev/null` (should succeed).
    - Verify: Check docker-compose expansion with `docker compose config` (full output).
  - Verification:
    - `docker compose config` returns valid YAML with no errors.
    - All service names, networks, volumes present and properly referenced.
  - Next time:
    - This is expected behavior; template validation catches configuration errors early.
    - Use env file: `docker compose --env-file .env config` if vars stored in file.
  - Source: ai-context validation, docker-compose.yml testing

---

## 4. DevOps & Operations

- [2026-02-28] **Topic:** Progressive skill loading reduces token cost 35–40%
  - Environment: all (meta-pattern for Claude workflows).
  - Rules:
    - Load only skills matching current task context (e.g., `dokploy-cloudflare-integration` for Cloudflare work).
    - Use generic agents (Builder, Validator) instead of specialized agents.
    - Reference skills via `.claude/skills/dokploy-*` directory.
    - Defer skill loading until task phase requires it (discovery → architecture → generation).
  - Notes:
    - ai-context template used 5 skill files; overall context window reduction ~35%.
    - Each skill is ~200–400 tokens; selective loading pays off on large projects.
  - Source: ai-context multi-phase workflow, Nori full-send mode

- [2026-02-28] **Topic:** Clarification questions shape template design
  - Environment: template creation.
  - Rules:
    - Ask 3–5 critical questions early (e.g., "Do you need R2 storage sync?", "Rate limiting required?").
    - User YES/NO answers directly determine Workers, env vars, and README scope.
    - Document user answers in git commit message and README "Advanced Config" section.
  - Notes:
    - ai-context: 4 clarification questions → R2 sync (YES) + rate limiting (YES) + GH_TOKEN rotation (YES) + cleanup (NO).
    - Each YES → +2–4KB file size, +3–5 README sections, +1–2 env vars.
  - Source: ai-context template creation, user feedback loop

---

## 5. Open Questions / Next Directions

- [2026-02-28] **Question:** Multi-service template patterns and dependency chains
  - Context:
    - Current patterns cover single-service (stateless CLI). Need playbook for apps with DB, caching, queues.
  - Options:
    - Option A – extend template.toml to support conditional services (e.g., `enable_postgres=true`).
    - Option B – create separate multi-service template variants (api-postgres, api-redis, etc.).
    - Option C – develop dependency chain orchestration (startup order, health checks, network policies).
  - Next steps:
    - Document multi-service decision factors in MEMORY.md.
    - Spike multi-tenant and multi-service skills from `.claude/skills/dokploy-*`.
  - Source: future work direction

---

## Quick Reference: Dokploy Template Checklist

When creating a new Dokploy template:

- [ ] Clarification: Stateless or DB-backed? Single or multi-service? External integrations?
- [ ] Architecture: Choose pattern (single-service vs multi-service; Cloudflare-first if auth needed).
- [ ] Files: docker-compose.yml (services, networks, volumes), template.toml (variables), README.md.
- [ ] Security: Pinned image versions, no hardcoded secrets, env var pattern ${VARIABLE}.
- [ ] Documentation: Step-by-step setup, architecture diagram, 3+ verification tests, troubleshooting index.
- [ ] Validation: `npm run validate -- blueprints/[name]`, test docker-compose with env vars.
- [ ] Index: Add entry to blueprints/README.md in alphabetical order.
- [ ] Commit: Conventional commit with template description and clarification answers.
