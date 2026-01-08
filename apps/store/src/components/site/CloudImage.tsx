"use client";

import Image from "next/image";

type CloudImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  crop?: { type: string; source?: boolean };
  priority?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * CloudImage Component
 *
 * Displays images from any URL (Cloudinary, external, or local).
 * Uses next/image for optimized loading.
 *
 * The src should be the full URL stored in the database (e.g., secure_url from Cloudinary).
 * No NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME required.
 */
export default function CloudImage({ src, alt, width, height, fill, sizes, className, priority, loading, fetchPriority }: CloudImageProps) {
  // Handle empty or invalid src
  if (!src) {
    return null;
  }

  const isLocal = src.startsWith("/");

  const srcWithFormat =
    !isLocal && src.includes("res.cloudinary.com")
      ? src.includes("f_auto") || src.includes("f_webp") || src.includes("f_avif")
        ? src
        : src.includes("?")
        ? `${src}&f_auto=webp&q_auto=good`
        : `${src}?f_auto=webp&q_auto=good`
      : src;

  // Use next/image for all images (local, Cloudinary URLs, or any external URL)
  if (fill) {
    return (
      <Image
        src={srcWithFormat}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        loading={loading ?? (priority ? undefined : "lazy")}
        fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
        unoptimized={!isLocal}
      />
    );
  }

  return (
    <Image
      src={srcWithFormat}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      loading={loading ?? (priority ? undefined : "lazy")}
      fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
      unoptimized={!isLocal}
    />
  );
}
