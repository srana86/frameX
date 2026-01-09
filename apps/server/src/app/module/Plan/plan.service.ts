import { prisma, Prisma, BillingCycle, Decimal } from "@framex/database";

export type IPlan = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  price: number;
  billingCycle: BillingCycle;
  billingCycleMonths: number;
  features?: Record<string, any> | null;
  featuresList: string[];
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  buttonText: string;
  buttonVariant: string;
  iconType: string;
  createdAt: Date;
  updatedAt: Date;
};

const getAllPlans = async (activeOnly?: boolean, cycleMonths?: number) => {
  const where: any = {};
  if (activeOnly) {
    where.isActive = true;
  }
  if (cycleMonths) {
    where.billingCycleMonths = cycleMonths;
  }

  return prisma.subscriptionPlan.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
};

const getPlanById = async (id: string) => {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan;
};

const createPlan = async (payload: Partial<IPlan>) => {
  if (!payload.name) {
    throw new Error("Plan name is required");
  }

  const billingCycleMonths = payload.billingCycleMonths || 1;
  const billingCycle: BillingCycle =
    billingCycleMonths === 1 ? "MONTHLY" :
      billingCycleMonths === 6 ? "SEMI_ANNUAL" : "YEARLY";

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: payload.name,
      description: payload.description || null,
      basePrice: new Decimal(payload.basePrice || payload.price || 0),
      price: new Decimal(payload.price || 0),
      billingCycle,
      billingCycleMonths,
      features: payload.features ?? Prisma.JsonNull,
      featuresList: payload.featuresList || [],
      isActive: payload.isActive !== false,
      isPopular: payload.isPopular || false,
      sortOrder: payload.sortOrder || 0,
      buttonText: payload.buttonText || "Get Started",
      buttonVariant: payload.buttonVariant || "outline",
      iconType: payload.iconType || "star",
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "plan_created",
      resource: "plan",
      resourceId: plan.id,
      details: {
        planId: plan.id,
        planName: plan.name,
        price: Number(plan.price),
        billingCycleMonths: plan.billingCycleMonths,
      },
    },
  });

  return plan;
};

const updatePlan = async (id: string, payload: Partial<IPlan>) => {
  const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Plan not found");
  }

  const updateData: any = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.price !== undefined) updateData.price = new Decimal(payload.price);
  if (payload.basePrice !== undefined) updateData.basePrice = new Decimal(payload.basePrice);
  if (payload.billingCycleMonths !== undefined) {
    updateData.billingCycleMonths = payload.billingCycleMonths;
    updateData.billingCycle =
      payload.billingCycleMonths === 1 ? "MONTHLY" :
        payload.billingCycleMonths === 6 ? "SEMI_ANNUAL" : "YEARLY";
  }
  if (payload.featuresList !== undefined) updateData.featuresList = payload.featuresList;
  if (payload.features !== undefined) updateData.features = payload.features;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;
  if (payload.isPopular !== undefined) updateData.isPopular = payload.isPopular;
  if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;
  if (payload.buttonText !== undefined) updateData.buttonText = payload.buttonText;
  if (payload.buttonVariant !== undefined) updateData.buttonVariant = payload.buttonVariant;
  if (payload.iconType !== undefined) updateData.iconType = payload.iconType;

  const updated = await prisma.subscriptionPlan.update({
    where: { id },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      action: "plan_updated",
      resource: "plan",
      resourceId: id,
      details: { planId: id, updates: Object.keys(updateData) },
    },
  });

  return updated;
};

const deletePlan = async (id: string) => {
  await prisma.subscriptionPlan.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: "plan_deleted",
      resource: "plan",
      resourceId: id,
      details: { planId: id },
    },
  });

  return { success: true, message: "Plan deleted successfully" };
};

const seedPlans = async () => {
  const existingCount = await prisma.subscriptionPlan.count();
  if (existingCount > 0) {
    throw new Error("Plans already exist. Use DELETE first to reset.");
  }

  const defaultPlans = [
    {
      name: "Starter",
      description: "Perfect for small businesses getting started",
      basePrice: new Decimal(29),
      price: new Decimal(29),
      billingCycle: "MONTHLY" as BillingCycle,
      billingCycleMonths: 1,
      featuresList: [
        "Up to 50 products",
        "5GB storage",
        "Basic analytics",
        "Email support",
        "1 payment gateway",
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      buttonText: "Get Started",
      buttonVariant: "outline",
      iconType: "star",
    },
    {
      name: "Professional",
      description: "For growing businesses with advanced needs",
      basePrice: new Decimal(79),
      price: new Decimal(79),
      billingCycle: "MONTHLY" as BillingCycle,
      billingCycleMonths: 1,
      featuresList: [
        "Up to 500 products",
        "50GB storage",
        "Custom domain",
        "Advanced analytics",
        "Priority support",
        "5 team members",
        "API access",
      ],
      isActive: true,
      isPopular: true,
      sortOrder: 2,
      buttonText: "Get Started",
      buttonVariant: "gradient",
      iconType: "grid",
    },
    {
      name: "Enterprise",
      description: "For large businesses with unlimited needs",
      basePrice: new Decimal(199),
      price: new Decimal(199),
      billingCycle: "MONTHLY" as BillingCycle,
      billingCycleMonths: 1,
      featuresList: [
        "Unlimited products",
        "500GB storage",
        "Custom domain",
        "Remove branding",
        "Advanced analytics",
        "Unlimited team members",
        "Full API access",
        "24/7 priority support",
        "Dedicated success manager",
      ],
      isActive: true,
      isPopular: false,
      sortOrder: 3,
      buttonText: "Contact Sales",
      buttonVariant: "outline",
      iconType: "sparkles",
    },
  ];

  await prisma.subscriptionPlan.createMany({
    data: defaultPlans,
  });

  await prisma.activityLog.create({
    data: {
      action: "plans_seeded",
      resource: "plan",
      resourceId: "system",
      details: { count: defaultPlans.length },
    },
  });

  return {
    success: true,
    message: `Created ${defaultPlans.length} default plans`,
  };
};

export const PlanServices = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  seedPlans,
};
