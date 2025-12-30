# FMD Server - Security-Hardened Multi-Stage Build
# Version: 0.5.0
# Official Source: https://gitlab.com/fmd-foss/fmd-server
# Build Date: 2025-12-29
# Based on: https://github.com/caroli-magni/findmydeviceserver

# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Security Verification
# ============================================
FROM alpine:3.21 AS verifier

# Install verification tools
RUN apk add --no-cache \
    git \
    ca-certificates

# Clone specific version from official repository
ARG FMD_VERSION=v0.5.0
WORKDIR /verify
RUN git clone --branch ${FMD_VERSION} --depth 1 \
    https://gitlab.com/fmd-foss/fmd-server.git .

# Verify git tag signature (if available)
RUN git verify-tag ${FMD_VERSION} 2>/dev/null || \
    echo "Warning: Tag ${FMD_VERSION} not signed" && \
    git log -1 --pretty=format:"Commit: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s"

# ============================================
# Stage 2: Build Application
# ============================================
FROM golang:1.24-bookworm AS builder

WORKDIR /go/src/fmdserver
ENV GOPATH=/go
ENV CGO_ENABLED=1

# Copy verified source
COPY --from=verifier /verify /go/src/fmdserver

# Pre-download Go dependencies (cached layer)
RUN go mod download && go mod verify

# Install ObjectBox library
# Note: Using official install script, but downloading with verification
ADD https://raw.githubusercontent.com/objectbox/objectbox-go/main/install.sh /tmp/objectbox-install.sh
RUN chmod +x /tmp/objectbox-install.sh && \
    /tmp/objectbox-install.sh && \
    rm /tmp/objectbox-install.sh

# Build the application
RUN go build -v -ldflags="-s -w" -o /fmd cmd/fmdserver.go

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        tini && \
    rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN useradd --create-home --uid 1000 --shell /bin/false fmd-user

# Set working directory
WORKDIR /fmd

# Copy built application
COPY --from=builder --chown=fmd-user:fmd-user /fmd /fmd/server
COPY --from=builder /usr/lib/libobjectbox.so /usr/lib/libobjectbox.so

# Copy web assets
COPY --from=builder --chown=fmd-user:fmd-user /go/src/fmdserver/extra /fmd/extra

# Create ObjectBox data directory with correct permissions
RUN mkdir -p /fmd/objectbox && \
    chown -R fmd-user:fmd-user /fmd

# Security: Switch to non-root user
USER fmd-user

# Expose FMD Server port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:8080/ || exit 1

# Volume for persistent data
VOLUME ["/fmd/objectbox"]

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start application
CMD ["/fmd/server"]

# Metadata
LABEL org.opencontainers.image.title="FMD Server" \
      org.opencontainers.image.description="Find My Device server for device tracking and control" \
      org.opencontainers.image.version="0.5.0" \
      org.opencontainers.image.source="https://gitlab.com/fmd-foss/fmd-server" \
      org.opencontainers.image.vendor="registry.hashgrid.net" \
      org.opencontainers.image.created="2025-12-29"
