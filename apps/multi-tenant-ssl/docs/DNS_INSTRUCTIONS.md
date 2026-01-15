# DNS Configuration Guide for Custom Domains

This guide explains how to configure DNS to connect your custom domain to our platform.

---

## Quick Start

Choose one of these options based on your domain type:

| Domain Type | Record Type | Example |
|-------------|-------------|---------|
| Apex domain (example.com) | A Record | `@ → YOUR_SERVER_IP` |
| Subdomain (shop.example.com) | CNAME Record | `shop → proxy.yourplatform.com` |
| Wildcard (*.example.com) | CNAME Record | `* → proxy.yourplatform.com` |

---

## Option 1: A Record (Apex Domains)

Use this for apex/root domains like `example.com`.

### Steps

1. **Log in to your DNS provider** (GoDaddy, Namecheap, Cloudflare, Route 53, etc.)

2. **Find DNS Management** - Look for "DNS Settings", "Manage DNS", or "DNS Records"

3. **Add an A Record:**

   | Field | Value |
   |-------|-------|
   | Type | A |
   | Name/Host | `@` (or leave blank) |
   | Value/Points to | `YOUR_SERVER_IP` |
   | TTL | 3600 (or Auto) |

4. **Save** the record

### Example

```
Type: A
Name: @
Value: 203.0.113.50
TTL: 3600
```

> **Note:** Replace `YOUR_SERVER_IP` with the IP address provided by your platform administrator.

---

## Option 2: CNAME Record (Subdomains)

Use this for subdomains like `shop.example.com` or `app.example.com`.

### Steps

1. **Log in to your DNS provider**

2. **Add a CNAME Record:**

   | Field | Value |
   |-------|-------|
   | Type | CNAME |
   | Name/Host | `shop` (your subdomain) |
   | Value/Points to | `proxy.yourplatform.com` |
   | TTL | 3600 (or Auto) |

3. **Save** the record

### Example

```
Type: CNAME
Name: shop
Value: proxy.yourplatform.com
TTL: 3600
```

---

## Domain Verification

After adding your DNS record, we verify domain ownership using a TXT record.

### Adding the Verification TXT Record

When you add a custom domain, you'll receive a verification token. Add this as a TXT record:

| Field | Value |
|-------|-------|
| Type | TXT |
| Name/Host | `_framex-verification` |
| Value | `framex-verify-abc123xyz` (your token) |
| TTL | 3600 |

### Example

```
Type: TXT
Name: _framex-verification.shop.example.com
Value: framex-verify-abc123xyz
TTL: 3600
```

---

## DNS Propagation

DNS changes can take time to propagate globally:

- **Minimum:** 5-10 minutes
- **Typical:** 1-4 hours
- **Maximum:** 24-48 hours

### Check Propagation Status

Use these tools to verify your DNS is configured correctly:

- [whatsmydns.net](https://www.whatsmydns.net) - Global DNS propagation checker
- [dnschecker.org](https://dnschecker.org) - Multi-location DNS checker
- `dig` command (Linux/Mac): `dig +short shop.example.com`
- `nslookup` command (Windows): `nslookup shop.example.com`

---

## Cloudflare Users

If you use Cloudflare as your DNS provider, note these special considerations:

### Proxy Mode

| Setting | Behavior |
|---------|----------|
| **Proxied (Orange Cloud)** | Traffic goes through Cloudflare. Use Cloudflare origin certificates. |
| **DNS Only (Gray Cloud)** | Traffic goes directly to our servers. Use Let's Encrypt certificates. |

### Recommended Settings

For best compatibility:

1. Set the record to **DNS Only** (gray cloud) initially
2. Wait for SSL certificate to be issued
3. Then switch to **Proxied** (orange cloud) if desired

### SSL/TLS Settings (if using Proxied mode)

1. Go to **SSL/TLS** → **Overview**
2. Set mode to **Full (Strict)**
3. This enables end-to-end encryption

---

## Troubleshooting

### "DNS verification failed"

- **Wait:** DNS changes may not have propagated yet
- **Check:** Use a DNS checker tool to verify the record exists
- **Verify:** Ensure the TXT record name and value are exactly correct

### "Could not issue SSL certificate"

- **DNS:** Ensure A/CNAME record points to our server IP
- **Propagation:** Wait for DNS to propagate fully
- **Firewall:** Ensure ports 80 and 443 are not blocked

### "Domain not resolving"

- **Typo:** Check for spelling errors in the record
- **TTL:** Old records may be cached; wait for TTL to expire
- **Registrar:** Ensure your domain registration is active

### Common Mistakes

| Mistake | Solution |
|---------|----------|
| Adding `http://` or `https://` | Only use the hostname, no protocol |
| Including trailing dot | Remove any trailing periods |
| Using wrong record type | Apex = A record, Subdomain = CNAME |
| Cloudflare proxy enabled | Disable proxy initially until SSL is issued |

---

## Provider-Specific Guides

### GoDaddy

1. Go to **My Products** → **DNS**
2. Click **Add** under the Records section
3. Select record type and fill in details

### Namecheap

1. Go to **Domain List** → **Manage**
2. Click **Advanced DNS**
3. Add records in the Host Records section

### Cloudflare

1. Go to your domain's dashboard
2. Click **DNS** in the sidebar
3. Click **Add record**

### AWS Route 53

1. Go to **Hosted zones**
2. Select your domain
3. Click **Create record**

### DigitalOcean

1. Go to **Networking** → **Domains**
2. Select your domain
3. Add records using the form

---

## Need Help?

If you're having trouble:

1. Double-check the DNS record values
2. Wait at least 1 hour for propagation
3. Use a DNS checker tool to verify
4. Contact support with your domain name and the error message

---

## SSL Certificate Timeline

After DNS is verified:

| Step | Time |
|------|------|
| DNS Verification | Instant (after propagation) |
| Certificate Request | < 30 seconds |
| Certificate Issuance | 30-60 seconds |
| Domain Active | < 2 minutes total |

Your domain will be fully active with HTTPS within minutes of successful DNS verification.
