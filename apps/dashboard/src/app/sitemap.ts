import type { MetadataRoute } from "next";

const siteUrl = "https://www.framextech.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    {
      path: "",
      priority: 1.0,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/about-us",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/contact-us",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/privacy-policy",
      priority: 0.5,
      changeFrequency: "yearly" as const,
    },
    {
      path: "/terms-of-service",
      priority: 0.5,
      changeFrequency: "yearly" as const,
    },
    // Add more routes as they are created
    // "/pricing",
    // "/features",
    // "/blog",
  ];

  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
