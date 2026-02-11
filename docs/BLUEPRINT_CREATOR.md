# Blueprint Creator Usage Guide

## Overview

This project uses GitHub Copilot's coding agent for automated blueprint creation through structured issue templates.

## Architecture

Instead of the non-existent `.agent.md` format, we use:

1. **Path-specific instructions**: `.github/instructions/blueprints.instructions.md`
   - Applies automatically to all `blueprints/**` files
   - Contains Docker Compose rules, TOML rules, validation requirements

2. **Issue template**: `.github/ISSUE_TEMPLATE/new-blueprint.yml`
   - Structured form for blueprint requests
   - Captures app name, Docker image, version, dependencies, Cloudflare services

3. **GitHub API assignment**: Copilot coding agent assigned via REST API

## Creating a New Blueprint

### Method 1: GitHub UI (Recommended)

1. Go to repository Issues tab
2. Click "New Issue"
3. Select "New Blueprint Request"
4. Fill out the form:
   - Application Name: `redis`
   - Docker Image: `redis:7-alpine`
   - Version: `7.2.0`
   - Description: "In-memory data structure store"
   - Select dependencies/Cloudflare services as needed
5. Submit issue
6. Manually assign `@copilot` in the issue

### Method 2: GitHub CLI

```bash
# Create issue from template
gh issue create \
  --template new-blueprint.yml \
  --title "[Blueprint] Redis" \
  --assignee copilot

# Or create with API
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/enuno/dokploy/issues \
  --input - <<< '{
    "title": "[Blueprint] Redis",
    "body": "Application Name: redis\nDocker Image: redis:7-alpine\nVersion: 7.2.0",
    "labels": ["blueprint", "template-request"],
    "assignees": ["copilot"]
  }'
```

### Method 3: API with Custom Instructions

For advanced workflows, use the GitHub REST API to assign Copilot with specific instructions:

```bash
# Note: This endpoint may require GitHub Copilot Enterprise
gh api --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/enuno/dokploy/issues/ISSUE_NUMBER/assignees \
  --input - <<< '{
    "assignees": ["copilot"],
    "agent_assignment": {
      "target_repo": "enuno/dokploy",
      "base_branch": "main",
      "custom_instructions": "Follow blueprints.instructions.md. Create complete template in blueprints/redis/ with docker-compose.yml, template.toml, logo SVG, and README.md. Update meta.json. Validate before PR."
    }
  }'
```

## What Happens Next

1. **Copilot reads instructions**: Automatically loads `.github/instructions/blueprints.instructions.md`
2. **Creates files**: Generates complete blueprint in `blueprints/[app-name]/`
   - `docker-compose.yml` with pinned version
   - `template.toml` with proper variables
   - `[app-name].svg` (logo placeholder or fetched)
   - `README.md` with setup instructions
3. **Updates registry**: Adds entry to `meta.json`
4. **Validates**: Runs validation checks before creating PR
5. **Creates PR**: Submits pull request with all changes

## Copilot Behavior

Copilot will follow these rules (from `blueprints.instructions.md`):

### Docker Compose
- Use version 3.8+
- Pin image versions (no `latest`)
- Add `restart: unless-stopped` to all services
- Use named volumes only
- Never expose ports (Traefik handles routing)

### template.toml
- Declare all variables in `[variables]` section
- Use Dokploy helpers: `${password:32}`, `${domain}`, `${uuid}`
- Match `serviceName` to compose service name
- Reference user env vars like `${CF_API_TOKEN}`

### Validation
- Run `docker compose config` to verify syntax
- Run `npm run validate -- blueprints/[name]`
- Run `npm run test:coverage`
- All must pass before PR submission

## Reviewing Copilot PRs

When Copilot creates a PR, review:

1. **File structure**: All required files present
2. **Version pinning**: No `latest` tags
3. **Variable declarations**: All variables defined in `[variables]`
4. **Service naming**: Compose service matches TOML `serviceName`
5. **Security**: No hardcoded credentials
6. **Validation**: CI checks pass
7. **Documentation**: README.md is complete and accurate

## Troubleshooting

### Copilot doesn't see instructions

Ensure `.github/instructions/blueprints.instructions.md` has YAML frontmatter:
```yaml
---
applyTo: "blueprints/**"
---
```

### Copilot creates incorrect structure

Add comment to issue with corrections:
```
@copilot Please update the template following these corrections:
- Pin image version to 10.2.0 (not latest)
- Move variables to [variables] section
- Match serviceName to compose service name
```

### Validation fails

Copilot should auto-fix if you comment:
```
@copilot The validation failed with error: [paste error]
Please fix and re-run validation.
```

## Advanced: Custom Workflows

For complex templates requiring multiple steps:

1. Create issue with basic requirements
2. Let Copilot create initial structure
3. Comment on PR with refinements:
   ```
   @copilot Please add Cloudflare D1 integration:
   - Add CF_D1_DB_ID variable
   - Create wrangler.toml mount
   - Update README with D1 setup instructions
   ```

## Reference

- **Primary config**: `.github/copilot-instructions.md`
- **Blueprint rules**: `.github/instructions/blueprints.instructions.md`
- **Universal standards**: `AGENTS.md`
- **Design patterns**: `AGENTS.md` section 3
