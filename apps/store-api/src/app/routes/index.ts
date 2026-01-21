import { Router } from "express";
import { UserRoutes } from "../module/User/user.route";
// NOTE: AuthRoutes removed - BetterAuth handles /api/auth/* routes
import { ProductRoutes } from "../module/Product/product.route";
import { OrderRoutes } from "../module/Order/order.route";
import { CouponRoutes } from "../module/Coupon/coupon.route";
import { PaymentRoutes } from "../module/Payment/payment.route";
import { InventoryRoutes } from "../module/Inventory/inventory.route";
import { CustomerRoutes } from "../module/Customer/customer.route";
import { HeroSlideRoutes } from "../module/Content/HeroSlide/heroSlide.route";
import { PageRoutes } from "../module/Content/Page/page.route";
import { StatisticsRoutes } from "../module/Statistics/statistics.route";
import { SubscriptionRoutes } from "../module/Subscription/subscription.route";
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
import { TenantRoutes } from "../module/Tenant/tenant.route";
import { StorefrontRoutes } from "../module/Storefront/storefront.route";
import { ReviewRoutes } from "../module/Review/review.route";
import { EmailTemplateRoutes } from "../module/EmailTemplate/emailTemplate.route";
import { EmailProviderRoutes } from "../module/EmailTemplate/emailProvider.route";
import { AIRoutes } from "../module/AI/ai.route";
import { AssetRoutes } from "../module/Asset/asset.route";

const router = Router();

const moduleRoutes = [
  // NOTE: Auth routes are now handled by BetterAuth at /api/auth/*
  {
    path: "/users",
    route: UserRoutes,
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
    path: "/payment",
    route: PaymentRoutes,
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
    route: SubscriptionRoutes,
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
    route: TenantRoutes,
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
