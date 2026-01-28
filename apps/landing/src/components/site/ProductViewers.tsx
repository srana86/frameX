"use client";

import { useEffect, useState } from "react";
import { Eye, Users, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api-client";

interface ProductViewersProps {
  productSlug: string;
  stock?: number;
  className?: string;
}

// Psychological messaging based on viewer count and stock
const getPsychologicalMessage = (
  otherViewers: number,
  stock?: number
): { message: string; icon: React.ElementType; urgency: "low" | "medium" | "high" } => {
  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;
  const isVeryLowStock = stock !== undefined && stock > 0 && stock <= 5;

  // High urgency scenarios
  if (isVeryLowStock && otherViewers >= 3) {
    return {
      message: `${otherViewers} people viewing - Only ${stock} left!`,
      icon: Zap,
      urgency: "high",
    };
  }

  if (isLowStock && otherViewers >= 5) {
    return {
      message: `${otherViewers} people viewing - ${stock} left in stock`,
      icon: TrendingUp,
      urgency: "high",
    };
  }

  // Medium urgency - popular item
  if (otherViewers >= 5) {
    return {
      message: `${otherViewers} people viewing this right now`,
      icon: TrendingUp,
      urgency: "medium",
    };
  }

  if (otherViewers >= 3) {
    return {
      message: `${otherViewers} people viewing with you`,
      icon: Users,
      urgency: "medium",
    };
  }

  // Low urgency - just social proof
  if (otherViewers === 2) {
    return {
      message: "2 people viewing with you",
      icon: Eye,
      urgency: "low",
    };
  }

  return {
    message: "1 person viewing with you",
    icon: Eye,
    urgency: "low",
  };
};

export function ProductViewers({ productSlug, stock, className }: ProductViewersProps) {
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Register as viewer and get initial count
  useEffect(() => {
    if (!productSlug) return;

    let mounted = true;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const registerViewer = async () => {
      try {
        const data = await apiRequest<{ sessionId: string; count: number }>("/product-viewers", {
          method: "POST",
          body: JSON.stringify({
            slug: productSlug,
            sessionId,
          }),
        });

        if (!mounted) return;

        if (data) {
          setSessionId(data.sessionId);
          setViewerCount(data.count);
          setIsVisible(data.count > 0);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error("Failed to register viewer:", error);
      }
    };

    // Initial registration
    registerViewer();

    // Heartbeat - keep viewer active (every 20 seconds)
    heartbeatInterval = setInterval(() => {
      if (sessionId && mounted) {
        registerViewer();
      }
    }, 20000);

    // Poll for updates (every 4 seconds for more real-time feel)
    pollInterval = setInterval(async () => {
      if (!mounted || !productSlug) return;

      try {
        const data = await apiRequest<{ count: number }>(`/product-viewers?slug=${encodeURIComponent(productSlug)}`, {
          method: "GET",
        });

        if (mounted && data) {
          setViewerCount(data.count);
          setIsVisible(data.count > 0);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error("Failed to poll viewer count:", error);
      }
    }, 4000);

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (pollInterval) clearInterval(pollInterval);

      // Remove viewer when leaving page
      if (sessionId && productSlug) {
        apiRequest("/product-viewers", {
          method: "DELETE",
          body: JSON.stringify({
            slug: productSlug,
            sessionId,
          }),
        }).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [productSlug, sessionId]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but keep viewer registered
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Only show if there are other viewers (excluding yourself)
  if (!isVisible || viewerCount === null || viewerCount <= 1) {
    return null;
  }

  const otherViewers = viewerCount - 1;
  const { message, icon: Icon, urgency } = getPsychologicalMessage(otherViewers, stock);

  // Dynamic styling based on urgency
  const urgencyStyles = {
    high: "text-red-600 dark:text-red-400 font-medium",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-muted-foreground",
  };

  const iconStyles = {
    high: "text-red-500 animate-pulse",
    medium: "text-amber-500",
    low: "opacity-60",
  };

  return (
    <div
      className={cn("flex items-center gap-1.5 text-[10px] sm:text-xs transition-all duration-300", urgencyStyles[urgency], className)}
      title={`Live viewer count - Updated just now`}
    >
      <Icon className={cn("w-3 h-3 shrink-0", iconStyles[urgency])} />
      <span className='whitespace-nowrap'>{message}</span>
    </div>
  );
}

export default ProductViewers;
