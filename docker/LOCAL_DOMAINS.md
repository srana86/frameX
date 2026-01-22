# Local Development Domain Setup

## Option 1: dnsmasq (Recommended for Wildcard Domains)

### macOS Setup

```bash
# Install dnsmasq
brew install dnsmasq

# Configure dnsmasq for .local domains
echo "address=/framextech.local/127.0.0.1" >> $(brew --prefix)/etc/dnsmasq.conf

# Start dnsmasq service
sudo brew services start dnsmasq

# Create resolver directory
sudo mkdir -p /etc/resolver

# Point .local domains to dnsmasq
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/framextech.local

# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Verify dnsmasq is working

```bash
# Should return 127.0.0.1 for any subdomain
dig demo.framextech.local @127.0.0.1
dig anything.framextech.local @127.0.0.1
dig shop.framextech.local @127.0.0.1

# Or use ping
ping -c 1 demo.framextech.local
ping -c 1 anysubdomain.framextech.local
```

### Restart dnsmasq (if needed)

```bash
# macOS
sudo brew services restart dnsmasq

# Check status
sudo brew services list | grep dnsmasq
```

---

## Option 2: Manual /etc/hosts (Limited - No Wildcards)

```bash
# Add specific domains manually
sudo nano /etc/hosts
```

Add:

```
127.0.0.1  framextech.local
127.0.0.1  demo.framextech.local
127.0.0.1  shop.framextech.local
```

**Note:** This requires adding each subdomain manually.

---

## Domain Routing

| URL                               | Routes To    | Service        |
| --------------------------------- | ------------ | -------------- |
| `http://localhost/`               | Landing      | localhost:3001 |
| `http://localhost/api/`           | Platform API | localhost:8081 |
| `http://admin.localhost/`         | Super Admin  | localhost:3002 |
| `http://admin.localhost/api/`     | Platform API | localhost:8081 |
| `http://*.localhost/`             | Store        | localhost:3000 |
| `http://*.localhost/api/`         | Store API    | localhost:8080 |

### Production Domains

| URL                                | Routes To    | Service        |
| ---------------------------------- | ------------ | -------------- |
| `https://framextech.com/`          | Landing      | landing:3001   |
| `https://framextech.com/api/`      | Platform API | server:8081    |
| `https://admin.framextech.com/`    | Super Admin  | admin:3002     |
| `https://admin.framextech.com/api/`| Platform API | server:8081    |
| `https://*.framextech.com/`        | Store        | store:3000     |
| `https://*.framextech.com/api/`    | Store API    | store-server:8080 |

---

## Headers

Your backend receives `X-Tenant-Subdomain` header:

- `demo.framextech.local` → `X-Tenant-Subdomain: demo`
- `shop.framextech.local` → `X-Tenant-Subdomain: shop`
- `anything.framextech.local` → `X-Tenant-Subdomain: anything`

---

## Testing

```bash
# Start databases + nginx
docker-compose up -d

# Start apps locally
pnpm dev

# Test main platform (Dashboard)
curl http://framextech.local/
curl http://framextech.local/api/health

# Test tenant subdomain (Store)
curl http://demo.framextech.local/
curl http://demo.framextech.local/api/health

# Check headers being passed
curl -v http://demo.framextech.local/ 2>&1 | grep -i x-tenant
```

---

## Troubleshooting

### dnsmasq not resolving

```bash
# Check if dnsmasq is running
sudo brew services list | grep dnsmasq

# Check config
cat $(brew --prefix)/etc/dnsmasq.conf | grep framextech

# Check resolver
cat /etc/resolver/framextech.local

# Restart
sudo brew services restart dnsmasq
```

### Port 53 already in use

```bash
# Check what's using port 53
sudo lsof -i :53

# If it's another DNS service, stop it or configure dnsmasq to use a different port
```

### Browser not resolving

- Clear browser cache
- Try incognito/private window
- Restart browser
- Run: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
