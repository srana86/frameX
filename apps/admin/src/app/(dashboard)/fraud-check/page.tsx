import { Metadata } from "next";
import { FraudCheckClient } from "./FraudCheckClient";

export const metadata: Metadata = {
  title: "Fraud Check | Super Admin",
  description: "Check customer fraud risk using courier delivery history",
};

export default function FraudCheckPage() {
  return <FraudCheckClient />;
}
