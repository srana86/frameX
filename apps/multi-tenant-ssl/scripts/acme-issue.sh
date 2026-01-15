#!/bin/bash
# =============================================================================
# ACME Certificate Issuance Script
# =============================================================================
# Issues an SSL certificate for a domain using acme.sh with HTTP-01 challenge.
# 
# USAGE:
#   ./acme-issue.sh <domain> [--staging]
#
# EXAMPLE:
#   ./acme-issue.sh shop.example.com
#   ./acme-issue.sh shop.example.com --staging  # Use Let's Encrypt staging
#
# PREREQUISITES:
#   - acme.sh installed at ~/.acme.sh
#   - Webroot accessible at /var/www/acme
#   - Domain DNS pointing to this server
#   - Port 80 accessible from the internet
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Load from environment or use defaults
ACME_HOME="${ACME_HOME:-$HOME/.acme.sh}"
WEBROOT="${ACME_WEBROOT:-/var/www/acme}"
CERT_DIR="${SSL_CERT_PATH:-/etc/ssl/tenants}"
ACME_EMAIL="${ACME_EMAIL:-admin@example.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "Usage: $0 <domain> [--staging]"
    echo ""
    echo "Arguments:"
    echo "  domain      The domain to issue certificate for (e.g., shop.example.com)"
    echo "  --staging   Use Let's Encrypt staging server (for testing)"
    echo ""
    echo "Environment variables:"
    echo "  ACME_HOME       Path to acme.sh installation (default: ~/.acme.sh)"
    echo "  ACME_WEBROOT    Path for HTTP challenge files (default: /var/www/acme)"
    echo "  SSL_CERT_PATH   Path to store certificates (default: /etc/ssl/tenants)"
    echo "  ACME_EMAIL      Email for certificate notifications"
    exit 1
}

check_prerequisites() {
    # Check if acme.sh exists
    if [[ ! -f "$ACME_HOME/acme.sh" ]]; then
        log_error "acme.sh not found at $ACME_HOME"
        log_info "Install it with: curl https://get.acme.sh | sh -s email=$ACME_EMAIL"
        exit 1
    fi
    
    # Check if webroot exists
    if [[ ! -d "$WEBROOT" ]]; then
        log_warn "Creating webroot directory: $WEBROOT"
        sudo mkdir -p "$WEBROOT"
        sudo chown -R www-data:www-data "$WEBROOT" 2>/dev/null || true
    fi
    
    # Check if cert directory exists
    if [[ ! -d "$CERT_DIR" ]]; then
        log_warn "Creating certificate directory: $CERT_DIR"
        sudo mkdir -p "$CERT_DIR"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

# Parse arguments
if [[ $# -lt 1 ]]; then
    usage
fi

DOMAIN="$1"
STAGING=""

if [[ "${2:-}" == "--staging" ]]; then
    STAGING="--staging"
    log_warn "Using Let's Encrypt STAGING server"
fi

# Validate domain format
if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$ ]]; then
    log_error "Invalid domain format: $DOMAIN"
    exit 1
fi

log_info "Starting certificate issuance for: $DOMAIN"

# Check prerequisites
check_prerequisites

# Create domain-specific directory
DOMAIN_CERT_DIR="$CERT_DIR/$DOMAIN"
sudo mkdir -p "$DOMAIN_CERT_DIR"

log_info "Certificate will be stored at: $DOMAIN_CERT_DIR"

# =============================================================================
# ISSUE CERTIFICATE
# =============================================================================

log_info "Issuing certificate via HTTP-01 challenge..."

"$ACME_HOME/acme.sh" --issue \
    -d "$DOMAIN" \
    --webroot "$WEBROOT" \
    --keylength 2048 \
    $STAGING \
    --force || {
        log_error "Certificate issuance failed"
        log_info "Common issues:"
        log_info "  - DNS not pointing to this server"
        log_info "  - Port 80 blocked by firewall"
        log_info "  - Nginx not serving /.well-known/acme-challenge/"
        exit 1
    }

log_info "Certificate issued successfully"

# =============================================================================
# INSTALL CERTIFICATE
# =============================================================================

log_info "Installing certificate to: $DOMAIN_CERT_DIR"

"$ACME_HOME/acme.sh" --install-cert -d "$DOMAIN" \
    --key-file "$DOMAIN_CERT_DIR/privkey.pem" \
    --fullchain-file "$DOMAIN_CERT_DIR/fullchain.pem" \
    --reloadcmd "sudo nginx -s reload" || {
        log_error "Certificate installation failed"
        exit 1
    }

# Set permissions
sudo chmod 600 "$DOMAIN_CERT_DIR/privkey.pem"
sudo chmod 644 "$DOMAIN_CERT_DIR/fullchain.pem"

# =============================================================================
# VERIFY CERTIFICATE
# =============================================================================

log_info "Verifying certificate..."

# Get expiry date
EXPIRY=$(openssl x509 -enddate -noout -in "$DOMAIN_CERT_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)

if [[ -n "$EXPIRY" ]]; then
    log_info "Certificate valid until: $EXPIRY"
else
    log_warn "Could not read certificate expiry date"
fi

# =============================================================================
# SUCCESS
# =============================================================================

echo ""
log_info "========================================="
log_info "Certificate issued successfully!"
log_info "========================================="
log_info "Domain:      $DOMAIN"
log_info "Certificate: $DOMAIN_CERT_DIR/fullchain.pem"
log_info "Private key: $DOMAIN_CERT_DIR/privkey.pem"
log_info "Expires:     $EXPIRY"
echo ""
log_info "Next steps:"
log_info "  1. Create Nginx config for this domain"
log_info "  2. Test: curl -I https://$DOMAIN"
echo ""
