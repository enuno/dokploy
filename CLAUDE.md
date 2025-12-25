# Claude Code Configuration (Skills-First Approach)

**Version:** 2.0.0
**Last Updated:** December 24, 2025
**Purpose:** Claude Code skills-first configuration for Dokploy templates + Cloudflare integration

---

## 📌 Source of Truth

This file is a **working reference** to the universal standards defined in **[AGENTS.md](./AGENTS.md)**.

**All universal standards, naming conventions, DOS/DON'Ts, CLI commands, and security boundaries are centrally maintained in AGENTS.md.**

---

## 🎯 Skills-First Paradigm

**Claude Code now uses a skills-first approach instead of specialized agents:**

### Traditional Multi-Agent (Deprecated)
```
User → Specialized Agent → Fixed Workflow → Output
Problems:
- 15x token baseline (expensive)
- Fixed agent roles (not reusable)
- Maintenance burden (update entire agent)
```

### Skills-First (Current)
```
User → Generic Agent → Progressive Skill Loading → Output
Benefits:
- 5-7x token baseline (35% reduction)
- Portable skills (reusable across projects)
- Easy maintenance (update individual skills)
- Context continuity (same agent throughout)
```

---

## 🎯 Claude Code Workflow

### 1. Session Initialization

When starting a Claude Code session for this project:

```
Hello! I'm working on Dokploy templates with Cloudflare integration.

This project uses a SKILLS-FIRST APPROACH:
- Generic agents load skills progressively (35% token savings)
- Skills located in .claude/skills/ directory
- Commands orchestrate skill loading (see .claude/commands/)
- AGENTS.md is the source of truth for all standards

Primary command: /dokploy-create [app-name]
- Loads 9 specialized skills progressively
- Maintains context throughout workflow
- Generates production-ready templates

Can you reference AGENTS.md and use the skills-first approach?
```

### 2. Memory & Context Management

**What Claude should remember:**
- Universal coding standards (AGENTS.md sections 2-3)
- Dokploy template structure requirements (AGENTS.md section 4)
- Cloudflare integration patterns (AGENTS.md section 3)
- Permission boundaries (AGENTS.md section 7)
- CLI commands for validation/testing (AGENTS.md section 6)

**What to ask me to clarify:**
- Specific Cloudflare service requirements (D1 vs R2 vs Workers)
- Target Docker image versions
- Complex multi-service orchestration requirements
- Custom environment variable schemes

### 3. Allowed Tools & Permissions

#### ✅ Always Permitted
```bash
# File operations
- Read/search files and directories
- Create new template files in blueprints/[name]/

# Code generation
- Write docker-compose.yml files
- Generate template.toml with proper variable handling
- Create Cloudflare Worker stub files
- Update meta.json entries

# Validation (non-destructive)
npm run validate -- blueprints/[template]
npm run type-check
npm run lint:ts -- path/to/file.ts
npm run format -- path/to/file.ts

# Testing (single file)
npm run test -- tests/template-validation.test.ts --grep "specific"

# Documentation
- Generate/update .md files
- Create CHANGELOG entries
- Update README sections
```

#### ⚠️ Ask Before Executing
```bash
# Package management
pnpm install [package]
pnpm update

# Full test suite
npm run test:coverage

# Cloudflare API tests (requires credentials)
npm run test:cloudflare

# Staging deployment
npm run deploy:staging

# Git operations
git commit -m "..."
git push origin [branch]
```

#### 🚫 Never Execute
```bash
# Dangerous operations
- npm install -g
- rm -rf [directory]
- sudo commands
- Production deployments
- Cloudflare zone modifications (non-staging)
- Direct database changes outside test context
```

---

## 🏗️ Primary Command: /dokploy-create

**Skills-First Template Creation Workflow**

Instead of fixed "tasks" and "roles," Claude Code uses **progressive skill loading** through the `/dokploy-create` command:

### Phase 1: Discovery (No Skills)
**Claude Code actions:**
1. Review **AGENTS.md Section 4** (Dokploy Template Structure)
2. Research application (WebSearch, WebFetch)
3. Ask clarifying questions:
   - What's the primary service?
   - Cloudflare integration needed?
   - Dependencies?
   - Storage requirements?
4. Gather requirements

**Output:** Requirements document

### Phase 2: Architecture (Load: dokploy-multi-service)
**Claude Code loads skill:** `dokploy-multi-service`

**Skill generates:**
- Service dependency graph
- Network topology design
- Cloudflare service selection
- Health check strategy

**Output:** Architecture design document

### Phase 3: Generation (Load: 6 Skills Progressively)
**Claude Code loads skills in sequence:**

1. `dokploy-compose-structure` → Base docker-compose.yml
2. `dokploy-traefik-routing` → Traefik labels
3. `dokploy-health-patterns` → Health checks
4. `dokploy-cloudflare-integration` → CF config (if applicable)
5. `dokploy-environment-config` → Environment variables
6. `dokploy-template-toml` → template.toml with variable mappings

**Output:**
- Complete docker-compose.yml
- Complete template.toml
- All variables properly mapped

### Phase 4: Validation (Load: 2 Skills Sequentially)
**Claude Code loads skills:**

1. `dokploy-security-hardening` → Security review
2. `dokploy-template-validation` → Convention compliance

**Final validation:**
- Run `docker compose config` to validate syntax
- Verify all quality gates pass

**Output:** Validated, production-ready templates

### Phase 5: Documentation (No Skills)
**Claude Code generates:**
- Template README.md
- Configuration variables table
- Cloudflare setup guide (if applicable)
- Troubleshooting section
- Post-deployment steps

**Output:** Complete documentation

---

## 🚀 Common Claude Code Workflows

### Workflow A: Create New Template from Scratch (Skills-First)

```
User: /dokploy-create nextjs-postgres "NextJS + PostgreSQL with Cloudflare Pages"

Claude Code Process:

Phase 1: Discovery (No Skills)
  ✓ Research NextJS Docker image and requirements
  ✓ Identify PostgreSQL as dependency
  ✓ Note Cloudflare Pages integration

Phase 2: Architecture
  Load skill: dokploy-multi-service
  ✓ Design NextJS → PostgreSQL dependency
  ✓ Plan network topology
  ✓ Select Cloudflare Pages for static assets

Phase 3: Generation
  Load skills progressively:
  ✓ dokploy-compose-structure → Base YAML
  ✓ dokploy-traefik-routing → Web routing
  ✓ dokploy-health-patterns → Service health
  ✓ dokploy-cloudflare-integration → CF Pages config
  ✓ dokploy-environment-config → Env vars
  ✓ dokploy-template-toml → template.toml

Phase 4: Validation
  Load skills:
  ✓ dokploy-security-hardening → Security review
  ✓ dokploy-template-validation → Compliance check
  Run: docker compose config

Phase 5: Documentation
  ✓ Generate README.md
  ✓ CF Pages setup guide
  ✓ Troubleshooting section

Result: Complete template in blueprints/nextjs-postgres/
Tokens used: ~30-40K (vs 75K+ for multi-agent approach)
Context: Maintained throughout workflow
```

### Workflow B: Add Cloudflare Integration to Existing Template

```
User: "Add Cloudflare Workers to the Grafana template"

Claude Action:
1. [RESEARCHER] Review current Grafana template
   - Existing docker-compose.yml
   - Current template.toml
   - Integration points
   
2. [ARCHITECT] Plan CF Workers integration
   - What function? (reverse proxy, auth, etc.)
   - Required CF credentials
   - KV/D1 binding needs
   
3. [BUILDER] Implement
   - Update template.toml with CF_* variables
   - Create cloudflare-worker.js stub
   - Update environment config
   
4. [VALIDATOR] Test
   npm run test:cloudflare
   
5. [SCRIBE] Update documentation
```

### Workflow C: Fix Template Validation Error

```
User: "Template validation is failing for pocketbase, can you debug?"

Claude Action:
1. Run validation to see error:
   npm run validate -- blueprints/pocketbase
   
2. Examine template files:
   - blueprints/pocketbase/docker-compose.yml
   - blueprints/pocketbase/template.toml
   - tests/env-variables.test.ts (if variable error)
   
3. Identify issue (common patterns):
   - Undefined variable reference: ${UNDEFINED_VAR}
   - Service name mismatch: serviceName vs docker service
   - Invalid TOML syntax
   - Missing environment variable declaration
   
4. Fix and revalidate:
   npm run validate -- blueprints/pocketbase
   
5. Provide user with fixed template
```

---

## 📚 Key References for Claude

### Must Read First
- **AGENTS.md Section 2**: Universal naming conventions
- **AGENTS.md Section 4**: Dokploy template structure (CRITICAL)
- **AGENTS.md Section 5**: Design patterns (reference when designing)

### Consult When
| Scenario | Reference |
|----------|-----------|
| Creating Cloudflare integration | AGENTS.md Section 3 |
| Writing tests | AGENTS.md Section 5 (Testing Standards) |
| Stuck on variables | AGENTS.md Section 4.4 (Variable Inheritance) |
| Unsure about permissions | AGENTS.md Section 7 |
| Need CLI command | AGENTS.md Section 6 |
| Multi-container patterns | AGENTS.md Section 5 (Design Patterns) |
| Git workflow | AGENTS.md Section 9 |

### External Docs
- **Dokploy Templates**: https://docs.dokploy.com/docs/core/templates
- **Cloudflare API**: https://developers.cloudflare.com/api
- **Docker Compose**: https://docs.docker.com/compose/compose-file/
- **TOML Spec**: https://toml.io

---

## 🔒 Claude-Specific Security Rules

### Credentials Handling
- **NEVER** provide raw credentials in responses
- **ALWAYS** reference variables: `${CF_API_TOKEN}` not actual token
- **ALWAYS** ask user to set secrets in .env.local (gitignored)
- **ALWAYS** mark sensitive variables with comments: `# SENSITIVE: user must provide`

### File Safety
- **NEVER** execute `rm -rf` or recursive deletes
- **ALWAYS** verify filenames before deletion
- **ALWAYS** ask before modifying:
  - package.json scripts
  - CI/CD workflows
  - .github/ files
  - .env files

### Cloudflare Safety
- **NEVER** modify actual Cloudflare zones (staging only)
- **ALWAYS** test in staging before production recommendations
- **ALWAYS** verify CF credentials are environment variables, not hardcoded

---

## 💬 How to Interact with Claude

### Clear Instructions
```
"Create a Grafana template following AGENTS.md standards.
- docker-compose.yml with Grafana service
- template.toml with password and domain variables
- Validate with: npm run validate -- blueprints/grafana
- Follow design patterns from AGENTS.md Section 5"
```

### When Claude Asks Clarifying Questions
**Good:** Claude asks about Cloudflare requirements, multi-service needs, version preferences  
**Respond clearly** with specific needs: "We need Cloudflare D1 database integration, PostgreSQL for local dev, and CF Workers for authentication"

### When Claude Suggests Something
**If it violates AGENTS.md:**
```
"That approach violates AGENTS.md Section 4.2 (no hardcoded credentials). 
Instead, use variable references: ${CF_API_TOKEN}"
```

**If it requires permission:**
```
"Before running 'git push', let me review the commit message and validate all tests pass first."
```

### Staging Links in Claude Responses
When Claude suggests testing in staging, request:
```
"Please provide the staging deployment command and 
the URL to access the deployed template"
```

Example:
```
npm run deploy:staging --template=grafana
Staging URL: https://dokploy-staging.example.com/services/grafana-xyz
```

---

## 📊 Quality Gates Claude Must Follow

Before submitting any template:

```
✅ docker-compose.yml passes lint
✅ template.toml passes lint and syntax validation
✅ All variables are declared in [variables] section
✅ No hardcoded secrets or credentials
✅ Specific Docker image versions (no 'latest')
✅ Service names match between docker-compose and template.toml
✅ meta.json entry created/updated
✅ Tests pass: npm run test:coverage (>80% coverage)
✅ Staging deployment successful
✅ Documentation complete
```

**Claude should ALWAYS run these checks before saying "template is ready"**

---

## 🎓 Quick Start for Claude

1. **First time?** Read AGENTS.md Sections 1-7
2. **Creating template?** Go to Task 1 → Task 2 → Task 3 above
3. **Stuck?** Check the "Consult When" table above
4. **Need permissions?** Review AGENTS.md Section 7
5. **Final check?** Review Quality Gates section above

---

**Remember:** AGENTS.md is the source of truth. When in doubt, reference it explicitly.
