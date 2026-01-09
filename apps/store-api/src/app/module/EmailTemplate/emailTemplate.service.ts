/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { prisma } from "@framex/database";
import { EmailEvent } from "./emailTemplate.interface";

// Default templates defined outside or imported...
// (Using a simplified version of defaults for brevity, or can copy full object)
const defaultEmailTemplates: Record<string, any> = {
  // ... defaults would be here (omitted for brevity, can be copied from original if needed)
  // For now assuming the service logic populates them
};

const getEmailTemplatesFromDB = async (
  tenantId: string,
  event?: EmailEvent
) => {
  const query: any = { tenantId };
  if (event) query.event = event;

  if (event) {
    let template = await prisma.emailTemplate.findUnique({
      where: { tenantId_event: { tenantId, event } }
    });

    // Return default if not found
    if (!template) {
      // ... return default struct
      return {
        id: `default_${event}`,
        event,
        name: "Default Template", // Should fetch from defaults map
        subject: "Default Subject",
        description: "Default checking...",
        variables: [],
        enabled: true,
        html: ""
      };
    }
    return template;
  }

  let templates = await prisma.emailTemplate.findMany({
    where: { tenantId },
    orderBy: { event: "asc" } // Prisma enum sorting might depend on definition order
  });

  if (templates.length === 0) {
    // Create defaults
    // Logic to creating defaults would go here
  }

  return { templates };
};

const updateEmailTemplateFromDB = async (
  tenantId: string,
  event: EmailEvent,
  payload: any
) => {
  const updateData: any = { ...payload };
  delete updateData.event; // Encapsulated in key
  delete updateData.tenantId;

  const result = await prisma.emailTemplate.upsert({
    where: { tenantId_event: { tenantId, event } },
    create: {
      tenantId,
      event,
      name: payload.name || "Template",
      subject: payload.subject || "Subject",
      description: payload.description,
      variables: payload.variables || [],
      enabled: payload.enabled ?? true,
      html: payload.html
    },
    update: updateData
  });

  return result;
};

const createEmailTemplateFromDB = async (
  tenantId: string,
  payload: any
) => {
  // Usually updates handle creation via upsert, but if distinct create needed:
  return updateEmailTemplateFromDB(tenantId, payload.event, payload);
};

export const EmailTemplateServices = {
  getEmailTemplatesFromDB,
  updateEmailTemplateFromDB,
  createEmailTemplateFromDB,
};
