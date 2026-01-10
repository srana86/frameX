import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { ConfigControllers } from "./config.controller";

const router = express.Router();

// Brand Config - routes registered at /brand-config
router.get("/", tenantMiddleware, ConfigControllers.getBrandConfig);
router.put("/", auth("admin", "merchant"), ConfigControllers.updateBrandConfig);

export const BrandConfigRoutes = router;

// Delivery Config routes
const deliveryRouter = express.Router();
deliveryRouter.get("/", tenantMiddleware, ConfigControllers.getDeliveryConfig);
deliveryRouter.put(
  "/",
  auth("admin", "merchant"),
  ConfigControllers.updateDeliveryConfig
);
export const DeliveryConfigRoutes = deliveryRouter;

// SSLCommerz Config routes
const sslcommerzRouter = express.Router();
sslcommerzRouter.get(
  "/",
  auth("admin", "merchant"),
  ConfigControllers.getSSLCommerzConfig
);
sslcommerzRouter.put(
  "/",
  auth("admin", "merchant"),
  ConfigControllers.updateSSLCommerzConfig
);
export const SSLCommerzConfigRoutes = sslcommerzRouter;

// OAuth Config routes
const oauthRouter = express.Router();
oauthRouter.get("/", tenantMiddleware, ConfigControllers.getOAuthConfig);
oauthRouter.put(
  "/",
  auth("admin", "merchant"),
  ConfigControllers.updateOAuthConfig
);
export const OAuthConfigRoutes = oauthRouter;

// Ads Config routes
const adsRouter = express.Router();
adsRouter.get("/", tenantMiddleware, ConfigControllers.getAdsConfig);
adsRouter.put(
  "/",
  auth("admin", "merchant"),
  ConfigControllers.updateAdsConfig
);
export const AdsConfigRoutes = adsRouter;
