"use client";

import { useEffect, useState } from "react";
import Snowfall from "react-snowfall";
export default function SnowfallEffect() {
  const [isVisible, setIsVisible] = useState(false);
  const [isWinterSeason, setIsWinterSeason] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Winter season: December 1st to February 28th
    const isWinter = currentMonth >= 11 || (currentMonth <= 1 && currentDay <= 28);
    setIsWinterSeason(isWinter);

    // Enable snowfall for winter season or development
    setIsVisible(isWinter || process.env.NODE_ENV === "development");
  }, []);

  // Toggle function for development/testing
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "s") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <Snowfall
        color='#ffffff'
        snowflakeCount={isWinterSeason ? 300 : 150}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 1,
        }}
        radius={[0.5, 3.0]}
        speed={[0.5, 4.0]}
        wind={[-1.0, 1.0]}
      />
    </>
  );
}
