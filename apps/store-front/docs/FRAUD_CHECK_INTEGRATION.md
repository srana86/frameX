# FraudShield Integration Documentation

## Overview

The FraudShield integration provides powerful fraud detection capabilities by analyzing customer courier delivery history across multiple courier services in Bangladesh. This helps tenants make informed decisions about order processing and identify potentially risky customers.

## Features

✅ **Customer Fraud Risk Assessment**
- Real-time fraud risk calculation based on delivery history
- Risk levels: Low, Medium, High, Unknown
- Comprehensive success rate analysis

✅ **Multi-Courier Support**
- Analyzes data across multiple courier services
- Individual courier performance tracking
- Aggregated statistics

✅ **API Usage Monitoring**
- Real-time usage statistics
- Daily and monthly quota tracking
- Subscription plan information

✅ **Beautiful Admin Interface**
- Modern, responsive design
- Easy-to-use search functionality
- Detailed customer insights

## Setup

### 1. Get Your FraudShield API Key

1. Visit [https://fraudshieldbd.site](https://fraudshieldbd.site)
2. Register for an account
3. Navigate to the Dashboard
4. Generate your API key

### 2. Configure Environment Variables

Add your FraudShield API key to your `.env.local` file:

```env
FRAUDSHIELD_API_KEY=your_fraudshield_api_key_here
```

### 3. Access the Fraud Check Page

Navigate to `/tenant/fraud-check` in your admin dashboard to start using the fraud detection feature.

## How to Use

### Checking a Customer

1. Go to **Tenant Dashboard** → **Settings** → **Fraud Check**
2. Enter the customer's Bangladeshi phone number (e.g., 01712345678)
3. Click **Check** or press Enter
4. View the comprehensive fraud risk assessment

### Understanding Risk Levels

#### Low Risk (90%+ success rate)
- ✅ Excellent delivery record
- ✅ High success rate
- ✅ Minimal failed deliveries
- **Recommendation**: Process orders normally

#### Medium Risk (70-90% success rate)
- ⚠️ Moderate delivery record
- ⚠️ Some failed deliveries
- **Recommendation**: Exercise normal caution

#### High Risk (<70% success rate)
- ❌ Poor delivery record
- ❌ High failure rate
- **Recommendation**: Exercise extra caution, consider verification

#### Unknown Risk
- ℹ️ Insufficient data available
- **Recommendation**: Treat as new customer

## API Endpoints

### Check Customer

```typescript
POST /api/tenant/fraud-check
Content-Type: application/json

{
  "phone": "01712345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phone": "01712345678",
    "total_parcels": 45,
    "successful_deliveries": 42,
    "failed_deliveries": 3,
    "success_rate": 93.33,
    "fraud_risk": "low",
    "last_delivery": "2025-10-03",
    "courier_history": [
      {
        "courier": "Steadfast",
        "total": 25,
        "successful": 24,
        "failed": 1
      }
    ]
  }
}
```

### Get Usage Statistics

```typescript
GET /api/tenant/fraud-check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today_usage": 25,
    "monthly_usage": 450,
    "daily_limit": 1000,
    "remaining_today": 975,
    "subscription": {
      "plan_name": "Professional",
      "expires_at": "2025-11-04T00:00:00Z",
      "days_remaining": 31
    }
  }
}
```

## Code Structure

### Files Created

```
my-app/
├── lib/
│   └── fraud-check/
│       ├── common.ts                    # Common types and utilities
│       ├── fraudshield.ts              # Legacy fraud check (existing)
│       └── fraudshield-api.ts          # New FraudShield API client
├── app/
│   ├── api/
│   │   └── tenant/
│   │       └── fraud-check/
│   │           └── route.ts            # API endpoints
│   └── (home)/
│       └── tenant/
│           └── fraud-check/
│               ├── page.tsx            # Page component
│               └── FraudCheckClient.tsx # Client component with UI
└── docs/
    └── FRAUD_CHECK_INTEGRATION.md      # This file
```

### Module Architecture

#### 1. Common Utilities (`lib/fraud-check/common.ts`)
- Phone number validation and normalization
- Type definitions
- Helper functions for risk calculation
- UI utility functions

#### 2. API Client (`lib/fraud-check/fraudshield-api.ts`)
- FraudShield API client class
- Authentication handling
- Request/response type definitions
- Error handling

#### 3. API Routes (`app/api/tenant/fraud-check/route.ts`)
- GET endpoint for usage statistics
- POST endpoint for customer checks
- Environment variable handling
- Error responses

#### 4. UI Components (`app/(home)/tenant/fraud-check/`)
- Main page component
- Client component with state management
- Beautiful, responsive design
- Real-time data updates

## Rate Limiting

API requests are rate-limited based on your FraudShield subscription plan:

| Plan | Rate Limit |
|------|------------|
| Basic | 60/min |
| Professional | 300/min |
| Enterprise | 1000/min |

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Your rate limit per minute
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Error Handling

The integration includes comprehensive error handling:

### Common Errors

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "code": 401
}
```
**Solution**: Check your API key configuration

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid phone number",
  "message": "Please provide a valid Bangladeshi phone number",
  "code": 400
}
```
**Solution**: Ensure phone number is in correct format (01XXXXXXXXX)

#### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests",
  "code": 429
}
```
**Solution**: Wait for rate limit to reset or upgrade your plan

## Best Practices

### 1. Phone Number Format
- Always use Bangladeshi phone format: `01XXXXXXXXX`
- The system automatically normalizes various formats
- Supports formats: `01712345678`, `+8801712345678`, `8801712345678`

### 2. Caching Results
- Consider caching fraud check results for a reasonable time period
- Update cache when new orders are placed
- Balance between data freshness and API usage

### 3. Usage Monitoring
- Regularly check your API usage statistics
- Monitor daily limits to avoid disruptions
- Plan ahead for high-traffic periods

### 4. Risk Assessment
- Use fraud risk as one factor in decision-making
- Consider customer history and order value
- Implement tiered verification based on risk level

### 5. Privacy & Compliance
- Store fraud check results securely
- Follow data protection regulations
- Inform customers about fraud prevention measures

## Troubleshooting

### API Key Not Working
1. Verify the API key is correctly set in `.env.local`
2. Restart your development server after adding the key
3. Check that the key hasn't expired in your FraudShield dashboard

### No Data Returned
- Customer may not have any delivery history
- Phone number might be incorrectly formatted
- Check API response for specific error messages

### Rate Limit Issues
- Monitor your usage through the dashboard
- Consider upgrading your plan for higher limits
- Implement request throttling in high-traffic scenarios

## Support

For issues related to:
- **FraudShield API**: Contact [FraudShield Support](https://fraudshieldbd.site)
- **Integration Issues**: Check this documentation or contact your development team

## Version History

### v1.0.0 (Current)
- Initial integration with FraudShield API
- Customer fraud check functionality
- Usage statistics tracking
- Beautiful admin interface
- Comprehensive error handling
- Multi-courier support

## Future Enhancements

Potential features for future versions:
- [ ] Bulk customer checking
- [ ] Automated fraud alerts
- [ ] Historical trend analysis
- [ ] Custom risk thresholds
- [ ] Export fraud reports
- [ ] Webhook integration for real-time updates

## License

This integration is part of the ShoeStore application. Please refer to the main application license for usage terms.

