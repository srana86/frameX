import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProfitAnalysisServices } from "./profitAnalysis.service";

// Get profit analysis
const getProfitAnalysis = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId;
    const { period } = req.query as { period: string };

    const result = await ProfitAnalysisServices.getProfitAnalysisFromDB(tenantId, period);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profit analysis fetched successfully",
        data: result,
    });
});

export const ProfitAnalysisControllers = {
    getProfitAnalysis,
};
