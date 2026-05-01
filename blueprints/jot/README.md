# Jot - Collaborative Markdown Editor

Jot is a minimal self-hosted collaborative markdown editor with inline comment threads. Built for humans and agents.

## Features

- **Collaborative Editing**: Real-time editing across multiple tabs and users
- **Inline Comments**: Comment threads anchored to text selections with replies
- **Sharing**: Share notes with configurable access (view, comment, edit)
- **CLI Support**: Full CLI for humans and agents (owner API keys or share links)
- **Themes**: Dark and light mode support
- **Mobile Friendly**: Responsive design for mobile devices
- **Plain Markdown**: Notes stored as .md files on disk

## Architecture

```
┌─────────────────────────────────────┐
│         jot-net (internal)          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │           jot                 │  │
│  │          :3000                │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │    Markdown Editor      │  │  │
│  │  │  - Real-time collab     │  │  │
│  │  │  - Comment threads      │  │  │
│  │  │  - Share management     │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │    Data Storage         │  │  │
│  │  │  /app/data              │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
          │
dokploy-network
          │
    ┌─────┴─────┐
    │  traefik  │
    └───────────┘
          │
https://jot.example.com
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Jot | ghcr.io/badlogic/jot:latest | 3000 | Markdown editor & API |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Domain for Jot | `jot.example.com` |

## Post-Deployment Setup

1. Visit your domain (e.g., `https://jot.example.com`)
2. Set the owner password on first visit
3. Create API keys from the settings gear for CLI access
4. Start creating and sharing notes!

## CLI Usage

### Owner Mode
```bash
npm install -g @mariozechner/jot
jot register myserver https://jot.example.com <api-key>
jot myserver list
jot myserver create "My note"
jot myserver edit <note-id> '[{"oldText":"foo","newText":"bar"}]'
```

### Shared Mode
```bash
jot register shared https://jot.example.com/s/<share-id>
jot shared read
jot shared comment "quoted text" "comment body"
```

## Data Storage

Data is stored in the `jot-data` volume at `/app/data/`:

```
/app/data/
  auth.json
  notes/
    <id>.md
    <id>.json
```

## HTTP API

The full HTTP API is available at `/api/`. See the [jot repository](https://github.com/badlogic/jot) for complete documentation.
