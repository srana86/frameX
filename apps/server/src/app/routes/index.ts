import { Router } from "express";

// Platform/Admin modules (from original server)
import { UserRoutes } from "../module/User/user.route";
import { TenantRoutes } from "../module/Tenant/tenant.route";
import { SubscriptionRoutes } from "../module/Subscription/subscription.route";
import { PlanRoutes } from "../module/Plan/plan.route";
import { PaymentRoutes } from "../module/Payment/payment.route";
import { CheckoutRoutes } from "../module/Checkout/checkout.route";
import { AnalyticsRoutes } from "../module/Analytics/analytics.route";
import { SalesRoutes } from "../module/Sales/sales.route";
import { DeploymentRoutes } from "../module/Deployment/deployment.route";
import { DatabaseRoutes } from "../module/Database/database.route";
import { InvoiceRoutes } from "../module/Invoice/invoice.route";
import { ActivityLogRoutes } from "../module/ActivityLog/activityLog.route";
import { FeatureRequestRoutes } from "../module/FeatureRequest/featureRequest.route";
import { SettingsRoutes } from "../module/Settings/settings.route";
import { SystemHealthRoutes } from "../module/SystemHealth/systemHealth.route";
import { FraudCheckRoutes } from "../module/FraudCheck/fraudCheck.route";
import { CloudinaryRoutes } from "../module/Cloudinary/cloudinary.route";
import { SimulateRoutes } from "../module/Simulate/simulate.route";
import { AuthRoutes } from "../module/Auth/auth.route";
import { TenantSubscriptionRoutes } from "../module/TenantSubscription/tenantSubscription.route";
import { OwnerRoutes } from "../module/Owner/owner.route";
import { StaffRoutes } from "../module/Staff/staff.route";
import { StoreAccessRoutes } from "../module/StoreAccess/storeAccess.route";

// Store modules (from store-server)
import { ProductRoutes } from "../module/Product/product.route";
import { OrderRoutes } from "../module/Order/order.route";
import { CouponRoutes } from "../module/Coupon/coupon.route";
import { InventoryRoutes } from "../module/Inventory/inventory.route";
import { CustomerRoutes } from "../module/Customer/customer.route";
import { HeroSlideRoutes } from "../module/Content/HeroSlide/heroSlide.route";
import { PageRoutes } from "../module/Content/Page/page.route";
import { StatisticsRoutes } from "../module/Statistics/statistics.route";
import {
  BrandConfigRoutes,
  DeliveryConfigRoutes,
  SSLCommerzConfigRoutes,
  OAuthConfigRoutes,
  AdsConfigRoutes,
} from "../module/Config/config.route";
import { PromotionalBannerRoutes } from "../module/Content/PromotionalBanner/promotionalBanner.route";
import { NotificationRoutes } from "../module/Notification/notification.route";
import { UploadRoutes } from "../module/Other/upload.route";
import { OtherRoutes } from "../module/Other/other.route";
import { DeliveryRoutes } from "../module/Delivery/delivery.route";
import { PathaoRoutes } from "../module/Delivery/pathao.route";
import { TrackingRoutes } from "../module/Tracking/tracking.route";
import { SuperAdminRoutes } from "../module/SuperAdmin/superAdmin.route";
import { VisitsRoutes } from "../module/Visits/visits.route";
import { ProductViewersRoutes } from "../module/ProductViewers/productViewers.route";
import { CronRoutes } from "../module/Cron/cron.route";
import { AffiliateRoutes } from "../module/Affiliate/affiliate.route";
import { BlockedCustomerRoutes } from "../module/BlockedCustomer/blockedCustomer.route";
import { BudgetRoutes } from "../module/Budget/budget.route";
import { InvestmentRoutes } from "../module/Investment/investment.route";
import { StorefrontRoutes } from "../module/Storefront/storefront.route";
import { ReviewRoutes } from "../module/Review/review.route";
import { EmailTemplateRoutes } from "../module/EmailTemplate/emailTemplate.route";
import { EmailProviderRoutes } from "../module/EmailTemplate/emailProvider.route";
import { AIRoutes } from "../module/AI/ai.route";
import { AssetRoutes } from "../module/Asset/asset.route";

// Store-specific versions of conflicting modules
import { PaymentRoutes as StorePaymentRoutes } from "../module/StorePayment/payment.route";
import { UserRoutes as StoreUserRoutes } from "../module/StoreUser/user.route";
import { TenantRoutes as StoreTenantRoutes } from "../module/StoreTenant/tenant.route";
import { SubscriptionRoutes as StoreSubscriptionRoutes } from "../module/StoreSubscription/subscription.route";

const router = Router();

const moduleRoutes = [
  // ==================== PLATFORM/ADMIN ROUTES ====================
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/tenants",
    route: TenantRoutes,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/checkout",
    route: CheckoutRoutes,
  },
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/sales",
    route: SalesRoutes,
  },
  {
    path: "/deployments",
    route: DeploymentRoutes,
  },
  {
    path: "/databases",
    route: DatabaseRoutes,
  },
  {
    path: "/invoices",
    route: InvoiceRoutes,
  },
  {
    path: "/activity-logs",
    route: ActivityLogRoutes,
  },
  {
    path: "/feature-requests",
    route: FeatureRequestRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/system-health",
    route: SystemHealthRoutes,
  },
  {
    path: "/fraud-check",
    route: FraudCheckRoutes,
  },
  {
    path: "/cloudinary",
    route: CloudinaryRoutes,
  },
  {
    path: "/simulate",
    route: SimulateRoutes,
  },
  {
    path: "/tenant-subscription",
    route: TenantSubscriptionRoutes,
  },
  {
    path: "/owner",
    route: OwnerRoutes,
  },
  {
    path: "/owner/staff",
    route: StaffRoutes,
  },
  {
    path: "/store-access",
    route: StoreAccessRoutes,
  },

  // ==================== STORE ROUTES (tenant-scoped) ====================
  {
    path: "/store/users",
    route: StoreUserRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/store/payment",
    route: StorePaymentRoutes,
  },
  {
    path: "/inventory",
    route: InventoryRoutes,
  },
  {
    path: "/customers",
    route: CustomerRoutes,
  },
  {
    path: "/hero-slides",
    route: HeroSlideRoutes,
  },
  {
    path: "/pages",
    route: PageRoutes,
  },
  {
    path: "/statistics",
    route: StatisticsRoutes,
  },
  {
    path: "/subscription",
    route: StoreSubscriptionRoutes,
  },
  {
    path: "/brand-config",
    route: BrandConfigRoutes,
  },
  {
    path: "/delivery-config",
    route: DeliveryConfigRoutes,
  },
  {
    path: "/sslcommerz-config",
    route: SSLCommerzConfigRoutes,
  },
  {
    path: "/oauth-config",
    route: OAuthConfigRoutes,
  },
  {
    path: "/ads-config",
    route: AdsConfigRoutes,
  },
  {
    path: "/promotional-banner",
    route: PromotionalBannerRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/env",
    route: OtherRoutes,
  },
  {
    path: "/geolocation",
    route: OtherRoutes,
  },
  {
    path: "/socket",
    route: OtherRoutes,
  },
  {
    path: "/delivery",
    route: DeliveryRoutes,
  },
  {
    path: "/pathao",
    route: PathaoRoutes,
  },
  {
    path: "/fb-events",
    route: TrackingRoutes,
  },
  {
    path: "/tracking",
    route: TrackingRoutes,
  },
  {
    path: "/super-admin",
    route: SuperAdminRoutes,
  },
  {
    path: "/visits",
    route: VisitsRoutes,
  },
  {
    path: "/product-viewers",
    route: ProductViewersRoutes,
  },
  {
    path: "/cron",
    route: CronRoutes,
  },
  {
    path: "/affiliate",
    route: AffiliateRoutes,
  },
  {
    path: "/blocked-customers",
    route: BlockedCustomerRoutes,
  },
  {
    path: "/budgets",
    route: BudgetRoutes,
  },
  {
    path: "/investments",
    route: InvestmentRoutes,
  },
  {
    path: "/tenant",
    route: StoreTenantRoutes,
  },
  {
    path: "/storefront",
    route: StorefrontRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/email-templates",
    route: EmailTemplateRoutes,
  },
  {
    path: "/email-providers",
    route: EmailProviderRoutes,
  },
  {
    path: "/ai-assistant",
    route: AIRoutes,
  },
  {
    path: "/assets",
    route: AssetRoutes,
  },
];

// This will automatically loop your routes that you will add in the moduleRoutes array
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
