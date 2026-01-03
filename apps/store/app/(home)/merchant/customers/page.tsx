import type { Metadata } from "next";
import { CustomersClient } from "./CustomersClient";

export const metadata: Metadata = {
  title: "Admin · Customers",
  description: "View and manage customer information.",
};

export default function CustomersPage() {
  return (
    <div className='mx-auto w-full'>
      <CustomersClient />
    </div>
  );
}
