"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, Users } from "lucide-react";

interface PsychologicalTriggersProps {
  productSlug: string;
  productName: string;
  stock?: number;
  price: number;
  discountPercentage?: number;
  finalPrice: number;
}

export function PsychologicalTriggers({
  productSlug,
  productName,
  stock,
  price,
  discountPercentage,
  finalPrice,
}: PsychologicalTriggersProps) {
  const [recentPurchases, setRecentPurchases] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Simulate recent purchases (in real app, fetch from API)
  useEffect(() => {
    const baseCount = Math.floor(Math.random() * 20) + 5;
    setRecentPurchases(baseCount);

    const interval = setInterval(() => {
      setRecentPurchases((prev) => {
        if (Math.random() > 0.7) {
          return prev + Math.floor(Math.random() * 3) + 1;
        }
        return prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for urgency (24 hours from now)
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const endTime = now + 24 * 60 * 60 * 1000;
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining("");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, []);

  const isLowStock = stock !== undefined && stock > 0 && stock <= 10;
  const isVeryLowStock = stock !== undefined && stock > 0 && stock <= 5;
  const hasDiscount = discountPercentage && discountPercentage > 0;

  return (
    <div className='space-y-1.5'>
      {/* Recent Purchases - Subtle */}
      {recentPurchases > 0 && (
        <div className='flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground'>
          <TrendingUp className='w-3 h-3 opacity-60' />
          <span>{recentPurchases}+ bought in last 24h</span>
        </div>
      )}

      {/* Urgency Timer - Subtle */}
      {hasDiscount && timeRemaining && (
        <div className='flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground'>
          <Clock className='w-3 h-3 opacity-60' />
          <span>Sale ends in {timeRemaining}</span>
        </div>
      )}

      {/* Scarcity - Subtle */}
      {isVeryLowStock && (
        <div className='flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400'>
          <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
          <span>Only {stock} left</span>
        </div>
      )}

      {isLowStock && !isVeryLowStock && (
        <div className='flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground'>
          <span className='w-1.5 h-1.5 rounded-full bg-amber-400' />
          <span>{stock} in stock</span>
        </div>
      )}

      {/* Popular Item - Subtle */}
      {recentPurchases >= 15 && !isLowStock && (
        <div className='flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground'>
          <Users className='w-3 h-3 opacity-60' />
          <span>Popular choice</span>
        </div>
      )}
    </div>
  );
}

export default PsychologicalTriggers;
