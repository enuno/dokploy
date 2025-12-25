# Windsurf/Codeium Configuration

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**File Location:** `WINDSURF.md` or `.windsurf/rules/`  
**Purpose:** Windsurf AI IDE configuration for async multi-agent template workflows

---

## 📌 Source of Truth

**Reference:** `AGENTS.md` (universal standards)

Windsurf provides **async multi-agent execution** with background task orchestration and workflow persistence.

---

## 🎯 Windsurf Workspace Configuration

### .windsurfrules (Project Root)

```yaml
project: "dokploy-templates-cloudflare"
version: "1.0.0"
reference: "./AGENTS.md"

# Workspace settings
workspace:
  name: "Dokploy Templates + Cloudflare"
  root: "./"
  
  # Files to exclude from AI context
  exclude:
    - "node_modules/**"
    - ".git/**"
    - ".env.local"
    - "*.pem"
    - "*.key"
  
  # Custom file watchers
  watch:
    - "blueprints/**/*.{yml,toml}"
    - "tests/**/*.test.ts"
    - "meta.json"

# AI Settings
ai:
  model: "claude-opus-4"
  max_context_tokens: 12000
  response_timeout: 300  # seconds
  async_tasks: true     # Enable background execution

# Custom Commands available in Windsurf
commands:
  validate_all:
    description: "Validate all templates"
    command: "npm run validate:all"
    
  test_coverage:
    description: "Run full test suite with coverage"
    command: "npm run test:coverage"
    
  deploy_staging:
    description: "Deploy to staging environment"
    command: "npm run deploy:staging"
    
  generate_docs:
    description: "Generate template documentation"
    command: "npm run docs:generate"
    
  cf_test:
    description: "Test Cloudflare integrations"
    command: "npm run test:cloudflare"

# Async workflow definitions
workflows:
  - name: "template-validation-pipeline"
    trigger: "file-change"
    pattern: "blueprints/**/*.{yml,toml}"
    steps:
      - id: "syntax-check"
        command: "npm run lint:toml blueprints/*.toml"
      - id: "structure-validate"
        command: "npm run validate -- blueprints/*"
      - id: "report"
        action: "notify on completion"
  
  - name: "test-on-change"
    trigger: "file-change"
    pattern: "blueprints/**/* OR tests/**/*"
    steps:
      - id: "run-tests"
        command: "npm run test:coverage"
      - id: "coverage-check"
        action: "check if >80%"
      - id: "suggest-improvements"
        action: "identify coverage gaps"
```

---

## 🎭 Multi-Agent Rules for Windsurf

Store in `.windsurf/rules/` directory (max 12,000 chars per rule)

### Rule 1: template-builder.mdc

**File:** `.windsurf/rules/template-builder.mdc`  
**Activation:** Mention `@windsurf-build` or edit `blueprints/**/*.yml`

```markdown
# Windsurf Template Builder

## Role
Build complete Dokploy templates with validation and testing.

## Activation
@windsurf-build or editing blueprints/ files

## Task: Create Template from Architecture

Input:
1. Architecture document (from @architect)
2. Service specifications
3. Cloudflare integration requirements

Output Process:
1. Create docker-compose.yml
2. Create template.toml with variable inheritance
3. Create meta.json entry
4. Run validation: npm run validate -- blueprints/[name]
5. Run tests: npm run test -- tests/template-validation.test.ts
6. Report status and any fixes needed

## Constraints (from AGENTS.md)
- Service names: lowercase
- Image versions: specific (no 'latest')
- Variables: declared before use
- Credentials: environment variable refs only
- No hardcoded passwords or tokens

## Post-Generation
- Validate passes: npm run validate
- Tests pass: >80% coverage
- Ready for staging: staging URL provided

## Async Tasks
- Background validation on save
- Test suite runs incrementally
- Notifications on completion
```

---

### Rule 2: cloudflare-integration.mdc

**File:** `.windsurf/rules/cloudflare-integration.mdc`  
**Activation:** Mention `@windsurf-cf` or edit files with `cf*` patterns

```markdown
# Windsurf Cloudflare Integration

## Role
Integrate Cloudflare services into templates with full API testing.

## Activation
@windsurf-cf or files matching *cloudflare*, *cf*, *worker*, *d1*, *r2*

## Task: Add CF Service to Template

Input:
1. Existing template
2. Target Cloudflare service (Workers, D1, R2, Pages, etc.)
3. Integration requirements

Output Process:
1. Update template.toml:
   - Add CF variables (account_id, api_token, etc.)
   - Add environment variable mappings
2. Create/update cloudflare-[service].js stub
3. Generate CF configuration mount
4. Add meta.json cloudflare section
5. Run CF API tests: npm run test:cloudflare
6. Document setup steps

## Variable Patterns (AGENTS.md Section 3)
- Credentials: ${CF_API_TOKEN}, ${CF_ACCOUNT_ID} (user provides)
- Services: ${CF_D1_DB_ID}, ${CF_ZONE_ID} (user provides)
- Auto-generated: ${uuid} for bucket names, etc.

## Testing
- API endpoint connectivity
- Authentication verification
- Service permissions check
- Error handling validation

## Async Validation
- Background CF API testing
- Report on integration readiness
- Identify permission issues
```

---

## 🚀 Windsurf Async Workflows

### Workflow 1: Template Validation Pipeline

```yaml
Triggered By: File change in blueprints/**

Step 1: Syntax Check (Parallel)
├─ Lint docker-compose.yml
└─ Lint template.toml
    ↓
Step 2: Structure Validation
├─ Validate docker-compose structure
├─ Check variable declarations
├─ Verify service names
└─ Check for hardcoded credentials
    ↓
Step 3: Testing (If structure valid)
├─ Run unit tests
├─ Check coverage (>80% required)
└─ Report failures with suggestions
    ↓
Step 4: Notification
├─ Background: Windsurf notifies of completion
├─ ✅ Status: All checks passed
└─ ❌ Status: Issues found (with details)

Result: Async validation without blocking editor
```

### Workflow 2: Cloudflare Integration Testing

```yaml
Triggered By: File change in cloudflare-* files

Step 1: Validate CF Configuration
├─ Check variable declarations
├─ Verify credential references
└─ Lint CF JavaScript (if applicable)
    ↓
Step 2: API Testing (Background)
├─ Test CF account connectivity
├─ Verify API token permissions
├─ Test service endpoints
└─ Check database/storage access
    ↓
Step 3: Report Generation
├─ Background: Create detailed report
├─ Identify missing permissions
└─ Suggest fixes per AGENTS.md

Result: Continuous CF integration validation
```

### Workflow 3: Full CI/CD Simulation (Local)

```yaml
Triggered By: PR preparation (manual trigger)

Step 1: Pre-commit Checks (Parallel)
├─ npm run lint:ts
├─ npm run format --check
├─ npm run type-check
└─ npm run validate:all
    ↓
Step 2: Test Execution
├─ npm run test:coverage (must be >80%)
├─ npm run test:cloudflare (if applicable)
└─ npm run deploy:staging (preview environment)
    ↓
Step 3: Quality Report
├─ Coverage summary
├─ Test results breakdown
├─ Staging deployment URL
└─ Ready for PR? (Yes/No with issues)

Result: Full validation before human review
```

---

## 📋 Windsurf Commands & Shortcuts

### Quick Commands

```
@windsurf-build          Create new template
@windsurf-cf             Add Cloudflare integration
@windsurf-validate       Validate all templates
@windsurf-test           Run full test suite
@windsurf-fix            Fix validation errors automatically
@windsurf-docs           Generate documentation
@windsurf-deploy         Deploy to staging
```

### IDE Shortcuts

```
Cmd/Ctrl + K             Quick Windsurf command
Cmd/Ctrl + Shift + W     Windsurf chat panel
Cmd/Ctrl + Alt + K       Async task queue (background jobs)
Cmd/Ctrl + Alt + V       Windsurf validation widget (background)
```

### Async Task Queue

Monitor background jobs in Windsurf:

```
Task Queue Panel:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running:
  [████░░░░] Validating templates (23%)
  
Queued:
  - Test coverage for blueprints/grafana
  - CF API connectivity test
  
Completed:
  ✅ docker-compose lint
  ✅ template.toml syntax check
  ✅ Staging deployment preview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Windsurf Multi-Agent Orchestration

### Sequential Agent Workflow

```
Timeline: Template Creation Start → Finish

T+0: User starts task
     └─ @windsurf-build: Template design

T+5s: Design phase complete
     └─ @windsurf-build: Generate docker-compose.yml

T+15s: Docker file created
     └─ Async: npm run lint:docker (background)

T+20s: Docker lint complete
     └─ @windsurf-build: Generate template.toml

T+30s: Template.toml created
     └─ Async: npm run validate (background)

T+40s: Validation complete
     └─ @windsurf-cf: Add CF integration (if needed)

T+50s: CF config added
     └─ Async: npm run test:cloudflare (background)

T+60s: CF tests complete
     └─ Async: npm run test:coverage (background)

T+90s: All async tasks complete
     └─ Windsurf: "Template ready for staging deployment"

T+90s+: npm run deploy:staging (optional)
```

**Key:** Windsurf runs validation/tests in background; doesn't block editor.

---

## 🔒 Windsurf Security & Permissions

### Allowed Async Tasks
```
✅ File reads/writes to blueprints/
✅ npm run validate/test/lint
✅ Background test execution
✅ Async CF API testing
✅ Documentation generation
✅ Report creation
```

### Forbidden in Async Mode
```
🚫 git commit/push (require manual review)
🚫 npm install -g
🚫 rm -rf (destructive)
🚫 Production deployments
🚫 Cloudflare zone modifications (test only)
```

### Notification Strategy

```
Background Validation Complete:
├─ ✅ All templates valid
├─ ✅ Test coverage: 87% (>80%)
├─ ✅ Staging deployment: Ready
└─ Next: npm run deploy:staging

Or:

⚠️ Issues Found:
├─ ❌ Template "pocketbase": Variable ${API_KEY} undefined
├─ ❌ Coverage: 72% (must be >80%)
├─ ❌ CF API: Unauthorized (check token)
└─ Suggestions provided in detailed report
```

---

## 💬 Windsurf Conversation Examples

### Example 1: Create Complete Template with Async Validation

```
User: "@windsurf-build Create Nextjs + PostgreSQL template with CF Pages"

Windsurf:
Starting template creation workflow...

[Progress]
✅ Template architecture planned
✅ docker-compose.yml generated
📋 Running async: npm run lint:docker
✅ template.toml generated
📋 Running async: npm run validate
✅ meta.json entry created
📋 Running async: npm run test:cloudflare

[Background Notifications - arriving as you work]
✅ Lint passed
✅ Validation passed
⚠️ Coverage report: Need 8% more for >80% target

[When async complete]
Template "nextjs-postgres" is ready!
- Staging URL: https://dokploy-staging.../nextjs-postgres-xyz
- Test coverage: 82% ✅
- CF Pages integration: Configured
- Ready for PR submission

Next Steps:
1. Review template files
2. Manual CF Pages setup (instructions in template README)
3. Submit PR with staging link
```

### Example 2: Fix Multiple Validation Errors

```
User: "@windsurf-fix Found validation errors in all templates"

Windsurf:
Analyzing validation errors...

Found 3 issues:
1. grafana: Image tag "latest" → Changing to "10.2.0"
2. pocketbase: Variable undefined → Adding to [variables]
3. redis: Service name mismatch → Aligning docker-compose + template.toml

Running async fixes...
📋 Processing grafana
📋 Processing pocketbase
📋 Processing redis

✅ All fixes applied
✅ Re-validating templates...
✅ Validation passed!

Changes Summary:
- Modified: blueprints/grafana/docker-compose.yml
- Modified: blueprints/pocketbase/template.toml
- Modified: blueprints/redis/docker-compose.yml

Ready to review and commit?
```

### Example 3: Continuous Monitoring During Development

```
User develops templates; Windsurf monitors in background

[As user edits blueprints/grafana/docker-compose.yml]
📋 Async: Linting file...
✅ Lint passed

[User edits template.toml]
📋 Async: Validating template structure...
✅ Structure valid

[15 seconds of silence...]
📋 Async background: Running full test suite
✅ Test coverage: 84%

[User switches to another template]
✅ Previous validation complete
Notifications Summary:
- grafana template: All checks passed ✅
- Ready for staging deployment

Current template ready to work on: [next template]
```

---

## 📊 Windsurf Status Dashboard

Windsurf can display a live status dashboard:

```
┌─ Dokploy Templates Dashboard ──────────────────────────────┐
│                                                              │
│ Templates Overview:                                         │
│  Total: 15 | Valid: 14 ✅ | Issues: 1 ❌                  │
│                                                              │
│ Test Coverage:                                             │
│  ████████████████████░░░░ 82% (Target: >80%) ✅          │
│                                                              │
│ Async Jobs Queue:                                          │
│  [████░░░░░░░░░░░░░░░] 20% - Validating pocketbase       │
│  [░░░░░░░░░░░░░░░░░░░░░] - Queued: CF API test           │
│                                                              │
│ Recent Issues:                                             │
│  ⚠️ pocketbase: Hard-coded password detected              │
│     Suggestion: Use ${password:32} helper                  │
│                                                              │
│ Last Validation: 2 minutes ago                            │
│ Next Scheduled: In 10 minutes (file watch)                │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 🔗 Windsurf + Agent Ecosystem

```
AGENTS.md (Source of Truth)
    ↓
Claude (Design)  ← Reference AGENTS.md
    ↓
Cursor (Edit)    ← Reference AGENTS.md, get suggestions from Copilot
    ↓
Windsurf (Async) ← Orchestrates parallel validation/testing
    ↓
Cline (Local)    ← Executes commands, reports results
    ↓
GitHub Actions   ← Final CI/CD validation before merge
```

**Windsurf's Role:** Asynchronous background orchestration + continuous monitoring

---

## 🎓 Windsurf Best Practices

1. **Let Windsurf Run in Background**
   - Don't wait for validation to complete
   - Continue editing while async tasks run
   - Windsurf notifies when ready

2. **Use Async Effectively**
   - Long test suites: Let Windsurf run in background
   - Multiple templates: Parallel validation
   - CF API tests: Background without blocking

3. **Monitor Task Queue**
   - Keep async task panel open (Cmd/Ctrl+Alt+K)
   - Check notifications periodically
   - Address issues as they appear

4. **Combine with Claude/Cursor**
   - Claude: Quick design questions
   - Cursor: Interactive editing with local rules
   - Windsurf: Background validation + monitoring

---

## 🚀 Getting Started with Windsurf

1. **Create .windsurfrules** in project root (template provided above)
2. **Create .windsurf/rules/** directory with .mdc files
3. **Install Windsurf IDE** from windsurf.ai
4. **Open project** and enable workspace monitoring
5. **Use @windsurf-build** to start creating templates
6. **Monitor async queue** as Windsurf validates in background

---

**Remember:** Windsurf is your background validation engine. Let it run async tasks while you focus on creative work. It integrates with Claude, Cursor, and Cline for a complete multi-agent workflow.
