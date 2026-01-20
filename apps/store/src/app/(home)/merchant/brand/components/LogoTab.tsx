"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import CloudImage from "@/components/site/CloudImage";
import { Logo } from "@/components/site/Logo";
import { Image as ImageIcon, Apple, Globe, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoTab() {
    const { config, updateConfig, imageErrors, setImageErrors } = useBrandConfig();

    return (
        <>
            {/* Logo & Favicon Upload Card */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-2 sm:pb-3 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg font-bold'>Logo & Favicon</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>Upload and preview your brand images</CardDescription>
                </CardHeader>
                <CardContent className='px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4'>
                        {/* Logo Preview */}
                        <div className='space-y-2'>
                            <Label className='text-xs sm:text-sm font-semibold'>Logo</Label>
                            {config.logo.type === "image" && config.logo.imagePath ? (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                                    <CloudImage src={config.logo.imagePath} alt={config.logo.altText || "Logo"} fill className='object-contain p-2' />
                                </div>
                            ) : config.logo.type === "text" && (config.logo.text?.primary || config.logo.text?.secondary) ? (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm flex items-center justify-center p-2 mb-2'>
                                    <Logo brandConfig={config} className='pointer-events-none scale-110' />
                                </div>
                            ) : (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                                    <ImageIcon className='h-5 w-5 text-muted-foreground' />
                                    <p className='text-[10px] text-muted-foreground text-center font-medium'>No Logo</p>
                                </div>
                            )}
                            <ImageUpload
                                value={config.logo.type === "image" ? config.logo.imagePath || "" : ""}
                                onChange={(url) => {
                                    if (config.logo.type !== "image") {
                                        updateConfig(["logo", "type"], "image");
                                    }
                                    updateConfig(["logo", "imagePath"], url);
                                    if (!config.logo.altText) {
                                        updateConfig(["logo", "altText"], "Logo");
                                    }
                                }}
                                label=''
                                folder='brand'
                                placeholder='/logo.png'
                            />
                        </div>

                        {/* Favicon Preview */}
                        <div className='space-y-2'>
                            <Label className='text-xs sm:text-sm font-semibold'>Favicon</Label>
                            {config.favicon.path && !imageErrors["favicon"] ? (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                                    <img
                                        src={config.favicon.path}
                                        alt='Favicon'
                                        className='absolute inset-0 w-full h-full object-contain p-2'
                                        onError={() => setImageErrors((prev) => ({ ...prev, favicon: true }))}
                                        onLoad={() => setImageErrors((prev) => ({ ...prev, favicon: false }))}
                                    />
                                </div>
                            ) : (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                                    <Globe className='h-5 w-5 text-muted-foreground' />
                                    <p className='text-[10px] text-muted-foreground text-center font-medium'>No Favicon</p>
                                </div>
                            )}
                            <ImageUpload
                                value={config.favicon.path || ""}
                                onChange={(url) => updateConfig(["favicon", "path"], url)}
                                label=''
                                folder='brand'
                                placeholder='/favicon.ico'
                            />
                            <p className='text-[10px] text-muted-foreground'>32x32px or 16x16px</p>
                        </div>

                        {/* Apple Touch Icon Preview */}
                        <div className='space-y-2'>
                            <Label className='text-xs sm:text-sm font-semibold'>Apple Touch Icon</Label>
                            {config.favicon.appleTouchIcon && !imageErrors["appleTouchIcon"] ? (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                                    <img
                                        src={config.favicon.appleTouchIcon}
                                        alt='Apple Touch Icon'
                                        className='absolute inset-0 w-full h-full object-contain p-2'
                                        onError={() => setImageErrors((prev) => ({ ...prev, appleTouchIcon: true }))}
                                        onLoad={() => setImageErrors((prev) => ({ ...prev, appleTouchIcon: false }))}
                                    />
                                </div>
                            ) : (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                                    <Apple className='h-5 w-5 text-muted-foreground' />
                                    <p className='text-[10px] text-muted-foreground text-center font-medium'>No Apple Icon</p>
                                </div>
                            )}
                            <ImageUpload
                                value={config.favicon.appleTouchIcon || ""}
                                onChange={(url) => updateConfig(["favicon", "appleTouchIcon"], url)}
                                label=''
                                folder='brand'
                                placeholder='/apple-touch-icon.png'
                            />
                            <p className='text-[10px] text-muted-foreground'>180x180px PNG</p>
                        </div>

                        {/* Manifest Icon Preview */}
                        <div className='space-y-2'>
                            <Label className='text-xs sm:text-sm font-semibold'>Manifest Icon</Label>
                            {config.favicon.manifestIcon && !imageErrors["manifestIcon"] ? (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                                    <img
                                        src={config.favicon.manifestIcon}
                                        alt='Manifest Icon'
                                        className='absolute inset-0 w-full h-full object-contain p-2'
                                        onError={() => setImageErrors((prev) => ({ ...prev, manifestIcon: true }))}
                                        onLoad={() => setImageErrors((prev) => ({ ...prev, manifestIcon: false }))}
                                    />
                                </div>
                            ) : (
                                <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                                    <Upload className='h-5 w-5 text-muted-foreground' />
                                    <p className='text-[10px] text-muted-foreground text-center font-medium'>No Manifest Icon</p>
                                </div>
                            )}
                            <ImageUpload
                                value={config.favicon.manifestIcon || ""}
                                onChange={(url) => updateConfig(["favicon", "manifestIcon"], url)}
                                label=''
                                folder='brand'
                                placeholder='/manifest-icon.png'
                            />
                            <p className='text-[10px] text-muted-foreground'>192x192px or 512x512px</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logo Configuration Card */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Logo Configuration</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Design your brand logo with customizable styles and options
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    {/* Logo Type Selection */}
                    <div className='space-y-2 sm:space-y-3'>
                        <Label className='text-xs sm:text-sm font-semibold'>Logo Type</Label>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3'>
                            <button
                                type='button'
                                onClick={() => {
                                    if (!config.logo.text) {
                                        updateConfig(["logo", "text"], { primary: "", secondary: "" });
                                    }
                                    updateConfig(["logo", "type"], "text");
                                }}
                                className={cn(
                                    "relative rounded-md sm:rounded-lg border-2 p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-md",
                                    config.logo.type === "text" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/30"
                                )}
                            >
                                <div className='font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1'>Text Logo</div>
                                <div className='text-[10px] sm:text-xs text-muted-foreground leading-tight'>
                                    Customizable text-based logo with multiple styles
                                </div>
                                {config.logo.type === "text" && (
                                    <div className='absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary' />
                                )}
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    if (!config.logo.imagePath) {
                                        updateConfig(["logo", "imagePath"], "");
                                    }
                                    updateConfig(["logo", "type"], "image");
                                }}
                                className={cn(
                                    "relative rounded-md sm:rounded-lg border-2 p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-md",
                                    config.logo.type === "image" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/30"
                                )}
                            >
                                <div className='font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1'>Image Logo</div>
                                <div className='text-[10px] sm:text-xs text-muted-foreground leading-tight'>Upload a custom logo image file</div>
                                {config.logo.type === "image" && (
                                    <div className='absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary' />
                                )}
                            </button>
                        </div>
                    </div>

                    {config.logo.type === "text" ? (
                        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
                            {/* Left Column - Configuration */}
                            <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
                                {/* Logo Style Selection */}
                                <div className='space-y-2 sm:space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <Label className='text-xs sm:text-sm font-semibold'>Choose Logo Style</Label>
                                        <span className='text-[10px] sm:text-xs text-muted-foreground capitalize'>{config.logo.style || "default"}</span>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3'>
                                        {/* Style buttons */}
                                        {[
                                            { id: "default", label: "Default", preview: <div className='text-base font-bold mb-1'>Sample</div> },
                                            { id: "gradient", label: "Gradient", preview: <div className='text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-1'>Sample</div> },
                                            { id: "minimal", label: "Minimal", preview: <div className='text-sm font-light mb-1'>Sample</div> },
                                            { id: "badge", label: "Badge", preview: <div className='rounded px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase w-fit mb-1'>Sample</div> },
                                        ].map((style) => (
                                            <button
                                                key={style.id}
                                                type='button'
                                                onClick={() => updateConfig(["logo", "style"], style.id)}
                                                className={cn(
                                                    "relative rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-md",
                                                    (config.logo.style || "default") === style.id
                                                        ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                                        : "border-muted bg-background hover:border-primary/50"
                                                )}
                                            >
                                                {style.preview}
                                                <p className='text-[10px] text-muted-foreground'>{style.label}</p>
                                                {(config.logo.style || "default") === style.id && (
                                                    <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Inputs */}
                                <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                                    <Label className='text-sm font-semibold mb-4 block'>Logo Text Content</Label>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='logoPrimary' className='text-sm font-medium'>
                                                Brand Name (Primary) *
                                            </Label>
                                            <Input
                                                id='logoPrimary'
                                                value={config.logo.text?.primary || ""}
                                                onChange={(e) => updateConfig(["logo", "text", "primary"], e.target.value)}
                                                placeholder='e.g., Shoe'
                                                className='h-11 text-base'
                                            />
                                            <p className='text-xs text-muted-foreground'>Main brand name or primary text</p>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='logoSecondary' className='text-sm font-medium'>
                                                Secondary Text
                                            </Label>
                                            <Input
                                                id='logoSecondary'
                                                value={config.logo.text?.secondary || ""}
                                                onChange={(e) => updateConfig(["logo", "text", "secondary"], e.target.value)}
                                                placeholder='e.g., Store'
                                                className='h-11 text-base'
                                            />
                                            <p className='text-xs text-muted-foreground'>Optional secondary text or tagline</p>
                                        </div>
                                    </div>

                                    {/* Tagline Field */}
                                    <div className='space-y-2 pt-2 border-t border-border/50'>
                                        <Label htmlFor='brandTagline' className='text-sm font-medium'>
                                            Tagline / Description
                                        </Label>
                                        <Input
                                            id='brandTagline'
                                            value={config.brandTagline || ""}
                                            onChange={(e) => updateConfig(["brandTagline"], e.target.value)}
                                            placeholder='e.g., Modern Ecommerce Store'
                                            className='h-11 text-base'
                                        />
                                        <p className='text-xs text-muted-foreground'>
                                            Appears below logo in icon-text style
                                        </p>
                                    </div>
                                </div>

                                {/* Gradient Colors (shown when gradient style selected) */}
                                {config.logo.style === "gradient" && (
                                    <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                                        <Label className='text-sm font-semibold mb-3 block'>Gradient Colors</Label>
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                            <div className='space-y-2'>
                                                <Label htmlFor='gradientFrom' className='text-sm font-medium'>
                                                    Start Color
                                                </Label>
                                                <div className='flex gap-2'>
                                                    <Input
                                                        id='gradientFrom'
                                                        type='color'
                                                        value={config.logo.colors?.gradientFrom || "#3b82f6"}
                                                        onChange={(e) => updateConfig(["logo", "colors", "gradientFrom"], e.target.value)}
                                                        className='h-10 w-20 cursor-pointer'
                                                    />
                                                    <Input
                                                        value={config.logo.colors?.gradientFrom || "#3b82f6"}
                                                        onChange={(e) => updateConfig(["logo", "colors", "gradientFrom"], e.target.value)}
                                                        placeholder='#3b82f6'
                                                        className='h-10 flex-1 font-mono text-sm'
                                                    />
                                                </div>
                                            </div>
                                            <div className='space-y-2'>
                                                <Label htmlFor='gradientTo' className='text-sm font-medium'>
                                                    End Color
                                                </Label>
                                                <div className='flex gap-2'>
                                                    <Input
                                                        id='gradientTo'
                                                        type='color'
                                                        value={config.logo.colors?.gradientTo || "#8b5cf6"}
                                                        onChange={(e) => updateConfig(["logo", "colors", "gradientTo"], e.target.value)}
                                                        className='h-10 w-20 cursor-pointer'
                                                    />
                                                    <Input
                                                        value={config.logo.colors?.gradientTo || "#8b5cf6"}
                                                        onChange={(e) => updateConfig(["logo", "colors", "gradientTo"], e.target.value)}
                                                        placeholder='#8b5cf6'
                                                        className='h-10 flex-1 font-mono text-sm'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Live Preview */}
                            <div className='lg:col-span-1'>
                                <div className='sticky top-20 space-y-3 sm:space-y-4'>
                                    <div className='rounded-lg sm:rounded-xl border border-primary/20 bg-gradient-to-br from-background to-muted/20 p-4 sm:p-5 shadow-md'>
                                        <div className='flex items-center justify-between mb-3 sm:mb-4'>
                                            <Label className='text-xs sm:text-sm font-semibold'>Live Preview</Label>
                                            <div className='h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse' />
                                        </div>
                                        <div className='flex items-center justify-center min-h-[100px] sm:min-h-[120px] bg-gradient-to-br from-muted/40 to-muted/10 rounded-lg p-4 sm:p-6 border border-border/50 mb-2 sm:mb-3'>
                                            {config.logo.text?.primary || config.logo.text?.secondary || config.logo.style === "icon-text" ? (
                                                <Logo brandConfig={config} className='pointer-events-none' />
                                            ) : (
                                                <div className='text-center text-muted-foreground'>
                                                    <p className='text-sm mb-1'>Enter your logo text</p>
                                                    <p className='text-xs'>Preview will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className='space-y-2 rounded-lg bg-muted/50 p-3 text-xs'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-muted-foreground'>Style:</span>
                                                <span className='font-medium capitalize'>{config.logo.style || "default"}</span>
                                            </div>
                                            {(config.logo.text?.primary || config.logo.text?.secondary) && (
                                                <>
                                                    <div className='flex items-center justify-between'>
                                                        <span className='text-muted-foreground'>Primary:</span>
                                                        <span className='font-medium'>{config.logo.text?.primary || "—"}</span>
                                                    </div>
                                                    {config.logo.text?.secondary && (
                                                        <div className='flex items-center justify-between'>
                                                            <span className='text-muted-foreground'>Secondary:</span>
                                                            <span className='font-medium'>{config.logo.text.secondary}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='space-y-6'>
                            <ImageUpload
                                value={config.logo.imagePath || ""}
                                onChange={(url) => updateConfig(["logo", "imagePath"], url)}
                                label='Logo Image'
                                folder='brand'
                                required
                                placeholder='/logo.png or https://example.com/logo.png'
                            />
                            <p className='text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg'>
                                Upload an image or enter a URL/path. For local files, use paths like /logo.png
                            </p>
                            <div className='space-y-3'>
                                <Label htmlFor='logoAltText' className='text-sm font-semibold'>
                                    Alt Text
                                </Label>
                                <Input
                                    id='logoAltText'
                                    value={config.logo.altText || ""}
                                    onChange={(e) => updateConfig(["logo", "altText"], e.target.value)}
                                    placeholder='Brand Logo'
                                    className='h-11 text-base'
                                />
                                <p className='text-xs text-muted-foreground'>Used for accessibility and SEO</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
