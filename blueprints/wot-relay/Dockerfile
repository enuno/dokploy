# =============================================================================
# WoT Relay - Multi-stage Dockerfile
# Build from source: https://github.com/bitvora/wot-relay
# =============================================================================

# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set build arguments
ARG VERSION=v0.1.18

# Clone and build
WORKDIR /build
RUN git clone --depth 1 --branch ${VERSION} https://github.com/bitvora/wot-relay.git . \
    && go mod download \
    && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s -X main.version=${VERSION}" -o wot-relay .

# Stage 2: Create minimal runtime image
FROM alpine:3.20

# Install runtime dependencies
RUN apk add --no-cache ca-certificates wget

# Create non-root user
RUN addgroup -g 1000 wot && \
    adduser -u 1000 -G wot -s /bin/sh -D wot

# Create directories
RUN mkdir -p /app/db /app/static && chown -R wot:wot /app

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/wot-relay /app/wot-relay

# Copy static files if they exist in build
COPY --from=builder /build/templates /app/templates
COPY --from=builder /build/static /app/static

# Switch to non-root user
USER wot

# Expose relay port
EXPOSE 3334

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:3334 || exit 1

# Run the relay
CMD ["/app/wot-relay"]
