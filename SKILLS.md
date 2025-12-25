# Dokploy Skills Ecosystem (v2.0+)

**Version:** 2.0.0
**Last Updated:** December 24, 2025
**Purpose:** Skills-first architecture documentation for Dokploy template creation

---

## 📌 Skills-First Architecture

As of version 2.0, this project uses **skills-first approach** instead of specialized agents:

### Traditional Multi-Agent (Deprecated v1.x)
```
User → Specialized Agent → Fixed Workflow → Output
```
**Problems:**
- 15x token baseline (expensive)
- Fixed agent roles (not reusable)
- Maintenance burden (update entire agent)

### Skills-First (Current v2.0+)
```
User → Generic Agent → Progressive Skill Loading → Output
```
**Benefits:**
- **35% token reduction** (5-7x vs 15x baseline)
- **Portable skills** (reusable across projects)
- **Easy maintenance** (update individual skills)
- **Context continuity** (same agent throughout)

---

## 🎯 Available Skills

### Core Workflow Skills (Standard `/dokploy-create`)

| Skill | Phase | Step | Purpose |
|-------|-------|------|---------|
| **dokploy-multi-service** | 2 (Architecture) | - | Design multi-service dependencies (2+ services) |
| **dokploy-compose-structure** | 3 (Generation) | 1 | Generate base docker-compose.yml structure |
| **dokploy-traefik-routing** | 3 (Generation) | 2 | Add Traefik routing labels |
| **dokploy-health-patterns** | 3 (Generation) | 3 | Configure service health checks |
| **dokploy-cloudflare-integration** | 3 (Generation) | 4* | Add Cloudflare R2/DNS/Zero Trust (*if applicable) |
| **dokploy-environment-config** | 3 (Generation) | 5 | Define environment variables |
| **dokploy-template-toml** | 3 (Generation) | 6 | Generate template.toml configuration |
| **dokploy-security-hardening** | 4 (Validation) | 1 | Security review and hardening |
| **dokploy-template-validation** | 4 (Validation) | 2 | Convention compliance validation |

### Advanced Pattern Skills (Manual Invocation)

| Skill | Use Case | When to Use |
|-------|----------|-------------|
| **dokploy-multi-tenant** | Multi-tenant architecture | SaaS platforms, tenant isolation |

---

## 🔄 Standard Workflow: `/dokploy-create`

### Phase 1: Discovery (No Skills)
**Claude Code actions:**
- Research application (WebSearch, WebFetch)
- Identify dependencies
- Determine storage requirements
- Check existing template patterns

**Output:** Requirements document

### Phase 2: Architecture

**Condition:** 2+ services detected

**Load Skill:** `dokploy-multi-service`

**Generates:**
- Service dependency graph
- Network topology design
- Cloudflare service selection
- Health check strategy

**Output:** Architectural design document

### Phase 3: Generation (Progressive Loading)

**Skills loaded sequentially:**

1. **dokploy-compose-structure**
   - Creates base docker-compose.yml
   - Defines networks (app-net + dokploy-network)
   - Sets up named volumes
   - Configures service dependencies

2. **dokploy-traefik-routing**
   - Adds Traefik labels for web access
   - Configures SSL/TLS with LetsEncrypt
   - Sets up domain routing

3. **dokploy-health-patterns**
   - Adds health checks per service type
   - Configures dependency conditions
   - Sets retry policies

4. **dokploy-cloudflare-integration** (*conditional*)
   - Adds R2 storage configuration (if needed)
   - Configures DNS challenge for SSL
   - Sets up Zero Trust access (if requested)

5. **dokploy-environment-config**
   - Defines required vs optional variables
   - Sets up secret management patterns
   - Configures connection strings

6. **dokploy-template-toml**
   - Generates template.toml
   - Maps variables to environment
   - Defines domain configuration

**Output:** Complete docker-compose.yml and template.toml

### Phase 4: Validation

**Skills loaded sequentially:**

1. **dokploy-security-hardening**
   - Reviews secrets management
   - Checks network isolation
   - Validates image versions
   - Ensures least privilege

2. **dokploy-template-validation**
   - Validates YAML syntax
   - Checks network structure
   - Verifies health checks
   - Ensures naming conventions

**Final Check:**
```bash
docker compose -f docker-compose.yml config
```

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

## 📊 Token Efficiency Comparison

| Approach | Token Usage | Relative | Context |
|----------|-------------|----------|---------|
| **Specialized Agent (v1.x)** | 75K+ tokens | 15x baseline | Fixed agent, all context loaded |
| **Skills-First (v2.0+)** | 30-40K tokens | 5-7x baseline | Progressive loading |
| **Savings** | 35-50K tokens | **35-46% reduction** | Same functionality |

---

## 🛠️ Using Skills Manually

### Invoke Single Skill

If you need to use a specific skill outside the standard workflow:

```
Use the Skill tool to invoke: dokploy-compose-structure

Context: I have an app with these requirements...
[Provide relevant context]
```

### Invoke Multiple Skills

For custom workflows:

```
1. Use dokploy-multi-service to design architecture
2. Then use dokploy-compose-structure to generate compose file
3. Finally use dokploy-template-toml to create template.toml
```

### Check Skill Status

```bash
# List all available skills
ls /Users/elvis/Documents/Git/HomeLab-Tools/dokploy/.claude/skills/

# Read a specific skill
cat .claude/skills/dokploy-compose-structure/SKILL.md
```

---

## 📖 Skill Documentation

Each skill contains:

### SKILL.md Structure
```markdown
---
name: skill-name
description: What the skill does and when to use it
version: 1.0.0
author: Home Lab Infrastructure Team
---

# Skill Name

## When to Use This Skill
[Clear trigger conditions]

## When NOT to Use This Skill
[Anti-patterns]

## Prerequisites
[Required context/information]

## Core Patterns
[Reusable patterns with examples]

## Complete Examples
[Real-world examples from existing templates]

## Quality Standards
[Mandatory requirements checklist]

## Common Pitfalls
[Known issues and solutions]

## Integration
[How this skill relates to others]
```

---

## 🔗 Skill Dependencies

### Dependency Graph

```
Phase 1: Discovery
    ↓
Phase 2: dokploy-multi-service (if 2+ services)
    ↓
Phase 3: Generation (sequential loading)
    ↓
    dokploy-compose-structure
    ↓
    dokploy-traefik-routing
    ↓
    dokploy-health-patterns
    ↓
    dokploy-cloudflare-integration (conditional)
    ↓
    dokploy-environment-config
    ↓
    dokploy-template-toml
    ↓
Phase 4: Validation (sequential)
    ↓
    dokploy-security-hardening
    ↓
    dokploy-template-validation
    ↓
Phase 5: Documentation
```

### Skill Relationships

| Skill | Depends On | Used By |
|-------|------------|---------|
| dokploy-multi-service | - | dokploy-compose-structure |
| dokploy-compose-structure | - | All generation skills |
| dokploy-traefik-routing | dokploy-compose-structure | dokploy-cloudflare-integration |
| dokploy-health-patterns | dokploy-compose-structure | dokploy-multi-service |
| dokploy-cloudflare-integration | dokploy-traefik-routing | dokploy-environment-config |
| dokploy-environment-config | dokploy-cloudflare-integration | dokploy-template-toml |
| dokploy-template-toml | All generation skills | Validation skills |
| dokploy-security-hardening | All generation skills | dokploy-template-validation |
| dokploy-template-validation | All skills | - |

---

## 🎓 Best Practices

### When to Use Skills-First

✅ **Always use skills-first for:**
- Creating new Dokploy templates
- Modifying existing templates
- Adding new services to templates
- Validating template quality

✅ **Benefits:**
- Consistent patterns across all templates
- Automated quality checks
- Progressive token usage
- Portable knowledge base

### When to Load Skills Manually

Sometimes you may want to load skills outside the standard `/dokploy-create` workflow:

**Use Case: Validate Existing Template**
```
/Use dokploy-template-validation skill to check existing template
Context: I have an existing template in blueprints/myapp/
```

**Use Case: Add Cloudflare to Existing Template**
```
/Use dokploy-cloudflare-integration skill
Context: Need to add R2 storage to existing paaster template
```

**Use Case: Security Review**
```
/Use dokploy-security-hardening skill
Context: Review security of all templates in blueprints/
```

---

## 📚 Skill Location

Skills are located in the project repository:

```
/Users/elvis/Documents/Git/HomeLab-Tools/dokploy/.claude/skills/
├── dokploy-cloudflare-integration/
│   └── SKILL.md
├── dokploy-compose-structure/
│   └── SKILL.md
├── dokploy-environment-config/
│   └── SKILL.md
├── dokploy-health-patterns/
│   └── SKILL.md
├── dokploy-multi-service/
│   └── SKILL.md
├── dokploy-multi-tenant/
│   └── SKILL.md
├── dokploy-security-hardening/
│   └── SKILL.md
├── dokploy-template-toml/
│   └── SKILL.md
├── dokploy-template-validation/
│   └── SKILL.md
└── dokploy-traefik-routing/
    └── SKILL.md
```

---

## 🔄 Migration from v1.x

### If You Used Agent-Based Approach (v1.x)

**Old Way (Deprecated):**
```
User invokes dokploy-template-agent → Agent has fixed phases → Output
```

**New Way (v2.0+):**
```
User runs: /dokploy-create [app-name]
→ Generic agent loads skills progressively
→ Output (35% fewer tokens)
```

### No Changes Needed For:
- ✅ Existing templates (still valid)
- ✅ Template structure (unchanged)
- ✅ Dokploy compatibility (same output)

### What Changed:
- ❌ `.claude/agents/dokploy-template-agent.md` → Deprecated
- ✅ `.claude/commands/dokploy-create.md` → Primary interface
- ✅ `.claude/skills/` → Individual capabilities

---

## 🆘 Troubleshooting

### Skill Not Found

**Issue:** "Skill dokploy-compose-structure not found"

**Solution:**
```bash
# Verify skills directory exists
ls .claude/skills/dokploy-compose-structure/

# Check SKILL.md exists
cat .claude/skills/dokploy-compose-structure/SKILL.md
```

### Skills Not Loading in Order

**Issue:** Skills loaded out of sequence

**Solution:** Skills are loaded by `/dokploy-create` command in specific order. Check command documentation:
```
cat .claude/commands/dokploy-create.md
```

### Token Usage Still High

**Issue:** Not seeing 35% token reduction

**Solution:**
- Ensure using `/dokploy-create` command (not old agent)
- Verify skills loaded progressively (not all at once)
- Check skill descriptions are concise (<1024 chars)

---

## 📊 Success Metrics

### Organizational Impact (v2.0 vs v1.x)
- **35% token reduction** (30-40K vs 75K+)
- **Maintained quality** (same output standards)
- **Improved maintainability** (update individual skills)
- **Better reusability** (skills portable across projects)

### Development Experience
- ✅ **Faster iteration**: Update skills independently
- ✅ **Better debugging**: Isolated skill execution
- ✅ **Clearer structure**: Command → Skills → Output
- ✅ **Easier onboarding**: Command documentation is entry point

---

## 🔗 Related Documentation

- [AGENTS.md](./AGENTS.md) - Universal standards and conventions
- [CLAUDE.md](./CLAUDE.md) - Claude Code specific configuration
- [README.md](./README.md) - Project overview
- [.claude/commands/dokploy-create.md](./.claude/commands/dokploy-create.md) - Primary command

---

**Status:** ✅ Production Ready
**Version:** 2.0.0
**Maintained By:** Home Lab Infrastructure Team
