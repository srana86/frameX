export interface TVisit {
  id?: string;
  ipAddress: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  visitCount: number;
  ipGeolocation?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    [key: string]: any;
  };
  createdAt?: Date;
  lastVisitedAt?: Date;
}
