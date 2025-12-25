# Dokploy Templates + Cloudflare Integration - AI Coding Agent System

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**Repository:** https://github.com/enuno/dokploy  
**Project Lead:** Ryno Crypto Mining Services - ServerDomes Network Engineering

---

## 📋 Overview

This repository contains **production-ready Dokploy application templates** with integrated **Cloudflare services** (Workers, Pages, D1, R2, KV, Analytics Engine). The project is managed by a **unified multi-agent AI coding system** that ensures consistent quality, rapid iteration, and automated validation.

### Key Features

- ✅ **Self-Contained Templates** - Each template is a complete Docker Compose + template.toml package
- ✅ **Cloudflare Integration** - Workers, Pages, D1, R2, KV support built-in
- ✅ **Production-Ready** - Tested, validated, staged before PR submission
- ✅ **AI-Assisted** - Claude designs, Cursor implements, Cline validates, Windsurf orchestrates
- ✅ **Automated Validation** - >80% test coverage, staging deployment, health checks
- ✅ **Zero-Trust Standards** - AGENTS.md as centralized source of truth for all agents

---

## 🎯 Quick Start

### For Humans

1. **Clone the repository**
   ```bash
   git clone https://github.com/enuno/dokploy.git
   cd dokploy
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Cloudflare credentials
   ```

3. **Install dependencies** (if using validation scripts)
   ```bash
   pnpm install
   ```

4. **View available templates**
   ```bash
   cat meta.json
   npm run validate:all
   ```

### For AI Agents (Skills-First Approach)

**Claude Code** uses a **skills-first approach** - instead of specialized agents, you use generic agents that load skills progressively:

1. **Create Dokploy Template** (Skills-First Command)
   ```
   /dokploy-create [application-name]
   ```

   **How it works:**
   - Generic Builder agent executes the command
   - Skills loaded progressively (dokploy-compose-structure, dokploy-template-toml, etc.)
   - **35% fewer tokens** than traditional multi-agent approach
   - **Maintained context** throughout the workflow

   See: [.claude/commands/dokploy-create.md](./.claude/commands/dokploy-create.md)

2. **Required Skills** (Project-Managed)
   ```
   .claude/skills/
   ├── dokploy-compose-structure/
   ├── dokploy-template-toml/
   ├── dokploy-traefik-routing/
   ├── dokploy-health-patterns/
   ├── dokploy-cloudflare-integration/
   ├── dokploy-environment-config/
   ├── dokploy-security-hardening/
   ├── dokploy-template-validation/
   └── dokploy-multi-service/
   ```

   **Skills are:**
   - Portable (work across projects)
   - Versioned independently
   - Loaded only when needed
   - Maintained separately

   See: [AGENTS.md](./AGENTS.md) for skills documentation

3. **Legacy Multi-Agent Documentation** (Reference Only)

   The following files document the **previous multi-agent approach** and are kept for reference:
   - [CURSOR.md](./CURSOR.md) - Cursor IDE multi-agent configuration
   - [CLINE.md](./CLINE.md) - Cline/Claude Dev MCP execution
   - [WINDSURF.md](./WINDSURF.md) - Windsurf async orchestration
   - [COPILOT.md](./COPILOT.md) - GitHub Copilot inline suggestions

   **Current Recommendation:** Use Claude Code with skills-first approach for **35% token efficiency** vs multi-agent patterns

---

## 📖 Documentation Structure

### For Everyone
- **[README.md](./README.md)** ← You are here (project overview)
- **[AGENTS.md](./AGENTS.md)** ⭐ **START HERE** (Universal standards & source of truth)
- **[SKILLS.md](./SKILLS.md)** 🆕 **Skills Ecosystem** (v2.0+ skills-first architecture)

### For Claude Code (v2.0+ Skills-First)
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code skills-first configuration
- **[SKILLS.md](./SKILLS.md)** - Complete skills ecosystem documentation
- **[.claude/commands/dokploy-create.md](./.claude/commands/dokploy-create.md)** - Primary command
- **[.claude/skills/](./.claude/skills/)** - Individual skill definitions

### For Other AI Tools (Legacy, Reference Only)
- **[CURSOR.md](./CURSOR.md)** - Cursor IDE configuration (v1.x multi-agent)
- **[COPILOT.md](./COPILOT.md)** - GitHub Copilot inline suggestions
- **[CLINE.md](./CLINE.md)** - Cline/Claude Dev MCP execution
- **[WINDSURF.md](./WINDSURF.md)** - Windsurf async orchestration

### For Project Coordination
- **[docs/MULTIAGENTPLAN.md](./docs/MULTIAGENTPLAN.md)** - Multi-agent workflows & handoffs
- **[docs/STAGING.md](./docs/STAGING.md)** - Staging environment setup
- **[docs/API.md](./docs/API.md)** - Cloudflare API integration guide
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security policies & audit logging
- **[docs/DESIGNSYSTEM.md](./docs/DESIGNSYSTEM.md)** - Dokploy template design patterns

### For Configuration
- **[.aiignore](./.aiignore)** - Files excluded from AI context
- **[.env.example](./.env.example)** - Environment variable template
- **[ai-agent.config.json](./ai-agent.config.json)** - Agent service configuration
- **[.cursor/settings.json](./.cursor/settings.json)** - Cursor IDE workspace config
- **[.windsurfrules](./.windsurfrules)** - Windsurf async workflow definition
- **[.clinerules](./.clinerules)** - Cline MCP server configuration

---

## 🎭 The Five AI Agents

### 1. **Claude** - Architect & Designer
**Role:** Strategic planning, architecture design, complex problem-solving  
**When to Use:** "Design a template for..."  
**Output:** Architecture documents, design specifications, guidance  
**File:** [CLAUDE.md](./CLAUDE.md)

```bash
# Example session start
"Hello! I'm working on Dokploy templates. 
Reference: AGENTS.md is my source of truth for all standards.
Design a Grafana + Prometheus monitoring stack template."
```

---

### 2. **Cursor** - Interactive Builder
**Role:** Hands-on code generation, local editing, fast iteration  
**When to Use:** "@builder Implement..."  
**Output:** Template files (docker-compose.yml, template.toml, etc.)  
**File:** [CURSOR.md](./CURSOR.md)

```bash
# In Cursor IDE
@builder Implement docker-compose.yml and template.toml based on architecture
@architect Review the template and suggest improvements
@cloudflare Add Cloudflare Workers integration
```

---

### 3. **Cline** - Local Validator & Executor
**Role:** Command execution, testing, validation, real-time feedback  
**When to Use:** "Cline, validate templates and run tests"  
**Output:** Test reports, validation results, staging URLs  
**File:** [CLINE.md](./CLINE.md)

```bash
# From Claude/Cursor/Terminal
npm run validate:all          # Validate all templates
npm run test:coverage         # Full test suite with coverage
npm run deploy:staging        # Deploy to staging
npm run test:cloudflare       # Test CF API integration
```

---

### 4. **Windsurf** - Async Orchestrator
**Role:** Background workflows, continuous monitoring, multi-agent coordination  
**When to Use:** "@windsurf-build Create template" (with async validation)  
**Output:** Async notifications, task queue status, continuous monitoring  
**File:** [WINDSURF.md](./WINDSURF.md)

```bash
# In Windsurf IDE
@windsurf-build Create complete Grafana template
# Windsurf runs validation in background
# Editor remains responsive
# Notified when ready
```

---

### 5. **Copilot** - Inline Assistant
**Role:** Quick code completions, inline suggestions, pattern helpers  
**When to Use:** Automatic (as you type in Cursor)  
**Output:** Code completions, suggestions, quick fixes  
**File:** [COPILOT.md](./COPILOT.md)

```bash
# In Cursor editor
# Type: [variables]
# Copilot suggests: main_domain = "${domain}"
# Press Tab to accept
```

---

## 🚀 Typical Workflow

### From Idea to Deployed Template (30 minutes)

```
T+0:  USER REQUESTS
      "Create a Redis caching layer template with Cloudflare integration"
      ↓

T+5:  CLAUDE (Design Phase)
      Designs architecture
      Output: Architecture doc with variables, services, CF integration
      ↓

T+10: CURSOR (Implementation Phase)
      Opens editor
      @builder Implement template from architecture
      Copilot suggests patterns as needed
      Output: docker-compose.yml, template.toml, meta.json
      ↓

T+15: WINDSURF (Async Monitoring)
      Detects new files
      Automatically triggers validation pipeline
      (Non-blocking - editor continues responsive)
      ↓

T+20: CLINE (Validation - Background)
      npm run validate        → checks syntax
      npm run test:coverage   → runs tests
      npm run test:cloudflare → tests CF APIs
      ↓

T+25: WINDSURF (Notification)
      "Validation complete ✅"
      Staging URL provided
      ↓

T+30: DEPLOYMENT READY
      "Template ready for PR"
      Staging: https://dokploy-staging.../redis-xyz
      Coverage: 82%
      All checks: ✅ PASS
```

**Total Time: 30 minutes with minimal manual intervention**

---

## 📚 File Finder: Find What You Need

| Need | File |
|------|------|
| **Universal standards (start here!)** | [AGENTS.md](./AGENTS.md) |
| **Design a new template** | Use Claude + [CLAUDE.md](./CLAUDE.md) |
| **Implement template** | Use Cursor + [CURSOR.md](./CURSOR.md) |
| **Validate & test locally** | Use Cline + [CLINE.md](./CLINE.md) |
| **Async monitoring while working** | Use Windsurf + [WINDSURF.md](./WINDSURF.md) |
| **Inline code suggestions** | Copilot auto-triggers + [COPILOT.md](./COPILOT.md) |
| **Multi-agent coordination** | [docs/MULTIAGENTPLAN.md](./docs/MULTIAGENTPLAN.md) |
| **Security policies** | [docs/SECURITY.md](./docs/SECURITY.md) |
| **Staging environment** | [docs/STAGING.md](./docs/STAGING.md) |
| **Cloudflare APIs** | [docs/API.md](./docs/API.md) |
| **Design patterns** | [docs/DESIGNSYSTEM.md](./docs/DESIGNSYSTEM.md) |
| **Environment setup** | [.env.example](./.env.example) |
| **Files to exclude from AI** | [.aiignore](./.aiignore) |

---

## 🛠️ Available Commands

### Validation & Testing
```bash
npm run validate:all              # Validate all templates
npm run validate -- blueprints/[name]  # Validate single template
npm run test:coverage             # Full test suite (>80% required)
npm run test -- tests/file.test.ts    # Single test file
```

### Linting & Formatting
```bash
npm run lint:ts                   # TypeScript linting
npm run lint:toml                 # TOML syntax check
npm run lint:docker               # Docker Compose syntax
npm run format                    # Format all files (Prettier)
npm run type-check                # TypeScript type checking
```

### Building & Deployment
```bash
npm run generate:meta             # Update meta.json
npm run build:template blueprints/[name]  # Build template base64
npm run deploy:staging --template=[name]  # Deploy to staging
```

### Cloudflare Integration
```bash
npm run test:cloudflare           # Test CF API integration
CF_API_TOKEN=xxx npm run test:cloudflare  # With token
```

### Documentation
```bash
npm run docs:generate blueprints/[name]   # Generate template docs
npm run docs:all                  # Generate all docs
```

---

## 🔒 Security & Credentials

### ⚠️ NEVER Commit These
- `.env.local` (local secrets, gitignored)
- `*.pem`, `*.key` (SSH keys)
- Database passwords in code
- Cloudflare API tokens hardcoded
- Any PII or sensitive data

### ✅ DO Use Environment Variables
```toml
# In template.toml
[variables]
cf_api_token = "${CF_API_TOKEN}"  # User provides via .env.local
postgres_password = "${password:32}"  # Auto-generated by Dokploy
```

### .env.local Setup
```bash
cp .env.example .env.local
# Edit with real credentials
# NEVER commit .env.local
```

---

## 🧪 Quality Standards

All templates must meet:

- ✅ **Validation:** 100% pass rate (`npm run validate:all`)
- ✅ **Test Coverage:** >80% (`npm run test:coverage`)
- ✅ **Staging Deployment:** Must succeed (`npm run deploy:staging`)
- ✅ **Cloudflare Integration:** API tests pass (if applicable)
- ✅ **Documentation:** Complete and clear
- ✅ **No Secrets:** Hardcoded credentials forbidden

---

## 🔄 Contributing

### Add a New Template

1. **Design Phase (Claude)**
   ```
   "Design a template for [service] with [features]"
   Output: Architecture document
   ```

2. **Implementation Phase (Cursor)**
   ```
   "@builder Implement the template"
   Output: docker-compose.yml, template.toml
   ```

3. **Validation Phase (Cline)**
   ```
   "Validate and test the template"
   Output: Test results + staging URL
   ```

4. **Submit PR**
   ```
   git checkout -b template/[service-name]
   git add blueprints/[service-name]
   git commit -m "template: feat [service-name]: description"
   git push origin template/[service-name]
   ```

Include staging link in PR description!

---

## 📊 Project Structure

```
dokploy-templates-cloudflare/
├── AGENTS.md                    # ⭐ Universal standards (read first!)
├── README.md                    # This file
├── CLAUDE.md, CURSOR.md, etc.   # Agent-specific configs
├── .aiignore                    # Files excluded from AI
├── .env.example                 # Environment template
├── ai-agent.config.json         # Agent service config
│
├── blueprints/                  # Template definitions
│   ├── grafana/
│   ├── pocketbase/
│   └── [new-template]/
│
├── tests/                       # Test suite
│   ├── template-validation.test.ts
│   ├── env-variables.test.ts
│   └── cloudflare-api.test.ts
│
├── docs/                        # Extended documentation
│   ├── MULTIAGENTPLAN.md
│   ├── STAGING.md
│   ├── API.md
│   ├── SECURITY.md
│   └── DESIGNSYSTEM.md
│
├── .cursor/                     # Cursor IDE config
│   ├── settings.json
│   └── rules/
│
├── .windsurf/                   # Windsurf config
│   └── rules/
│
├── .github/
│   └── copilot-instructions.md
│
└── meta.json                    # Template registry
```

---

## 🤝 Multi-Agent Collaboration Example

```
SCENARIO: Add Cloudflare D1 to Pocketbase template

Step 1 - CLAUDE:
User: "How should we integrate Cloudflare D1 with Pocketbase?"
Claude: "Here's the architecture..."

Step 2 - CURSOR:
User: "@cloudflare Add D1 integration"
Cursor: Updates template.toml, creates cloudflare-d1-migration.js

Step 3 - WINDSURF (Async):
Windsurf: Detects file changes, triggers validation

Step 4 - CLINE (Background):
Cline: Runs npm run validate, npm run test:cloudflare

Step 5 - WINDSURF (Notification):
Windsurf: "Validation complete ✅"

Result: Complete integration in <10 minutes!
```

---

## 📞 Support & Resources

- **Dokploy Docs:** https://docs.dokploy.com
- **Cloudflare API:** https://developers.cloudflare.com/api
- **GitHub Issues:** https://github.com/enuno/dokploy/issues
- **Discord:** https://discord.gg/dokploy

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 24, 2025 | Initial release with multi-agent system |

---

## 📋 Checklist: Getting Started

- [ ] Read [AGENTS.md](./AGENTS.md) (source of truth)
- [ ] Set up `.env.local` from `.env.example`
- [ ] Run `pnpm install`
- [ ] Run `npm run validate:all` (verify setup)
- [ ] Choose an AI agent for your task:
  - [ ] Design? → Use Claude
  - [ ] Implement? → Use Cursor
  - [ ] Test? → Use Cline
  - [ ] Monitor? → Use Windsurf
  - [ ] Quick fix? → Use Copilot

---

**🚀 Ready to create production-ready Dokploy templates with AI assistance?**

**Start with:** [AGENTS.md](./AGENTS.md)

---

**Maintained By:** Ryno Crypto Mining Services - ServerDomes Network Engineering  
**Last Updated:** December 24, 2025  
**License:** MIT (per original Dokploy)
