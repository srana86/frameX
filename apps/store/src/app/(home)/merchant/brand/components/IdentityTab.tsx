"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IdentityTab() {
    const { config, updateConfig } = useBrandConfig();

    return (
        <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
            <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold'>Brand Identity</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1 sm:mt-2'>
                    Configure your brand name and tagline to establish your unique identity
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                    <Label htmlFor='brandName' className='text-xs sm:text-sm font-semibold'>
                        Brand Name *
                    </Label>
                    <Input
                        id='brandName'
                        value={config.brandName}
                        onChange={(e) => updateConfig(["brandName"], e.target.value)}
                        placeholder='Your Brand Name'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                    <p className='text-[10px] sm:text-xs text-muted-foreground'>This will be displayed throughout your store</p>
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='brandTagline' className='text-xs sm:text-sm font-semibold'>
                        Brand Tagline
                    </Label>
                    <Input
                        id='brandTagline'
                        value={config.brandTagline || ""}
                        onChange={(e) => updateConfig(["brandTagline"], e.target.value)}
                        placeholder='Your Brand Tagline'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                    <p className='text-[10px] sm:text-xs text-muted-foreground'>A short, memorable phrase that describes your brand</p>
                </div>
                {(config.brandName || config.brandTagline) && (
                    <div className='rounded-lg sm:rounded-xl border  bg-gradient-to-br from-muted/50 to-muted/30 p-4 sm:p-6 md:p-8 space-y-2 sm:space-y-3 shadow-inner'>
                        <Label className='text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Preview</Label>
                        <div className='space-y-1 sm:space-y-2'>
                            <h3 className='text-xl sm:text-2xl md:text-3xl font-bold'>{config.brandName || "Brand Name"}</h3>
                            {config.brandTagline && (
                                <p className='text-sm sm:text-base md:text-lg text-muted-foreground'>{config.brandTagline}</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
