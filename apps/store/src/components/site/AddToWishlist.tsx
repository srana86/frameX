"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/providers/wishlist-provider";
import type { Product } from "@/lib/types";

interface AddToWishlistProps {
  product: Product;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AddToWishlist({ product, variant = "ghost", size = "icon", className }: AddToWishlistProps) {
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (inWishlist) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={`relative overflow-hidden transition-all duration-300 ${
        inWishlist
          ? "bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-400 dark:hover:border-red-700 hover:scale-105 shadow-md hover:shadow-lg"
          : "border-2 border-border hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-950/10 hover:scale-105"
      } ${isAnimating ? "scale-110" : ""} ${className || ""} rounded-full`}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {/* Subtle glow effect when active */}
      {inWishlist && <div className='absolute inset-0 bg-red-200/20 dark:bg-red-800/10 rounded-full animate-pulse' />}

      {/* Ripple effect on click */}
      {isAnimating && (
        <div
          className={`absolute inset-0 rounded-full ${
            inWishlist ? "bg-red-200/40 dark:bg-red-800/20" : "bg-red-100/40 dark:bg-red-900/20"
          }`}
          style={{
            animation: "ripple 0.6s ease-out",
          }}
        />
      )}

      <Heart
        className={`relative z-10 transition-all duration-300 ${
          inWishlist
            ? "w-5 h-5 fill-red-500 text-red-500 scale-110"
            : "w-5 h-5 text-muted-foreground hover:text-red-400 dark:hover:text-red-500"
        } ${isAnimating ? "scale-125" : ""}`}
      />
    </Button>
  );
}
