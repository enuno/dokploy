# Claude Code Configuration

**Version:** 2.0.0  
**Last Updated:** February 11, 2026  
**Project:** Dokploy Templates with Cloudflare Integration

---

## Primary Reference

**Universal Standards**: `.github/copilot-instructions.md` (~500 tokens)  
**Extended Documentation**: `AGENTS.md` (~800 tokens)  
**Skills**: `.claude/skills/dokploy-*` (auto-loaded by relevance)  
**Commands**: `.claude/commands/` for slash-command workflows

---

## Skills-First Approach

This project uses **progressive skill loading** for 35% token reduction:
- Skills loaded on-demand based on task context
- Generic agents (Builder, Validator) instead of specialized agents
- Portable skills in `.claude/skills/dokploy-*`

---

## Session Initialization

When starting a Claude Code session:

1. **Load primary reference**: Read `.github/copilot-instructions.md` for universal standards
2. **Primary command**: `/dokploy-create [app-name]` for template creation
3. **Reference extended docs**: `AGENTS.md` for design patterns and API references

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

### Key Rules
- Pinned image versions (no `latest`)
- Variables use `${helper}` or `${ENV_VAR}` syntax
- Service names match between compose and TOML
- Never hardcode credentials
- Cloudflare vars use `${CF_*}` pattern
