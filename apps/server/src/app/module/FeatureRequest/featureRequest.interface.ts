export type FeatureRequestStatus = "new" | "in_review" | "resolved";
export type FeatureRequestPriority = "low" | "medium" | "high";

export interface IFeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: FeatureRequestPriority;
  contactEmail?: string;
  contactPhone?: string;
  merchantId: string;
  status: FeatureRequestStatus;
  createdAt: string;
}
