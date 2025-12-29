---
description: Build Docker image from Dockerfile and push to registry.hashgrid.net
allowed-tools: Read, Write, Bash(docker:*, curl:*, wget:*, git:*)
argument-hint: "<dockerfile-path> [image-tag]"
---

Build a Docker image from a Dockerfile (local or URL) and push it to the private registry at registry.hashgrid.net.

## Step 1: Parse Arguments

Extract the Dockerfile path from the first argument. Check if a custom image tag was provided as the second argument.

## Step 2: Validate Dockerfile Source

Determine if the Dockerfile path is:
- **Local file**: Check if it exists using the Read tool
- **URL**: Must start with `http://` or `https://`

If URL, download it to a temporary location:
```bash
!curl -fsSL <dockerfile-url> -o /tmp/Dockerfile.tmp
```

## Step 3: Generate Image Tag

If no custom tag provided, auto-generate one:

1. Get current directory name: `!basename $(pwd)`
2. Try to get git commit hash: `!git rev-parse --short HEAD 2>/dev/null || echo "latest"`
3. Format: `<directory-name>:<git-hash>` or `<directory-name>:latest`

If custom tag provided, use it directly.

## Step 4: Check Registry Authentication

Verify login to registry.hashgrid.net:
```bash
!docker login registry.hashgrid.net --password-stdin < /dev/null 2>&1
```

If not authenticated, instruct user:
```
⚠️  Not logged into registry.hashgrid.net
Please run: docker login registry.hashgrid.net
```

Then stop execution.

## Step 5: Build Docker Image

Build the image from the Dockerfile:

**If local Dockerfile:**
```bash
!docker build -f <dockerfile-path> -t <image-tag> <build-context-dir>
```

**If downloaded from URL:**
```bash
!docker build -f /tmp/Dockerfile.tmp -t <image-tag> .
```

The build context directory is the directory containing the Dockerfile (or current directory for URLs).

Show the build output to the user.

## Step 6: Tag for Registry

Tag the image with the registry prefix:
```bash
!docker tag <image-tag> registry.hashgrid.net/<image-tag>
```

## Step 7: Push to Registry

Push the tagged image:
```bash
!docker push registry.hashgrid.net/<image-tag>
```

Show push progress to the user.

## Step 8: Cleanup and Report

If Dockerfile was downloaded from URL, remove it:
```bash
!rm -f /tmp/Dockerfile.tmp
```

Report success:
```
✅ Image built and pushed successfully!
📦 Image location: registry.hashgrid.net/<image-tag>

To pull this image:
docker pull registry.hashgrid.net/<image-tag>
```

## Step 9: Update Dockerfile Library Index

Update the `Dockerfiles/README.md` to maintain an index of all built images.

1. **Check if Dockerfiles/README.md exists:**
   - If not, create it with header template
   - If exists, read current content

2. **Determine Dockerfile path relative to Dockerfiles/ directory:**
   ```
   Example:
   - Full path: Dockerfiles/bitcoind/Dockerfile
   - Relative: bitcoind/Dockerfile
   - App name: bitcoind
   ```

3. **Get current timestamp:**
   ```bash
   !date -u +"%Y-%m-%d %H:%M UTC"
   ```

4. **Update or add entry in the index table:**

   **README.md format:**
   ```markdown
   # Dockerfile Library - registry.hashgrid.net

   Custom Docker images built for use in Dokploy templates.

   ## Available Images

   | Application | Dockerfile Path | Latest Tag | Registry URL | Last Built |
   |-------------|----------------|------------|--------------|------------|
   | bitcoind | bitcoind/Dockerfile | 30.0 | registry.hashgrid.net/bitcoind:30.0 | 2025-12-29 08:46 UTC |
   | app-name | app-name/Dockerfile | v1.0.0 | registry.hashgrid.net/app-name:v1.0.0 | 2025-12-29 10:00 UTC |
   ```

5. **Update logic:**
   - If application already exists in table: Update the row with new tag and timestamp
   - If application is new: Add new row in alphabetical order
   - Preserve table formatting

6. **Write updated README.md:**
   ```
   Save to: Dockerfiles/README.md
   ```

**Success confirmation:**
```
✅ Updated Dockerfiles/README.md
📋 Registry index: Dockerfiles/README.md

View all available images:
cat Dockerfiles/README.md
```

## Error Handling

- If Dockerfile doesn't exist or download fails: Show error and stop
- If docker build fails: Display build errors and stop
- If docker push fails: Check authentication and show error
- If any bash command fails: Report the specific failure

## Example Usage

```bash
# Build from local Dockerfile in Dockerfiles/ directory
/create-container Dockerfiles/bitcoind/Dockerfile bitcoind:30.0

# Build with auto-generated tag
/create-container Dockerfiles/myapp/Dockerfile

# Build from remote Dockerfile (not indexed)
/create-container https://raw.githubusercontent.com/docker/labs/master/beginner/Dockerfile

# Build from subdirectory with custom tag
/create-container Dockerfiles/nginx-custom/Dockerfile nginx:alpine-custom
```

## Workflow Integration

This command is designed to work with `/dokploy-create` for a complete workflow:

1. **Build Custom Image:**
   ```bash
   /create-container Dockerfiles/bitcoind/Dockerfile bitcoind:30.0
   ```
   - Builds image
   - Pushes to registry.hashgrid.net
   - Updates Dockerfiles/README.md index

2. **Reference in Dokploy Template:**
   ```bash
   /dokploy-create my-bitcoin-app
   ```
   - Use custom image: `registry.hashgrid.net/bitcoind:30.0`
   - Available images listed in Dockerfiles/README.md

3. **Benefits:**
   - Version control for custom images
   - Central registry for homelab deployments
   - Reusable across multiple Dokploy templates
   - Index tracks all built images and tags
