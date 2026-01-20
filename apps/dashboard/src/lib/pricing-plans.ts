export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycleMonths: number;
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "gradient";
  iconType?: "star" | "grid" | "sparkles";
}

const COMMON_FEATURES = [
  "Complete E-Commerce Store",
  "Unlimited Products",
  "Product & Inventory Management",
  "Order Management System",
  "Payment Gateway Integration",
  "Facebook Pixel Tracking",
  "Instagram & TikTok Conversion API",
  "Advanced Analytics & Reporting",
  "Custom Domain Support",
  "Brand Customization (Logo, SEO, Theme & More)",
  "Mobile Responsive Design",
  "Email Support",
];

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "plan-1month",
    name: "1 Month Plan",
    description: "Perfect for trying out your online store. Pay monthly with full flexibility.",
    price: 500,
    billingCycleMonths: 1,
    featuresList: COMMON_FEATURES,
    buttonText: "Get Started",
    buttonVariant: "outline",
    iconType: "star",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "plan-3month",
    name: "3 Months Plan",
    description: "Save more with 3 months. Great value for growing your business.",
    price: 1300,
    billingCycleMonths: 3,
    featuresList: COMMON_FEATURES,
    buttonText: "Choose 3 Months",
    buttonVariant: "outline",
    iconType: "grid",
    isActive: true,
    isPopular: true,
    sortOrder: 2,
  },
  {
    id: "plan-6month",
    name: "6 Months Plan",
    description: "Best value for long-term growth. Maximum savings with 6 months commitment.",
    price: 2500,
    billingCycleMonths: 6,
    featuresList: COMMON_FEATURES,
    buttonText: "Choose 6 Months",
    buttonVariant: "gradient",
    isPopular: false,
    iconType: "sparkles",
    isActive: true,
    sortOrder: 3,
  },
];
