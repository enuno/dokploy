# Multi-Agent Orchestration Plan

**Version:** 1.0.0  
**Last Updated:** December 24, 2025  
**Location:** `docs/MULTIAGENTPLAN.md`  
**Purpose:** Coordinate multiple AI agents (Claude, Cursor, Cline, Windsurf, Copilot) across the Dokploy templates project

---

## 🎯 Vision: Unified Agent Ecosystem

This document orchestrates **5 AI coding agents** working together seamlessly on a single project:

| Agent | Role | Speed | Context | When to Use |
|-------|------|-------|---------|------------|
| **Claude** | Architect/Designer | 🟢 Medium | 🟠 Large | Design, planning, complex decisions |
| **Cursor** | Editor/Builder | 🟢 Fast | 🟢 Medium | Hands-on editing, local development |
| **Cline** | Validator/Executor | 🟢 Fast | 🟠 Large | Testing, validation, local execution |
| **Windsurf** | Orchestrator | 🟢 Fast | 🟠 Large | Async workflows, background monitoring |
| **Copilot** | Assistant/Suggester | 🟠 Very Fast | 🔴 Small | Inline completions, quick fixes |

---

## 🏗️ Architecture: Agent Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENTS.md (Source of Truth)              │
│                   Universal Standards Hub                    │
│        (Naming, Testing, Security, Permissions, CLI)        │
└────┬────────────────────────────────────────────────────────┘
     │
     ├─────────────────────────────────────────────────────────────┐
     │                                                             │
     ▼                     ▼                    ▼                  ▼
┌──────────┐         ┌──────────┐        ┌──────────┐      ┌──────────┐
│  CLAUDE  │         │  CURSOR  │        │  CLINE   │      │WINDSURF  │
├──────────┤         ├──────────┤        ├──────────┤      ├──────────┤
│ Designer │         │  Editor  │        │Validator │      │Orchestr. │
│ Strategy │         │  Builder │        │ Executor │      │ Monitor  │
│ Planning │         │   Ideas  │        │ Testing  │      │ Async    │
└────┬─────┘         └────┬─────┘        └────┬─────┘      └────┬─────┘
     │                    │                    │                │
     └────────────────────┴────────────────────┴────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
           ┌──────────┐      ┌──────────┐
           │ COPILOT  │      │ GitHub   │
           │(Inline)  │      │ Actions  │
           │Suggestions│      │(CI/CD)  │
           └──────────┘      └──────────┘
```

---

## 📋 Agent Roles & Responsibilities

### 1. Claude (Strategic Designer)

**Specialization:** Complex reasoning, architecture, design decisions

**Primary Tasks:**
- Template architecture design
- Cloudflare integration strategy
- Multi-service orchestration planning
- Problem-solving complex scenarios
- Code review and guidance

**When to Use:**
```
"Claude, design a Nextjs + PostgreSQL + Cloudflare D1 template architecture"
```

**Output:**
- Detailed architecture document
- Service dependency diagram
- Variable inheritance strategy
- Testing approach
- CF integration points

**Integration:**
- Provides specifications to Cursor
- Validates Cursor's implementations
- Reviews complex edge cases
- Guides Cline's testing strategy

---

### 2. Cursor (Interactive Editor)

**Specialization:** Hands-on code generation, local editing, fast iteration

**Primary Tasks:**
- Implement docker-compose.yml
- Generate template.toml from architecture
- Create/modify file structures
- Local testing and debugging
- File-based operations

**When to Use:**
```
@builder: Implement the template architecture from design doc
```

**Output:**
- Complete docker-compose.yml
- Full template.toml with variables
- meta.json entries
- Cloudflare service files
- Test stubs

**Integration:**
- Takes Claude's architecture as input
- Runs inline Copilot suggestions
- Coordinates with Cline for testing
- Notified by Windsurf of async validations

**Key Shortcut:**
```
Cmd+K: Ask quick questions
Cmd+L: Edit code block
Cmd+Shift+L: Multi-turn conversation
```

---

### 3. Cline (Local Validator & Executor)

**Specialization:** Command execution, validation, testing, real-time feedback

**Primary Tasks:**
- Run validation suite: `npm run validate:all`
- Execute test suites with coverage reporting
- Deploy to staging environment
- Test Cloudflare API integrations
- Provide real-time validation feedback
- Fix issues automatically (when safe)

**When to Use:**
```
"Cline, validate all templates and report issues"
"Run test coverage and identify gaps"
"Deploy Grafana template to staging and verify"
```

**Output:**
- Validation reports with specific issues
- Test coverage breakdown
- Staging deployment URLs
- Cloudflare connectivity status
- Actionable fix suggestions

**Integration:**
- Executes tests triggered by Cursor edits
- Reports to Windsurf for async monitoring
- Provides feedback to Claude for design adjustments
- Final validation before PR

---

### 4. Windsurf (Async Orchestrator)

**Specialization:** Background workflows, continuous monitoring, async task orchestration

**Primary Tasks:**
- Monitor file changes
- Trigger validation pipelines asynchronously
- Run tests in background
- Track task queues
- Notify on completion/issues
- Coordinate multi-agent async workflows

**When to Use:**
```
@windsurf-build: Create complete template (with async validation)
@windsurf-validate: Monitor all templates continuously
@windsurf-deploy: Stage deployment with background status tracking
```

**Output:**
- Async validation notifications
- Task queue status
- Continuous monitoring dashboard
- Background test results
- Status notifications

**Integration:**
- Orchestrates Cursor edits → Cline validation pipeline
- Monitors Claude-designed templates during implementation
- Provides real-time feedback without blocking
- Aggregates results for team awareness

---

### 5. Copilot (Inline Assistant)

**Specialization:** Quick completions, inline suggestions, context-aware helpers

**Primary Tasks:**
- Auto-complete variables in TOML
- Suggest docker-compose patterns
- Complete common code structures
- Variable inheritance patterns
- Quick documentation

**When to Use:**
- Automatic as you type in Cursor
- Suggest via `Tab` when completion appears
- Manual: `Cmd/Ctrl+I` for inline suggestion

**Output:**
- Code completions
- Pattern suggestions
- Variable references
- Format helpers

**Integration:**
- Works within Cursor editor
- Learns from existing templates
- Respects AGENTS.md patterns
- Fast feedback (milliseconds)

---

## 🔄 Multi-Agent Workflow Examples

### Workflow A: Design → Build → Test → Deploy

```
Timeline: New template creation

T+0: User requests
┌─ Claude (Design)
│  Designs template architecture
│  Output: Architecture doc
│
T+5m: Architecture ready
├─ Cursor (Build)
│  Implements based on design
│  Uses Copilot for suggestions
│  Output: Template files
│
T+15m: Files created
├─ Windsurf (Async Monitoring)
│  │ Notices new files
│  │ Triggers validation pipeline
│  └─ Cline validates in background
│      npm run validate
│      npm run test
│      (No editor blocking)
│
T+20m: Tests running in background
├─ User continues editing while Cline tests
│  Windsurf notifies when ready
│
T+25m: Validation complete
├─ Cline (Validate)
│  Runs final staging deployment
│  Reports: URL + status
│
T+30m: Staging live
└─ Template ready for review
   "Staging: https://dokploy-staging.../template-xyz"
```

### Workflow B: Fix Validation Errors

```
Scenario: Templates have validation errors

T+0: Cline detects issues
     [From Windsurf async monitoring or manual run]
     
     Errors Found:
     1. grafana: Image tag 'latest' not allowed
     2. pocketbase: Variable ${API_KEY} undefined
     3. redis: Service name mismatch
     
T+5s: Claude (Problem Solving)
      Explains why each is an issue
      References AGENTS.md standards
      
T+10s: Cursor (Fixes)
       Opens each file
       Makes corrections with Copilot
       - Change 'latest' to specific version
       - Add variable declarations
       - Align service names
       
T+20s: Windsurf (Async Revalidation)
       Detects changes
       Automatically revalidates
       
T+25s: Cline (Confirm)
       ✅ All issues fixed
       All tests pass
       Ready for commit

Total: 25 seconds with no manual testing!
```

### Workflow C: Add Cloudflare Integration to Existing Template

```
T+0: User requests
     "Add Cloudflare D1 to Pocketbase template"
     
T+5s: Claude (Architecture)
      Plans CF D1 integration
      Variable strategy
      Configuration approach
      
T+10s: Cursor (Implementation)
       Updates template.toml with CF variables:
       - cf_account_id = "${CF_ACCOUNT_ID}"
       - cf_d1_db_id = "${CF_D1_DB_ID}"
       - cf_api_token = "${CF_API_TOKEN}"
       
       Creates cloudflare-d1-migration.js stub
       Updates environment config
       Copilot suggests patterns
       
T+20s: Windsurf (Async Testing)
       Detects CF file changes
       Automatically triggers:
       - npm run lint:toml
       - npm run validate
       - npm run test:cloudflare (background)
       
T+30s: Cline (Background Validation)
       Runs CF API tests
       Verifies endpoint connectivity
       Tests D1 database access
       Reports: ✅ CF integration ready
       
T+40s: Integration Complete
       User notified
       Staging ready for testing
       Documentation generated
```

---

## 🎮 Command Flow: Where Each Agent Shines

### Create Template (Full Workflow)

```
User Input
    ↓
[Claude] Design template
    "Architect: Design a Grafana + Prometheus template"
    ↓ Outputs: Architecture doc
[Cursor] Implement
    "@builder: Implement based on architecture"
    ↓ Generates: Files
    ↓ Copilot suggests: Completions
[Windsurf] Monitor (Async)
    Detects new files
    Triggers validation automatically
    ↓ (No user action needed)
[Cline] Validate (Background)
    npm run validate
    npm run test
    ↓ Reports: Status + fixes
[Windsurf] Notify
    "Template ready for staging"
    [Staging URL provided]

Final: User reviews + submits PR
```

### Debug Issue (Problem Solving)

```
User Input
    ↓
[Cline] Detect
    "Cline: Run validation on all templates"
    ↓ Reports: Issues found
[Claude] Analyze
    "Claude: Why are these errors happening?"
    ↓ Explains: References AGENTS.md
[Cursor] Fix
    "@builder: Fix the validation errors"
    ↓ Modifies: Files
    ↓ Copilot: Suggests patterns
[Windsurf] Verify (Async)
    Detects changes
    Revalidates automatically
    ↓ No editor blocking
[Cline] Confirm
    ✅ All issues resolved

Final: "Ready to commit"
```

### Deploy & Test (Validation)

```
User Input
    ↓
[Cursor] Prepare
    Reviews template files
    Ensures completeness
[Cline] Validate Locally
    npm run validate:all
    npm run test:coverage
    ↓ Reports: Coverage + issues
[Windsurf] Stage (Async)
    npm run deploy:staging
    (Background, no blocking)
[Cline] Verify Staging
    Tests service health
    Verifies endpoints
    ✅ Ready
[Windsurf] Notify
    "Staging deployment live"
    "URL: https://..."

Final: User tests manually + submits PR
```

---

## 🚨 Communication Protocol Between Agents

### Agent → Agent Pass-Off Pattern

```
DESIGNER (Claude) → BUILDER (Cursor)
- Format: Architecture document
- Content: Service specs, variable plan, CF integration
- Handoff: "Implementation ready"

BUILDER (Cursor) → VALIDATOR (Cline)
- Format: Generated files
- Triggers: File save events
- Handoff: "Files ready for testing"

VALIDATOR (Cline) → NOTIFIER (Windsurf)
- Format: Test results + issues
- Content: Specific error messages with fixes
- Handoff: "Validation complete, issues: N"

VALIDATOR (Cline) → DESIGNER (Claude)
- Format: Complex issue report
- Content: "Why is this pattern failing?"
- Handoff: "Needs architectural review"

COPILOT → BUILDER (Cursor)
- Format: Inline suggestions
- Content: Code completions
- Handoff: Immediate (no handoff needed)

ORCHESTRATOR (Windsurf) → ALL AGENTS
- Format: Task queue + notifications
- Content: "File changed, triggering validation"
- Handoff: Async (non-blocking)
```

---

## 📊 Agent Decision Tree

Use this to decide which agent to ask:

```
Question/Task Arrives

1. Is it strategic/design? 
   ├─ YES → Ask Claude
   │        "Design template for..."
   │        "What's the best approach to..."
   └─ NO → Continue to 2

2. Do I need to edit files interactively?
   ├─ YES → Use Cursor
   │        "@builder: Implement..."
   │        "@architect: Review..."
   └─ NO → Continue to 3

3. Do I need to run tests/validate?
   ├─ YES → Ask Cline
   │        "Cline: Validate templates"
   │        "Run test coverage"
   └─ NO → Continue to 4

4. Do I need background async work?
   ├─ YES → Ask Windsurf
   │        "@windsurf-build: Create..."
   │        "@windsurf-validate: Monitor..."
   └─ NO → Continue to 5

5. Do I need quick code completion?
   ├─ YES → Use Copilot
   │        (Auto-triggered as you type)
   │        Press Tab to accept
   └─ NO → Use GitHub or manual process

Example:
"Design a Redis template" 
→ Claude (design question)

"Implement the template"
→ Cursor + Copilot (editing)

"Validate the template"
→ Cline (testing)

"Monitor while I work"
→ Windsurf (async)
```

---

## ⚙️ Agent Configuration Hierarchy

```
AGENTS.md (Universal Standards)
├─ Version: 1.0.0
├─ Tech Stack: Docker, TOML, TypeScript
├─ Naming Conventions: lowercase-with-hyphens
├─ Security: No hardcoded credentials
├─ Testing: >80% coverage required
└─ Permissions: What agents can/cannot do

├─ CLAUDE.md (Agent-specific)
│  └─ Claude-specific workflows
│     Memory management
│     Primary task patterns
│
├─ CURSOR.md (Agent-specific)
│  └─ Cursor rules in .cursor/rules/
│     Multi-agent activation
│     IDE shortcuts
│
├─ CLINE.md (Agent-specific)
│  └─ Cline MCP configuration
│     Command execution
│     Permission boundaries
│
├─ WINDSURF.md (Agent-specific)
│  └─ Async workflow definition
│     Task orchestration
│     Background monitoring
│
└─ COPILOT.md (Agent-specific)
   └─ Inline suggestion patterns
      Code completion rules
      Security guidelines
```

---

## 🎯 Success Metrics: Multi-Agent Effectiveness

| Metric | Target | How Achieved |
|--------|--------|-------------|
| **Template Creation Speed** | <30 min | Parallel workflow (async validation) |
| **Validation Accuracy** | 100% | Cline automated testing |
| **Test Coverage** | >80% | Cline + automated test suite |
| **Error Recovery** | <5 min | Claude explains, Cursor fixes |
| **Staging Readiness** | 100% | Cline verifies pre-deployment |
| **PR Quality** | 0 revisions | Full validation before submission |
| **Agent Coordination** | Seamless | AGENTS.md as source of truth |

---

## 📞 Escalation & Handoff Protocol

### When Claude Needs to Escalate

```
Scenario: Complex architectural issue
Claude: "This requires hands-on testing"
↓
→ Cursor: "Implement this approach"
   (Cursor tries implementation)
→ If Cursor implementation fails:
   → Cline: "Debug and test locally"
   → Cline reports: "Issue X at Y location"
   → Claude: "Suggests redesign based on findings"
```

### When Cursor Needs to Escalate

```
Scenario: Validation error with no clear fix
Cursor: "I can't resolve this validation error"
↓
→ Claude: "Explain the error's root cause"
   (Claude analyzes AGENTS.md Section 4)
   (Claude suggests architectural fix)
→ Cursor: "Implement fix based on explanation"
```

### When Cline Needs to Escalate

```
Scenario: Complex test failure
Cline: "3 tests failing, pattern unclear"
↓
→ Claude: "Analyze failure patterns"
   (Claude reviews test logs)
   (Claude identifies root cause)
→ Cursor: "Implement fix"
→ Cline: "Retest"
```

---

## 🔄 Continuous Improvement Cycle

```
Week 1: Initial Templates Created
├─ Claude designs 3 templates
├─ Cursor implements
├─ Cline validates
└─ Windsurf monitors

Week 2: Patterns Emerge
├─ Analyze: What worked well?
├─ Copilot learns common patterns
├─ Claude: Extract design patterns
└─ Update: DESIGNSYSTEM.md

Week 3: Process Refinement
├─ Identify bottlenecks
├─ Adjust agent responsibilities
├─ Streamline workflows
└─ Update: Configuration files

Week 4: Scaling
├─ Apply learned patterns
├─ Speed increases
├─ Quality improves
└─ Ready for production use
```

---

## 🎓 Training New Agents

Adding a new agent to the workflow:

1. **Reference AGENTS.md** - New agent reads standards
2. **Create agent-specific config** - New file following pattern (e.g., GEMINI.md)
3. **Map agent role** - Where in workflow?
4. **Test integration** - Simple task first
5. **Refine interactions** - Adjust communication pattern
6. **Document** - Add to MULTIAGENTPLAN.md

Example: Adding Gemini as "Research Agent"
```
GEMINI.md created
├─ Research specialist: API docs, best practices
├─ Works with: Claude (strategy), Cursor (implementation)
├─ Primary: "Research Cloudflare D1 best practices"
└─ Output: Research document for Claude
```

---

## 📋 Checklist: Is Your Multi-Agent Setup Ready?

- [ ] AGENTS.md created (source of truth)
- [ ] CLAUDE.md created (Claude configuration)
- [ ] CURSOR.md created (.cursor/rules/ set up)
- [ ] CLINE.md created (.clinerules configured)
- [ ] WINDSURF.md created (.windsurfrules configured)
- [ ] COPILOT.md created (symlink to AGENTS.md)
- [ ] MULTIAGENTPLAN.md created (this file)
- [ ] .aiignore created (exclude sensitive files)
- [ ] ai-agent.config.json created (service config)
- [ ] agents/ directory created (role-specific docs)
- [ ] Package.json scripts match AGENTS.md commands
- [ ] .env.example provided (no secrets)
- [ ] All agents tested individually
- [ ] Workflow A tested (design → build → test)
- [ ] Workflow B tested (fix errors)
- [ ] Workflow C tested (CF integration)
- [ ] Team trained on agent interactions
- [ ] CHANGELOG.md updated
- [ ] Documentation complete

---

## 🚀 Quick Start: Using Multi-Agent System

### Day 1: Design Phase
```
Start Claude: "Design a Grafana template with CF integration"
Duration: 5-10 minutes
Output: Architecture document
```

### Day 2: Implementation Phase
```
Start Cursor: "@builder Implement Grafana template"
Duration: 10-15 minutes
Output: Template files
Monitor: Windsurf validates in background
```

### Day 3: Validation Phase
```
Check Windsurf: "Is template ready?"
Cline reports: ✅ All checks passed
Staging: URL provided
Next: Manual testing + PR submission
```

### Total: 3 days with minimal manual work

---

**Remember:** Agents are tools. AGENTS.md is the shared source of truth. Use agents strategically, let them work asynchronously, and trust the automated validation pipeline.

The goal: **Fast, high-quality template creation with zero regressions.**
