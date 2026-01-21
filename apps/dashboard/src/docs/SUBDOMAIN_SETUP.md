# Subdomain Setup Guide

## Overview

This guide explains how to set up subdomains for tenant deployments on Vercel.

## Types of Subdomains

### 1. **Vercel Default Subdomain** (Automatic)

- Format: `tenant-{tenantId}.vercel.app`
- Automatically created when a Vercel project is deployed
- No configuration needed
- Example: `tenant-1234567890.vercel.app`

### 2. **Custom Subdomain** (Manual Setup Required)

- Format: `{subdomain}.framextech.com`
- Requires domain ownership and DNS configuration
- Example: `tenant1.framextech.com`

## Setting Up Custom Subdomains

### Prerequisites

1. **Domain Ownership**: You must own the domain you want to use
2. **DNS Access**: You need access to your domain's DNS settings
3. **Vercel Token**: Your Vercel API token must have domain management permissions

### Step 1: Add Subdomain in Deployment

When creating a deployment, you can optionally provide a custom subdomain:

```typescript
// In the simulator UI, enter:
// Custom Subdomain: tenant1.framextech.com
```

Or via API:

```typescript
POST /api/simulate/create-deployment
{
  "tenantId": "tenant_123",
  "tenantName": "Test Tenant",
  "databaseName": "tenant_123_db",
  "customSubdomain": "tenant1.framextech.com" // Optional
}
```

### Step 2: Configure DNS Records

After adding the subdomain to Vercel, you'll need to configure DNS records:

#### Option A: CNAME Record (Recommended)

```
Type: CNAME
Name: tenant1 (or your subdomain)
Value: cname.vercel-dns.com
TTL: 3600 (or default)
```

#### Option B: A Record (Alternative)

```
Type: A
Name: tenant1 (or your subdomain)
Value: 76.76.21.21 (Vercel's IP - check Vercel docs for current IP)
TTL: 3600 (or default)
```

### Step 3: Verify Domain in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Find your subdomain
4. Check verification status
5. Vercel will automatically issue an SSL certificate once DNS is configured

### Step 4: Wait for Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Use tools like `dig` or online DNS checkers to verify:
  ```bash
  dig tenant1.framextech.com
  ```

## API Functions

### Add Subdomain to Project

```typescript
import { addVercelSubdomain } from "@/lib/vercel-service";

const domain = await addVercelSubdomain("project-id", "tenant1.framextech.com");

console.log(`Domain: ${domain.name}, Verified: ${domain.verified}`);
```

### Get All Project Domains

```typescript
import { getProjectDomains } from "@/lib/vercel-service";

const domains = await getProjectDomains("project-id");
domains.forEach((domain) => {
  console.log(`${domain.name} - ${domain.verified ? "Verified" : "Pending"}`);
});
```

## How It Works

1. **Project Creation**: Vercel project is created with default subdomain
2. **Custom Subdomain**: If provided, subdomain is added to the project
3. **DNS Configuration**: You configure DNS records at your domain provider
4. **Verification**: Vercel verifies domain ownership via DNS
5. **SSL Certificate**: Vercel automatically issues SSL certificate
6. **Deployment**: All deployments automatically use the configured domains

## Troubleshooting

### Subdomain Not Working

1. **Check DNS Records**:

   - Verify CNAME or A record is correctly configured
   - Wait for DNS propagation (can take up to 48 hours)

2. **Check Vercel Dashboard**:

   - Go to project → Settings → Domains
   - Verify domain is added and verified
   - Check for any error messages

3. **Check Domain Format**:

   - Ensure subdomain format is correct: `subdomain.domain.com`
   - No `http://` or `https://` prefix
   - No trailing slashes

4. **Verify Vercel Token Permissions**:
   - Ensure your Vercel token has domain management permissions
   - Check if you're using the correct team ID

### Common Errors

- **"Domain already exists"**: The subdomain is already configured on another project
- **"Invalid domain format"**: Check the subdomain format matches `subdomain.domain.com`
- **"DNS not configured"**: Add the required DNS records at your domain provider

## Best Practices

1. **Use CNAME Records**: Easier to manage and update
2. **Wait for DNS Propagation**: Don't expect immediate results
3. **Verify Before Production**: Test subdomain in staging first
4. **Document DNS Settings**: Keep track of DNS configurations
5. **Monitor SSL Status**: Ensure SSL certificates are properly issued

## Example: Complete Setup Flow

```typescript
// 1. Create deployment with custom subdomain
const deployment = await createDeployment({
  tenantId: "tenant_123",
  tenantName: "My Store",
  databaseName: "tenant_123_db",
  customSubdomain: "mystore.framextech.com",
});

// 2. Configure DNS at domain provider
// Add CNAME: mystore → cname.vercel-dns.com

// 3. Wait for verification (check Vercel dashboard)

// 4. Deployment is ready at https://mystore.framextech.com
```

## Environment Variables

Make sure these are set:

```env
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id (optional)
```

## Additional Resources

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Configuration](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [DNS Propagation Checker](https://www.whatsmydns.net/)
