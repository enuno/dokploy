---
description: Scans blueprints for outdated Docker image versions and creates update issues
on:
  schedule:
    - cron: "0 8 * * *"
  workflow_dispatch:
permissions:
  contents: read
  issues: write
engine: copilot
timeout-minutes: 15
tools:
  bash: true
  github: true
  web-fetch: true
safe-outputs:
  create-issue:
    enabled: true
    labels: ["template-update", "automated"]
---

# Daily Version Scanner

Scan all application templates in `blueprints/` and identify outdated versions.

## Steps

### 1. Inventory Templates
Read each `blueprints/*/docker-compose.yml` and extract:
- Docker image name and current tag
- Application name from directory name

Read `meta.json` for current version metadata.

### 2. Check Latest Versions
For each template:
- Query Docker Hub API: `https://hub.docker.com/v2/repositories/{org}/{image}/tags?page_size=25&ordering=last_updated`
- Filter for stable semver tags (exclude latest, dev, rc, beta, alpha)
- Compare with current version

For templates with GitHub links in meta.json:
- Query GitHub releases API: `/repos/{owner}/{repo}/releases/latest`

### 3. Create Issues for Outdated Templates
For each template needing update, create an issue titled:
`Update {app-name} to version {new-version}`

Include in body:
```markdown
## Current Version
- **Current**: {current-version}
- **Latest**: {new-version}

## Links
- Changelog: {link-to-changelog}
- Release Notes: {link-to-release}
- Docker Hub: https://hub.docker.com/r/{org}/{image}

## Update Checklist
- [ ] Update docker-compose.yml with new version
- [ ] Update meta.json version field
- [ ] Test deployment in staging
- [ ] Run validation: `npm run validate -- blueprints/{app-name}`
- [ ] Update README.md if breaking changes
- [ ] Run tests: `npm run test:coverage`
```

### 4. Deduplicate
Before creating: search open issues with label `template-update` for this app.
If exists, add comment with new version info instead of duplicate issue.

### 5. Summary
Post results as workflow summary with table of scanned templates and their status:
```markdown
| Template | Current | Latest | Status |
|----------|---------|--------|--------|
| grafana  | 10.2.0  | 10.3.1 | ⚠️ Update Available |
| redis    | 7.2.0   | 7.2.0  | ✅ Up to date |
```

## Constraints
- Maximum 10 issues per run
- Only report semver increases (not downgrades)
- Respect API rate limits (Docker Hub: 200/6hr with token)
- Skip templates without version tags (e.g., `latest`, `main`)

## Environment Variables
Use GitHub secrets for API authentication:
- `DOCKER_HUB_TOKEN` - Docker Hub personal access token (optional, increases rate limit)
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Error Handling
- If Docker Hub API fails, log warning and continue with other templates
- If GitHub API fails, use Docker Hub version only
- If no stable version found, skip template with info log
