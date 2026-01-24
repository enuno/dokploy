#!/bin/bash
# Automated Cloudflare R2 Bucket Setup for Matrix Synapse
# This script uses Wrangler CLI to create and configure R2 storage
#
# Prerequisites:
#   - Wrangler CLI installed: npm install -g wrangler
#   - Cloudflare account logged in: wrangler login
#
# Usage:
#   ./setup-r2.sh [bucket-name]
#
# Example:
#   ./setup-r2.sh matrix-synapse-media

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default bucket name
BUCKET_NAME="${1:-matrix-synapse-media}"

echo -e "${GREEN}Matrix Synapse - Cloudflare R2 Setup${NC}"
echo "======================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: Wrangler CLI not found${NC}"
    echo ""
    echo "Install Wrangler:"
    echo "  npm install -g wrangler"
    echo ""
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}Not logged in to Cloudflare${NC}"
    echo ""
    echo "Please login first:"
    echo "  wrangler login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Get account ID
echo -e "${YELLOW}Getting Cloudflare Account ID...${NC}"
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $NF}' | tr -d '\n')

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Could not retrieve Account ID${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Account ID: ${ACCOUNT_ID}${NC}"
echo ""

# Create R2 bucket
echo -e "${YELLOW}Creating R2 bucket: ${BUCKET_NAME}...${NC}"
if wrangler r2 bucket create "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ Bucket created successfully${NC}"
else
    echo -e "${YELLOW}Note: Bucket may already exist${NC}"
fi
echo ""

# Generate R2 API token
echo -e "${YELLOW}To create R2 API credentials:${NC}"
echo "1. Go to: https://dash.cloudflare.com/${ACCOUNT_ID}/r2/api-tokens"
echo "2. Click 'Create API token'"
echo "3. Token name: synapse-media-storage"
echo "4. Permissions: Object Read & Write"
echo "5. Bucket: ${BUCKET_NAME}"
echo "6. Copy Access Key ID and Secret Access Key"
echo ""

# Display configuration summary
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}R2 Bucket Setup Complete!${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo ""
echo "Configuration for Dokploy:"
echo ""
echo "  CF_ACCOUNT_ID:           ${ACCOUNT_ID}"
echo "  R2_BUCKET_NAME:          ${BUCKET_NAME}"
echo "  R2_ACCESS_KEY_ID:        <from Cloudflare Dashboard>"
echo "  R2_SECRET_ACCESS_KEY:    <from Cloudflare Dashboard>"
echo ""
echo "S3-compatible endpoint:"
echo "  https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
echo ""

# Verification
echo -e "${YELLOW}Verifying bucket...${NC}"
if wrangler r2 bucket list | grep -q "$BUCKET_NAME"; then
    echo -e "${GREEN}✓ Bucket verified in account${NC}"
else
    echo -e "${RED}Warning: Bucket not found in list${NC}"
fi
echo ""

# Optional: Display bucket info
echo -e "${YELLOW}Bucket Information:${NC}"
echo "  Name:     ${BUCKET_NAME}"
echo "  Region:   Automatic (global)"
echo "  Class:    Standard"
echo ""

# Next steps
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo ""
echo "1. Create R2 API Token (see URL above)"
echo "2. Configure in Dokploy deployment:"
echo "   - Set CF_ACCOUNT_ID to: ${ACCOUNT_ID}"
echo "   - Set R2_BUCKET_NAME to: ${BUCKET_NAME}"
echo "   - Set R2_ACCESS_KEY_ID from token creation"
echo "   - Set R2_SECRET_ACCESS_KEY from token creation"
echo ""
echo "3. After first Synapse deployment, update homeserver.yaml:"
echo "   - Add media_storage_providers configuration"
echo "   - See homeserver.yaml.example for full config"
echo ""
echo "4. Restart Synapse to enable R2 storage"
echo ""

echo -e "${GREEN}Storage Cost Estimate (Cloudflare R2):${NC}"
echo "  Storage:      \$0.015/GB/month"
echo "  Class A ops:  \$4.50/million (writes)"
echo "  Class B ops:  \$0.36/million (reads)"
echo "  Egress:       \$0 (FREE!)"
echo ""
echo "  Example: 100GB + 1M requests/month = ~\$1.50/month"
echo ""

echo -e "${GREEN}Done!${NC}"
