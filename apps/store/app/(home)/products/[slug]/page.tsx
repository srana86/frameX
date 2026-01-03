import type { Metadata } from "next";
import { headers } from "next/headers";
import ProductDetailsClient from "./ProductDetailsClient";
import { loadMerchantDocument } from "@/lib/merchant-data-loader";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { formatPriceFromConfig } from "@/lib/currency";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

// Helper function to normalize slug
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getProductBySlug(slug: string) {
  try {
    const decodedSlug = decodeURIComponent(slug);
    let d = await loadMerchantDocument<any>("products", { slug: decodedSlug });

    if (!d) {
      const normalizedSlug = normalizeSlug(decodedSlug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedSlug });
    }

    if (!d) {
      d = await loadMerchantDocument<any>("products", { slug: slug });
    }

    if (!d) {
      const normalizedOriginal = normalizeSlug(slug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedOriginal });
    }

    return d;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    const doc = await loadMerchantDocument<any>("brand_config", { id: "brand_config_v1" });
    if (doc) {
      const { _id, ...config } = doc;
      return config as BrandConfig;
    }
  } catch (error) {
    console.error("Error fetching brand config:", error);
  }
  return defaultBrandConfig;
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getAbsoluteUrl(url: string | undefined, metadataBase: URL): string | undefined {
  if (!url || url.trim() === "") return undefined;
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  if (trimmedUrl.startsWith("/")) {
    return new URL(trimmedUrl, metadataBase).toString();
  }
  return new URL(trimmedUrl.startsWith("./") ? trimmedUrl.slice(2) : trimmedUrl, metadataBase).toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [productDoc, brandConfig] = await Promise.all([getProductBySlug(slug), getBrandConfig()]);

  if (!productDoc) return { title: "Product Not Found" };

  const product = {
    name: productDoc.name,
    price: Number(productDoc.price ?? 0),
    discountPercentage: productDoc.discountPercentage !== undefined ? Number(productDoc.discountPercentage) : undefined,
    images: Array.isArray(productDoc.images) ? productDoc.images : [],
    description: productDoc.description ?? "",
  };

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  const finalPrice =
    product.discountPercentage && product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price;

  const formattedPrice = formatPriceFromConfig(finalPrice, brandConfig);
  const title = `${product.name} – ${formattedPrice}`;
  const metaDescription = stripHtmlTags(product.description || "");
  const productImage = product.images && product.images.length > 0 ? getAbsoluteUrl(product.images[0], metadataBase) : undefined;

  return {
    title,
    description: metaDescription,
    openGraph: {
      title,
      description: metaDescription,
      images: productImage ? [{ url: productImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: productImage ? [productImage] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  return <ProductDetailsClient params={params} />;
}
