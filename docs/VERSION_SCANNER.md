# Version Scanner Setup Guide

## Overview

Automated daily scanning of Docker image versions in blueprints using GitHub Actions Workflows (gh-aw) and Copilot.

## Prerequisites

1. **Install gh-aw extension**:
   ```bash
   gh extension install github/gh-aw
   ```

2. **Verify installation**:
   ```bash
   gh aw --help
   ```

## Setup Steps

### 1. Compile Workflow

The workflow is defined in `.github/workflows/daily-version-scan.md` in gh-aw format.

Compile to GitHub Actions YAML:
```bash
gh aw compile .github/workflows/daily-version-scan.md
```

This generates `.github/workflows/daily-version-scan.lock.yml` which is the actual workflow file.

### 2. Set Secrets

Configure GitHub secrets for API authentication:

```bash
# GitHub token (automatically provided, but can be customized)
gh secret set GH_AW_GITHUB_TOKEN --body "ghp_your_token_here"

# Docker Hub token (optional, increases rate limit from 100 to 200 pulls/6hr)
gh secret set DOCKER_HUB_TOKEN --body "dckr_pat_your_token_here"
```

**Note**: Docker Hub token is optional but recommended to avoid rate limiting.

### 3. Commit Both Files

Both the source `.md` and compiled `.lock.yml` should be committed:

```bash
git add .github/workflows/daily-version-scan.md
git add .github/workflows/daily-version-scan.lock.yml
git commit -m "chore: add daily version scanner workflow"
git push
```

## Usage

### Manual Trigger

Test the workflow manually:
```bash
gh aw run daily-version-scan
```

Or via GitHub UI:
1. Go to Actions tab
2. Select "Daily Version Scanner"
3. Click "Run workflow"

### Automatic Trigger

Workflow runs automatically every day at 8:00 AM UTC (defined in `on.schedule.cron`).

## Workflow Behavior

### 1. Template Inventory
- Scans all `blueprints/*/docker-compose.yml` files
- Extracts image names and current versions
- Cross-references with `meta.json` for metadata

### 2. Version Checking
For each template:
- **Docker Hub API**: Query latest stable version
  ```
  GET https://hub.docker.com/v2/repositories/{org}/{image}/tags?page_size=25&ordering=last_updated
  ```
- **GitHub Releases API**: If GitHub link in meta.json
  ```
  GET /repos/{owner}/{repo}/releases/latest
  ```

### 3. Issue Creation
For outdated templates, creates issue:
```
Title: Update [app-name] to version [new-version]

Body:
## Current Version
- Current: 10.2.0
- Latest: 10.3.1

## Links
- Changelog: [link]
- Release Notes: [link]
- Docker Hub: https://hub.docker.com/r/grafana/grafana

## Update Checklist
- [ ] Update docker-compose.yml
- [ ] Update meta.json
- [ ] Test in staging
- [ ] Run validation
- [ ] Update README if breaking changes
- [ ] Run tests
```

Labels: `template-update`, `automated`

### 4. Deduplication
Before creating issue:
- Searches for existing open issues with `template-update` label for same app
- If found, adds comment with new version info instead of creating duplicate

### 5. Summary
Posts workflow run summary with table:
```markdown
| Template | Current | Latest | Status |
|----------|---------|--------|--------|
| grafana  | 10.2.0  | 10.3.1 | ⚠️ Update Available |
| redis    | 7.2.0   | 7.2.0  | ✅ Up to date |
| pocketbase | latest | —    | ⚠️ Unversioned |
```

## Constraints

- **Maximum 10 issues per run**: Prevents spam
- **Semver increases only**: No downgrades reported
- **Rate limits**: Respects Docker Hub (200/6hr) and GitHub (5000/hr) API limits
- **Stable versions only**: Excludes `latest`, `dev`, `rc`, `beta`, `alpha` tags

## Security

### API Tokens
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions (read issues, write issues)
- `DOCKER_HUB_TOKEN`: Optional, stored in GitHub Secrets (never exposed)

### Permissions
Workflow has minimal permissions:
```yaml
permissions:
  contents: read
  issues: write
```

Cannot modify code or push commits - only read templates and create issues.

## Troubleshooting

### Workflow doesn't run
Check:
1. Compiled `.lock.yml` exists in `.github/workflows/`
2. Both `.md` and `.lock.yml` are committed
3. Workflow is enabled in repository settings

### Rate limit errors
Solution:
1. Set `DOCKER_HUB_TOKEN` secret (increases limit to 200/6hr)
2. Reduce scan frequency (change cron schedule)

### No issues created
Possible reasons:
1. All templates are up-to-date ✅
2. Templates use `latest` tag (skipped by design)
3. Deduplication found existing issues (check for open `template-update` issues)

### Wrong version detected
The scanner prioritizes stable semver tags. If detecting wrong version:
1. Check Docker Hub API response manually
2. Verify image tag naming convention
3. Update scanner logic in workflow to handle special cases

## Modifying the Workflow

### Change Schedule
Edit `on.schedule.cron` in `.github/workflows/daily-version-scan.md`:
```yaml
on:
  schedule:
    - cron: "0 8 * * *"  # 8 AM UTC daily
    # Change to:
    - cron: "0 */12 * * *"  # Every 12 hours
```

Then recompile:
```bash
gh aw compile .github/workflows/daily-version-scan.md
git add .github/workflows/daily-version-scan.{md,lock.yml}
git commit -m "chore: update version scan schedule"
```

### Add Custom Logic
Modify the workflow markdown, then recompile:
```bash
# Edit workflow
vim .github/workflows/daily-version-scan.md

# Recompile
gh aw compile .github/workflows/daily-version-scan.md

# Verify changes
git diff .github/workflows/daily-version-scan.lock.yml

# Commit
git add .github/workflows/daily-version-scan.{md,lock.yml}
git commit -m "chore: customize version scanner logic"
```

## Monitoring

### View Workflow Runs
```bash
# List recent runs
gh run list --workflow=daily-version-scan.lock.yml

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### GitHub UI
1. Go to repository Actions tab
2. Select "Daily Version Scanner" workflow
3. View run history and logs

## Integration with Blueprint Updates

When version scanner creates an issue:

1. **Manual Update**: Developer updates template and closes issue
2. **Copilot Update**: Assign `@copilot` to issue for automated PR creation
3. **Dependabot-style**: Future enhancement - auto-create PRs (requires additional workflow)

## Reference

- **Workflow source**: `.github/workflows/daily-version-scan.md`
- **Compiled workflow**: `.github/workflows/daily-version-scan.lock.yml`
- **gh-aw docs**: https://github.com/github/gh-aw
- **Docker Hub API**: https://docs.docker.com/docker-hub/api/latest/
- **GitHub REST API**: https://docs.github.com/en/rest
