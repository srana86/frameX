"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Loader2,
  FileText,
  Search,
  Sparkles,
  Copy,
  Check,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface AiAssistantClientProps {
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * AI Assistant Client Component
 * AI-powered tools for content generation
 */
export function AiAssistantClient({
  storeId,
  permission,
}: AiAssistantClientProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Product Description State
  const [productInput, setProductInput] = useState({
    name: "",
    category: "",
    features: "",
    tone: "professional",
  });
  const [productDescription, setProductDescription] = useState("");

  // SEO State
  const [seoInput, setSeoInput] = useState({
    pageTitle: "",
    pageType: "product",
    keywords: "",
  });
  const [seoOutput, setSeoOutput] = useState({
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  // Email State
  const [emailInput, setEmailInput] = useState({
    type: "promotion",
    subject: "",
    details: "",
  });
  const [emailOutput, setEmailOutput] = useState("");

  // Permission check
  const canUse = permission === null || permission === "EDIT" || permission === "FULL";

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate product description
  const generateProductDescription = async () => {
    if (!productInput.name) {
      toast.error("Please enter a product name");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("ai/generate-description", productInput);
      setProductDescription((result as any).description || "");
      toast.success("Description generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate description");
      // Mock response for demo
      setProductDescription(
        `Introducing the ${productInput.name} - a premium quality product designed for discerning customers. ` +
        `${productInput.features ? `Key features include: ${productInput.features}. ` : ""}` +
        `Perfect for those who appreciate excellence and value. Order now and experience the difference!`
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate SEO content
  const generateSeoContent = async () => {
    if (!seoInput.pageTitle) {
      toast.error("Please enter a page title");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("ai/generate-seo", seoInput);
      setSeoOutput(result as any);
      toast.success("SEO content generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate SEO content");
      // Mock response for demo
      setSeoOutput({
        metaTitle: `${seoInput.pageTitle} | Best Prices & Quality`,
        metaDescription: `Discover ${seoInput.pageTitle}. ${seoInput.keywords ? `Keywords: ${seoInput.keywords}` : "Shop now for great deals!"}`,
        keywords: seoInput.keywords || `${seoInput.pageTitle}, shop, buy online`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate email content
  const generateEmailContent = async () => {
    if (!emailInput.subject) {
      toast.error("Please enter an email subject");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("ai/generate-email", emailInput);
      setEmailOutput((result as any).content || "");
      toast.success("Email content generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate email content");
      // Mock response for demo
      setEmailOutput(
        `Subject: ${emailInput.subject}\n\n` +
        `Dear Valued Customer,\n\n` +
        `${emailInput.details || "We have an exciting announcement for you!"}\n\n` +
        `Don't miss out on this amazing opportunity. Visit our store today!\n\n` +
        `Best regards,\nYour Store Team`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          AI-powered tools to help you create content faster
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Wand2 className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-purple-800">
              AI-Powered Content Generation
            </p>
            <p className="text-sm text-purple-700">
              Use AI to generate product descriptions, SEO content, and marketing emails.
              Results are suggestions - always review and edit before publishing.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="descriptions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="descriptions">
            <FileText className="h-4 w-4 mr-2" />
            Descriptions
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Zap className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
        </TabsList>

        {/* Product Descriptions Tab */}
        <TabsContent value="descriptions" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Enter details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={productInput.name}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Wireless Bluetooth Headphones"
                    disabled={!canUse}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCategory">Category</Label>
                  <Input
                    id="productCategory"
                    value={productInput.category}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="e.g., Electronics, Audio"
                    disabled={!canUse}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productFeatures">Key Features</Label>
                  <Textarea
                    id="productFeatures"
                    value={productInput.features}
                    onChange={(e) =>
                      setProductInput((prev) => ({ ...prev, features: e.target.value }))
                    }
                    placeholder="e.g., 40-hour battery life, noise cancellation, premium sound"
                    rows={3}
                    disabled={!canUse}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productTone">Tone</Label>
                  <Select
                    value={productInput.tone}
                    onValueChange={(value) =>
                      setProductInput((prev) => ({ ...prev, tone: value }))
                    }
                    disabled={!canUse}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generateProductDescription}
                  disabled={loading || !canUse}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Description
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Description</CardTitle>
                <CardDescription>
                  AI-generated product description
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productDescription ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap">{productDescription}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(productDescription)}
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy to Clipboard
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Generated description will appear here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Information</CardTitle>
                <CardDescription>
                  Enter page details for SEO optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageTitle">Page Title *</Label>
                  <Input
                    id="pageTitle"
                    value={seoInput.pageTitle}
                    onChange={(e) =>
                      setSeoInput((prev) => ({ ...prev, pageTitle: e.target.value }))
                    }
                    placeholder="e.g., Premium Leather Wallet"
                    disabled={!canUse}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageType">Page Type</Label>
                  <Select
                    value={seoInput.pageType}
                    onValueChange={(value) =>
                      setSeoInput((prev) => ({ ...prev, pageType: value }))
                    }
                    disabled={!canUse}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product Page</SelectItem>
                      <SelectItem value="category">Category Page</SelectItem>
                      <SelectItem value="homepage">Homepage</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Target Keywords</Label>
                  <Input
                    id="keywords"
                    value={seoInput.keywords}
                    onChange={(e) =>
                      setSeoInput((prev) => ({ ...prev, keywords: e.target.value }))
                    }
                    placeholder="e.g., leather wallet, men's wallet, gift"
                    disabled={!canUse}
                  />
                </div>
                <Button
                  onClick={generateSeoContent}
                  disabled={loading || !canUse}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Generate SEO Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated SEO Content</CardTitle>
                <CardDescription>
                  Optimized meta tags for your page
                </CardDescription>
              </CardHeader>
              <CardContent>
                {seoOutput.metaTitle ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Meta Title</Label>
                      <div className="rounded-lg border bg-muted/50 p-3">
                        <p>{seoOutput.metaTitle}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <div className="rounded-lg border bg-muted/50 p-3">
                        <p>{seoOutput.metaDescription}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Keywords</Label>
                      <div className="rounded-lg border bg-muted/50 p-3">
                        <p>{seoOutput.keywords}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Generated SEO content will appear here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
                <CardDescription>
                  Describe the email you want to create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select
                    value={emailInput.type}
                    onValueChange={(value) =>
                      setEmailInput((prev) => ({ ...prev, type: value }))
                    }
                    disabled={!canUse}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSubject">Subject *</Label>
                  <Input
                    id="emailSubject"
                    value={emailInput.subject}
                    onChange={(e) =>
                      setEmailInput((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="e.g., 50% Off Everything This Weekend!"
                    disabled={!canUse}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailDetails">Details</Label>
                  <Textarea
                    id="emailDetails"
                    value={emailInput.details}
                    onChange={(e) =>
                      setEmailInput((prev) => ({ ...prev, details: e.target.value }))
                    }
                    placeholder="Describe what you want to communicate..."
                    rows={4}
                    disabled={!canUse}
                  />
                </div>
                <Button
                  onClick={generateEmailContent}
                  disabled={loading || !canUse}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Generate Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Email</CardTitle>
                <CardDescription>
                  AI-generated email content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emailOutput ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <pre className="whitespace-pre-wrap text-sm">{emailOutput}</pre>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(emailOutput)}
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy to Clipboard
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Generated email will appear here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
