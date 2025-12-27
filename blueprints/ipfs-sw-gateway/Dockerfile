# Multi-stage build for IPFS Service Worker Gateway
# Stage 1: Build Node.js static assets
FROM node:20-alpine AS node-builder

WORKDIR /build

# Clone repository and checkout specific commit
# Commit: chore: enable if-none-match conformance tests (#944)
RUN apk add --no-cache git && \
    git clone https://github.com/ipfs/service-worker-gateway.git . && \
    git checkout 39dce782d27bc0eb43ff2096acc3dcbe4c7def45

# Install dependencies
RUN npm ci

# Build static assets
RUN npm run build

# Stage 2: Build Go binary with embedded static files
FROM golang:1.22-alpine AS go-builder

WORKDIR /build

# Copy source code and built static files from node-builder
COPY --from=node-builder /build /build

# Build Go binary with embedded static files
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o service-worker-gateway main.go

# Stage 3: Runtime
FROM alpine:3.20

# Install ca-certificates for HTTPS and wget for health checks
RUN apk --no-cache add ca-certificates wget

WORKDIR /app

# Copy binary from go-builder
COPY --from=go-builder /build/service-worker-gateway /app/service-worker-gateway

# Expose port
EXPOSE 3000

# Run binary
ENTRYPOINT ["/app/service-worker-gateway"]
