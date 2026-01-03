import { Metadata } from "next";
import EditCouponClient from "./EditCouponClient";

export const metadata: Metadata = {
  title: "Edit Coupon · Admin",
  description: "Edit discount coupon",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: PageProps) {
  const { id } = await params;
  return <EditCouponClient couponId={id} />;
}

