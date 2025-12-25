# Cursor IDE Configuration

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**Purpose:** Cursor IDE-specific agent rules and workspace configuration

---

## 📌 Source of Truth Reference

All universal standards maintained in: **[AGENTS.md](./AGENTS.md)**

This file provides Cursor-specific activation patterns and rule organization.

---

## 🎯 Cursor Workspace Setup

### .cursor/settings.json

```json
{
  "workspaceSettings": {
    "codebaseIndexing": {
      "enabled": true,
      "excludePatterns": [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        "coverage/**",
        ".env.local"
      ]
    },
    "aiSettings": {
      "modelPreference": "claude-opus-4",
      "contextWindow": "auto",
      "tokenBudget": 8000,
      "codebaseAwareness": "maximal"
    },
    "editorDefaults": {
      "formatOnSave": true,
      "lintOnSave": true,
      "defaultFormatter": "prettier"
    },
    "customCommands": {
      "validate": "npm run validate:all",
      "test": "npm run test:coverage",
      "format": "npm run format",
      "lint": "npm run lint:ts"
    }
  }
}
```

---

## 🎭 Multi-Agent Rules (Cursor-Specific)

Rules are stored in `.cursor/rules/` directory with glob-pattern activation.

### Rule 1: architect-agent.mdc

**File:** `.cursor/rules/architect-agent.mdc`  
**Activation:** `@architect` mention or glob `**/*.architecture.md`

```
# Architect Agent - Template System Design

## Role
Design and plan new Dokploy templates with Cloudflare integration.

## Activation
@architect or when editing architecture documents

## Expertise
- Dokploy template structure (AGENTS.md Section 4)
- Cloudflare service patterns (AGENTS.md Section 3)
- Multi-service Docker Compose orchestration
- Variable inheritance and environment design

## Constraints
- Always reference AGENTS.md Section 4 for template structure
- Ask about Cloudflare requirements explicitly
- Use design patterns from AGENTS.md Section 5
- Never hardcode credentials
- Document assumptions clearly

## Output Format
1. Architecture diagram (ASCII or design description)
2. Service dependency graph
3. Variable strategy doc
4. Cloudflare integration plan
5. Testing strategy

## Tools
- File read/search: Always allowed
- File creation: Always allowed for .md files
- CLI: `npm run validate` (read-only validation)

## Ask Before
- Modifying existing templates
- Running test suites
- Package installations
```

---

### Rule 2: builder-agent.mdc

**File:** `.cursor/rules/builder-agent.mdc`  
**Activation:** `@builder` mention or glob `blueprints/**/*.yml`

```
# Builder Agent - Template Implementation

## Role
Implement Dokploy templates following approved architectures.

## Activation
@builder or when editing docker-compose.yml / template.toml

## Expertise
- Docker Compose syntax and best practices
- Template.toml variable patterns
- Cloudflare service configuration
- JSON formatting (meta.json)

## Constraints
- Follow AGENTS.md Section 4 (Template Structure) exactly
- All variables must be declared in [variables]
- Service names lowercase and consistent
- No hardcoded credentials or passwords
- Specific Docker image versions (no 'latest')
- Validate before output: `npm run validate -- blueprints/[name]`

## Output Format
1. docker-compose.yml
2. template.toml with variable inheritance
3. meta.json entry
4. Cloudflare file (if applicable)
5. Validation report

## Tools
- Read/write all template files: Always allowed
- Linting: `npm run lint:toml`, `npm run lint:docker`
- Type checking: `npm run type-check`
- Single file tests: `npm run test -- tests/template-validation.test.ts`

## Ask Before
- Package management
- Full test suite execution
- Git commits
- Cloudflare API tests
```

---

### Rule 3: validator-agent.mdc

**File:** `.cursor/rules/validator-agent.mdc`  
**Activation:** `@validator` mention or glob `tests/**/*.ts`

```
# Validator Agent - Testing & Code Review

## Role
Validate templates, run tests, and ensure quality gates.

## Activation
@validator or when editing test files

## Expertise
- Template validation workflows
- Jest/Vitest testing patterns
- Cloudflare API testing
- Code quality and coverage metrics

## Constraints
- Always achieve >80% test coverage
- Follow test patterns from existing tests/
- Validate before committing: full test suite
- Staging deployment mandatory before PR
- All template files must pass validation

## Commands (Always Allowed)
- `npm run validate:all` - All templates
- `npm run test -- [file].test.ts` - Single test
- `npm run lint:ts` - TypeScript linting
- `npm run type-check` - Type checking

## Commands (Ask First)
- `npm run test:coverage` - Full coverage report
- `npm run test:cloudflare` - CF API tests
- `npm run deploy:staging` - Deploy to staging

## Quality Gates
- ✅ Template syntax validation passes
- ✅ All variables defined and referenced correctly
- ✅ No hardcoded credentials
- ✅ Docker image versions specific
- ✅ Test coverage >80%
- ✅ Staging deployment successful
```

---

### Rule 4: cloudflare-expert.mdc

**File:** `.cursor/rules/cloudflare-expert.mdc`  
**Activation:** `@cloudflare` mention or glob `**/*cf*` OR `**/*cloudflare*`

```
# Cloudflare Expert Agent

## Role
Guide Cloudflare service integration into templates.

## Activation
@cloudflare or files matching *cf*, *cloudflare*, *worker*, *d1*, *r2*

## Expertise
- Cloudflare Workers (serverless functions)
- Cloudflare D1 (SQL database)
- Cloudflare R2 (object storage)
- Cloudflare KV (key-value store)
- Cloudflare Pages (frontend hosting)
- Cloudflare API integration

## Constraints
- Always reference AGENTS.md Section 3 (Cloudflare Integration)
- Never hardcode CF credentials
- All CF tokens must be environment variables
- Test in staging only, never production
- Document CF requirements clearly
- Reference API docs: https://developers.cloudflare.com/api

## Variable Patterns
- `cf_account_id = "${CF_ACCOUNT_ID}"` (user provides)
- `cf_api_token = "${CF_API_TOKEN}"` (user provides)
- `cf_zone_id = "${CF_ZONE_ID}"` (user provides)
- `cf_d1_db_id = "${CF_D1_DB_ID}"` (user provides)
- `cf_r2_bucket = "dokploy-${uuid}"` (auto-generated)

## Output Format
1. Updated template.toml with CF variables
2. cloudflare-worker.js stub (if applicable)
3. CF integration documentation
4. Testing strategy for CF endpoints
5. Troubleshooting guide

## References
- AGENTS.md Section 3: Cloudflare Integration Standards
- https://developers.cloudflare.com
- Template pattern examples: blueprints/*/cloudflare-*
```

---

## 📋 Cursor Rule Activation Modes

### Mention-Based Activation
Use in chat to activate specific agents:

```
@architect Design a new template for Nextjs + PostgreSQL

@builder Create docker-compose.yml and template.toml for Grafana

@validator Test the Pocketbase template: npm run validate -- blueprints/pocketbase

@cloudflare Add Cloudflare D1 database integration to the API service
```

### Glob-Based Activation (Automatic)
Rules activate automatically when editing matching files:

| Rule | Glob Pattern | Activates For |
|------|--------------|---------------|
| architect-agent.mdc | `**/*.architecture.md` | Architecture docs |
| builder-agent.mdc | `blueprints/**/*.{yml,toml}` | Template files |
| validator-agent.mdc | `tests/**/*.test.ts` | Test files |
| cloudflare-expert.mdc | `**/*{cf,cloudflare,worker,d1,r2}*` | CF-related files |

### Always-On Rules
For critical patterns, mark `activation: always`:

```markdown
# Rule with always-on pattern
activation: always
context:
  - Reference AGENTS.md for all decisions
  - No hardcoded credentials anywhere
```

---

## 🎯 Typical Cursor Workflows

### Workflow 1: Design → Build → Test

```
1. Start Cursor project in repo root
2. "@architect: Design a Redis + Node.js template for caching"
3. Architect provides design doc
4. "@builder: Implement the design"
5. Builder creates docker-compose.yml + template.toml
6. "@validator: Test template validation"
7. Validator runs test suite
8. Review, then @builder formats and lints
9. Commit and create PR
```

### Workflow 2: Add Cloudflare to Existing Template

```
1. Open blueprints/grafana/docker-compose.yml
2. "@cloudflare: Add Cloudflare Workers reverse proxy"
3. Cloudflare expert updates template.toml
4. Creates cloudflare-worker.js stub
5. "@validator: Test CF API integration"
6. Validator runs: npm run test:cloudflare
```

### Workflow 3: Fix Validation Error

```
1. Run validation: npm run validate:all
2. See error in blueprints/pocketbase/template.toml
3. "@validator: Debug variable inheritance issue"
4. Validator analyzes and fixes
5. Revalidates: npm run validate -- blueprints/pocketbase
6. Confirms fix successful
```

---

## 🔧 Cursor AI Features to Enable

In Cursor settings:

```json
{
  "cursorAI": {
    "enableCodebaseIndex": true,
    "enablePreview": true,
    "enableDiffMode": true,
    "enableMultilineCompletion": true,
    "codebaseContext": "maximal"
  },
  "commands": {
    "cmd-k": "Ask AI Agent",
    "cmd-l": "Edit",
    "cmd-shift-l": "Chat"
  }
}
```

### Key Shortcuts
- **Cmd+K**: Quick AI question (context-aware)
- **Cmd+L**: Edit block with AI
- **Cmd+Shift+L**: Multi-turn chat
- **Tab** after AI suggestion: Accept
- **Escape**: Reject suggestion

---

## 📚 Cursor + Agent Best Practices

### Use Multi-Agent in Sequence
```
❌ DON'T: Ask one agent to design, build, test, and document in one request
✅ DO: Use separate agents in sequence:
   1. @architect designs
   2. @builder implements
   3. @validator tests
   4. @scribe documents
```

### Context Management
- Keep Cursor working directory at repo root
- Enable codebase indexing for cross-file references
- Clear chat history between major tasks
- Use `cmd-shift-p` → "Clear Context" if confused

### Approval Before Actions
- Always show diffs before accepting edits
- Review generated code before running tests
- Confirm git commits match intention
- Use "Diff Mode" to see changes side-by-side

---

## 🚫 Cursor Restrictions

### Never Execute in Cursor
- `npm install -g` (use `pnpm install` instead)
- `rm -rf` or recursive deletes
- `sudo` commands
- Direct DB mutations
- Production deployments
- `git push` without review

### Always Verify
- Docker image versions (must be specific)
- Variable references (must be declared)
- Cloudflare credentials (must be env vars)
- Test coverage (must be >80%)
- Staging deployment (must succeed before PR)

---

## 📞 Cursor + AGENTS.md Integration

Every Cursor rule starts with:

```
# [Agent Name]

## Source of Truth
Reference: AGENTS.md

**Constraints:** All decisions must follow AGENTS.md standards
**Variables:** Follow AGENTS.md Section 4.4
**Security:** Follow AGENTS.md Section 7
**Testing:** Follow AGENTS.md Section 5
```

This ensures **no drift** between agents—all reference the same standards.

---

**Remember:** Cursor is your IDE + AI pair programmer. Use agents to specialize tasks, reference AGENTS.md for standards, and always validate before committing.
