import { NextFunction, Request, Response } from "express";
import { AIServices } from "./ai.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

const getAIData = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await AIServices.getAIDataFromDB(user.tenantId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "AI Data retrieved successfully",
        data: result,
    });
});

const chatWithAI = catchAsync(async (req: Request, res: Response) => {
    const result = await AIServices.chatWithAI(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "AI Response generated successfully",
        data: result, // result will involve { response: string }
    });
});

export const AIControllers = {
    getAIData,
    chatWithAI,
};
