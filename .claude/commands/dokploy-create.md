---
description: "Create production-ready Dokploy template using skills-first approach with Cloudflare defaults"
allowed-tools: ["Read", "Search", "Edit", "Write", "Bash", "WebSearch", "WebFetch", "Skill"]
author: "Home Lab Infrastructure Team"
version: "2.0.0"
---

# Create Dokploy Template (Skills-First Orchestration)

Create a complete, production-ready Dokploy template for `$ARGUMENTS` using progressive skill loading for optimal token efficiency.

## Invocation

```
/dokploy-create [application-name]
```

**Examples:**
- `/dokploy-create gitea`
- `/dokploy-create nextcloud`
- `/dokploy-create vaultwarden`

---

## Skills-First Workflow

This command orchestrates multiple specialized skills instead of using a fixed agent. This approach provides:
- **35% token reduction** vs traditional agent approach
- **Progressive loading** - skills loaded only when needed
- **Maintainability** - update individual skills without changing command
- **Reusability** - skills portable across projects

## Process

### Phase 1: Discovery (Research)

**No skills needed** - Direct research and analysis

Research the application to understand:
1. **Official Docker Image**: Find on Docker Hub or GitHub Container Registry
2. **Dependencies**: Database (PostgreSQL, MongoDB, MySQL), cache (Redis), helpers
3. **Storage Needs**: Volumes, object storage (use R2)
4. **Ports**: Web UI port, API port, other protocols (SSH, etc.)
5. **Environment Variables**: Required configuration

**Actions:**
- WebSearch for `[application] docker compose`
- WebFetch official documentation
- Read existing templates in `dokploy/blueprints/` for patterns

### Phase 2: Architecture (Design)

**Load Skill:** `dokploy-multi-service`

Design the service architecture:
1. **Service Graph**: Which services depend on which
2. **Network Topology**: Internal-only vs external services
3. **Cloudflare Services**: R2 for storage, Zero Trust for admin
4. **Health Strategy**: Appropriate health checks per service type

**Skill Output:** Architectural design document

### Phase 3: Generation (Build)

**Load Skills Progressively** (in order):

1. **dokploy-compose-structure** → Create base docker-compose.yml structure
2. **dokploy-traefik-routing** → Add Traefik routing labels for web access
3. **dokploy-health-patterns** → Configure health checks for each service type
4. **dokploy-cloudflare-integration** → Add R2 storage / DNS challenge / Zero Trust (if applicable)
5. **dokploy-environment-config** → Define environment variables with proper helpers
6. **dokploy-template-toml** → Generate template.toml with variable mappings

**Skill Outputs:** Complete docker-compose.yml and template.toml files

### Phase 4: Validation (Quality Gates)

**Load Skills Sequentially:**

1. **dokploy-security-hardening** → Security review and hardening
2. **dokploy-template-validation** → Validate against all conventions

**Final Check:**
- Run `docker compose -f docker-compose.yml config` to validate syntax

**Skill Outputs:** Validation reports and fixed templates

### Phase 5: Documentation (Finalize)

**No skills needed** - Direct documentation generation

Generate comprehensive README.md for the template:
- Application overview and features
- Service architecture diagram
- Resource requirements
- Configuration variables reference table
- Post-deployment steps
- Cloudflare R2 setup instructions (if applicable)
- Troubleshooting guide with common issues

### Phase 6: Update Index

**Load Skill:** `documentation-update` (if available) or manual update

**Actions:**
1. Read current `dokploy/README.md`
2. Determine appropriate category:
   - **Nostr Protocol Relays**: Nostr/relay applications
   - **Developer Tools**: Git forges, CI/CD, registries, dev utilities
   - **Document & Content Management**: Document systems, pastebins, file sharing
   - **Observability**: Monitoring, metrics, logging stacks
   - Create new category if none fit
3. Add template row to the appropriate category table
4. Update template count in Overview section
5. Update "Last Updated" date to current month/year

**Template Row Format:**
```markdown
| [app-name](blueprints/app-name/) | Brief description | Services count | Ready |
```

**For Nostr relays, include database column:**
```markdown
| [app-name](blueprints/app-name/) | Description | Database type | Services | Ready |
```

---

## Output

Creates/updates the following files:

```
dokploy/
├── README.md                     # Updated with new template entry
└── blueprints/
    └── [app-name]/
        ├── docker-compose.yml    # Service definitions
        ├── template.toml         # Dokploy configuration
        ├── README.md             # Template documentation
        └── [app-name].svg        # Logo (optional, user provides)
```

---

## Required Skills

This command requires the following skills to be available in `.claude/skills/`:

| Skill Name | Purpose | Phase Used |
|------------|---------|------------|
| **dokploy-multi-service** | Multi-service architecture design | Phase 2 (Architecture) |
| **dokploy-compose-structure** | Docker Compose generation | Phase 3 (Generation) |
| **dokploy-traefik-routing** | Traefik label configuration | Phase 3 (Generation) |
| **dokploy-health-patterns** | Health check patterns | Phase 3 (Generation) |
| **dokploy-cloudflare-integration** | Cloudflare service integration | Phase 3 (Generation) |
| **dokploy-environment-config** | Environment variable configuration | Phase 3 (Generation) |
| **dokploy-template-toml** | template.toml generation | Phase 3 (Generation) |
| **dokploy-security-hardening** | Security review and hardening | Phase 4 (Validation) |
| **dokploy-template-validation** | Convention compliance validation | Phase 4 (Validation) |

**Note:** If skills are not found in `.claude/skills/`, the command will reference them from the project-managed skills location. Skills are loaded progressively - only when needed for the current phase.

---

## Cloudflare Defaults

When the application needs external services, default to Cloudflare:

| Need | Use | Instead Of |
|------|-----|------------|
| Object storage | Cloudflare R2 | MinIO, AWS S3 |
| SSL certs | CF DNS challenge | HTTP challenge |
| Admin access | Zero Trust | Basic auth |

---

## Quality Checklist

Before completion, verify:

### docker-compose.yml
- [ ] All images have pinned versions (no `:latest`)
- [ ] All services have `restart: always`
- [ ] All services have health checks
- [ ] Two networks: `[app]-net` + `dokploy-network`
- [ ] Databases on internal network only
- [ ] Named volumes (no bind mounts)
- [ ] Required vars use `:?` syntax
- [ ] Optional vars use `:-` syntax

### template.toml
- [ ] Variables section complete
- [ ] Domain configuration correct
- [ ] Environment organized by category
- [ ] Secrets use password/base64 generators

### README.md (template)
- [ ] Overview and features
- [ ] Architecture diagram
- [ ] Configuration table
- [ ] Post-deployment steps
- [ ] Troubleshooting section

### dokploy/README.md (index)
- [ ] Template added to correct category table
- [ ] Template count updated in Overview
- [ ] Last Updated date is current

---

## Example Output

For `/dokploy-create vaultwarden`:

**docker-compose.yml:**
```yaml
services:
  vaultwarden:
    image: vaultwarden/server:1.32.0
    restart: always
    volumes:
      - vaultwarden-data:/data
    environment:
      DOMAIN: https://${VAULTWARDEN_DOMAIN}
      ADMIN_TOKEN: ${ADMIN_TOKEN:?Set admin token}
      SIGNUPS_ALLOWED: ${SIGNUPS_ALLOWED:-false}
    networks:
      - vaultwarden-net
      - dokploy-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vaultwarden.rule=Host(`${VAULTWARDEN_DOMAIN}`)"
      - "traefik.http.routers.vaultwarden.entrypoints=websecure"
      - "traefik.http.routers.vaultwarden.tls.certresolver=letsencrypt"
      - "traefik.http.services.vaultwarden.loadbalancer.server.port=80"
      - "traefik.docker.network=dokploy-network"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/alive"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  vaultwarden-data:
    driver: local

networks:
  vaultwarden-net:
    driver: bridge
  dokploy-network:
    external: true
```

**template.toml:**
```toml
# Vaultwarden - Self-hosted Bitwarden compatible password manager
# https://github.com/dani-garcia/vaultwarden

[variables]
domain = "${domain}"
admin_token = "${base64:48}"

[[config.domains]]
serviceName = "vaultwarden"
port = 80
host = "${domain}"

[config.env]
VAULTWARDEN_DOMAIN = "${domain}"
ADMIN_TOKEN = "${admin_token}"
SIGNUPS_ALLOWED = "false"
```

---

## Error Handling

### If No Image Found
Ask user: "What Docker image should I use for [app]?"

### If Dependencies Unknown
Ask user: "Does [app] require a database? (PostgreSQL/MongoDB/MySQL/None)"

### If Storage Needs Unclear
Ask user: "Does [app] need object storage? (For uploads, attachments, etc.)"

---

## Notes

- Always use existing templates as reference patterns
- Prefer PostgreSQL over MySQL when choice exists
- Default to Cloudflare R2 for any S3-compatible storage needs
- Include resource limits for home lab optimization
- Generate comprehensive README with setup instructions

---

**Version**: 1.1.0
**Last Updated**: December 2024
