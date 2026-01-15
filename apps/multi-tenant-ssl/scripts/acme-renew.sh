#!/bin/bash
# =============================================================================
# ACME Certificate Renewal Script
# =============================================================================
# Renews all certificates that are close to expiry.
# Designed to be run as a daily cron job.
#
# USAGE:
#   ./acme-renew.sh [--force]
#
# CRON EXAMPLE (run daily at 2 AM):
#   0 2 * * * /path/to/acme-renew.sh >> /var/log/acme-renew.log 2>&1
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

ACME_HOME="${ACME_HOME:-$HOME/.acme.sh}"
CERT_DIR="${SSL_CERT_PATH:-/etc/ssl/tenants}"
RENEWAL_DAYS="${CERT_RENEWAL_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stats
RENEWED=0
FAILED=0
SKIPPED=0

# =============================================================================
# FUNCTIONS
# =============================================================================

log_info() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[ERROR]${NC} $1"
}

# Check if certificate needs renewal (within RENEWAL_DAYS of expiry)
needs_renewal() {
    local cert_file="$1"
    
    if [[ ! -f "$cert_file" ]]; then
        return 0  # No cert = needs issuance
    fi
    
    # Get expiry timestamp
    local expiry_date
    expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2)
    
    if [[ -z "$expiry_date" ]]; then
        return 0  # Can't read = assume needs renewal
    fi
    
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    local now_epoch
    now_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - now_epoch) / 86400 ))
    
    if [[ $days_until_expiry -lt $RENEWAL_DAYS ]]; then
        log_info "Certificate expires in $days_until_expiry days (threshold: $RENEWAL_DAYS)"
        return 0
    else
        log_info "Certificate valid for $days_until_expiry more days"
        return 1
    fi
}

renew_certificate() {
    local domain="$1"
    local force="${2:-false}"
    
    log_info "Processing: $domain"
    
    local cert_file="$CERT_DIR/$domain/fullchain.pem"
    
    # Check if renewal is needed
    if [[ "$force" != "true" ]] && ! needs_renewal "$cert_file"; then
        ((SKIPPED++))
        return 0
    fi
    
    log_info "Renewing certificate for: $domain"
    
    # Attempt renewal
    if "$ACME_HOME/acme.sh" --renew -d "$domain" --force; then
        log_info "Certificate renewed for: $domain"
        
        # Install to our directory
        "$ACME_HOME/acme.sh" --install-cert -d "$domain" \
            --key-file "$CERT_DIR/$domain/privkey.pem" \
            --fullchain-file "$CERT_DIR/$domain/fullchain.pem"
        
        ((RENEWED++))
    else
        log_error "Failed to renew certificate for: $domain"
        ((FAILED++))
    fi
}

# =============================================================================
# MAIN
# =============================================================================

log_info "========================================="
log_info "Starting certificate renewal check"
log_info "========================================="
log_info "Certificate directory: $CERT_DIR"
log_info "Renewal threshold: $RENEWAL_DAYS days"

FORCE="false"
if [[ "${1:-}" == "--force" ]]; then
    FORCE="true"
    log_warn "Force renewal enabled"
fi

# Check prerequisites
if [[ ! -f "$ACME_HOME/acme.sh" ]]; then
    log_error "acme.sh not found at $ACME_HOME"
    exit 1
fi

if [[ ! -d "$CERT_DIR" ]]; then
    log_error "Certificate directory not found: $CERT_DIR"
    exit 1
fi

# Process each domain directory
for domain_dir in "$CERT_DIR"/*/; do
    if [[ -d "$domain_dir" ]]; then
        domain=$(basename "$domain_dir")
        renew_certificate "$domain" "$FORCE"
    fi
done

# Reload Nginx if any certificates were renewed
if [[ $RENEWED -gt 0 ]]; then
    log_info "Reloading Nginx..."
    if sudo nginx -t && sudo nginx -s reload; then
        log_info "Nginx reloaded successfully"
    else
        log_error "Failed to reload Nginx"
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
log_info "========================================="
log_info "Renewal Summary"
log_info "========================================="
log_info "Renewed: $RENEWED"
log_info "Skipped: $SKIPPED"
log_info "Failed:  $FAILED"
echo ""

if [[ $FAILED -gt 0 ]]; then
    log_error "Some certificates failed to renew!"
    exit 1
fi

log_info "Certificate renewal check complete"
