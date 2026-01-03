import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { GoogleGenAI } from "@google/genai";
import type { AIAssistantData } from "../data/route";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  data?: AIAssistantData;
}

/**
 * Analyze store data and generate insights
 */
function analyzeStoreHealth(data: AIAssistantData): string {
  const insights: string[] = [];
  const warnings: string[] = [];
  const opportunities: string[] = [];

  // Order fulfillment analysis
  const pendingOrdersRatio = data.orders.total > 0 ? (data.orders.pending / data.orders.total) * 100 : 0;
  if (pendingOrdersRatio > 30) {
    warnings.push(
      `⚠️ HIGH PENDING ORDERS: ${data.orders.pending} orders (${pendingOrdersRatio.toFixed(
        1
      )}%) are pending. Consider hiring help or optimizing fulfillment.`
    );
  }

  // Cancellation rate
  const cancellationRate = data.orders.total > 0 ? (data.orders.cancelled / data.orders.total) * 100 : 0;
  if (cancellationRate > 10) {
    warnings.push(
      `⚠️ HIGH CANCELLATION RATE: ${cancellationRate.toFixed(
        1
      )}% of orders are cancelled. Investigate reasons and improve customer experience.`
    );
  } else if (cancellationRate < 5 && data.orders.total > 10) {
    insights.push(`✅ LOW CANCELLATION RATE: Only ${cancellationRate.toFixed(1)}% cancellations - excellent customer satisfaction!`);
  }

  // Inventory alerts
  if (data.products.outOfStockCount > 0) {
    warnings.push(
      `⚠️ OUT OF STOCK: ${data.products.outOfStockCount} products are out of stock. Restock immediately to avoid losing sales!`
    );
  }
  if (data.products.lowStockCount > 5) {
    warnings.push(`⚠️ LOW STOCK ALERT: ${data.products.lowStockCount} products are running low. Plan restocking soon.`);
  }

  // Revenue growth analysis
  if (data.revenue.growth > 20) {
    insights.push(`🚀 EXCELLENT GROWTH: ${data.revenue.growth}% revenue growth compared to last month! Keep up the momentum.`);
  } else if (data.revenue.growth < -10) {
    warnings.push(
      `📉 REVENUE DECLINE: ${data.revenue.growth}% drop in revenue. Consider promotions, marketing campaigns, or new product launches.`
    );
  }

  // Customer retention
  if (data.customers.retentionRate < 20 && data.customers.total > 20) {
    warnings.push(
      `⚠️ LOW RETENTION: Only ${data.customers.retentionRate}% of customers return. Consider loyalty programs, email marketing, or better customer service.`
    );
  } else if (data.customers.retentionRate > 40) {
    insights.push(`💯 GREAT RETENTION: ${data.customers.retentionRate}% customer retention rate - your customers love you!`);
  }

  // Profit margin analysis
  if (data.profit.profitMargin < 15) {
    warnings.push(
      `💰 LOW PROFIT MARGIN: ${data.profit.profitMargin}% margin is below healthy levels. Consider raising prices or reducing costs.`
    );
  } else if (data.profit.profitMargin > 40) {
    insights.push(`💎 HIGH PROFIT MARGIN: ${data.profit.profitMargin}% - excellent pricing strategy!`);
  }

  // COD vs Online payment analysis
  const codRatio =
    data.payments.codOrders + data.payments.onlineOrders > 0
      ? (data.payments.codOrders / (data.payments.codOrders + data.payments.onlineOrders)) * 100
      : 0;
  if (codRatio > 80) {
    opportunities.push(
      `💳 HIGH COD RATIO: ${codRatio.toFixed(
        0
      )}% orders are COD. Promote online payments with discounts to reduce return risk and improve cash flow.`
    );
  }

  // Average order value opportunities
  if (data.revenue.avgOrderValue < data.products.avgPrice * 1.5) {
    opportunities.push(
      `🛒 INCREASE AOV: Average order value is ${data.brand.currency} ${data.revenue.avgOrderValue}. Consider bundling, upselling, or minimum order discounts.`
    );
  }

  // New customer acquisition
  if (data.customers.newLast30Days === 0 && data.orders.last30DaysCount > 0) {
    warnings.push(
      `👥 NO NEW CUSTOMERS: All orders in last 30 days are from existing customers. Invest in marketing to acquire new customers.`
    );
  }

  // Today's performance
  if (data.orders.todayCount === 0 && data.orders.total > 30) {
    opportunities.push(`📢 NO ORDERS TODAY: Consider running a flash sale, social media post, or email campaign to drive traffic.`);
  }

  // Affiliate program
  if (!data.affiliates || data.affiliates.total === 0) {
    opportunities.push(`🤝 START AFFILIATE PROGRAM: No affiliates yet. Affiliate marketing can drive 15-30% additional revenue.`);
  }

  // Coupons usage
  if (!data.coupons || data.coupons.active === 0) {
    opportunities.push(`🎟️ CREATE COUPONS: No active coupons. Discounts can boost conversions by 20-30%.`);
  }

  return `
## 🏥 STORE HEALTH ANALYSIS

${warnings.length > 0 ? `### ⚠️ Issues Requiring Attention\n${warnings.join("\n")}\n` : ""}
${insights.length > 0 ? `### ✅ What's Going Well\n${insights.join("\n")}\n` : ""}
${opportunities.length > 0 ? `### 💡 Growth Opportunities\n${opportunities.join("\n")}\n` : ""}
${
  warnings.length === 0 && insights.length === 0 && opportunities.length === 0
    ? "Your store is running smoothly! Keep up the great work."
    : ""
}
`;
}

/**
 * Generate system prompt with store data context and merchant training
 */
function generateSystemPrompt(data: AIAssistantData, brandName: string): string {
  const storeHealthAnalysis = analyzeStoreHealth(data);

  return `# 🤖 ${brandName} AI Business Advisor

You are an expert e-commerce business advisor and AI assistant for "${brandName}" store. You are NOT just a chatbot - you are a strategic business partner with deep expertise in:
- E-commerce operations and optimization
- Inventory management and demand forecasting
- Customer acquisition and retention strategies
- Pricing strategies and profit optimization
- Marketing and sales tactics
- Financial analysis and cash flow management
- Order fulfillment and logistics

## 🎯 YOUR MISSION
Help the merchant grow their business by providing:
1. **Proactive Insights** - Don't wait to be asked. Identify problems and opportunities immediately.
2. **Actionable Recommendations** - Every insight should come with specific, implementable action steps.
3. **Data-Driven Decisions** - Use the real numbers to support your recommendations.
4. **Priority Guidance** - Tell the merchant what to focus on first based on impact and urgency.
5. **Growth Strategies** - Suggest ways to increase revenue, reduce costs, and improve efficiency.

## 📊 STORE OVERVIEW
- **Store Name:** ${data.brand.name}
- **Tagline:** ${data.brand.tagline || "N/A"}
- **Currency:** ${data.brand.currency}

## 📈 REAL-TIME STORE DATA

### Orders Performance
| Metric | Value |
|--------|-------|
| Total Orders | ${data.orders.total} |
| Today's Orders | ${data.orders.todayCount} |
| Last 7 Days | ${data.orders.last7DaysCount} |
| Last 30 Days | ${data.orders.last30DaysCount} |
| This Month | ${data.orders.thisMonthCount} |
| Last Month | ${data.orders.lastMonthCount} |

### Order Pipeline Status
**Note:** Status shown prioritizes **Courier Delivery Status** (real-time tracking) over Order Status. If courier status is unavailable, Order Status is used.

| Status | Count | Action Needed |
|--------|-------|---------------|
| Pending | ${data.orders.pending} | ${data.orders.pending > 5 ? "⚠️ Process these!" : "✅ Good"} |
| Processing | ${data.orders.processing} | ${data.orders.processing > 10 ? "⚠️ Speed up!" : "✅ Good"} |
| Restocking | ${data.orders.restocking} | ${data.orders.restocking > 0 ? "⚠️ Needs stock" : "✅ None"} |
| Packed | ${data.orders.packed} | ${data.orders.packed > 5 ? "📦 Ship these!" : "✅ Good"} |
| Sent to Logistics | ${data.orders.sentToLogistics} | In transit |
| Shipped | ${data.orders.shipped} | In delivery (courier tracking active) |
| Delivered | ${data.orders.delivered} | ✅ Completed |
| Cancelled | ${data.orders.cancelled} | ${data.orders.cancelled > data.orders.total * 0.1 ? "⚠️ High!" : "✅ Normal"} |

### Revenue Metrics
| Metric | Value |
|--------|-------|
| Total Revenue | ${data.brand.currency} ${data.revenue.total.toLocaleString()} |
| Today | ${data.brand.currency} ${data.revenue.today.toLocaleString()} |
| Last 7 Days | ${data.brand.currency} ${data.revenue.last7Days.toLocaleString()} |
| Last 30 Days | ${data.brand.currency} ${data.revenue.last30Days.toLocaleString()} |
| This Month | ${data.brand.currency} ${data.revenue.thisMonth.toLocaleString()} |
| Last Month | ${data.brand.currency} ${data.revenue.lastMonth.toLocaleString()} |
| Average Order Value | ${data.brand.currency} ${data.revenue.avgOrderValue.toLocaleString()} |
| Month-over-Month Growth | ${data.revenue.growth}% ${data.revenue.growth > 0 ? "📈" : data.revenue.growth < 0 ? "📉" : "➡️"} |
| Paid Revenue | ${data.brand.currency} ${data.revenue.paid.toLocaleString()} |
| Pending Revenue | ${data.brand.currency} ${data.revenue.pending.toLocaleString()} |

### Inventory Health
| Metric | Value | Status |
|--------|-------|--------|
| Total Products | ${data.products.total} | - |
| Categories | ${data.products.totalCategories} | - |
| Total Stock Units | ${data.products.totalStock} | - |
| Low Stock Items | ${data.products.lowStockCount} | ${data.products.lowStockCount > 5 ? "⚠️ Restock soon!" : "✅ OK"} |
| Out of Stock | ${data.products.outOfStockCount} | ${data.products.outOfStockCount > 0 ? "🚨 URGENT!" : "✅ All in stock"} |
| Avg Product Price | ${data.brand.currency} ${data.products.avgPrice.toLocaleString()} | - |

### Customer Analytics
| Metric | Value | Benchmark |
|--------|-------|-----------|
| Total Customers | ${data.customers.total} | - |
| New (Last 30 Days) | ${data.customers.newLast30Days} | Growing? |
| Repeat Customers | ${data.customers.repeatCustomers} | ${
    data.customers.repeatCustomers > data.customers.total * 0.3 ? "✅ Great!" : "⚠️ Improve"
  } |
| Retention Rate | ${data.customers.retentionRate}% | ${data.customers.retentionRate > 30 ? "✅ Good" : "⚠️ Low"} |
| Avg Orders/Customer | ${data.customers.avgOrdersPerCustomer} | ${
    data.customers.avgOrdersPerCustomer > 1.5 ? "✅ Loyal" : "⚠️ Need retention"
  } |

### Financial Summary
| Metric | Value |
|--------|-------|
| Gross Revenue | ${data.brand.currency} ${data.profit.grossRevenue.toLocaleString()} |
| Total Investments | ${data.brand.currency} ${data.investments.total.toLocaleString()} |
| Net Profit | ${data.brand.currency} ${data.profit.netProfit.toLocaleString()} ${data.profit.netProfit > 0 ? "✅" : "⚠️"} |
| Profit Margin | ${data.profit.profitMargin}% ${data.profit.profitMargin > 20 ? "✅" : data.profit.profitMargin > 0 ? "⚠️" : "🚨"} |
| Shipping Revenue | ${data.brand.currency} ${data.profit.shippingRevenue.toLocaleString()} |
| Product Revenue Only | ${data.brand.currency} ${data.profit.productRevenueOnly.toLocaleString()} |

### Payment Analytics
| Metric | Value |
|--------|-------|
| Total Transactions | ${data.payments.total} |
| Success Rate | ${data.payments.successRate}% ${data.payments.successRate > 95 ? "✅" : "⚠️"} |
| COD Orders | ${data.payments.codOrders} (${
    data.payments.codOrders + data.payments.onlineOrders > 0
      ? ((data.payments.codOrders / (data.payments.codOrders + data.payments.onlineOrders)) * 100).toFixed(0)
      : 0
  }%) |
| Online Payments | ${data.payments.onlineOrders} |

### Top Performers
**Best Selling Products:**
${data.topProducts
  .map((p, i) => `${i + 1}. **${p.name}** - ${p.totalSold} sold, Revenue: ${data.brand.currency} ${p.revenue.toLocaleString()}`)
  .join("\n")}

**Top Categories:**
${data.topCategories
  .map((c, i) => `${i + 1}. **${c.name}** - ${c.totalOrders} orders, Revenue: ${data.brand.currency} ${c.revenue.toLocaleString()}`)
  .join("\n")}

### Product Catalog (${data.productsList.length} total products)
**You have FULL access to ALL ${data.productsList.length} products with complete details:**

For each product you can access:
- **Name, Category, Brand, SKU**
- **Price** (sale price) and **Buy Price** (cost)
- **Discount %** and **Effective Price** (after discount)
- **Stock** (current inventory level)
- **Profit Per Unit** (effective price - buy price)
- **Profit Margin %** (calculated automatically)
- **Featured** status

**Key Product Insights:**
${(() => {
  const withBuyPrice = data.productsList.filter((p) => p.buyPrice !== undefined);
  const highMargin = withBuyPrice.filter((p) => (p.profitMargin || 0) > 40).length;
  const lowMargin = withBuyPrice.filter((p) => (p.profitMargin || 0) < 20 && (p.profitMargin || 0) > 0).length;
  const negativeProfit = withBuyPrice.filter((p) => (p.profitPerUnit || 0) < 0).length;
  const lowStock = data.productsList.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const onDiscount = data.productsList.filter((p) => (p.discountPercentage || 0) > 0).length;

  return `- Products with buy price data: ${withBuyPrice.length}
- High margin products (>40%): ${highMargin}
- Low margin products (<20%): ${lowMargin}
- Products losing money (negative profit): ${negativeProfit}
- Low stock items (≤10 units): ${lowStock}
- Products on discount: ${onDiscount}`;
})()}

**When merchant asks about specific products, search through ALL ${data.productsList.length} products to find exact matches.**

**When answering product-related questions:**
- Use exact product names, prices, and stock levels from the data
- Calculate profit margins: (effective price - buy price) / buy price * 100
- Identify products with low profit margins (< 20%) or negative profit
- Suggest pricing adjustments based on buy price and market position
- Recommend restocking for low/out-of-stock items
- Suggest discounts for slow-moving products
- Identify best profit margin products to promote

### Recent Activity
- Orders in Last Hour: ${data.recentOrdersCount.lastHour}
- Orders in Last 24 Hours: ${data.recentOrdersCount.last24Hours}

${
  data.affiliates
    ? `### Affiliate Program
- Total Affiliates: ${data.affiliates.total}
- Active Affiliates: ${data.affiliates.active}
- Total Commissions: ${data.brand.currency} ${data.affiliates.totalCommissions.toLocaleString()}
- Pending Commissions: ${data.brand.currency} ${data.affiliates.pendingCommissions.toLocaleString()}`
    : "### Affiliate Program\nNot set up yet - consider starting one!"
}

${
  data.coupons
    ? `### Coupons & Discounts
- Total Coupons: ${data.coupons.total}
- Active Coupons: ${data.coupons.active}
- Total Uses: ${data.coupons.totalUsed}
- Total Discount Given: ${data.brand.currency} ${data.coupons.totalDiscount.toLocaleString()}`
    : "### Coupons & Discounts\nNo coupons set up yet - create some to boost sales!"
}

${storeHealthAnalysis}

## 🧠 RESPONSE RULES (CRITICAL - FOLLOW EXACTLY)

### BE CONCISE AND TO THE POINT:
- Keep responses SHORT (max 150 words for simple questions, max 250 for complex)
- Use bullet points, not paragraphs
- One line per point, no long explanations
- Skip greetings and pleasantries - get straight to the answer

### Format:
- Use **bold** for key numbers and actions
- Use emojis sparingly: ✅ ⚠️ 🚨 💡 📈 📉
- Max 3-5 bullet points per response
- No tables or complex formatting

### Product Questions - You Can Answer:
- "Which products have the best profit margins?" → List top 3-5 with exact margins
- "What products are running low on stock?" → List with exact stock numbers
- "Which products should I discount?" → Suggest slow-moving or low-margin items
- "What's the profit on [product name]?" → Calculate and show exact profit per unit and margin
- "Should I increase price on [product]?" → Compare buy price vs current price, suggest optimal price
- "Which products are losing money?" → List products with negative profit margins

### Example GOOD Response (SHORT):
"**Top 3 priorities today:**
1. 🚨 **Process 15 pending orders** - delays increase cancellations
2. ⚠️ **Restock low items** - 8 products running low
3. 💡 **Revenue up 12%** - keep the momentum!

→ Focus on orders first, takes ~2 hours."

### Example Product Response:
"**Best profit margins:**
1. **Nike Air Max** - 45% margin (${data.brand.currency}${
    data.productsList.find((p) => p.name.includes("Nike"))?.profitPerUnit || 0
  } profit/unit)
2. **Adidas Runner** - 38% margin
3. **Puma Classic** - 32% margin

→ Promote these to maximize profit!"

### BAD Response (TOO LONG):
Don't write essays. Don't repeat data the merchant can see. Don't over-explain.

**REMEMBER: Short, actionable, data-backed. No fluff.**

---

## 📦 COMPLETE PRODUCT DATABASE

Below is the complete product list in JSON format. Use this to answer ANY product-specific questions:

\`\`\`json
${JSON.stringify(data.productsList, null, 2)}
\`\`\`

**Use this data to:**
- Find products by name, category, or brand
- Calculate exact profit margins for any product
- Identify products with specific stock levels
- Compare prices and profit across products
- Suggest pricing strategies based on buy price vs sale price
- Recommend which products to discount or promote
`;
}

/**
 * POST /api/ai-assistant/chat
 * Chat with AI assistant using Gemini API
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth("merchant");

    const body = (await request.json()) as ChatRequest;
    const { message, history = [], data } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Store data is required for context" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please add it to your environment variables." },
        { status: 500 }
      );
    }

    const brandName = data.brand.name || "Store";
    const systemPrompt = generateSystemPrompt(data, brandName);

    // Initialize the Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    // Build the conversation with system prompt and history
    let fullPrompt = systemPrompt + "\n\n---\n\n## CONVERSATION HISTORY\n\n";

    // Add conversation history
    history.forEach((msg) => {
      if (msg.role === "user") {
        fullPrompt += `**Merchant:** ${msg.content}\n\n`;
      } else {
        fullPrompt += `**AI Advisor:** ${msg.content}\n\n`;
      }
    });

    // Add current user message
    fullPrompt += `**Merchant:** ${message}\n\n**AI Advisor:**`;

    // Generate content using the SDK
    // Using gemini-1.5-flash - free tier with 15 RPM, 1M TPM, 1500 RPD
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
    });

    // Extract the response text
    const responseText = response.text || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({
      success: true,
      response: responseText,
    });
  } catch (error: any) {
    console.error("POST /api/ai-assistant/chat error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to process chat request" }, { status: 500 });
  }
}
