# Fraud Check Charts & Visualizations

## Overview

The fraud check page includes beautiful, interactive charts to help you visualize customer risk and delivery patterns at a glance.

## Available Charts

### 1. 🎯 Risk Assessment Score (Radial Gauge)

**Location**: Top of customer data section  
**Type**: Radial Progress Chart  
**Purpose**: Visual representation of customer's overall success rate

**Features**:
- Large circular gauge showing success rate percentage
- Color-coded based on risk level:
  - 🟢 Green (90-100%): Low Risk
  - 🟡 Yellow (70-89%): Medium Risk
  - 🔴 Red (0-69%): High Risk
- Risk level indicators with descriptions
- Gradient background for visual appeal

**Use Case**: Quick visual assessment of customer trustworthiness

---

### 2. 📊 Orders Distribution (Pie Chart)

**Location**: Left side of charts section  
**Type**: Pie Chart  
**Purpose**: Show the ratio of successful vs failed deliveries

**Features**:
- Two segments: Successful (green) and Failed (red)
- Percentage labels on each segment
- Interactive tooltips with exact numbers
- Legend showing counts
- Responsive design

**Data Displayed**:
- Successful deliveries count and percentage
- Failed deliveries count and percentage

**Use Case**: Understand the overall delivery success/failure ratio

---

### 3. 📈 Success Rate by Courier (Bar Chart)

**Location**: Right side of charts section (top)  
**Type**: Vertical Bar Chart  
**Purpose**: Compare success rates across different courier services

**Features**:
- One bar per courier service
- Y-axis shows success rate (0-100%)
- Color-coded bars (blue)
- Interactive tooltips showing:
  - Courier name
  - Success rate percentage
  - Successful delivery count
  - Failed delivery count
  - Total parcel count
- Grid lines for easy reading

**Use Case**: Identify which courier services perform best for this customer

---

### 4. 📦 Courier Volume Comparison (Stacked Bar Chart)

**Location**: Bottom of charts section (full width)  
**Type**: Grouped Bar Chart  
**Purpose**: Show volume of successful and failed deliveries per courier

**Features**:
- Two bars per courier: Successful (green) and Failed (red)
- Y-axis shows number of parcels
- Legend for easy identification
- Interactive tooltips
- Side-by-side comparison
- Responsive full-width display

**Data Displayed**:
- Successful delivery count (green bars)
- Failed delivery count (red bars)
- Easy visual comparison of volumes

**Use Case**: Understand delivery patterns and identify couriers with high failure rates

---

## Chart Interactions

### Hover Effects
- Hover over any chart element to see detailed information
- Tooltips display exact numbers and percentages
- Chart elements highlight on hover

### Responsive Design
- Charts automatically resize based on screen size
- Mobile-optimized layouts
- Grid layouts adjust for tablet and desktop views

### Color Coding

| Color | Meaning | Usage |
|-------|---------|-------|
| 🟢 Green (#22c55e) | Successful / Low Risk | Successful deliveries, positive metrics |
| 🔴 Red (#ef4444) | Failed / High Risk | Failed deliveries, negative metrics |
| 🔵 Blue (#3b82f6) | Neutral / Info | Success rate bars, general metrics |
| 🟡 Yellow (#eab308) | Medium Risk | Warning indicators |
| ⚪ Gray | Unknown / Neutral | No data or neutral states |

---

## Chart Data Sources

All charts are dynamically generated from the FraudShield API response:

```typescript
interface CustomerFraudData {
  phone: string;
  total_parcels: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  fraud_risk: FraudRiskLevel;
  last_delivery?: string;
  courier_history?: CourierHistory[];
}
```

---

## Technical Details

### Libraries Used
- **Recharts**: Primary charting library (v2.15.4)
- **Custom UI Components**: ChartContainer, ChartTooltip for consistent styling
- **SVG**: For radial gauge chart

### Performance
- Charts render only when customer data is loaded
- Lazy loading prevents unnecessary renders
- Optimized for smooth animations
- Responsive containers for all screen sizes

### Accessibility
- Proper labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- High contrast color schemes

---

## Customization

### Changing Colors

Edit the chart configuration in `FraudCheckClient.tsx`:

```typescript
<ChartContainer
  config={{
    successful: {
      label: "Successful",
      color: "hsl(142, 76%, 36%)", // Change this
    },
    failed: {
      label: "Failed",
      color: "hsl(0, 84%, 60%)", // Change this
    },
  }}
>
```

### Adjusting Chart Heights

Modify the className height values:

```typescript
className='h-[300px]' // Change to desired height
```

### Adding New Charts

1. Import required Recharts components
2. Add ChartContainer wrapper
3. Configure chart data
4. Add tooltips and legends
5. Style with Tailwind classes

---

## Best Practices

### Data Interpretation

1. **Risk Assessment Gauge**
   - Focus on the overall percentage
   - Check which risk indicator is highlighted
   - Consider the gradient: smooth transition = borderline case

2. **Distribution Chart**
   - Small red slice = good customer
   - Large red slice = risky customer
   - Equal slices = 50% success rate (high risk)

3. **Success Rate Comparison**
   - Tall bars (close to 100%) = reliable with that courier
   - Short bars = problems with that courier
   - Multiple low bars = consistently problematic customer

4. **Volume Comparison**
   - High green bars = experienced customer with good record
   - High red bars = experienced customer with poor record
   - Low bars overall = limited history (treat cautiously)

### When to Act

| Scenario | Charts Show | Action |
|----------|-------------|--------|
| **Excellent Customer** | High gauge (90%+), mostly green charts | Process orders normally |
| **Risky Customer** | Low gauge (<70%), mostly red charts | Require advance payment or verification |
| **Courier-Specific Issues** | Low bar for specific courier | Avoid that courier for this customer |
| **New Customer** | No charts (insufficient data) | Treat as new customer, normal precautions |

---

## Troubleshooting

### Charts Not Displaying

**Issue**: Charts don't appear after checking customer  
**Solutions**:
- Verify customer has delivery history
- Check browser console for errors
- Ensure Recharts library is installed
- Clear browser cache

### Incorrect Data

**Issue**: Chart shows unexpected values  
**Solutions**:
- Verify API response data
- Check data transformation logic
- Refresh the page and try again
- Check for API errors in network tab

### Performance Issues

**Issue**: Charts load slowly or lag  
**Solutions**:
- Check number of data points
- Optimize chart rendering settings
- Consider data pagination for large datasets
- Update Recharts library if outdated

---

## Future Enhancements

Potential improvements for future versions:

- [ ] **Historical Trend Chart**: Show success rate over time
- [ ] **Heat Map**: Display delivery success by time period
- [ ] **Comparison Mode**: Compare multiple customers side-by-side
- [ ] **Export Options**: Download charts as images or PDF
- [ ] **Real-time Updates**: Live chart updates via WebSocket
- [ ] **Custom Date Ranges**: Filter data by specific time periods
- [ ] **Geographic Maps**: Show delivery locations and success rates
- [ ] **Predictive Analytics**: AI-powered risk predictions

---

## Examples

### High-Risk Customer Pattern
```
Radial Gauge: 45% (Red)
Distribution: 55% failed (large red slice)
Success Rate: All bars below 50%
Volume: High red bars across all couriers
```
**Action**: Require COD or verification

### Low-Risk Customer Pattern
```
Radial Gauge: 95% (Green)
Distribution: 95% successful (large green slice)
Success Rate: All bars above 90%
Volume: High green bars, minimal red
```
**Action**: Trusted customer, normal processing

### Courier-Specific Issue
```
Radial Gauge: 75% (Yellow)
Distribution: 75% successful
Success Rate: One courier at 30%, others at 95%
Volume: One courier shows high red bars
```
**Action**: Avoid the problematic courier for this customer

---

## Support

For chart-related issues:
- Check the main [Fraud Check Integration Documentation](./FRAUD_CHECK_INTEGRATION.md)
- Review Recharts documentation: [https://recharts.org](https://recharts.org)
- Contact development team for custom chart requirements

## Version

**Current Version**: 1.0.0  
**Last Updated**: November 2025  
**Recharts Version**: 2.15.4

