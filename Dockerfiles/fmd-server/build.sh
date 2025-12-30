#!/bin/bash
# FMD Server - Build and Push Script
# Version: 0.5.0

set -e

IMAGE_NAME="fmd-server"
IMAGE_TAG="0.5.0"
REGISTRY="registry.hashgrid.net"
BUILD_CONTEXT="$(dirname "$0")"

echo "================================"
echo "Building FMD Server Image"
echo "================================"
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo "Build Context: ${BUILD_CONTEXT}"
echo ""

# Build the image
echo "Step 1: Building Docker image..."
docker build -f "${BUILD_CONTEXT}/Dockerfile" \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    "${BUILD_CONTEXT}"

# Tag for registry
echo ""
echo "Step 2: Tagging for registry..."
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" \
    "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Push to registry
echo ""
echo "Step 3: Pushing to registry..."
docker push "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo ""
echo "✅ Build and push completed successfully!"
echo "📦 Image location: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "To pull this image:"
echo "docker pull ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
