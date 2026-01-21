# 🎨 Fraud Check Demo Mode

## Quick Preview

Want to see the beautiful charts without setting up API keys? Use the Demo Mode!

## How to Use Demo Mode

### Option 1: Click the Button
1. Navigate to `/tenant/fraud-check`
2. Look for the **"Load Demo Data"** button in the top-right corner
3. Click it!
4. Instantly see all charts populated with realistic sample data

### Option 2: Keep Working Normally
- The demo mode doesn't interfere with real checks
- Enter a real phone number and click "Check" to switch back to real data
- Demo mode automatically clears when you perform a real check

## Demo Data Details

### Sample Customer Profile
```
Phone: 01712345678
Total Parcels: 87
Successful: 79 (90.8%)
Failed: 8
Risk Level: LOW
Last Delivery: Nov 20, 2025
```

### Courier Breakdown
- **Steadfast**: 35 parcels (33 success, 2 failed) - 94.3% success
- **Pathao**: 28 parcels (26 success, 2 failed) - 92.9% success
- **RedX**: 15 parcels (12 success, 3 failed) - 80% success
- **Paperfly**: 9 parcels (8 success, 1 failed) - 88.9% success

### Usage Stats (Demo)
- Today's Usage: 142 / 1000
- Monthly Usage: 3,847
- Plan: Professional
- Days Remaining: 30

## What You'll See

### 1. Risk Assessment Gauge
- Large circular gauge showing 90.8% success rate
- Green indicator (Low Risk)
- Visual breakdown of risk levels

### 2. Orders Distribution Pie Chart
- 90.8% successful (green)
- 9.2% failed (red)

### 3. Success Rate by Courier Bar Chart
- Steadfast: 94.3%
- Pathao: 92.9%
- Paperfly: 88.9%
- RedX: 80%

### 4. Courier Volume Comparison
- Side-by-side green/red bars
- Shows volume across all couriers

## Features

✅ **No API Key Required** - Preview without configuration  
✅ **Realistic Data** - Based on actual customer patterns  
✅ **All Charts Visible** - See every visualization  
✅ **Easy Toggle** - Switch between demo and real data  
✅ **Visual Indicator** - Blue badge shows when in demo mode  
✅ **No Data Loss** - Demo doesn't affect real operations  

## Screenshots Scenarios

### Low Risk Customer (Current Demo)
Perfect customer with excellent delivery record across all couriers.

### To Test Other Scenarios

Modify the `DEMO_DATA` constant in `FraudCheckClient.tsx`:

```typescript
// High Risk Customer
const DEMO_DATA = {
  success_rate: 45.5,
  fraud_risk: "high",
  successful_deliveries: 20,
  failed_deliveries: 24,
  // ...
};

// Medium Risk Customer
const DEMO_DATA = {
  success_rate: 75.0,
  fraud_risk: "medium",
  successful_deliveries: 60,
  failed_deliveries: 20,
  // ...
};
```

## Demo Mode Indicator

When demo mode is active, you'll see:
- 🔵 **Blue "Demo Mode" badge** next to the page title
- ℹ️ **Info alert** below the search box explaining demo mode
- The phone number field pre-filled with demo number

## Switching Back to Real Data

Simply:
1. Enter a different phone number
2. Click "Check"
3. Demo mode clears automatically

Or refresh the page to start fresh.

## Use Cases

### 1. Testing UI/UX
- Design review without backend setup
- Screenshot generation for documentation
- Client presentations

### 2. Development
- Frontend development without API dependencies
- CSS/styling adjustments
- Responsive design testing

### 3. Training
- Show team members the interface
- Explain how to interpret charts
- Demo fraud detection features

### 4. Quick Preview
- Stakeholder presentations
- Feature demonstrations
- User onboarding

## Tips

💡 **Tip 1**: Use demo mode to understand chart interpretations before checking real customers  
💡 **Tip 2**: Screenshot demo mode for training materials  
💡 **Tip 3**: Test responsive design by resizing browser in demo mode  
💡 **Tip 4**: Compare demo data patterns with real customer data  

## Customizing Demo Data

Want different demo scenarios? Edit the `DEMO_DATA` object:

```typescript
// Location: FraudCheckClient.tsx (top of file)

const DEMO_DATA: CustomerFraudData = {
  phone: "01712345678",           // Change phone
  total_parcels: 87,              // Change totals
  successful_deliveries: 79,      // Adjust success count
  failed_deliveries: 8,           // Adjust failure count
  success_rate: 90.8,            // Update rate
  fraud_risk: "low",              // Change risk: low/medium/high
  courier_history: [
    // Add/modify courier data
  ],
};
```

## Current Implementation

✅ Demo button in header  
✅ Realistic sample data  
✅ All charts populated  
✅ Visual indicators  
✅ Easy toggle on/off  
✅ No interference with real functionality  
✅ Toast notification on load  

## Version

**Feature Added**: v1.1.0  
**Last Updated**: November 2025  
**Status**: Active

---

**Enjoy exploring the charts! 🎉**

