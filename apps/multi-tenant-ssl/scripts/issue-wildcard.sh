#!/bin/bash
# =============================================================================
# Issue Wildcard SSL Certificate for *.framextech.com
# =============================================================================
# This script issues a wildcard certificate using Cloudflare DNS challenge.
#
# PREREQUISITES:
# 1. acme.sh installed: curl https://get.acme.sh | sh
# 2. Cloudflare API token with DNS edit permissions
# 3. Cloudflare Zone ID for framextech.com
#
# USAGE:
#   ./scripts/issue-wildcard.sh
#
# The certificate will be valid for:
#   - *.framextech.com (all subdomains)
#   - framextech.com (root domain)
# =============================================================================

set -e

# Configuration
DOMAIN="framextech.com"
WILDCARD="*.${DOMAIN}"
CERT_DIR="/etc/ssl/tenants/_wildcard.${DOMAIN}"
ACME_HOME="${ACME_HOME:-/root/.acme.sh}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Wildcard SSL Certificate Issuance${NC}"
echo -e "${GREEN}  Domain: ${WILDCARD}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for Cloudflare credentials
if [ -z "$CF_Token" ]; then
    echo -e "${RED}Error: CF_Token environment variable not set${NC}"
    echo ""
    echo "Set your Cloudflare API token:"
    echo "  export CF_Token='your-cloudflare-api-token'"
    echo ""
    echo "Get a token from: https://dash.cloudflare.com/profile/api-tokens"
    echo "Required permissions: Zone:DNS:Edit"
    exit 1
fi

if [ -z "$CF_Zone_ID" ]; then
    echo -e "${YELLOW}Warning: CF_Zone_ID not set, acme.sh will try to detect it${NC}"
    echo "For faster issuance, set: export CF_Zone_ID='your-zone-id'"
    echo ""
fi

# Create certificate directory
echo -e "${YELLOW}Creating certificate directory...${NC}"
mkdir -p "$CERT_DIR"

# Check if acme.sh is installed
if [ ! -f "$ACME_HOME/acme.sh" ]; then
    echo -e "${RED}Error: acme.sh not found at $ACME_HOME${NC}"
    echo "Install with: curl https://get.acme.sh | sh"
    exit 1
fi

echo -e "${YELLOW}Issuing wildcard certificate via Cloudflare DNS...${NC}"
echo "This may take a few minutes..."
echo ""

# Issue the certificate
# --dns dns_cf uses Cloudflare DNS API for DNS-01 challenge
# We include both *.domain and domain to cover root domain too
"$ACME_HOME/acme.sh" --issue \
    -d "$WILDCARD" \
    -d "$DOMAIN" \
    --dns dns_cf \
    --keylength 2048

echo ""
echo -e "${YELLOW}Installing certificate to $CERT_DIR...${NC}"

# Install the certificate to our directory
"$ACME_HOME/acme.sh" --install-cert \
    -d "$WILDCARD" \
    --key-file "$CERT_DIR/privkey.pem" \
    --fullchain-file "$CERT_DIR/fullchain.pem" \
    --reloadcmd "nginx -s reload || true"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Certificate issued successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Certificate files:"
echo "  - Certificate: $CERT_DIR/fullchain.pem"
echo "  - Private Key: $CERT_DIR/privkey.pem"
echo ""
echo "Next steps:"
echo "  1. Copy nginx config to sites-enabled:"
echo "     cp nginx/sites-available/wildcard.framextech.com.conf /etc/nginx/sites-enabled/"
echo ""
echo "  2. Test nginx config:"
echo "     nginx -t"
echo ""
echo "  3. Reload nginx:"
echo "     nginx -s reload"
echo ""
echo -e "${GREEN}Your wildcard certificate is ready!${NC}"
echo "All subdomains like tenant1.framextech.com will now work."
