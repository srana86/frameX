# Super Admin Panel

Centralized admin panel for managing all tenants, deployments, and subscriptions.

## Features

- Manage all tenants
- View and manage deployments
- Manage subscription plans
- Monitor system health
- Create new tenant deployments

## Setup

1. Copy environment variables from main app:
```env
MONGODB_URI=mongodb://.../shoestore_main
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id
GITHUB_REPO=username/shoestore
ENCRYPTION_KEY=your_encryption_key
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## Deployment

Deploy to Vercel or your preferred platform. This is a separate deployment from tenant instances.
# ecommerce-admin
