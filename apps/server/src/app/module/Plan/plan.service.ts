import { Plan } from "./plan.model";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IPlan } from "./plan.interface";

const getAllPlans = async (activeOnly?: boolean, cycleMonths?: number) => {
  const query: any = {};
  if (activeOnly) {
    query.isActive = true;
  }
  if (cycleMonths) {
    query.billingCycleMonths = cycleMonths;
  }

  const plans = await Plan.find(query).sort({ sortOrder: 1, createdAt: -1 });
  return toPlainObjectArray<IPlan>(plans);
};

const getPlanById = async (id: string) => {
  const plan = await Plan.findOne({ id });
  if (!plan) {
    throw new Error("Plan not found");
  }
  return toPlainObject<IPlan>(plan);
};

const createPlan = async (payload: Partial<IPlan>) => {
  if (!payload.name) {
    throw new Error("Plan name is required");
  }

  const billingCycleMonths = payload.billingCycleMonths || 1;
  const cycleSuffix =
    billingCycleMonths === 1
      ? "monthly"
      : billingCycleMonths === 6
        ? "6month"
        : "yearly";
  const baseId = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const planId = payload.id || `${baseId}_${cycleSuffix}_${Date.now()}`;

  // Check if plan already exists
  const existing = await Plan.findOne({ id: planId });
  if (existing) {
    throw new Error("Plan with this ID already exists");
  }

  const planData: IPlan = {
    id: planId,
    name: payload.name,
    description: payload.description || "",
    price: parseFloat(String(payload.price)) || 0,
    billingCycleMonths,
    featuresList: payload.featuresList || [],
    isActive: payload.isActive !== false,
    isPopular: payload.isPopular || false,
    sortOrder: payload.sortOrder || 0,
    buttonText: payload.buttonText || "Get Started",
    buttonVariant: payload.buttonVariant || "outline",
    iconType: payload.iconType || "star",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const plan = await Plan.create(planData);

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "plan",
    action: "plan_created",
    entityId: plan.id,
    details: {
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      billingCycleMonths: plan.billingCycleMonths,
    },
    createdAt: new Date().toISOString(),
  });

  return toPlainObject<IPlan>(plan);
};

const updatePlan = async (id: string, payload: Partial<IPlan>) => {
  const plan = await Plan.findOne({ id });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.price !== undefined)
    updateData.price = parseFloat(String(payload.price));
  if (payload.billingCycleMonths !== undefined)
    updateData.billingCycleMonths = payload.billingCycleMonths;
  if (payload.featuresList !== undefined)
    updateData.featuresList = payload.featuresList;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;
  if (payload.isPopular !== undefined) updateData.isPopular = payload.isPopular;
  if (payload.sortOrder !== undefined) updateData.sortOrder = payload.sortOrder;
  if (payload.buttonText !== undefined)
    updateData.buttonText = payload.buttonText;
  if (payload.buttonVariant !== undefined)
    updateData.buttonVariant = payload.buttonVariant;
  if (payload.iconType !== undefined) updateData.iconType = payload.iconType;

  const updated = await Plan.findOneAndUpdate(
    { id },
    { $set: updateData },
    { new: true }
  );

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "plan",
    action: "plan_updated",
    entityId: id,
    details: { planId: id, updates: Object.keys(updateData) },
    createdAt: new Date().toISOString(),
  });

  return toPlainObject<IPlan>(updated!);
};

const deletePlan = async (id: string) => {
  const plan = await Plan.findOne({ id });
  if (!plan) {
    throw new Error("Plan not found");
  }

  await Plan.deleteOne({ id });

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "plan",
    action: "plan_deleted",
    entityId: id,
    details: { planId: id },
    createdAt: new Date().toISOString(),
  });

  return { success: true, message: "Plan deleted successfully" };
};

const seedPlans = async () => {
  const existingCount = await Plan.countDocuments({});
  if (existingCount > 0) {
    throw new Error("Plans already exist. Use DELETE first to reset.");
  }

  // Simplified default plans - matching the model structure
  const defaultPlans: Partial<IPlan>[] = [
    {
      id: "starter_monthly",
      name: "Starter",
      description: "Perfect for small businesses getting started",
      price: 29,
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
    },
    {
      id: "professional_monthly",
      name: "Professional",
      description: "For growing businesses with advanced needs",
      price: 79,
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
    },
    {
      id: "enterprise_monthly",
      name: "Enterprise",
      description: "For large businesses with unlimited needs",
      price: 199,
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
    },
  ];

  const now = new Date().toISOString();
  const plansToInsert = defaultPlans.map((plan) => ({
    ...plan,
    createdAt: now,
    updatedAt: now,
  })) as IPlan[];

  await Plan.insertMany(plansToInsert);

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "plan",
    action: "plans_seeded",
    entityId: "system",
    details: {
      count: plansToInsert.length,
      planIds: plansToInsert.map((p) => p.id),
    },
    createdAt: now,
  });

  return {
    success: true,
    message: `Created ${plansToInsert.length} default plans`,
    plans: plansToInsert.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      billingCycleMonths: p.billingCycleMonths,
    })),
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
