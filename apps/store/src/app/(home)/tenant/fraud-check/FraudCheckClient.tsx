"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Shield,
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Truck,
  Activity,
  Info,
  BarChart3,
  PieChart,
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import type { CustomerFraudData, UsageStats, OnecodesoftFraudCheckResponse } from "@/lib/fraud-check/fraudshield-api";
import { transformOnecodesoftResponse } from "@/lib/fraud-check/fraudshield-api";
import { getRiskBadgeColor, calculateRiskLevel, type FraudRiskLevel } from "@/lib/fraud-check/common";
import { apiRequest } from "@/lib/api-client";

// New API response structure
interface CourierDataItem {
  name: string;
  logo: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

interface CourierHistory {
  courier: string;
  total: number;
  successful: number;
  failed: number;
  success_rate?: number;
  logo?: string;
}

interface NewAPIResponse {
  status: string;
  courierData: {
    [key: string]:
    | CourierDataItem
    | {
      total_parcel: number;
      success_parcel: number;
      cancelled_parcel: number;
      success_ratio: number;
    };
    summary: {
      total_parcel: number;
      success_parcel: number;
      cancelled_parcel: number;
      success_ratio: number;
    };
  };
  reports: any[];
}

// Get risk badge style
const getRiskBadge = (risk: FraudRiskLevel) => {
  const baseClass = getRiskBadgeColor(risk);
  const icons = {
    low: <CheckCircle2 className='size-3' />,
    medium: <AlertTriangle className='size-3' />,
    high: <XCircle className='size-3' />,
    unknown: <Info className='size-3' />,
  };

  return (
    <Badge className={`${baseClass} flex items-center gap-1`}>
      {icons[risk]}
      <span className='capitalize'>{risk} Risk</span>
    </Badge>
  );
};

// Courier History Item Component
function CourierHistoryItem({ courier, index }: { courier: CourierHistory; index: number }) {
  const [imageError, setImageError] = useState(false);
  const successRate = courier.total > 0 ? Math.round((courier.successful / courier.total) * 100) : 0;
  const risk = calculateRiskLevel(successRate);

  // Get progress bar color based on success rate
  const getProgressColor = () => {
    if (successRate >= 90) return "bg-green-500";
    if (successRate >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className='border rounded-lg p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center max-w-44 rounded-lg overflow-hidden'>
            {courier.logo && !imageError ? (
              <img
                src={courier.logo}
                alt={courier.courier}
                className='w-full h-full object-contain p-1.5'
                onError={() => setImageError(true)}
              />
            ) : (
              <Truck className='size-6 text-primary' />
            )}
          </div>
          <div>
            <h3 className='font-semibold text-lg'>{courier.courier}</h3>
            <p className='text-sm text-muted-foreground'>{courier.total} total parcels</p>
          </div>
        </div>
        {getRiskBadge(risk)}
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <div>
          <p className='text-sm text-muted-foreground mb-1'>Successful</p>
          <p className='text-xl font-bold text-green-600'>{courier.successful}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground mb-1'>Failed</p>
          <p className='text-xl font-bold text-red-600'>{courier.failed}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground mb-1'>Success Rate</p>
          <p className='text-xl font-bold text-blue-600'>{successRate}%</p>
        </div>
      </div>

      <div className='relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
        <div className={`h-full transition-all duration-500 ${getProgressColor()}`} style={{ width: `${successRate}%` }} />
      </div>
    </div>
  );
}

// Transform new API response to CustomerFraudData format
function transformAPIResponse(phone: string, response: NewAPIResponse): CustomerFraudData {
  const summary = response.courierData.summary;
  const successRate = summary.success_ratio;

  // Calculate risk level based on success rate
  const fraud_risk: FraudRiskLevel = successRate >= 90 ? "low" : successRate >= 70 ? "medium" : "high";

  // Transform courier data to courier_history format
  const courier_history = Object.entries(response.courierData)
    .filter(([key]) => key !== "summary")
    .map(([key, data]) => {
      // Type guard to check if it's a CourierDataItem
      if ("name" in data && "logo" in data) {
        return {
          courier: data.name,
          total: data.total_parcel,
          successful: data.success_parcel,
          failed: data.cancelled_parcel,
          success_rate: data.success_ratio,
          logo: data.logo, // Preserve logo for display
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.total > 0); // Only include couriers with parcels

  return {
    phone,
    total_parcels: summary.total_parcel,
    successful_deliveries: summary.success_parcel,
    failed_deliveries: summary.cancelled_parcel,
    success_rate: successRate,
    fraud_risk,
    courier_history,
  };
}

// Demo data for preview
const DEMO_DATA: CustomerFraudData = {
  phone: "01712345678",
  total_parcels: 87,
  successful_deliveries: 79,
  failed_deliveries: 8,
  success_rate: 90.8,
  fraud_risk: "low",
  last_delivery: "2025-11-20",
  courier_history: [
    {
      courier: "Steadfast",
      total: 35,
      successful: 33,
      failed: 2,
    },
    {
      courier: "Pathao",
      total: 28,
      successful: 26,
      failed: 2,
    },
    {
      courier: "RedX",
      total: 15,
      successful: 12,
      failed: 3,
    },
    {
      courier: "Paperfly",
      total: 9,
      successful: 8,
      failed: 1,
    },
  ],
};

const DEMO_USAGE_STATS: UsageStats = {
  today_usage: 142,
  monthly_usage: 3847,
  daily_limit: 1000,
  remaining_today: 858,
  subscription: {
    plan_name: "Professional",
    expires_at: "2025-12-24T00:00:00Z",
    days_remaining: 30,
  },
};

export function FraudCheckClient() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerFraudData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load usage stats on mount
  const loadUsageStats = async () => {
    try {
      const data = await apiRequest<any>("GET", "/tenant/fraud-check");

      if (data.success && data.data) {
        setUsageStats(data.data);
      }
    } catch (err) {
      console.error("Failed to load usage stats:", err);
    }
  };

  // Check customer fraud data
  const handleCheck = async () => {
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setLoading(true);
    setError(null);
    setCustomerData(null);

    try {
      const data = await apiRequest<any>("POST", "/tenant/fraud-check", { phone: phone.trim() });
      console.log(data);

      // Handle Onecodesoft API response structure (from super-admin)
      if (data.success && data.data) {
        // Check if it's the new Onecodesoft format
        if (data.data.total_parcel !== undefined && data.data.response !== undefined) {
          // Transform Onecodesoft response to CustomerFraudData format
          const transformedData = transformOnecodesoftResponse(data.data as OnecodesoftFraudCheckResponse);
          setCustomerData(transformedData);
        } else if (data.data.total_parcels !== undefined) {
          // Already in CustomerFraudData format (backward compatibility)
          setCustomerData(data.data as CustomerFraudData);
        }

        toast.success("Customer data retrieved successfully");
        // Refresh usage stats
        loadUsageStats();
      } else if (data.status === "success" && data.courierData) {
        // Handle old legacy API response structure (backward compatibility)
        const transformedData = transformAPIResponse(phone.trim(), data as NewAPIResponse);
        setCustomerData(transformedData);
        toast.success("Customer data retrieved successfully");
        // Refresh usage stats
        loadUsageStats();
      } else {
        setError(data.message || "Failed to retrieve customer data");
        toast.error(data.message || "Failed to check customer");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Failed to check customer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  // Load demo data
  const loadDemoData = () => {
    setCustomerData(DEMO_DATA);
    setUsageStats(DEMO_USAGE_STATS);
    setPhone(DEMO_DATA.phone);
    setError(null);
    setIsDemoMode(true);
    toast.success("Demo data loaded successfully! This is sample data for preview.");
  };

  // Clear demo mode when checking real data
  const handleCheckWithClearDemo = () => {
    setIsDemoMode(false);
    handleCheck();
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className='space-y-6 mt-4'>
      {/* Header */}
      <div>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <Shield className='size-6 text-primary' />
              <h1 className='text-3xl font-bold'>Fraud Check</h1>
              {isDemoMode && (
                <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                  <Activity className='size-3 mr-1' />
                  Demo Mode
                </Badge>
              )}
            </div>
            <p className='text-muted-foreground'>
              Check customer fraud risk by analyzing their courier delivery history across multiple services.
            </p>
          </div>
          <Button onClick={loadDemoData} variant='outline' size='lg' className='gap-2'>
            <Activity className='size-4' />
            Load Demo Data
          </Button>
        </div>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Check Customer</CardTitle>
          <CardDescription>Enter a Bangladeshi phone number to check fraud risk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <Input
              placeholder='01712345678'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className='flex-1'
            />
            <Button onClick={handleCheckWithClearDemo} disabled={loading}>
              {loading ? (
                <>
                  <Activity className='size-4 mr-2 animate-spin' />
                  Checking...
                </>
              ) : (
                <>
                  <Search className='size-4 mr-2' />
                  Check
                </>
              )}
            </Button>
          </div>

          {/* Demo mode indicator */}
          {isDemoMode && (
            <Alert className='mt-3 border-blue-200 bg-blue-50/50'>
              <Info className='size-4 text-blue-600' />
              <AlertDescription className='text-blue-900'>
                You&apos;re viewing demo data. Enter a real phone number and click &quot;Check&quot; to see actual customer data.
              </AlertDescription>
            </Alert>
          )}

          {/* Load stats button */}
          {!usageStats && !isDemoMode && (
            <Button onClick={loadUsageStats} variant='outline' size='sm' className='mt-3'>
              <Activity className='size-3 mr-2' />
              Load Usage Stats
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <XCircle className='size-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Customer Data Display */}
      {customerData && (
        <div className='space-y-4'>
          {/* Risk Level Gauge */}
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-2xl'>Risk Assessment Score</CardTitle>
                  <CardDescription className='mt-2'>Based on delivery success rate</CardDescription>
                </div>
                {getRiskBadge(customerData.fraud_risk)}
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col md:flex-row items-center gap-8'>
                {/* Radial Progress */}
                <div className='relative w-64 h-64'>
                  <svg className='w-full h-full transform -rotate-90' viewBox='0 0 200 200'>
                    {/* Background circle */}
                    <circle
                      cx='100'
                      cy='100'
                      r='80'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='20'
                      className='text-gray-200 dark:text-gray-700'
                    />
                    {/* Progress circle */}
                    <circle
                      cx='100'
                      cy='100'
                      r='80'
                      fill='none'
                      stroke={customerData.success_rate >= 90 ? "#22c55e" : customerData.success_rate >= 70 ? "#eab308" : "#ef4444"}
                      strokeWidth='20'
                      strokeDasharray={`${(customerData.success_rate / 100) * 502.65} 502.65`}
                      strokeLinecap='round'
                      className='transition-all duration-1000 ease-out'
                    />
                  </svg>
                  <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <div className='text-5xl font-bold'>{customerData.success_rate}%</div>
                    <div className='text-sm text-muted-foreground mt-2'>Success Rate</div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className='flex-1 space-y-4'>
                  <div className='grid grid-cols-1 gap-4'>
                    {/* Low Risk */}
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${customerData.success_rate >= 90
                          ? "border-green-500 bg-green-50 dark:bg-green-950/50"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-900/50 opacity-50"
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        <CheckCircle2 className={`size-6 ${customerData.success_rate >= 90 ? "text-green-600" : "text-gray-400"}`} />
                        <div>
                          <div className='font-semibold'>Low Risk (90-100%)</div>
                          <div className='text-sm text-muted-foreground'>Excellent delivery record</div>
                        </div>
                      </div>
                    </div>

                    {/* Medium Risk */}
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${customerData.success_rate >= 70 && customerData.success_rate < 90
                          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-900/50 opacity-50"
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        <AlertTriangle
                          className={`size-6 ${customerData.success_rate >= 70 && customerData.success_rate < 90 ? "text-yellow-600" : "text-gray-400"
                            }`}
                        />
                        <div>
                          <div className='font-semibold'>Medium Risk (70-89%)</div>
                          <div className='text-sm text-muted-foreground'>Moderate delivery record</div>
                        </div>
                      </div>
                    </div>

                    {/* High Risk */}
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${customerData.success_rate < 70
                          ? "border-red-500 bg-red-50 dark:bg-red-950/50"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-900/50 opacity-50"
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        <XCircle className={`size-6 ${customerData.success_rate < 70 ? "text-red-600" : "text-gray-400"}`} />
                        <div>
                          <div className='font-semibold'>High Risk (&lt;70%)</div>
                          <div className='text-sm text-muted-foreground'>Poor delivery record</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-xl'>Customer Overview</CardTitle>
                  <CardDescription className='mt-1'>{customerData.phone}</CardDescription>
                </div>
                {getRiskBadge(customerData.fraud_risk)}
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                {/* Total Parcels */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Package className='size-4' />
                    <span className='text-sm'>Total Parcels</span>
                  </div>
                  <p className='text-3xl font-bold'>{customerData.total_parcels}</p>
                </div>

                {/* Successful Deliveries */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-green-600'>
                    <CheckCircle2 className='size-4' />
                    <span className='text-sm'>Successful</span>
                  </div>
                  <p className='text-3xl font-bold text-green-600'>{customerData.successful_deliveries}</p>
                </div>

                {/* Failed Deliveries */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-red-600'>
                    <XCircle className='size-4' />
                    <span className='text-sm'>Failed</span>
                  </div>
                  <p className='text-3xl font-bold text-red-600'>{customerData.failed_deliveries}</p>
                </div>

                {/* Success Rate */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-blue-600'>
                    <TrendingUp className='size-4' />
                    <span className='text-sm'>Success Rate</span>
                  </div>
                  <div className='flex items-baseline gap-1'>
                    <p className='text-3xl font-bold text-blue-600'>{customerData.success_rate}%</p>
                  </div>
                  <div className='relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ${customerData.success_rate >= 90 ? "bg-green-500" : customerData.success_rate >= 70 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      style={{ width: `${customerData.success_rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Last Delivery */}
              {customerData.last_delivery && (
                <>
                  <Separator className='my-4' />
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Calendar className='size-4' />
                    <span>Last delivery: {formatDate(customerData.last_delivery)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Courier History */}
          {customerData.courier_history && customerData.courier_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Truck className='size-5' />
                  Courier History
                </CardTitle>
                <CardDescription>Delivery statistics across different courier services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {customerData.courier_history.map((courier, index) => (
                    <CourierHistoryItem key={index} courier={courier as CourierHistory} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
