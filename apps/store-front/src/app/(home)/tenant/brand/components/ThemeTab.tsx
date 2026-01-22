"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hexToOklch } from "@/lib/utils";

export function ThemeTab() {
    const { config, updateConfig, applyThemeColor, colorPresets } = useBrandConfig();

    return (
        <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
            <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Theme Color</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                    Customize your website's primary theme color. Changes apply to buttons, links, and other primary UI elements.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 sm:space-y-8 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-6'>
                    <div className='space-y-4'>
                        <Label htmlFor='primaryColor' className='text-sm font-semibold'>
                            Primary Color
                        </Label>
                        <div className='flex items-start gap-4'>
                            <div className='relative group'>
                                <Input
                                    id='primaryColor'
                                    type='color'
                                    value={config.theme.primaryColor}
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        updateConfig(["theme", "primaryColor"], newColor);
                                        applyThemeColor(newColor);
                                    }}
                                    className='h-12 w-32 cursor-pointer rounded-xl border-2 border-border shadow-lg transition-all hover:scale-105 hover:shadow-xl'
                                />
                                <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border rounded-md text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap'>
                                    {config.theme.primaryColor}
                                </div>
                            </div>
                            <div className='flex-1 space-y-2'>
                                <Input
                                    type='text'
                                    value={config.theme.primaryColor}
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                                            updateConfig(["theme", "primaryColor"], newColor);
                                            applyThemeColor(newColor);
                                        } else {
                                            updateConfig(["theme", "primaryColor"], newColor);
                                        }
                                    }}
                                    placeholder='#000000'
                                    className='font-mono h-11 text-base'
                                />
                                <p className='text-xs text-muted-foreground'>Enter a hex color code (e.g., #f97316)</p>
                            </div>
                        </div>
                    </div>

                    {/* Color Preview */}
                    <div className='space-y-3 sm:space-y-4'>
                        <Label className='text-xs sm:text-sm font-semibold'>Live Preview</Label>
                        <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl border bg-gradient-to-br from-muted/50 to-muted/30'>
                            <div className='space-y-3'>
                                <div
                                    className='h-24 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transition-all hover:scale-105'
                                    style={{ backgroundColor: config.theme.primaryColor }}
                                >
                                    Button
                                </div>
                                <p className='text-xs text-center font-medium text-muted-foreground'>Primary Button</p>
                            </div>
                            <div className='space-y-3'>
                                <div
                                    className='h-24 rounded-xl border-2 flex items-center justify-center font-semibold bg-background transition-all hover:scale-105'
                                    style={{ borderColor: config.theme.primaryColor, color: config.theme.primaryColor }}
                                >
                                    Outline
                                </div>
                                <p className='text-xs text-center font-medium text-muted-foreground'>Outline Button</p>
                            </div>
                            <div className='space-y-3'>
                                <div className='h-24 rounded-xl flex items-center justify-center bg-background border'>
                                    <a
                                        href='#'
                                        className='font-semibold underline transition-all hover:opacity-80'
                                        style={{ color: config.theme.primaryColor }}
                                    >
                                        Link Text
                                    </a>
                                </div>
                                <p className='text-xs text-center font-medium text-muted-foreground'>Link</p>
                            </div>
                            <div className='space-y-3'>
                                <div className='h-24 rounded-xl flex items-center justify-center bg-background border'>
                                    <div className='h-4 w-4 rounded-full shadow-md' style={{ backgroundColor: config.theme.primaryColor }}></div>
                                </div>
                                <p className='text-xs text-center font-medium text-muted-foreground'>Badge</p>
                            </div>
                        </div>
                    </div>

                    {/* Color Presets */}
                    <div className='space-y-3 sm:space-y-4'>
                        <Label className='text-xs sm:text-sm font-semibold'>Quick Select Presets</Label>
                        <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3'>
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.value}
                                    type='button'
                                    onClick={() => {
                                        updateConfig(["theme", "primaryColor"], preset.value);
                                        applyThemeColor(preset.value);
                                    }}
                                    className='group relative h-14 w-full rounded-xl border-2 transition-all hover:scale-110 hover:shadow-lg hover:z-10'
                                    style={{
                                        backgroundColor: preset.value,
                                        borderColor: config.theme.primaryColor === preset.value ? preset.value : "transparent",
                                        boxShadow: config.theme.primaryColor === preset.value ? `0 0 0 2px ${preset.value}40` : "none",
                                    }}
                                    title={preset.name}
                                >
                                    {config.theme.primaryColor === preset.value && (
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl'>
                                            <svg
                                                className='h-6 w-6 text-white drop-shadow-lg'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                                stroke='currentColor'
                                                strokeWidth={3}
                                            >
                                                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                                            </svg>
                                        </div>
                                    )}
                                    <span className='sr-only'>{preset.name}</span>
                                </button>
                            ))}
                        </div>
                        <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
                            Click a preset color to apply it instantly to your theme
                        </p>
                    </div>

                    {/* Info */}
                    <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6 space-y-3'>
                        <div className='flex items-start gap-4'>
                            <div
                                className='h-8 w-8 rounded-full shrink-0 shadow-md border-2 border-background'
                                style={{ backgroundColor: config.theme.primaryColor }}
                            ></div>
                            <div className='flex-1 space-y-2'>
                                <p className='text-sm font-semibold'>Current Theme Color</p>
                                <p className='text-xs text-muted-foreground leading-relaxed'>
                                    This color will be applied to{" "}
                                    <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>--primary</code> and{" "}
                                    <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>--sidebar-primary</code> CSS
                                    variables throughout your site.
                                </p>
                                <div className='flex items-center gap-2 mt-3'>
                                    <span className='text-xs font-medium text-muted-foreground'>OKLCH:</span>
                                    <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>
                                        {hexToOklch(config.theme.primaryColor)}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
