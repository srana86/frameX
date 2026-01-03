import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InvoiceServices } from "./invoice.service";

const getAllInvoices = catchAsync(async (req, res) => {
  const status = req.query.status as string;
  const merchantId = req.query.merchantId as string;
  const limit = parseInt(req.query.limit as string) || 100;

  const result = await InvoiceServices.getAllInvoices(
    status,
    merchantId,
    limit
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices retrieved successfully",
    data: result,
  });
});

const getInvoiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvoiceServices.getInvoiceById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const createInvoice = catchAsync(async (req, res) => {
  const result = await InvoiceServices.createInvoice(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice created successfully",
    data: result,
  });
});

const updateInvoice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvoiceServices.updateInvoice(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice updated successfully",
    data: result,
  });
});

const deleteInvoice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvoiceServices.deleteInvoice(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice deleted successfully",
    data: result,
  });
});

const sendInvoice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvoiceServices.sendInvoice(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice sent successfully",
    data: result,
  });
});

export const InvoiceControllers = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
};
