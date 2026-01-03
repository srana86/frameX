import { Metadata } from "next";
import CouponFormClient from "./CouponFormClient";

export const metadata: Metadata = {
  title: "Create Coupon · Admin",
  description: "Create a new discount coupon",
};

export default function NewCouponPage() {
  return <CouponFormClient />;
}

