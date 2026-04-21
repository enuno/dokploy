# signal-cli

Command-line interface and JSON-RPC daemon for the Signal messenger. Run Signal on your server to send and receive messages programmatically — ideal for alerts, notifications, and chatbot integrations.

## Overview

This template deploys the official [packaging.gitlab.io](https://packaging.gitlab.io/signal-cli/) Docker image for `signal-cli` in JSON-RPC daemon mode. It exposes a machine-readable API that can be consumed by any HTTP or TCP client.

## What's Included

| Service | Image | Description |
|---------|-------|-------------|
| signal-cli | `registry.gitlab.com/packaging/signal-cli/signal-cli-jre:v0-14-2-1` | Signal messenger daemon with JSON-RPC interface |

## Requirements

- **Domain**: A fully-qualified domain name pointing to your Dokploy server
- **Phone Number**: A real mobile or landline number capable of receiving SMS or voice calls for Signal registration
- **Mode Selection**: Choose HTTP (port 3000, Traefik-routed) or TCP (port 7583, raw socket)

## Post-Deployment Setup

### 1. Register a Signal Account

**This is mandatory before the daemon is useful.** The daemon starts immediately, but cannot send or receive messages until a phone number is registered.

Temporarily change the container command to register:

```bash
# Register with SMS
docker compose exec signal-cli signal-cli -a +1234567890 register

# Or register with voice call (for landlines)
docker compose exec signal-cli signal-cli -a +1234567890 register --voice
```

You will receive a verification code. Verify it:

```bash
docker compose exec signal-cli signal-cli -a +1234567890 verify CODE
```

If you have a Signal PIN set on your account, add `--pin YOUR_PIN`:

```bash
docker compose exec signal-cli signal-cli -a +1234567890 verify CODE --pin YOUR_PIN
```

**Note**: Replace `+1234567890` with your real phone number in international format (must start with `+` and country code).

### 2. Restart the Daemon

After successful registration, restart the container so the daemon picks up the new account:

```bash
docker compose restart signal-cli
```

### 3. Test Sending a Message

```bash
# HTTP mode
curl -X POST https://your-domain/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"send","params":{"account":"+1234567890","recipient":"+9876543210","message":"Hello from signal-cli!"},"id":1}'
```

## Architecture

### JSON-RPC Modes

| Mode | Port | Protocol | Traefik | Best For |
|------|------|----------|---------|----------|
| `http` | 3000 | HTTP JSON-RPC | ✅ Yes | Webhooks, REST clients, browsers |
| `tcp` | 7583 | TCP JSON-RPC | ❌ No | High-performance native clients |

**Default**: `http` — easiest to integrate with Traefik and standard HTTP clients.

The HTTP JSON-RPC endpoint is `POST /api/v1/rpc`.

### Volume Persistence

- `/var/lib/signal-cli` — Signal device identity, encryption keys, and message database
- **Critical**: Back this volume up. Losing it requires re-registering your phone number.

### tmpfs Requirement

The container mounts `/tmp` as a `tmpfs` with `exec` permissions. This is required by the Signal native library for temporary file operations.

## Configuration

### Switching to TCP Mode

In `template.toml`, change:

```toml
mode = "tcp"
port = "7583"
```

Then expose port 7583 in `docker-compose.yml`:

```yaml
ports:
  - "7583:7583"
```

Remove or disable the Traefik labels since TCP JSON-RPC cannot be proxied over HTTP.

### Switching to Native Image

In `template.toml`, change:

```toml
variant = "native"
```

The native variant is a GraalVM build (experimental). It is smaller and starts faster, but may be less stable than the JRE variant.

## JSON-RPC API Examples

### Send a Message

```bash
curl -X POST https://your-domain/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "send",
    "params": {
      "account": "+1234567890",
      "recipient": "+9876543210",
      "message": "Server alert: CPU usage is high!"
    },
    "id": 1
  }'
```

### Receive Messages

The daemon automatically receives messages in the background. To fetch them via JSON-RPC:

```bash
curl -X POST https://your-domain/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "receive",
    "params": {
      "account": "+1234567890"
    },
    "id": 2
  }'
```

### List Linked Devices

```bash
curl -X POST https://your-domain/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "listDevices",
    "params": {
      "account": "+1234567890"
    },
    "id": 3
  }'
```

## Troubleshooting

### Registration Fails with CAPTCHA

If you see a rate-limit or CAPTCHA error during registration:

1. Visit <https://signalcaptchas.org/challenge/generate.html>
2. Solve the CAPTCHA
3. Copy the token
4. Register with the token:

```bash
docker compose exec signal-cli signal-cli -a +1234567890 register --captcha CAPTCHA_TOKEN
```

### Permission Denied on Data Volume

If the daemon fails to start with permission errors:

```bash
# Fix ownership
docker compose exec --user root signal-cli chown -R signal-cli:signal-cli /var/lib/signal-cli

# Restart
docker compose restart signal-cli
```

### Daemon Says "No Account Configured"

You must register a phone number before the daemon can send/receive. Follow the registration steps above.

## Security Considerations

- **Protect your domain**: Anyone with access to the JSON-RPC endpoint can send messages as your Signal account. Use strong authentication in front of the API or restrict network access.
- **Backup the data volume**: It contains your Signal identity keys. Losing it means losing access to your Signal account on this device.
- **Signal PIN**: If your account has a Signal PIN, you may need to provide it during verification.

## Updating

To update signal-cli:

1. Check the latest release: <https://github.com/AsamK/signal-cli/releases>
2. Find the matching packaging tag at the [GitLab Container Registry](https://gitlab.com/packaging/signal-cli/container_registry)
3. Update `SIGNAL_CLI_TAG` in `template.toml`
4. Redeploy via Dokploy

**Important**: Signal-cli must be kept up-to-date. Releases older than ~3 months may stop working due to Signal server protocol changes.

## Links

- **signal-cli GitHub**: <https://github.com/AsamK/signal-cli>
- **Packaging Docs**: <https://packaging.gitlab.io/signal-cli/>
- **Docker Docs**: <https://packaging.gitlab.io/signal-cli/installation/docker/>
- **JSON-RPC Reference**: <https://github.com/AsamK/signal-cli/wiki/JSON-RPC-service>
