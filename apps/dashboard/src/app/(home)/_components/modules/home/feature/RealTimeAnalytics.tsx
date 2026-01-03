"use client";

import React, { useEffect, useState } from "react";

// CSS for smooth up-down animation
const styleSheet = `
  @keyframes smoothBounce {
    0%, 100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.92);
    }
  }
  
  @keyframes growBar {
    from {
      height: 0;
      opacity: 0;
    }
    to {
      opacity: 1;
      height: var(--bar-height);
    }
  }
`;

export function RealTimeAnalytics() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Realistic data with highs and lows: 4, 8, 2, 4, 5, 9, 6 (converted to percentages)
  const chartData = [40, 80, 20, 40, 50, 90, 60];
  const [animatedValues, setAnimatedValues] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);
    // Animate bar chart values with realistic data - shorter delay for mobile
    const timer = setTimeout(() => {
      setAnimatedValues(chartData);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate max value for proper scaling
  const maxValue = Math.max(...chartData);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleSheet }} />
      <div className='w-full h-[320px]  bg-white rounded-lg overflow-hidden relative group/analytics'>
        {/* Compact Analytics Dashboard */}
        <div className='w-full h-full p-1 sm:p-1.5 flex flex-col gap-1 sm:gap-1.5 relative min-h-0'>
          {/* Chart Section - Ultra Compact */}
          <div className='flex-1 bg-linear-to-br from-gray-50 to-white rounded p-1 sm:p-1.5 border border-gray-100 relative overflow-hidden min-h-0 flex flex-col'>
            {/* Animated Bar Chart - Realistic Data */}
            <div className='flex items-end gap-0.5 sm:gap-1 flex-1 min-h-[60px] sm:min-h-24 relative z-10'>
              {animatedValues.map((value, idx) => {
                // Calculate height as percentage of max value
                const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
                // Different animation durations and delays for each bar to create natural variation
                const animationDuration = 2 + idx * 0.3; // 2s to 3.8s
                const animationDelay = idx * 0.15; // Shorter staggered delays for mobile
                const growBarDelay = idx * 0.08 + 0.2; // Faster initial animation for mobile
                return (
                  <div key={idx} className='flex flex-col items-center justify-end gap-0.5 flex-1 group/bar min-w-0 h-full'>
                    <div
                      className='w-full bg-linear-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t shadow-sm hover:shadow-md transition-all duration-500 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 relative overflow-hidden'
                      style={
                        {
                          height: mounted ? `${heightPercent}%` : "0%",
                          minHeight: "8px",
                          transformOrigin: "bottom",
                          "--bar-height": `${heightPercent}%`,
                          animation:
                            isVisible && mounted
                              ? `growBar 0.6s ease-out ${growBarDelay}s both, smoothBounce ${animationDuration}s ease-in-out ${
                                  animationDelay + 0.8
                                }s infinite`
                              : "none",
                        } as React.CSSProperties & { "--bar-height": string }
                      }
                    >
                      {/* Shimmer Effect */}
                      <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/bar:translate-x-full group-hover/bar:transition-transform group-hover/bar:duration-1000' />
                    </div>
                    <div className='text-[6px] sm:text-[7px] text-gray-500 font-medium group-hover/bar:text-blue-600 transition-colors whitespace-nowrap shrink-0'>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
