import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-helpers";
import CreateOrderClient from "./CreateOrderClient";

export const metadata: Metadata = {
  title: "Create Order · Tenant",
  description: "Create a new order manually.",
};

export default async function CreateOrderPage() {
  await requireAuth("tenant");
  return <CreateOrderClient />;
}
