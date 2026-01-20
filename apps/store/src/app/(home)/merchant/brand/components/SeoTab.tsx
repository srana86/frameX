"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import CloudImage from "@/components/site/CloudImage";

export function SeoTab() {
    const { config, updateConfig, setConfig } = useBrandConfig();

    return (
        <>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>SEO & Meta Tags</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Configure your site's SEO settings for better search engine visibility
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='metaTitleDefault' className='text-xs sm:text-sm font-semibold'>
                            Default Title *
                        </Label>
                        <Input
                            id='metaTitleDefault'
                            value={config.meta.title.default}
                            onChange={(e) => updateConfig(["meta", "title", "default"], e.target.value)}
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>The default page title for your site</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='metaTitleTemplate' className='text-xs sm:text-sm font-semibold'>
                            Title Template *
                        </Label>
                        <Input
                            id='metaTitleTemplate'
                            value={config.meta.title.template}
                            onChange={(e) => updateConfig(["meta", "title", "template"], e.target.value)}
                            placeholder='%s – Your Brand'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Use %s as a placeholder for page-specific titles</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='metaDescription' className='text-xs sm:text-sm font-semibold'>
                            Description *
                        </Label>
                        <Textarea
                            id='metaDescription'
                            value={config.meta.description}
                            onChange={(e) => updateConfig(["meta", "description"], e.target.value)}
                            rows={3}
                            className='text-sm sm:text-base min-h-[80px]'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>
                            Meta description shown in search results (recommended: 150-160 characters)
                        </p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='metaKeywords' className='text-xs sm:text-sm font-semibold'>
                            Keywords (comma-separated)
                        </Label>
                        <Input
                            id='metaKeywords'
                            value={config.meta.keywords.join(", ")}
                            onChange={(e) =>
                                updateConfig(
                                    ["meta", "keywords"],
                                    e.target.value
                                        .split(",")
                                        .map((k) => k.trim())
                                        .filter(Boolean)
                                )
                            }
                            placeholder='shoes, sneakers, footwear'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Relevant keywords for your site (separated by commas)</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='metadataBase' className='text-xs sm:text-sm font-semibold'>
                            Metadata Base URL *
                        </Label>
                        <Input
                            id='metadataBase'
                            value={config.meta.metadataBase}
                            onChange={(e) => updateConfig(["meta", "metadataBase"], e.target.value)}
                            placeholder='https://yourdomain.com'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>The base URL for all metadata links</p>
                    </div>
                </CardContent>
            </Card>

            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Social Share Image</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Image used when sharing your site on social media (Open Graph & Twitter)
                    </CardDescription>
                </CardHeader>
                <CardContent className='px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6'>
                    <ImageUpload
                        value={config.meta?.socialShareImage || ""}
                        onChange={(url) => {
                            if (!config) return;
                            setConfig(prevConfig => {
                                const newConfig = { ...prevConfig };
                                newConfig.meta = {
                                    ...newConfig.meta,
                                    socialShareImage: url,
                                    openGraph: {
                                        ...newConfig.meta.openGraph,
                                        image: url,
                                    },
                                    twitter: {
                                        ...newConfig.meta.twitter,
                                        image: url,
                                    },
                                };
                                return newConfig;
                            });
                        }}
                        label='Social Share Image'
                        folder='brand'
                        placeholder='https://example.com/social-share.png'
                    />
                    <div className='rounded-lg border bg-muted/30 p-4'>
                        <p className='text-xs text-muted-foreground'>
                            <strong>Recommended:</strong> 1200x630px (1.91:1 aspect ratio) for optimal display on social platforms
                        </p>
                    </div>
                    {config.meta.socialShareImage && (
                        <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6'>
                            <Label className='text-sm font-semibold mb-4 block'>Preview</Label>
                            <div className='relative w-full aspect-[1.91/1] max-w-2xl rounded-xl overflow-hidden border-2 shadow-lg bg-background'>
                                <CloudImage src={config.meta.socialShareImage} alt='Social Share Image' fill className='object-cover' />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Open Graph Settings */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Open Graph Settings</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Configure how your site appears when shared on Facebook, LinkedIn, and other platforms
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='ogTitle' className='text-xs sm:text-sm font-semibold'>
                            OG Title
                        </Label>
                        <Input
                            id='ogTitle'
                            value={config.meta.openGraph?.title || ""}
                            onChange={(e) => updateConfig(["meta", "openGraph", "title"], e.target.value)}
                            placeholder='Your Brand – Tagline'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Title shown when shared on social media</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='ogDescription' className='text-xs sm:text-sm font-semibold'>
                            OG Description
                        </Label>
                        <Textarea
                            id='ogDescription'
                            value={config.meta.openGraph?.description || ""}
                            onChange={(e) => updateConfig(["meta", "openGraph", "description"], e.target.value)}
                            placeholder='A brief description of your site for social sharing'
                            rows={3}
                            className='text-sm sm:text-base min-h-[80px]'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Description shown when shared on social media</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='ogSiteName' className='text-xs sm:text-sm font-semibold'>
                            Site Name
                        </Label>
                        <Input
                            id='ogSiteName'
                            value={config.meta.openGraph?.siteName || ""}
                            onChange={(e) => updateConfig(["meta", "openGraph", "siteName"], e.target.value)}
                            placeholder='Your Brand Name'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>The name of your website</p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='ogType' className='text-xs sm:text-sm font-semibold'>
                                Type
                            </Label>
                            <Select
                                value={config.meta.openGraph?.type || "website"}
                                onValueChange={(value) => updateConfig(["meta", "openGraph", "type"], value)}
                            >
                                <SelectTrigger className='h-9 sm:h-10 md:h-11'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='website'>Website</SelectItem>
                                    <SelectItem value='article'>Article</SelectItem>
                                    <SelectItem value='product'>Product</SelectItem>
                                    <SelectItem value='profile'>Profile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='ogLocale' className='text-xs sm:text-sm font-semibold'>
                                Locale
                            </Label>
                            <Input
                                id='ogLocale'
                                value={config.meta.openGraph?.locale || "en_US"}
                                onChange={(e) => updateConfig(["meta", "openGraph", "locale"], e.target.value)}
                                placeholder='en_US'
                                className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Twitter Card Settings */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Twitter Card Settings</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Configure how your site appears when shared on Twitter/X
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='twitterCard' className='text-xs sm:text-sm font-semibold'>
                            Card Type
                        </Label>
                        <Select
                            value={config.meta.twitter?.card || "summary_large_image"}
                            onValueChange={(value) => updateConfig(["meta", "twitter", "card"], value)}
                        >
                            <SelectTrigger className='h-9 sm:h-10 md:h-11'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='summary'>Summary</SelectItem>
                                <SelectItem value='summary_large_image'>Summary Large Image</SelectItem>
                                <SelectItem value='app'>App</SelectItem>
                                <SelectItem value='player'>Player</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>
                            "Summary Large Image" is recommended for best visual impact
                        </p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='twitterTitle' className='text-xs sm:text-sm font-semibold'>
                            Twitter Title
                        </Label>
                        <Input
                            id='twitterTitle'
                            value={config.meta.twitter?.title || ""}
                            onChange={(e) => updateConfig(["meta", "twitter", "title"], e.target.value)}
                            placeholder='Your Brand – Tagline'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Title shown when shared on Twitter</p>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='twitterDescription' className='text-xs sm:text-sm font-semibold'>
                            Twitter Description
                        </Label>
                        <Textarea
                            id='twitterDescription'
                            value={config.meta.twitter?.description || ""}
                            onChange={(e) => updateConfig(["meta", "twitter", "description"], e.target.value)}
                            placeholder='A brief description of your site for Twitter sharing'
                            rows={3}
                            className='text-sm sm:text-base min-h-[80px]'
                        />
                        <p className='text-[10px] sm:text-xs text-muted-foreground'>Description shown when shared on Twitter</p>
                    </div>

                    {/* Quick Sync Button */}
                    <div className='rounded-lg border bg-muted/30 p-4 space-y-3'>
                        <p className='text-xs font-medium'>Quick Actions</p>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                                if (!config) return;
                                setConfig(prevConfig => {
                                    const newConfig = { ...prevConfig };
                                    newConfig.meta = {
                                        ...newConfig.meta,
                                        openGraph: {
                                            ...newConfig.meta.openGraph,
                                            title: `${config.brandName}${config.brandTagline ? ` – ${config.brandTagline}` : ""}`,
                                            description: config.meta.description,
                                            siteName: config.brandName,
                                        },
                                        twitter: {
                                            ...newConfig.meta.twitter,
                                            title: `${config.brandName}${config.brandTagline ? ` – ${config.brandTagline}` : ""}`,
                                            description: config.meta.description,
                                        },
                                    };
                                    return newConfig;
                                });
                            }}
                        >
                            Sync from Brand Name & Meta Description
                        </Button>
                        <p className='text-[10px] text-muted-foreground'>
                            This will update OG and Twitter titles/descriptions based on your brand name, tagline, and meta description
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
