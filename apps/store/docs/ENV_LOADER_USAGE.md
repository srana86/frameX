# Environment Variable Loader Usage

## Overview

The environment variable loader reads data from specific lines of the `.env` file (default: lines 12-16) and provides utility functions to access them.

## Files Created

1. **`lib/env-loader.ts`** - Core loader that reads from .env file
2. **`lib/env-utils.ts`** - Helper functions for accessing env vars
3. **`app/api/env/config/route.ts`** - API endpoint to get env config

## Usage

### Basic Usage

```typescript
import { getEnvConfig, getEnvValue } from "@/lib/env-utils";

// Get all data from .env lines 12-16
const config = getEnvConfig();
console.log(config.ENCRYPTION_KEY);
console.log(config.GITHUB_REPO);
console.log(config.GITHUB_TOKEN);
console.log(config.MONGODB_DB);

// Get specific value
const encryptionKey = getEnvValue("ENCRYPTION_KEY");
```

### Helper Functions

```typescript
import {
  getEncryptionKey,
  getGitHubRepo,
  getGitHubToken,
  getMongoDbName,
  validateEnvVars,
} from "@/lib/env-utils";

// Get specific values
const encryptionKey = getEncryptionKey();
const githubRepo = getGitHubRepo();
const githubToken = getGitHubToken();
const dbName = getMongoDbName();

// Validate required variables
const { valid, missing } = validateEnvVars();
if (!valid) {
  console.error("Missing variables:", missing);
}
```

### Custom Line Range

```typescript
import { loadEnvFromFile } from "@/lib/env-loader";

// Load from lines 10-20
const config = loadEnvFromFile({ start: 10, end: 20 });
```

### API Endpoint

```bash
# Get environment configuration
GET /api/env/config

# Response:
{
  "success": true,
  "data": {
    "envLines12to16": {
      "ENCRYPTION_KEY": "***",
      "GITHUB_REPO": "abujobayer0/shoes-store",
      "GITHUB_TOKEN": "***",
      "MONGODB_DB": "shoestore_main"
    },
    "validation": {
      "valid": true,
      "missing": []
    },
    "allEnvVars": { ... }
  }
}
```

## Environment Variables from Lines 12-16

Based on your `.env` file, lines 12-16 contain:

- **Line 12**: `ENCRYPTION_KEY` - Key for encrypting database connection strings
- **Line 13**: `GITHUB_REPO` - GitHub repository (format: username/repo)
- **Line 14**: `GITHUB_TOKEN` - GitHub personal access token
- **Line 15**: `MONGODB_DB` - MongoDB database name

## Integration

The utilities are already integrated into:

- `lib/database-service.ts` - Uses `getEncryptionKey()` and `getMongoDbName()`
- `lib/vercel-service.ts` - Uses `getGitHubRepo()`

## Security Note

Sensitive values (tokens, keys, secrets) are automatically masked when returned via the API endpoint.

