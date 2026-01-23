import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { ConfigControllers } from "./config.controller";

const router = express.Router();

// Brand Config - routes registered at /brand-config
router.get("/", tenantMiddleware, ConfigControllers.getBrandConfig);
router.put("/", auth("admin", "tenant", "owner"), ConfigControllers.updateBrandConfig);

export const BrandConfigRoutes = router;

// Delivery Config routes
const deliveryRouter = express.Router();
deliveryRouter.get("/", tenantMiddleware, ConfigControllers.getDeliveryConfig);
deliveryRouter.put(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.updateDeliveryConfig
);
export const DeliveryConfigRoutes = deliveryRouter;

// SSLCommerz Config routes
const sslcommerzRouter = express.Router();
sslcommerzRouter.get(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.getSSLCommerzConfig
);
sslcommerzRouter.put(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.updateSSLCommerzConfig
);
export const SSLCommerzConfigRoutes = sslcommerzRouter;

// OAuth Config routes
const oauthRouter = express.Router();
oauthRouter.get("/", tenantMiddleware, ConfigControllers.getOAuthConfig);
oauthRouter.put(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.updateOAuthConfig
);
export const OAuthConfigRoutes = oauthRouter;

// Ads Config routes
const adsRouter = express.Router();
adsRouter.get("/", tenantMiddleware, ConfigControllers.getAdsConfig);
adsRouter.put(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.updateAdsConfig
);
export const AdsConfigRoutes = adsRouter;

// Delivery Support routes (combined delivery config + courier services)
const deliverySupportRouter = express.Router();
deliverySupportRouter.get("/", tenantMiddleware, ConfigControllers.getDeliverySupportConfig);
deliverySupportRouter.put(
  "/",
  auth("admin", "tenant", "owner"),
  ConfigControllers.updateDeliverySupportConfig
);
export const DeliverySupportRoutes = deliverySupportRouter;
