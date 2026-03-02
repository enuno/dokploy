# Claude Code Configuration

**Version:** 2.1.0
**Last Updated:** March 1, 2026
**Project:** Dokploy Templates with Cloudflare Integration
**Status**: 77 production-ready templates, validated framework

---

## Primary Reference

**Universal Standards**: `.github/copilot-instructions.md` (~500 tokens)  
**Extended Documentation**: `AGENTS.md` (~800 tokens)  
**Skills**: `.claude/skills/dokploy-*` (auto-loaded by relevance)  
**Commands**: `.claude/commands/` for slash-command workflows

---

## Six-Phase Template Development (Validated Pattern)

**Framework** proven with Warpgate template (all phases PASSED):

| Phase | Time | Focus | Validation |
|-------|------|-------|-----------|
| 1: Requirements | 10 min | App analysis | Profile doc |
| 2: Architecture | 10 min | Service design | Design doc |
| 3: Generation | 20 min | Files (6 skills) | Syntax check |
| 4: Validation | 5 min | Security + conventions | EXCELLENT + 100% PASS |
| 5: Documentation | 10 min | README + examples | 350+ lines |
| 6: Integration | 5 min | Index update | Alphabetical order |

**Total**: ~60 minutes per template, zero defects on validation

---

## Skills-First Approach (Progressive Loading)

**Pattern** achieves 35% token reduction:
- Phase 3: Load 6 skills sequentially (not all upfront)
- Phase 4: Use generic validator agents (not specialized)
- Reusable skills in `.claude/skills/dokploy-*` (portable across projects)

**Warpgate Skills Loaded**:
1. dokploy-compose-structure (base YAML)
2. dokploy-traefik-routing (HTTPS/routing)
3. dokploy-health-patterns (health checks)
4. dokploy-cloudflare-integration (optional Access)
5. dokploy-environment-config (variables)
6. dokploy-template-toml (template.toml)

---

## Session Initialization

When starting a Claude Code session:

1. **Load primary reference**: Read `.github/copilot-instructions.md` for universal standards
2. **Primary command**: `/dokploy-create [github-url]` for automated template generation (6-phase framework)
3. **Reference extended docs**: `AGENTS.md` for design patterns and API references

### Template Creation Workflow

```bash
/dokploy-create https://github.com/org/app/
```

Automatically executes:
- Phase 1: Requirements discovery (manual questions)
- Phase 2: Architecture design (manual planning)
- Phase 3: Progressive skill loading + file generation
- Phase 4: Security + convention validation (agents)
- Phase 5: Documentation generation
- Phase 6: Repository index update + git commit/push

**Result**: Production-ready 3-file template in `/blueprints/[app-name]/` with full documentation

---

## Permission Boundaries

### ✅ Allowed Without Prompting
- Read any repository file
- Validate templates: `npm run validate -- blueprints/[name]`
- Type check single files: `npm run type-check path/to/file.ts`
- Format code: `npm run format -- path/to/file`
- Create new template files in `blueprints/[new-template]/`

### ⚠️ Ask First
- Install dependencies: `pnpm install [package]`
- Run full test suite: `npm run test:coverage`
- Execute Cloudflare API tests (requires credentials)
- Git operations: `git commit`, `git push`
- Modify environment variables or secrets

### 🚫 Forbidden
- `npm install -g` (global installs)
- `sudo` commands
- `rm -rf` (recursive deletion)
- Production deployments without approval
- Commit and push in single operation

---

## Quick Commands

```bash
# Validate template
npm run validate -- blueprints/[name]

# Test template
npm run test -- --grep "[name]"

# Generate meta.json entry
npm run generate:meta

# Full validation
npm run validate:all && npm run test:coverage
```

---

## Template Standards (Quick Reference)

See `.github/copilot-instructions.md` and `AGENTS.md` for complete standards.

### Essential Security Patterns

**Environment Variables**:
```yaml
# Required with error message
VAR_NAME: ${VAR_NAME:?Set description}

# Optional with safe default
VAR_NAME: ${VAR_NAME:-default_value}
```

**Password Generation** (template.toml):
```toml
admin_password = "${password:32}"  # Auto-generated 32-char
```

**Traefik HTTPS** (6 mandatory labels):
- `traefik.enable=true`
- `traefik.http.routers.{name}.rule=Host(...)`
- `traefik.http.routers.{name}.entrypoints=websecure` ← HTTPS only
- `traefik.http.routers.{name}.tls.certresolver=letsencrypt`
- `traefik.http.services.{name}.loadbalancer.server.port={port}`
- `traefik.docker.network=dokploy-network`

### Key Rules
- Pinned image versions (no `:latest`) - use specific tags like `0.20.2`
- Variables use `${helper}` or `${ENV_VAR}` syntax
- Service names match between compose and TOML
- Never hardcode credentials or secrets
- Cloudflare vars use `${CF_*}` pattern
- Network isolation: internal bridge + external Traefik network
- Health checks required (HTTP endpoint + sensible defaults)
- No privileged containers unless documented

### Validation Checklist (Phase 4)
- ✅ YAML syntax passes `docker compose config`
- ✅ TOML syntax valid
- ✅ Security review: no hardcoded secrets, HTTPS-only, proper isolation
- ✅ Convention compliance: image pinning, Traefik labels, restart policies
- ✅ Variables: required fields use `?` syntax, optional use `-` syntax
