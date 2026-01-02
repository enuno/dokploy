---
description: "Troubleshoot deployed Dokploy applications using MCP server and SSH diagnostics"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "mcp__dokploy-mcp__*"]
argument-hint: "<app-name> [--host <hostname>] [--user <username>] [--key <path>]"
author: "Home Lab Infrastructure Team"
version: "1.0.0"
complexity: "moderate"
category: "troubleshooting"
tags: ["dokploy", "debugging", "diagnostics", "mcp", "ssh"]
---

# Troubleshoot Deployed Dokploy Application

Diagnose and fix issues with applications deployed using Dokploy templates from this repository. Uses MCP server as primary diagnostic tool, with SSH for deeper system-level debugging when needed.

## Invocation

```bash
/dokploy-troubleshoot <app-name>
/dokploy-troubleshoot <app-name> --host <hostname> --user <username> --key <path>
```

**Examples:**
```bash
# Troubleshoot using MCP server only (default)
/dokploy-troubleshoot grafana

# Troubleshoot with SSH diagnostics available
/dokploy-troubleshoot nextcloud --host dokploy.example.com --user dokployuser --key ~/.ssh/id_rsa

# Custom SSH configuration
/dokploy-troubleshoot pocketbase --host 192.168.1.100 --user root --key ~/.ssh/homelab_key
```

---

## Diagnostic Hierarchy

```
┌─────────────────────────────────────────────┐
│  Phase 1: MCP Server Diagnostics (Primary) │
│  • Application status and health            │
│  • Configuration validation                 │
│  • Deployment logs and events               │
│  • Domain/routing checks                    │
│  • Make configuration changes               │
│  • Monitor redeployments                    │
└───────────────────┬─────────────────────────┘
                    │
                    ├─[Issue Resolved?]──Yes──► Done
                    │
                    No
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Phase 2: SSH Deep Diagnostics (Secondary) │
│  • Container-level debugging                │
│  • System resource analysis                 │
│  • Network connectivity tests               │
│  • File system and volume inspection        │
│  • Manual Docker commands                   │
└─────────────────────────────────────────────┘
```

**Key Principle:** MCP first, SSH second. Only escalate to SSH when MCP diagnostics are insufficient.

---

## Workflow

### Step 1: Parse Arguments

Extract application name and optional SSH connection parameters:

```
Required:
  app-name: Name of the deployed application (matches blueprint name)

Optional SSH flags:
  --host <hostname>: Remote Dokploy server hostname or IP
  --user <username>: SSH username (default: inferred from MCP server config)
  --key <path>: Path to SSH private key (default: ~/.ssh/id_rsa)
```

**Argument Parsing:**
```
First argument = app-name
Remaining arguments = parse as flags:
  - --host followed by value → hostname
  - --user followed by value → username
  - --key followed by value → key path
```

### Step 2: Validate Blueprint Exists

Check if the application template exists in this repository:

```bash
# Check if blueprint directory exists
ls blueprints/<app-name>/
```

If not found, list available blueprints:
```bash
ls -1 blueprints/ | grep -v README.md
```

Show error:
```
❌ Blueprint '<app-name>' not found in this repository.

Available blueprints:
  - grafana
  - nextcloud
  - pocketbase
  ...

Usage: /dokploy-troubleshoot <blueprint-name>
```

Then stop execution.

### Step 3: Get Application Info via MCP Server

Use MCP tools to retrieve deployed application details:

**Step 3.1: Find Application**

Search all projects to find the application:

```
Use: mcp__dokploy-mcp__project-all
  - Lists all projects with services
  - Find application matching <app-name> (fuzzy match)
```

**Step 3.2: Get Application Details**

Once found, retrieve full application info:

```
Use: mcp__dokploy-mcp__application-one
  Parameters:
    - applicationId: <id-from-step-3.1>
```

**Expected Response:**
```json
{
  "name": "grafana",
  "appName": "grafana-prod",
  "applicationStatus": "running" | "idle" | "error" | "done",
  "sourceType": "github" | "docker" | "git",
  "dockerImage": "grafana/grafana:10.2.0",
  "buildType": "dockerfile" | "nixpacks" | ...,
  "environmentId": "env-123",
  "serverId": "server-456",
  // ... more fields
}
```

**Step 3.3: Display Application Status**

```
📦 Application: <name>
🏷️  App Name: <appName>
📊 Status: <applicationStatus>
🖼️  Image: <dockerImage>
🔧 Build Type: <buildType>
🌐 Source: <sourceType>
```

### Step 4: Check Domain Configuration

Retrieve domain configuration for the application:

```
Use: mcp__dokploy-mcp__domain-byApplicationId
  Parameters:
    - applicationId: <application-id>
```

**Expected Response:**
```json
[
  {
    "host": "grafana.example.com",
    "port": 3000,
    "https": true,
    "certificateType": "letsencrypt",
    "path": "/",
    "serviceName": "grafana"
  }
]
```

**Display:**
```
🌐 Domains:
  ✓ https://grafana.example.com:3000
    Certificate: Let's Encrypt
    Service: grafana
```

**Validate Domain:**
```
Use: mcp__dokploy-mcp__domain-validateDomain
  Parameters:
    - domain: <host>
    - serverIp: <optional-from-ssh-host>
```

If validation fails:
```
⚠️  Domain validation failed for grafana.example.com
  Issue: DNS not pointing to server IP
  Expected: 192.168.1.100
  Current: Not resolved or different IP
```

### Step 5: Analyze Application Status

Based on `applicationStatus` from Step 3.2, determine diagnostic path:

#### Status: "error"
```
🔴 Application is in ERROR state

Likely causes:
  1. Container failed to start
  2. Health check failing
  3. Build/deployment failed
  4. Configuration error

Next steps:
  → Check deployment logs (Step 6)
  → Review configuration (Step 7)
  → Check container health (Step 9 - requires SSH)
```

#### Status: "idle"
```
🟡 Application is IDLE (not running)

Possible causes:
  1. Application manually stopped
  2. Deployment not triggered
  3. Waiting for manual start

Next steps:
  → Start application via MCP (Step 8)
  → Check if redeployment needed (Step 7)
```

#### Status: "running"
```
🟢 Application is RUNNING

If experiencing issues despite running status:
  → Check domain/routing (already done in Step 4)
  → Review Traefik configuration (Step 10 - requires SSH)
  → Inspect container logs (Step 11 - requires SSH)
  → Check resource usage (Step 12 - requires SSH)
```

#### Status: "done"
```
✅ Deployment completed successfully

If issues persist:
  → Application may be running but misconfigured
  → Proceed to deeper diagnostics (SSH)
```

### Step 6: Check Recent Deployment Logs (via MCP)

**Note:** This step depends on MCP server capabilities. If the MCP server doesn't expose deployment logs directly, skip to Step 9 (SSH diagnostics).

If MCP exposes deployment events or logs, retrieve them:

```
Check MCP documentation for:
  - Deployment history endpoint
  - Application events/logs endpoint
  - Build/deployment status endpoint
```

Display recent events:
```
📋 Recent Deployment Events:
  [2025-01-02 10:30 UTC] Deployment started
  [2025-01-02 10:31 UTC] Building Docker image...
  [2025-01-02 10:32 UTC] Image built successfully
  [2025-01-02 10:33 UTC] Starting containers...
  [2025-01-02 10:34 UTC] ERROR: Health check failed
```

### Step 7: Review and Fix Configuration

Read the blueprint template files:

```
Read:
  - blueprints/<app-name>/docker-compose.yml
  - blueprints/<app-name>/template.toml
```

**Common Issues to Check:**

#### Issue 1: Missing Required Environment Variables
```yaml
# docker-compose.yml
environment:
  DATABASE_URL: ${DATABASE_URL:?Set database URL}  # ERROR if not set
```

**Fix:** Check if variable is defined in template.toml:
```toml
[config.env]
DATABASE_URL = "postgresql://..."
```

If missing, add it and proceed to Step 7.5 (Git workflow).

#### Issue 2: Invalid Docker Image Version
```yaml
services:
  app:
    image: grafana/grafana:latest  # ❌ Don't use :latest
```

**Fix:** Pin to specific version:
```yaml
services:
  app:
    image: grafana/grafana:10.2.0  # ✅ Pinned version
```

#### Issue 3: Health Check Misconfiguration
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s  # May need adjustment if app slow to start
```

**Fix:** Increase `start_period` if container needs more startup time:
```yaml
healthcheck:
  start_period: 60s  # Give app more time to start
```

#### Issue 4: Network Configuration
```yaml
networks:
  - app-net        # Internal network
  - dokploy-network  # External (Traefik) network - REQUIRED
```

**Fix:** Ensure service is on `dokploy-network` for Traefik routing:
```yaml
services:
  app:
    networks:
      - app-net
      - dokploy-network
```

#### Issue 5: Traefik Labels Missing or Incorrect
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.app.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.app.entrypoints=websecure"
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
  - "traefik.http.services.app.loadbalancer.server.port=3000"
  - "traefik.docker.network=dokploy-network"
```

**Validation:** All 6 labels must be present for proper routing.

### Step 7.5: Apply Configuration Fixes (Git Workflow)

If configuration issues were found and fixed in Step 7:

**Important:** Template changes require git commit + push to trigger redeployment.

**Step 7.5.1: Validate Fixes Locally**

Before committing, validate the docker-compose.yml syntax:

```bash
docker compose -f blueprints/<app-name>/docker-compose.yml config
```

Expected: YAML resolves without syntax errors (may show warnings about missing env vars - this is OK).

**Step 7.5.2: Commit Changes**

Use git to commit the template fixes:

```bash
git add blueprints/<app-name>/docker-compose.yml
git add blueprints/<app-name>/template.toml  # if modified

git commit -m "fix(<app-name>): <brief description of fix>

- Fixed <specific issue 1>
- Fixed <specific issue 2>
- <additional context>

Resolves: <issue being fixed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 7.5.3: Push Changes**

```bash
git push origin main
```

**Step 7.5.4: Monitor Redeployment**

After pushing changes, Dokploy will trigger a redeployment (if configured with GitHub webhooks or similar).

Monitor deployment via MCP:

```
Loop (max 10 iterations, 30 second intervals):
  1. Use: mcp__dokploy-mcp__application-one
     Parameters:
       - applicationId: <application-id>

  2. Check applicationStatus:
     - If "running": ✅ Redeployment successful, proceed to Step 8
     - If "error": ❌ Redeployment failed, proceed to Step 6 (check logs)
     - If "idle" or "done": Continue monitoring

  3. Display progress:
     "⏳ Monitoring redeployment... Status: <applicationStatus> (attempt <N>/10)"

  4. Wait 30 seconds before next check

Exit loop if:
  - Status becomes "running" (success)
  - Status becomes "error" (failure - investigate)
  - 10 iterations completed (timeout - warn user)
```

**If redeployment successful:**
```
✅ Configuration fixes applied and redeployed successfully!
   Application status: running

Next steps:
  → Verify application is accessible at configured domain
  → Check application logs if issues persist (use SSH diagnostics)
```

**If redeployment failed:**
```
❌ Redeployment failed after configuration changes

Next steps:
  → Review deployment logs (Step 6)
  → Check for new errors introduced by changes
  → Revert changes if necessary
  → Escalate to SSH diagnostics (Step 9+)
```

**If timeout:**
```
⚠️  Redeployment monitoring timed out (5 minutes)

Possible causes:
  - Deployment is taking longer than expected
  - Webhook not configured (manual redeploy needed)
  - Application stuck in intermediate state

Next steps:
  → Manually trigger redeploy via Dokploy UI
  → Use SSH to check Docker container status
  → Contact Dokploy administrator
```

### Step 8: Application Control via MCP

If application needs to be started, stopped, or redeployed:

#### Start Application
```
Use: mcp__dokploy-mcp__application-start
  Parameters:
    - applicationId: <application-id>

Response: Application start initiated
```

#### Stop Application
```
Use: mcp__dokploy-mcp__application-stop
  Parameters:
    - applicationId: <application-id>

Response: Application stopped
```

#### Redeploy Application
```
Use: mcp__dokploy-mcp__application-redeploy
  Parameters:
    - applicationId: <application-id>
    - title: "Troubleshooting redeploy"
    - description: "Redeploying to fix <issue>"

Response: Redeployment triggered
```

**Monitor Redeploy:**
Follow same monitoring pattern as Step 7.5.4.

### Step 9: Escalate to SSH Diagnostics (If Needed)

**Trigger Conditions:**
- MCP diagnostics didn't reveal the issue
- Need container-level debugging
- Need to inspect system resources
- Need to run manual Docker commands
- User provided --host flag (SSH available)

**Prerequisites Check:**

```bash
# Verify SSH connection parameters
if [ -z "$SSH_HOST" ]; then
  echo "⚠️  SSH diagnostics require --host flag"
  echo "   Rerun with: /dokploy-troubleshoot <app-name> --host <hostname>"
  exit 1
fi

# Set defaults
SSH_USER="${SSH_USER:-root}"  # Default to root if not specified
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"  # Default SSH key

# Test SSH connectivity
ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
  "$SSH_USER@$SSH_HOST" "echo SSH connection successful" 2>&1
```

**If SSH connection fails:**
```
❌ SSH connection failed to $SSH_HOST

Possible causes:
  1. Host unreachable
  2. Invalid credentials
  3. SSH key not authorized
  4. Firewall blocking port 22

Troubleshooting:
  → Verify host is correct: $SSH_HOST
  → Verify user is correct: $SSH_USER
  → Verify SSH key exists: $SSH_KEY
  → Test manually: ssh -i $SSH_KEY $SSH_USER@$SSH_HOST
```

Then stop execution.

**If SSH connection successful:**
```
✅ SSH connection established to $SSH_HOST

Proceeding with deep diagnostics...
```

### Step 10: Container Status Inspection (SSH)

Check if containers are running:

```bash
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker ps --filter 'name=<app-name>' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

**Expected Output:**
```
NAMES                    STATUS              PORTS
grafana-prod            Up 2 hours          0.0.0.0:3000->3000/tcp
grafana-postgres        Up 2 hours          5432/tcp
```

**If containers not running:**
```bash
# Check exited containers
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker ps -a --filter 'name=<app-name>' --format 'table {{.Names}}\t{{.Status}}'"
```

**Display:**
```
🐳 Container Status:
  grafana-prod: Exited (1) 5 minutes ago
  grafana-postgres: Up 2 hours

⚠️  Main container is not running!

Next step: Check container logs (Step 11)
```

### Step 11: Container Logs Analysis (SSH)

Retrieve recent logs from containers:

```bash
# Get logs from main application container (last 100 lines)
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker logs --tail 100 <container-name>"

# For multiple containers, retrieve logs from each
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker compose -f /path/to/compose.yml logs --tail 50"
```

**Common Error Patterns:**

#### Pattern 1: Database Connection Error
```
ERROR: connection to database failed
FATAL: password authentication failed for user "grafana"
```

**Diagnosis:**
```
❌ Database connection issue detected

Possible causes:
  1. DATABASE_URL environment variable incorrect
  2. PostgreSQL not ready (timing issue)
  3. Database credentials mismatch

Fixes:
  → Check environment variables (Step 7)
  → Increase health check start_period (Step 7.5)
  → Verify database is running (Step 10)
```

#### Pattern 2: Port Already in Use
```
ERROR: bind: address already in use
```

**Diagnosis:**
```
❌ Port conflict detected

Fix:
  → Check for other containers using the same port
  → Change port mapping in docker-compose.yml
  → Stop conflicting service
```

#### Pattern 3: Permission Denied
```
ERROR: permission denied
FATAL: could not write to file
```

**Diagnosis:**
```
❌ File system permission issue

Fix:
  → Check volume mount permissions (Step 12)
  → Ensure container user has correct permissions
  → Fix ownership on host: chown -R <uid>:<gid> /path/to/volume
```

#### Pattern 4: Health Check Failing
```
WARNING: health check failed: <error>
```

**Diagnosis:**
```
⚠️  Health check failure detected

Fixes:
  → Increase health check timeout (Step 7)
  → Fix health check command (Step 7)
  → Increase start_period (Step 7)
```

### Step 12: System Resource Analysis (SSH)

Check server resources to identify resource exhaustion:

#### Disk Space
```bash
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "df -h | grep -E '(Filesystem|/var/lib/docker|/$)'"
```

**Expected Output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   30G   18G  63% /
/dev/sdb1       100G   45G   50G  48% /var/lib/docker
```

**If disk full (>90% used):**
```
⚠️  Disk space critical!

/var/lib/docker: 98% used

Action required:
  → Clean up old Docker images: docker system prune -a
  → Clean up old volumes: docker volume prune
  → Clean up old containers: docker container prune
```

#### Memory Usage
```bash
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "free -h"
```

**Expected Output:**
```
              total        used        free      shared  buff/cache   available
Mem:           16Gi       8.0Gi       4.0Gi       100Mi       4.0Gi       7.5Gi
Swap:         8.0Gi       0.0Gi       8.0Gi
```

**If low memory (<10% available):**
```
⚠️  Memory pressure detected!

Available: 500Mi / 16Gi (3%)

Possible causes:
  → Too many containers running
  → Memory leak in application
  → Insufficient server resources

Action required:
  → Stop unused containers
  → Increase server memory
  → Review container memory limits
```

#### CPU Usage
```bash
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "top -bn1 | head -20"
```

Analyze CPU usage by container:
```bash
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"
```

**If high CPU (>80%):**
```
⚠️  High CPU usage detected

Container grafana-prod: CPU 95%

Possible causes:
  → Application under heavy load
  → Inefficient queries or operations
  → Resource limits too low

Action required:
  → Review application logs for performance issues
  → Increase CPU limits in docker-compose.yml
  → Scale horizontally (add replicas)
```

### Step 13: Volume and Mount Inspection (SSH)

Check volume mounts and permissions:

```bash
# List volumes for application
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker volume ls | grep <app-name>"

# Inspect volume details
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker volume inspect <volume-name>"

# Check permissions on volume mount point
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "ls -la /var/lib/docker/volumes/<volume-name>/_data"
```

**Common Issues:**

#### Issue: Volume Not Mounted
```
❌ Expected volume not found: grafana-data

Fix:
  → Check volume definition in docker-compose.yml
  → Verify volume mount in service definition
  → Recreate volume if necessary
```

#### Issue: Permission Denied
```
drwxr-xr-x 2 root root 4096 Jan  2 10:00 /var/lib/docker/volumes/grafana-data/_data
```

**If container runs as non-root user:**
```
❌ Volume owned by root but container runs as user 472

Fix:
  → Change ownership:
    ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
      "chown -R 472:472 /var/lib/docker/volumes/grafana-data/_data"
```

### Step 14: Network Connectivity Tests (SSH)

Test network connectivity from container to dependencies:

```bash
# Test database connectivity from app container
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "docker exec <app-container> ping -c 3 postgres"

# Test DNS resolution
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "docker exec <app-container> nslookup postgres"

# Test port connectivity
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "docker exec <app-container> nc -zv postgres 5432"
```

**If connectivity fails:**
```
❌ Cannot reach postgres:5432 from app container

Possible causes:
  1. Services not on same Docker network
  2. Service name mismatch in depends_on
  3. Firewall blocking communication

Fix:
  → Verify both services on same network (docker-compose.yml)
  → Check service names match across configuration
  → Inspect network: docker network inspect <network-name>
```

### Step 15: Traefik Routing Diagnostics (SSH)

Check Traefik routing configuration:

```bash
# Check Traefik container logs
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "docker logs traefik --tail 50"

# Check if Traefik can see the service
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "docker exec traefik traefik healthcheck"

# Inspect Traefik configuration
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "curl -s http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains(\"<app-name>\"))'"
```

**Common Issues:**

#### Issue: Router Not Found
```
❌ Traefik router not found for <app-name>

Possible causes:
  1. Traefik labels missing or incorrect
  2. Container not on dokploy-network
  3. traefik.enable=false

Fix:
  → Verify Traefik labels in docker-compose.yml (Step 7)
  → Ensure container on dokploy-network (Step 7)
  → Restart Traefik to reload configuration
```

#### Issue: SSL Certificate Problem
```
❌ TLS certificate not found for grafana.example.com

Fix:
  → Check certresolver configuration
  → Verify domain DNS points to server
  → Check Let's Encrypt rate limits
  → Review Traefik logs for certificate errors
```

### Step 16: Generate Diagnostic Report

Compile all findings into a comprehensive report:

```markdown
# Diagnostic Report: <app-name>
Generated: <timestamp>

## Application Info
- Name: <app-name>
- Status: <applicationStatus>
- Image: <dockerImage>
- Source: <sourceType>

## Domain Configuration
- Primary Domain: <domain>
- HTTPS Enabled: <yes/no>
- Certificate Type: <letsencrypt/none/custom>
- Domain Validation: <passed/failed>

## MCP Diagnostics
✅ Issues found via MCP:
  - <issue 1>
  - <issue 2>

❌ Issues requiring SSH:
  - <issue 3>
  - <issue 4>

## SSH Diagnostics (if performed)
🐳 Container Status:
  - <container-name>: <status>

📋 Log Analysis:
  - Error: <error-message>
  - Cause: <root-cause>

💾 Resource Usage:
  - Disk: <usage>
  - Memory: <usage>
  - CPU: <usage>

🌐 Network:
  - Connectivity: <status>
  - Traefik: <status>

## Recommended Actions
1. <action 1>
2. <action 2>
3. <action 3>

## Applied Fixes
- [x] Fixed <issue> in docker-compose.yml (commit: <hash>)
- [x] Triggered redeployment
- [ ] Waiting for verification...

## Next Steps
- Monitor application after redeployment
- Verify domain accessibility
- Check application logs for new issues
```

### Step 17: Summary and Next Steps

Provide user with clear summary and actionable next steps:

```
╔════════════════════════════════════════════════════════╗
║  Troubleshooting Summary: <app-name>                   ║
╚════════════════════════════════════════════════════════╝

🔍 Issues Found: <N>
✅ Issues Fixed: <N>
⏳ Pending Verification: <N>

📊 Application Status: <status>

🛠️  Actions Taken:
  1. <action>
  2. <action>

📝 Next Steps:
  1. Monitor redeployment status
  2. Verify application at: <domain>
  3. Check logs if issues persist:
     docker logs <container-name>

💡 Additional Resources:
  - Blueprint: blueprints/<app-name>/
  - Dokploy Docs: https://docs.dokploy.com
  - Template README: blueprints/<app-name>/README.md

Need help? Check template documentation or contact support.
```

---

## Error Handling

### Error: Application Not Found in Dokploy
```
Symptom: MCP server cannot find application
Action: Verify application name, check if deployed
Recovery: List all applications, ask user to confirm name
```

### Error: SSH Connection Failed
```
Symptom: Cannot connect via SSH
Action: Verify credentials, test connection
Recovery: Provide manual SSH command for testing
```

### Error: Permission Denied (MCP)
```
Symptom: MCP operation rejected (insufficient permissions)
Action: Check MCP server authentication
Recovery: Ask user to verify API credentials
```

### Error: Git Push Failed
```
Symptom: Cannot push template changes
Action: Check git remote, authentication
Recovery: Provide manual git commands
```

---

## Usage Patterns

### Pattern 1: Quick MCP-Only Diagnostic
```bash
# Fast check using only MCP server
/dokploy-troubleshoot grafana

Expected workflow:
  → Get app status (MCP)
  → Check domains (MCP)
  → Identify config issue
  → Fix and commit
  → Monitor redeploy (MCP)
  → Done (no SSH needed)
```

### Pattern 2: Deep Dive with SSH
```bash
# Full diagnostic with container inspection
/dokploy-troubleshoot nextcloud --host dokploy.example.com

Expected workflow:
  → Try MCP diagnostics first
  → Escalate to SSH (container logs)
  → Identify resource issue
  → Fix configuration
  → Verify via SSH
  → Done
```

### Pattern 3: Fix Template and Redeploy
```bash
# Template has known issue, fix and redeploy
/dokploy-troubleshoot pocketbase

Expected workflow:
  → Skip MCP checks (known issue)
  → Edit docker-compose.yml
  → Commit and push
  → Monitor redeploy via MCP
  → Verify fix
  → Done
```

---

## Integration with Dokploy Templates

This command works specifically with templates from this repository:

### Supported Blueprints
All templates in `blueprints/` directory:
- Grafana
- Nextcloud
- Pocketbase
- Uptime Kuma
- Vaultwarden
- ... (all blueprints)

### Required Template Structure
```
blueprints/<app-name>/
├── docker-compose.yml  # Docker Compose configuration
├── template.toml       # Dokploy template configuration
└── README.md           # Template documentation
```

### Git Workflow Integration
```
Template Change → Git Commit → Git Push → Dokploy Webhook → Redeploy
```

**Important:** Always commit and push template changes to trigger redeployment.

---

## Troubleshooting the Troubleshooter

### Issue: MCP Server Not Responding
```
Solution:
  1. Check MCP server is running
  2. Verify MCP server configuration
  3. Test connection: curl <mcp-endpoint>/health
  4. Restart MCP server if needed
```

### Issue: Cannot Determine Default SSH Host
```
Solution:
  1. Always provide --host flag explicitly
  2. Check MCP server config for default host
  3. Use environment variable: DOKPLOY_HOST
```

### Issue: Application Exists in Multiple Projects
```
Solution:
  1. Show all matches to user
  2. Ask user to specify project name
  3. Add --project flag to command invocation
```

---

## Version History

### 1.0.0 (2025-01-02)
- Initial release
- MCP-first diagnostic approach
- SSH deep diagnostics as fallback
- Git workflow integration for template fixes
- Comprehensive error patterns and fixes
- Resource analysis and reporting
