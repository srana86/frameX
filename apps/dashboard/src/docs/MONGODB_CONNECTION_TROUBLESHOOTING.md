# MongoDB Connection Troubleshooting Guide

## Common Error: ETIMEOUT / querySrv

If you're seeing `ETIMEOUT` or `querySrv` errors, this means the system cannot reach your MongoDB server.

## Quick Fixes

### 1. **Check MongoDB Atlas IP Whitelist** (Most Common)

If using MongoDB Atlas:

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access** → **IP Access List**
3. Add your current IP address, OR
4. For testing, add `0.0.0.0/0` (allows all IPs - use only for development!)

### 2. **Verify Connection String Format**

**MongoDB Atlas (SRV):**

```
mongodb+srv://username:password@cluster.mongodb.net/database
```

**Direct Connection:**

```
mongodb://username:password@host:port/database
```

**Local MongoDB:**

```
mongodb://localhost:27017/database
```

### 3. **Test Connection String**

Test your connection string directly:

```bash
# Using MongoDB Compass or mongosh
mongosh "your-connection-string"
```

### 4. **Check Network/Firewall**

- Ensure your network allows outbound connections to MongoDB
- Check if corporate firewall is blocking MongoDB ports (27017 for direct, 27017+ for Atlas)
- Verify DNS resolution is working

### 5. **Use Direct Connection Instead of SRV**

If `mongodb+srv://` is timing out, try using direct connection:

1. Get connection string from Atlas
2. Click "Connect" → "Connect your application"
3. Choose "Standard connection string" instead of "SRV connection string"
4. Replace `mongodb+srv://` with `mongodb://` and add port `:27017`

## Environment Variable Setup

Make sure your `.env` file has:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shoestore_main
MONGODB_DB=shoestore_main
```

## Connection Timeout Settings

The system now uses:

- **Server Selection Timeout**: 10 seconds
- **Connection Timeout**: 10 seconds
- **Socket Timeout**: 45 seconds

If your connection takes longer, you may need to:

1. Check network latency
2. Verify MongoDB cluster is running
3. Check MongoDB Atlas status page

## Error Messages Explained

### `ETIMEOUT` / `querySrv`

- **Cause**: DNS resolution timeout for MongoDB Atlas SRV records
- **Fix**: Check network, DNS, or use direct connection string

### `ENOTFOUND`

- **Cause**: Cannot resolve MongoDB hostname
- **Fix**: Check connection string format and DNS

### `Authentication failed`

- **Cause**: Wrong username or password
- **Fix**: Verify credentials in connection string

### `Connection refused`

- **Cause**: MongoDB server not running or firewall blocking
- **Fix**: Check MongoDB service status and firewall rules

## Testing Your Connection

### Option 1: MongoDB Compass

1. Download MongoDB Compass
2. Paste your connection string
3. Click "Connect"
4. If it works, the connection string is correct

### Option 2: Command Line

```bash
# Test with mongosh
mongosh "your-connection-string"

# Or with mongo (older versions)
mongo "your-connection-string"
```

### Option 3: Node.js Test Script

```javascript
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    await client.db().admin().ping();
    console.log("✅ Ping successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();
```

## Still Having Issues?

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **Verify Cluster is Running**: Check Atlas dashboard
3. **Review Connection String**: Ensure no extra spaces or special characters
4. **Check Logs**: Look at server console for detailed error messages
5. **Try Different Network**: Test from different network to rule out firewall issues

## Support

If the issue persists:

- Check MongoDB Atlas logs
- Review server console output
- Verify all environment variables are set correctly
- Test connection from a different environment
