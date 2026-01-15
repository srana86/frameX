#!/bin/bash
# =============================================================================
# Multi-Tenant SSL Setup Script
# =============================================================================
# Initial setup script for the multi-tenant SSL system.
# Run this once on a new server to configure all prerequisites.
#
# USAGE:
#   sudo ./setup.sh
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# =============================================================================
# PRE-CHECKS
# =============================================================================

log_step "Pre-flight checks"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    echo "Usage: sudo ./setup.sh"
    exit 1
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    log_info "Detected OS: $OS ($VERSION_ID)"
else
    log_error "Could not detect OS"
    exit 1
fi

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================

log_step "Installing dependencies"

case $OS in
    ubuntu|debian)
        apt-get update
        apt-get install -y nginx curl openssl cron
        ;;
    centos|rhel|fedora)
        yum install -y nginx curl openssl cronie
        ;;
    *)
        log_warn "Unknown OS. Please install nginx, curl, openssl manually."
        ;;
esac

log_info "Dependencies installed"

# =============================================================================
# CREATE DIRECTORIES
# =============================================================================

log_step "Creating directories"

# Certificate storage
mkdir -p /etc/ssl/tenants
chmod 700 /etc/ssl/tenants
log_info "Created /etc/ssl/tenants"

# ACME challenge webroot
mkdir -p /var/www/acme/.well-known/acme-challenge
chown -R www-data:www-data /var/www/acme 2>/dev/null || chown -R nginx:nginx /var/www/acme
chmod 755 /var/www/acme
log_info "Created /var/www/acme"

# Nginx sites-enabled
mkdir -p /etc/nginx/sites-enabled
log_info "Created /etc/nginx/sites-enabled"

# Log directory
mkdir -p /var/log/multi-tenant-ssl
log_info "Created /var/log/multi-tenant-ssl"

# =============================================================================
# INSTALL ACME.SH
# =============================================================================

log_step "Installing acme.sh"

ACME_EMAIL="${ACME_EMAIL:-admin@example.com}"

if [[ ! -f ~/.acme.sh/acme.sh ]]; then
    curl https://get.acme.sh | sh -s email="$ACME_EMAIL"
    log_info "acme.sh installed"
else
    log_info "acme.sh already installed"
fi

# Update acme.sh
~/.acme.sh/acme.sh --upgrade
log_info "acme.sh updated to latest version"

# =============================================================================
# CONFIGURE NGINX
# =============================================================================

log_step "Configuring Nginx"

# Backup original nginx.conf
if [[ ! -f /etc/nginx/nginx.conf.backup ]]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    log_info "Backed up original nginx.conf"
fi

# Generate default self-signed certificate for catch-all server
if [[ ! -f /etc/ssl/certs/default.crt ]]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/default.key \
        -out /etc/ssl/certs/default.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    log_info "Generated default self-signed certificate"
fi

# Test Nginx config
if nginx -t; then
    systemctl enable nginx
    systemctl start nginx
    log_info "Nginx started and enabled"
else
    log_error "Nginx configuration test failed"
    exit 1
fi

# =============================================================================
# CONFIGURE FIREWALL
# =============================================================================

log_step "Configuring firewall"

# Check for ufw
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    log_info "UFW rules added for ports 80 and 443"
# Check for firewalld
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log_info "Firewalld rules added for HTTP and HTTPS"
else
    log_warn "No firewall detected. Please manually open ports 80 and 443."
fi

# =============================================================================
# SETUP CRON JOBS
# =============================================================================

log_step "Setting up cron jobs"

# Create cron script
CRON_SCRIPT="/etc/cron.daily/acme-renew"

cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash
# Daily certificate renewal check
/root/.acme.sh/acme.sh --cron --home "/root/.acme.sh" > /var/log/multi-tenant-ssl/acme-cron.log 2>&1

# Reload nginx if certs were updated
if grep -q "Cert success" /var/log/multi-tenant-ssl/acme-cron.log 2>/dev/null; then
    nginx -s reload
fi
EOF

chmod +x "$CRON_SCRIPT"
log_info "Created daily renewal cron job"

# =============================================================================
# CREATE SAMPLE CONFIGURATION
# =============================================================================

log_step "Creating sample configuration"

# Create .env.example
cat > /opt/multi-tenant-ssl/.env.example 2>/dev/null || cat << 'EOF'
# Sample .env file for multi-tenant-ssl

# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/multi_tenant_ssl

# Redis
REDIS_URL=redis://localhost:6379

# ACME
ACME_EMAIL=admin@yourdomain.com
ACME_DIRECTORY=https://acme-v02.api.letsencrypt.org/directory
ACME_HOME=/root/.acme.sh

# Nginx
NGINX_SITES_PATH=/etc/nginx/sites-enabled
SSL_CERT_PATH=/etc/ssl/tenants
ACME_WEBROOT=/var/www/acme

# Security
API_KEY=generate-a-secure-random-key-here
JWT_SECRET=generate-another-secure-key-here

# Certificate renewal
CERT_RENEWAL_DAYS=30
EOF

log_info "Created sample .env file"

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
log_step "Setup Complete!"
echo ""
log_info "Nginx is running and configured"
log_info "acme.sh is installed and ready"
log_info "Directories created:"
echo "    - /etc/ssl/tenants (certificate storage)"
echo "    - /var/www/acme (ACME challenge webroot)"
echo "    - /etc/nginx/sites-enabled (virtual hosts)"
echo ""
log_info "Next steps:"
echo "    1. Copy nginx/nginx.conf to /etc/nginx/nginx.conf"
echo "    2. Set up your database (PostgreSQL)"
echo "    3. Configure .env file with your settings"
echo "    4. Start the Node.js API service"
echo "    5. Test with: curl http://localhost/health"
echo ""
log_info "To issue a test certificate:"
echo "    ./scripts/acme-issue.sh example.com --staging"
echo ""
