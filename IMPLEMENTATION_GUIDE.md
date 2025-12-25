# Implementation Guide: AI Coding Agent Configuration System

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**Purpose:** Step-by-step guide to implement the complete multi-agent AI coding system

---

## 📋 What You're Getting

10 standardized configuration files that create a **unified, multi-agent AI coding environment** for Dokploy template development:

| File | Purpose | Audience |
|------|---------|----------|
| **AGENTS.md** | Universal standards (source of truth) | All agents + humans |
| **CLAUDE.md** | Claude/Claude Code configuration | Claude users |
| **CURSOR.md** | Cursor IDE setup + multi-agent rules | Cursor users |
| **COPILOT.md** | GitHub Copilot integration (symlinks AGENTS.md) | Copilot users |
| **CLINE.md** | Cline/Claude Dev MCP execution | Cline users |
| **WINDSURF.md** | Windsurf async orchestration | Windsurf users |
| **MULTIAGENTPLAN.md** | Multi-agent coordination hub | Project leads |
| **.aiignore** | Files excluded from AI context | All AI tools |
| **ai-agent.config.json** | Agent service configuration | System config |
| **.env.example** | Environment variable template | All developers |

---

## 🚀 Implementation Steps

### Phase 1: Core Setup (5 minutes)

#### Step 1.1: Create Project Root Files

Copy these files to your project root:

```bash
# Copy from this implementation:
✓ AGENTS.md                    # Source of truth for all standards
✓ CLAUDE.md                    # Claude configuration
✓ CURSOR.md                    # Cursor IDE configuration
✓ COPILOT.md                   # Copilot configuration (can be symlink)
✓ CLINE.md                     # Cline configuration
✓ WINDSURF.md                  # Windsurf configuration
✓ README.md                    # Project overview
✓ .aiignore                    # AI exclusions
✓ .env.example                 # Environment template
✓ ai-agent.config.json         # Agent service config
```

#### Step 1.2: Create .cursor Directory

```bash
mkdir -p .cursor/rules
touch .cursor/settings.json

# Add settings.json (provided in CURSOR.md)
# Add .mdc files to .cursor/rules/:
#   - architect-agent.mdc
#   - builder-agent.mdc
#   - validator-agent.mdc
#   - cloudflare-expert.mdc
```

#### Step 1.3: Create .windsurf Directory

```bash
mkdir -p .windsurf/rules
touch .windsurfrules

# Add .mdc files to .windsurf/rules/:
#   - template-builder.mdc
#   - cloudflare-integration.mdc
```

#### Step 1.4: Create Documentation Directory

```bash
mkdir -p docs
touch docs/MULTIAGENTPLAN.md
touch docs/STAGING.md
touch docs/API.md
touch docs/SECURITY.md
touch docs/DESIGNSYSTEM.md
```

#### Step 1.5: Create GitHub Config

```bash
mkdir -p .github
touch .github/copilot-instructions.md

# .github/copilot-instructions.md can be symlink:
ln -s ../AGENTS.md .github/copilot-instructions.md
```

### Phase 2: Configuration Files (10 minutes)

#### Step 2.1: Set Up .clinerules

Create `.clinerules` in project root with MCP configuration:

```yaml
# From CLINE.md - copy the .clinerules configuration
[SYSTEM_PROMPT]
[MCP_SERVERS]
[PERMISSIONS]
[CONSTRAINTS]
```

#### Step 2.2: Set Up .windsurfrules

Create `.windsurfrules` in project root with async workflow definition:

```yaml
# From WINDSURF.md - copy the .windsurfrules configuration
project: "dokploy-templates-cloudflare"
workspace: { ... }
ai: { ... }
commands: { ... }
workflows: [ ... ]
```

#### Step 2.3: Update .gitignore

Add these entries to `.gitignore`:

```bash
# AI and secrets
.env.local
.env.production.local
.env.test.local
ai-agent.config.local.json
.audit/

# IDE
.cursor/
.windsurf/
.idea/
.vscode/settings.json.local

# Credentials
*.pem
*.key
secrets.json
```

---

### Phase 3: Environment Setup (5 minutes)

#### Step 3.1: Create .env.local

```bash
cp .env.example .env.local

# Edit .env.local with your actual values:
# - Cloudflare credentials
# - Dokploy API key
# - Staging environment URLs
# - Testing configuration
```

⚠️ **CRITICAL:** Never commit `.env.local` - add to `.gitignore`

#### Step 3.2: Verify Package.json Scripts

Ensure your `package.json` includes these scripts (from AGENTS.md Section 6):

```json
{
  "scripts": {
    "validate:all": "npm run validate:all",
    "validate": "dokploy validate",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:cloudflare": "CF_API_TOKEN=$CF_API_TOKEN vitest run tests/cloudflare-api.test.ts",
    "lint:ts": "eslint . --ext .ts",
    "lint:toml": "toml-lint blueprints/**/*.toml",
    "lint:docker": "docker-compose config --quiet blueprints/**/docker-compose.yml",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "generate:meta": "node scripts/generate-meta.js",
    "build:template": "node scripts/build-template.js",
    "deploy:staging": "npm run validate && npm run test:coverage && dokploy deploy staging",
    "docs:generate": "node scripts/generate-docs.js"
  }
}
```

---

### Phase 4: Agent Activation (10 minutes)

#### Step 4.1: Activate Cursor IDE

1. Install Cursor IDE from https://www.cursor.com
2. Open project root
3. Create `.cursor/settings.json` (from CURSOR.md template)
4. Create `.cursor/rules/` directory with .mdc files
5. Cursor auto-detects and enables agents

**Test:**
```bash
# In Cursor
@architect Design a template for...
# Should activate architect-agent.mdc
```

#### Step 4.2: Activate Windsurf

1. Install Windsurf from https://www.windsurf.ai
2. Open project root
3. Windsurf auto-detects `.windsurfrules`
4. Async monitoring starts automatically

**Test:**
```bash
# In Windsurf
@windsurf-build Create a template
# Should activate template-builder.mdc
# Async validation runs in background
```

#### Step 4.3: Activate Claude / Claude Code

1. Open Claude at https://claude.ai or use Claude Code
2. Copy project structure and AGENTS.md into context
3. Reference CLAUDE.md for workflow guidance

**Test:**
```
"Design a Grafana template with Cloudflare integration.
Reference: I'm following AGENTS.md standards."
```

#### Step 4.4: Activate Cline / Claude Dev

1. Install Cline extension in VS Code
2. Cline auto-detects `.clinerules`
3. MCP server connects automatically

**Test:**
```bash
# In Cline chat
"Cline: Validate all templates"
# Should execute: npm run validate:all
```

#### Step 4.5: Activate GitHub Copilot

1. Install GitHub Copilot extension in VS Code
2. Copilot auto-reads COPILOT.md (or symlink to AGENTS.md)
3. Learns from existing templates in blueprints/

**Test:**
```bash
# In editor, start typing TOML
[variables]
# Copilot should suggest: main_domain = "${domain}"
```

---

### Phase 5: Team Communication (5 minutes)

#### Step 5.1: Document Standards

Create or update these docs in your repo:

- [x] **AGENTS.md** - Universal standards (copy provided file)
- [x] **docs/MULTIAGENTPLAN.md** - Agent interaction guide
- [x] **docs/STAGING.md** - Staging environment guide
- [x] **docs/API.md** - API integration standards
- [x] **docs/SECURITY.md** - Security policies
- [x] **README.md** - Project overview

#### Step 5.2: Onboard Team Members

For each team member:

1. **Send them:** Link to README.md
2. **Have them read:** AGENTS.md (5 min)
3. **Show them:** Quick Cursor demo (5 min)
4. **Let them try:** Design a template with Claude (10 min)
5. **Watch them:** Implement with Cursor + Copilot (15 min)
6. **Verify:** Run validation with Cline (5 min)

Total onboarding: ~40 minutes

#### Step 5.3: Create Team Guidelines

Add to your wiki or docs:

```markdown
# AI Agent Guidelines

## When to Use Each Agent

- **Claude:** "I need to design a template architecture"
- **Cursor:** "I need to implement a template"
- **Cline:** "I need to validate and test"
- **Windsurf:** "I want async validation while I work"
- **Copilot:** "I want inline code suggestions"

## Reference AGENTS.md Always

All standards are documented in AGENTS.md.
If uncertain, check AGENTS.md first.

## Required Quality Gates

- ✅ Template validation: 100% pass
- ✅ Test coverage: >80%
- ✅ Staging deployment: Success
- ✅ Documentation: Complete
```

---

### Phase 6: Continuous Integration (Optional, 10 minutes)

#### Step 6.1: Add GitHub Actions Workflow

Create `.github/workflows/template-validation.yml`:

```yaml
name: Template Validation

on:
  pull_request:
    paths:
      - 'blueprints/**'
      - 'tests/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Validate templates
        run: npm run validate:all
      
      - name: Run tests
        run: npm run test:coverage
        
      - name: Check coverage
        run: |
          if [ $(grep -oP '(?<=<coverage>).*?(?=</coverage>)' coverage/coverage-summary.json) -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
      
      - name: Test Cloudflare integration
        run: npm run test:cloudflare
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
```

#### Step 6.2: Store Secrets in GitHub

1. Go to: Settings → Secrets and variables → Actions
2. Add:
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`
   - `CF_ZONE_ID`
   - `DOKPLOY_API_KEY`

#### Step 6.3: Protect main Branch

1. Settings → Branches → Add rule for `main`
2. Require PR reviews
3. Require status checks (GitHub Actions validation)
4. Dismiss stale reviews on push

---

## ✅ Verification Checklist

After implementation, verify everything works:

### File Structure
- [ ] AGENTS.md exists in project root
- [ ] All agent config files created (CLAUDE.md, CURSOR.md, etc.)
- [ ] .cursor/rules/ directory created with .mdc files
- [ ] .windsurf/rules/ directory created with .mdc files
- [ ] docs/ directory created with supporting docs
- [ ] .clinerules file created
- [ ] .windsurfrules file created
- [ ] .aiignore file created
- [ ] ai-agent.config.json file created

### Environment Setup
- [ ] .env.example file created
- [ ] .env.local created (not committed)
- [ ] .env.local has valid Cloudflare credentials
- [ ] .gitignore includes .env.local
- [ ] package.json has all required scripts

### Agent Activation
- [ ] Cursor opens and recognizes .cursor/rules/
- [ ] Windsurf opens and recognizes .windsurfrules
- [ ] Claude can reference AGENTS.md
- [ ] Copilot gives suggestions in editor
- [ ] Cline recognizes .clinerules and MCP config

### Testing
- [ ] Run: npm run validate:all (should pass or show expected errors)
- [ ] Run: npm run test:coverage (should run test suite)
- [ ] Run: npm run type-check (TypeScript type check)
- [ ] Test Cursor: @architect [mention] → should work
- [ ] Test Cline: "Cline: validate templates" → should execute
- [ ] Test Windsurf: Edit template file → async validation starts
- [ ] Test Copilot: Type TOML → should see suggestions

### Documentation
- [ ] README.md is readable and helpful
- [ ] AGENTS.md is complete and clear
- [ ] MULTIAGENTPLAN.md explains agent interactions
- [ ] All docs link correctly
- [ ] No dead links in documentation

---

## 🎓 Learning Path for Your Team

### For New Team Members (1 hour)

1. **Read** (15 min):
   - README.md - Project overview
   - AGENTS.md - Standards and conventions

2. **Watch** (10 min):
   - Demo: Claude designing a template
   - Demo: Cursor implementing

3. **Try** (20 min):
   - Use Claude to design simple template
   - Use Cursor to implement
   - Use Cline to validate

4. **Review** (15 min):
   - Check agent decision tree in MULTIAGENTPLAN.md
   - Understand quality gates

---

## 🚨 Common Issues & Solutions

### Issue: Cursor doesn't recognize .cursor/rules/

**Solution:**
```bash
# Restart Cursor completely
# Verify .cursor/settings.json exists and is valid JSON
# Check .cursor/rules/*.mdc files exist
# Cursor may need 10-30 seconds to index on startup
```

### Issue: Windsurf async tasks not running

**Solution:**
```bash
# Verify .windsurfrules exists at project root
# Check file watchers in .windsurfrules point to correct patterns
# Windsurf may need 5 seconds to start monitoring
# Check Windsurf task queue (Cmd/Ctrl+Alt+K)
```

### Issue: Cline doesn't execute npm commands

**Solution:**
```bash
# Verify .clinerules exists
# Check node_modules is installed: pnpm install
# Verify npm scripts in package.json match AGENTS.md
# Cline may need MCP server restart
```

### Issue: Copilot doesn't suggest patterns from AGENTS.md

**Solution:**
```bash
# AGENTS.md must be in workspace root
# Copilot learns from existing code (needs examples)
# May take 30 seconds after opening file
# Try: Cmd/Ctrl+Shift+I for manual suggestion
```

---

## 🔄 Maintenance & Updates

### Monthly Review

1. **Check AGENTS.md**
   - Are standards still accurate?
   - Do we need to update CLI commands?
   - Any security changes?

2. **Review Agent Configs**
   - Are any agents outdated?
   - Do model preferences need updating?
   - Any new permissions needed?

3. **Update Dependencies**
   - pnpm update
   - Check npm script compatibility
   - Test all validation commands

### Quarterly Assessment

1. **Team Feedback**
   - Which agents are most useful?
   - Where are bottlenecks?
   - What's working well?

2. **Metrics**
   - Template creation speed
   - Quality gate pass rate
   - Test coverage trends
   - Time to PR submission

3. **Improvements**
   - Optimize workflows based on feedback
   - Update documentation
   - Refine agent decision tree

---

## 📞 Support

- **Questions about AGENTS.md?** → Check AGENTS.md itself
- **Questions about specific agent?** → Check that agent's .md file (CLAUDE.md, etc.)
- **Multi-agent coordination?** → Check MULTIAGENTPLAN.md
- **Technical issues?** → Check docs/SECURITY.md or docs/STAGING.md

---

## 🎉 You're Ready!

You now have a **complete, production-ready AI coding agent system** for Dokploy template development.

### Next Steps:

1. ✅ Copy all provided files to your repo
2. ✅ Run: npm run validate:all (verify setup)
3. ✅ Onboard team members (using guidelines above)
4. ✅ Create first template with Claude + Cursor + Cline
5. ✅ Iterate and improve based on feedback

---

**Questions?** Reference **[AGENTS.md](./AGENTS.md)** - it's the source of truth.

**Ready to get started?** Open Cursor or Claude and say:

> "I'm setting up a Dokploy templates project with Cloudflare integration.
> My standards are in AGENTS.md. 
> Design a template architecture for [service]."

---

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**System:** Multi-Agent AI Coding for Dokploy Templates + Cloudflare
