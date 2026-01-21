import type { Metadata } from "next";
import { InventoryClient } from "./InventoryClient";

export const metadata: Metadata = {
  title: "Admin · Inventory Management",
  description: "Manage product inventory and stock levels.",
};

export default function InventoryPage() {
  return <InventoryClient />;
}

