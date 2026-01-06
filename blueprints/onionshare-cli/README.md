# OnionShare CLI

Securely and anonymously share files, host websites, receive files, and chat using the Tor network.

## Overview

[OnionShare](https://onionshare.org/) is an open-source tool that creates temporary onion services on the Tor network. This template runs the OnionShare CLI in a Docker container, enabling you to:

- **Share files**: Securely share files with anyone using a unique `.onion` URL
- **Receive files**: Set up an anonymous dropbox to receive files from others
- **Host websites**: Serve static websites anonymously on the Tor network
- **Chat**: Create ephemeral, anonymous chat rooms

All connections are end-to-end encrypted and routed through Tor, providing strong anonymity for both sender and receiver.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OnionShare CLI                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Python 3.12 + onionshare-cli 2.6.x             │    │
│  │  + Bundled Tor connector                        │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│        ┌────────────────┴────────────────┐              │
│        │                                 │              │
│        ▼                                 ▼              │
│  onionshare-tor                    Local Directory      │
│  (Tor identity)                    (Shared files)       │
│  [Named Volume]                    [Bind Mount]         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                    Tor Network
                          │
                          ▼
              .onion URL (Tor Browser)
```

**Key Points:**
- No HTTP/HTTPS routing via Traefik - uses Tor's onion services
- Access requires Tor Browser (https://www.torproject.org/download/)
- `.onion` URL displayed in container logs after startup

## Configuration

### Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `data_dir` | Local filesystem path for shared files | `/opt/onionshare/data` | Yes |
| `onionshare_args` | CLI arguments (mode and options) | `/shared` | No |

### Operation Modes

Configure the mode via `onionshare_args`:

| Mode | Arguments | Description |
|------|-----------|-------------|
| **Share** (default) | `/shared` | Share files from the data directory |
| **Receive** | `--receive /shared` | Receive files into the data directory |
| **Website** | `--website /shared` | Host a static website |
| **Chat** | `--chat` | Start an anonymous chat server |

### Common Options

Add these flags to `onionshare_args`:

| Flag | Description |
|------|-------------|
| `--persistent FILE` | Use persistent `.onion` address across restarts |
| `--public` | Disable private key (anyone can access without password) |
| `--no-autostop-sharing` | Continue sharing after first download |
| `--title "NAME"` | Set a custom title for the share page |
| `--verbose` | Enable verbose output in logs |
| `--connect-timeout N` | Tor connection timeout in seconds (default: 120) |

### Example Configurations

**One-time file share (default):**
```toml
onionshare_args = "/shared"
```

**Persistent file sharing (same URL across restarts):**
```toml
onionshare_args = "--persistent /root/.config/onionshare/persistent.json --no-autostop-sharing /shared"
```

**Anonymous file dropbox:**
```toml
onionshare_args = "--receive --no-autostop-sharing /shared"
```

**Static website hosting:**
```toml
onionshare_args = "--website /shared"
```

**Anonymous chat room:**
```toml
onionshare_args = "--chat"
```

## Prerequisites

- **Dokploy** installed and running
- **Local directory** created for shared files
- **Tor Browser** for accessing `.onion` URLs

## Deployment

### 1. Create the Data Directory

On your Dokploy host, create a directory for shared files:

```bash
sudo mkdir -p /opt/onionshare/data
sudo chmod 755 /opt/onionshare/data
```

### 2. Add Files to Share (Share Mode)

If using share mode, place files in the data directory:

```bash
cp /path/to/your/files/* /opt/onionshare/data/
```

### 3. Deploy via Dokploy

1. Navigate to your Dokploy instance
2. Create a new **Compose** project
3. Import the template or paste the docker-compose.yml
4. Configure variables:
   - `data_dir`: `/opt/onionshare/data`
   - `onionshare_args`: Choose your mode (see examples above)
5. Deploy the stack

### 4. Get the .onion URL

After deployment, view the container logs to find your `.onion` URL:

```bash
docker logs <container-name>
```

Look for output like:
```
Connecting to the Tor network: 100% - Connected
 * Running on http://127.0.0.1:17600
Compressing files.
Give this address to the recipient:
http://abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx.onion

Press Ctrl+C to stop the server
```

### 5. Access via Tor Browser

1. Download [Tor Browser](https://www.torproject.org/download/)
2. Open Tor Browser and navigate to your `.onion` URL
3. If a private key is enabled (default), enter the password shown in logs

## Volume Mounts

| Mount | Path in Container | Purpose |
|-------|-------------------|---------|
| `onionshare-tor` | `/root/.config/onionshare` | Tor identity and persistent keys |
| `${DATA_DIR}` | `/shared` | Shared files (bind mount) |

## Accessing Files

### Share Mode
Recipients download files through Tor Browser at the provided `.onion` URL.

### Receive Mode
Uploaded files appear in your `data_dir` on the host system.

### Website Mode
Place your website files (HTML, CSS, JS) in `data_dir`. The site is served at the `.onion` URL.

### Chat Mode
Users join the chat room via the `.onion` URL in Tor Browser.

## Security Considerations

- **Anonymity**: OnionShare routes all traffic through Tor, protecting both sender and receiver identity
- **End-to-end encryption**: All connections use Tor's built-in encryption
- **Private keys**: By default, a random private key is generated - recipients need this to access the share
- **No persistent URLs**: Unless using `--persistent`, each restart generates a new `.onion` address
- **No logs**: OnionShare doesn't log connections or downloads (except filename logging with `--verbose`)

## Troubleshooting

### Container keeps restarting

**Symptom**: Container restarts repeatedly without showing `.onion` URL

**Possible causes**:
1. **Tor connection issues**: Increase `--connect-timeout` (default is 120 seconds)
2. **Empty share directory**: In share mode, ensure files exist in `data_dir`
3. **Permission issues**: Verify the data directory is readable

**Debug steps**:
```bash
# Check container logs
docker logs <container-name>

# Check if Tor is connecting
docker exec <container-name> cat /root/.config/onionshare/onionshare.json
```

### Cannot connect to .onion URL

**Symptom**: Tor Browser shows "Unable to connect"

**Possible causes**:
1. **Container stopped**: Check if the container is running
2. **Auto-stop triggered**: If using default share mode, the container stops after first download
3. **Wrong URL**: URLs change on restart unless using `--persistent`

**Solutions**:
- Add `--no-autostop-sharing` to keep the service running
- Use `--persistent` for consistent URLs

### Files not appearing (Receive mode)

**Symptom**: Uploaded files don't appear in data directory

**Possible causes**:
1. **Permission issues**: Container can't write to bind mount
2. **Wrong directory**: Check `data_dir` configuration

**Debug steps**:
```bash
# Check directory permissions
ls -la /opt/onionshare/data

# Check container's view
docker exec <container-name> ls -la /shared
```

### Health check failing

**Symptom**: Container marked as unhealthy

**Note**: The health check uses `pgrep` to verify the OnionShare process is running. A failing health check typically means:
1. Tor is still connecting (wait for `start_period` of 180s)
2. OnionShare exited due to an error

Check logs for the actual error.

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 0.25 cores | 0.5 cores |
| Memory | 128 MB | 256 MB |
| Storage | Varies | Based on shared files |

## Links

- [OnionShare Official Site](https://onionshare.org/)
- [OnionShare GitHub](https://github.com/onionshare/onionshare)
- [OnionShare Documentation](https://docs.onionshare.org/)
- [Docker Image](https://github.com/nikosch86/docker-onionshare)
- [Tor Browser Download](https://www.torproject.org/download/)

## License

OnionShare is licensed under the GNU General Public License v3.0.
