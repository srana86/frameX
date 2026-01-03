# Fraud Check API Tests

This directory contains test scripts for the Fraud Check API.

## Test Scripts

### 1. Unit Tests (`test-fraud-check-unit.ts`)

Tests phone number normalization and validation without requiring an API key or network access.

**Run:**
```bash
bun run scripts/test-fraud-check-unit.ts
# or
tsx scripts/test-fraud-check-unit.ts
```

**Tests:**
- Phone number normalization (various formats)
- Phone number validation (valid/invalid numbers)
- Specific phone number: `01303463436`

### 2. Integration Tests (`test-fraud-check.ts`)

Tests the full API integration with the Onecodesoft Fraud Checker API.

**Prerequisites:**
- Set `ONECODESOFT_FRAUD_CHECK_API_KEY` environment variable
- Optionally set `ONECODESOFT_DOMAIN` or `SUPER_ADMIN_URL` for domain whitelisting

**Run:**
```bash
# Set API key
export ONECODESOFT_FRAUD_CHECK_API_KEY='your-api-key'

# Run direct API test
bun run scripts/test-fraud-check.ts

# Also test HTTP endpoint (requires server to be running)
bun run scripts/test-fraud-check.ts --http
```

**Tests:**
- Direct API client test (calls Onecodesoft API directly)
- HTTP endpoint test (tests `/api/fraud-check` route)
- Phone number: `01303463436`
- Response format validation
- Error handling

## Test Phone Number

The test scripts use the phone number: **01303463436**

This number:
- ✅ Is valid (normalizes correctly)
- ✅ Matches BD phone regex pattern
- ✅ Ready for API calls

## Troubleshooting

### API Key Not Set
```
❌ ERROR: ONECODESOFT_FRAUD_CHECK_API_KEY is not set
```
**Solution:** Set the environment variable before running the test.

### Imunify360 Bot Protection Block
```
Access denied by Imunify360 bot-protection
```
**This is the most common issue!**

**Cause:**
The Onecodesoft API server is protected by Imunify360 bot-protection firewall, which blocks automated requests.

**Solution:**
1. **Contact Onecodesoft support** to whitelist your server's IP address
2. Domain whitelisting alone is **not sufficient** - you must whitelist the **IP address** of the server making the requests
3. Provide them with:
   - Your server's public IP address (not the domain)
   - Your API key
   - Your domain name (for reference)

**Note:** This is a server-side configuration issue, not a code problem. Your API key and configuration are correct.

### Connection Refused
```
Unable to connect to Fraud Checker API
```
**Possible causes:**
- API service is down
- Network connectivity issues

**Solution:**
1. Check network connectivity
2. Verify API key is correct
3. Check if the Onecodesoft service is operational

### Invalid Response Format
```
Unexpected response format from API
```
**Possible causes:**
- API returned HTML (blocked by Imunify360)
- API response structure changed
- API key is invalid

**Solution:**
1. Check server logs for detailed error messages
2. Verify API key is valid
3. Ensure server IP is whitelisted
4. Contact Onecodesoft support if issue persists

## Response Format

### Success Response (New Format)
```json
{
  "status": "success",
  "courierData": {
    "summary": {
      "total_parcel": 10,
      "success_parcel": 8,
      "cancelled_parcel": 2,
      "success_ratio": 80
    },
    "pathao": {
      "name": "Pathao",
      "total_parcel": 5,
      "success_parcel": 4,
      "cancelled_parcel": 1,
      "success_ratio": 80
    },
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Error message",
  "code": 400
}
```

## Running Tests in CI/CD

To run tests in CI/CD, set the API key as a secret:

```bash
# GitHub Actions example
env:
  ONECODESOFT_FRAUD_CHECK_API_KEY: ${{ secrets.ONECODESOFT_FRAUD_CHECK_API_KEY }}

# Run tests
- run: bun run scripts/test-fraud-check-unit.ts
- run: bun run scripts/test-fraud-check.ts
```

