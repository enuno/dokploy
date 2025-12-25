# =============================================================================
# Algo Relay - Multi-stage Dockerfile
# Build from source: https://github.com/bitvora/algo-relay
# =============================================================================

# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set build arguments
ARG VERSION=v0.2.0

# Clone and build
WORKDIR /build
RUN git clone --depth 1 --branch ${VERSION} https://github.com/bitvora/algo-relay.git . \
    && go mod download \
    && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o algo-relay .

# Stage 2: Create minimal runtime image
FROM alpine:3.20

# Install runtime dependencies
RUN apk add --no-cache ca-certificates wget

# Create non-root user
RUN addgroup -g 1000 algo && \
    adduser -u 1000 -G algo -s /bin/sh -D algo

# Create data directory
RUN mkdir -p /app/data && chown -R algo:algo /app

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/algo-relay /app/algo-relay

# Switch to non-root user
USER algo

# Expose relay port
EXPOSE 3334

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --spider -q http://localhost:3334 || exit 1

# Run the relay
CMD ["/app/algo-relay"]
