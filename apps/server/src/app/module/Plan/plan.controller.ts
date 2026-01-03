import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PlanServices } from "./plan.service";

const getAllPlans = catchAsync(async (req, res) => {
  const activeOnly = req.query.active === "true";
  const cycleMonths = req.query.cycle
    ? parseInt(req.query.cycle as string)
    : undefined;
  const result = await PlanServices.getAllPlans(activeOnly, cycleMonths);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plans retrieved successfully",
    data: result,
  });
});

const getPlanById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.getPlanById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan retrieved successfully",
    data: result,
  });
});

const createPlan = catchAsync(async (req, res) => {
  const result = await PlanServices.createPlan(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Plan created successfully",
    data: result,
  });
});

const updatePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.updatePlan(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan updated successfully",
    data: result,
  });
});

const deletePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PlanServices.deletePlan(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan deleted successfully",
    data: result,
  });
});

const seedPlans = catchAsync(async (req, res) => {
  const result = await PlanServices.seedPlans();
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Plans seeded successfully",
    data: result,
  });
});

export const PlanControllers = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  seedPlans,
};
