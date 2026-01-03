import { Router } from "express";
import { UserRoutes } from "../module/User/user.route";
import { MerchantRoutes } from "../module/Merchant/merchant.route";
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
import { AuthRoutes } from '../module/Auth/auth.route';
import { MerchantSubscriptionRoutes } from "../module/MerchantSubscription/merchantSubscription.route";

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/merchants",
    route: MerchantRoutes,
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
    path: "/merchant-subscription",
    route: MerchantSubscriptionRoutes,
  },
];

// This will automatically loop your routes that you will add in the moduleRoutes array
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
