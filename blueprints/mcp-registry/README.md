# MCP Registry

A community-driven registry service for Model Context Protocol (MCP) servers.

## Overview

[MCP Registry](https://github.com/modelcontextprotocol/registry) functions as an "app store" for MCP servers, providing clients with curated listings of available servers. Built with Go and PostgreSQL, it supports GitHub OAuth for namespace ownership validation and server publishing.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MCP Registry Stack                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│              ┌───────────────────────┐                           │
│              │    mcp-registry       │                           │
│              │       (Go)            │                           │
│              │       :8080           │                           │
│              └───────────┬───────────┘                           │
│                          │                                       │
│          ┌───────────────┼───────────────┐                       │
│          │               │               │                       │
│          ▼               ▼               ▼                       │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │  PostgreSQL │ │   GitHub    │ │  Google     │               │
│   │  (database) │ │   OAuth     │ │   OIDC      │               │
│   │   :5432     │ │ (optional)  │ │ (optional)  │               │
│   └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                   │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
│   Features:                                                       │
│   ├── Server discovery and listing                               │
│   ├── Namespace ownership via GitHub OAuth                       │
│   ├── Server publishing with validation                          │
│   └── Enterprise auth via Google OIDC                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- **Server Discovery**: Browse and search MCP servers with curated listings
- **Namespace Ownership**: GitHub OAuth validates ownership (e.g., `io.github.user/server`)
- **Server Publishing**: Authenticated users can publish MCP servers
- **Registry Validation**: Validates server metadata on publish
- **Enterprise Auth**: Optional Google OIDC for organizational access control
- **Data Seeding**: Seeds from production registry or local files
- **RESTful API**: Full API for MCP client integration

## Prerequisites

- Domain name with DNS configured
- PostgreSQL database (included in template)
- GitHub OAuth App (for publishing functionality)

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `mcp.example.com`)
3. Configure GitHub OAuth credentials (optional but recommended)
4. Access the registry at `https://mcp.example.com`

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain name |
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `JWT_PRIVATE_KEY` | Ed25519 seed for JWT signing (auto-generated) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_REGISTRY_VERSION` | `latest` | Docker image tag |
| `SEED_FROM` | Production API | Data source for seeding |
| `ENABLE_REGISTRY_VALIDATION` | `true` | Validate server metadata |
| `ENABLE_ANONYMOUS_AUTH` | `false` | Allow anonymous publishing |
| `GITHUB_CLIENT_ID` | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | - | GitHub OAuth client secret |
| `OIDC_ENABLED` | `false` | Enable Google OIDC |
| `OIDC_CLIENT_ID` | - | Google OAuth client ID |

## Services

| Service | Description | Ports |
|---------|-------------|-------|
| **mcp-registry** | Main registry application (Go) | 8080 |
| **postgres** | PostgreSQL database | 5432 (internal) |

## Exposed Endpoints

| Path | Description |
|------|-------------|
| `/` | Registry web interface |
| `/health` | Health check endpoint |
| `/v0/servers` | List all registered servers |
| `/v0/servers/{namespace}/{name}` | Get specific server details |
| `/auth/github/callback` | GitHub OAuth callback |

## GitHub OAuth Setup

GitHub OAuth is required for publishing servers to the registry.

### 1. Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `MCP Registry`
   - **Homepage URL**: `https://${DOMAIN}`
   - **Authorization callback URL**: `https://${DOMAIN}/auth/github/callback`
4. Click "Register application"
5. Copy the Client ID
6. Generate and copy a Client Secret

### 2. Configure Environment

```
GITHUB_CLIENT_ID=Iv23li...
GITHUB_CLIENT_SECRET=your_client_secret
```

## Google OIDC Setup (Optional)

For enterprise/organizational access control.

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Configure authorized redirect URIs: `https://${DOMAIN}/auth/oidc/callback`

### 2. Configure Environment

```
OIDC_ENABLED=true
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=1234567890.apps.googleusercontent.com
OIDC_EXTRA_CLAIMS=[{"hd":"your-domain.com"}]
```

## Data Seeding

The registry can seed data from various sources.

### Default (Production API)

By default, the registry seeds from the official MCP registry:

```
SEED_FROM=https://registry.modelcontextprotocol.io/v0/servers
```

### Offline Mode

For air-gapped or offline deployments:

```
SEED_FROM=/data/seed.json
ENABLE_REGISTRY_VALIDATION=false
```

Note: You must provide a `seed.json` file mounted at `/data/seed.json`.

## Publishing Servers

To publish an MCP server to your registry:

### 1. Authenticate

```bash
# Login via GitHub OAuth
curl -X POST https://your-registry.com/auth/github/login
```

### 2. Namespace Ownership

Namespaces are validated against GitHub:
- `io.github.username/server` → Must be logged in as `username`
- `io.github.org/server` → Must be member of `org`

### 3. Publish Server

Use the MCP Publisher CLI or API:

```bash
# Example API call
curl -X POST https://your-registry.com/v0/servers/io.github.user/my-server \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-server", "description": "..."}'
```

## Post-Deployment Setup

### 1. Verify Services

Check that all services are healthy:
- Registry: `https://your-domain.com/health`
- API: `https://your-domain.com/v0/servers`

### 2. Configure GitHub OAuth

1. Create GitHub OAuth App (see above)
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Redeploy the registry

### 3. Test Publishing (Optional)

1. Login via GitHub at `https://your-domain.com/auth/github/login`
2. Verify token is issued
3. Test publishing a server to your namespace

## Troubleshooting

### Database Connection Failed

- Verify PostgreSQL is healthy: check Dokploy logs
- Ensure `POSTGRES_PASSWORD` matches between services
- Check network connectivity between services

### GitHub OAuth Not Working

- Verify callback URL matches exactly: `https://${DOMAIN}/auth/github/callback`
- Check GitHub OAuth app is not suspended
- Review browser console for redirect errors

### Seeding Fails

- If using production API, ensure internet connectivity
- For offline mode, verify `/data/seed.json` exists and is valid JSON
- Set `ENABLE_REGISTRY_VALIDATION=false` for local seed files

### JWT Errors

- Ensure `JWT_PRIVATE_KEY` is a valid 32-byte hex string
- Generate new key: `openssl rand -hex 32`
- Restart registry after changing the key

## API Reference

### List Servers

```bash
curl https://your-registry.com/v0/servers
```

### Get Server Details

```bash
curl https://your-registry.com/v0/servers/io.github.user/server-name
```

### Health Check

```bash
curl https://your-registry.com/health
```

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| mcp-registry | 128MB | 0.25 cores |
| postgres | 256MB | 0.25 cores |
| **Total** | ~384MB | ~0.5 cores |

**Note**: Resource usage scales with registered servers and API traffic.

## Security Considerations

- **JWT Signing**: Use a unique, randomly generated `JWT_PRIVATE_KEY`
- **GitHub OAuth**: Restrict OAuth app to your organization if needed
- **OIDC Claims**: Use `OIDC_EXTRA_CLAIMS` to restrict access to specific domains
- **Anonymous Auth**: Keep `ENABLE_ANONYMOUS_AUTH=false` in production
- **Database**: PostgreSQL is isolated on internal network only

## Related Templates

| Template | Description |
|----------|-------------|
| `mcp-context-forge` | MCP Gateway & Registry with enterprise auth |
| `n8n` | Workflow automation with MCP integration |
| `langflow` | Visual AI workflow builder |

## Links

- [MCP Registry GitHub](https://github.com/modelcontextprotocol/registry)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [MCP Documentation](https://modelcontextprotocol.io/docs)

## Version

- **Template**: 1.0.0
- **MCP Registry**: latest (ghcr.io/modelcontextprotocol/registry)
- **PostgreSQL**: 16-alpine
