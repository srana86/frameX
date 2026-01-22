"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactTab() {
    const { config, updateConfig } = useBrandConfig();

    return (
        <>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Contact Information</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>Configure your contact details for customer inquiries</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='contactEmail' className='text-xs sm:text-sm font-semibold'>
                            Email *
                        </Label>
                        <Input
                            id='contactEmail'
                            type='email'
                            value={config.contact.email}
                            onChange={(e) => updateConfig(["contact", "email"], e.target.value)}
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='contactPhone' className='text-xs sm:text-sm font-semibold'>
                            Phone *
                        </Label>
                        <Input
                            id='contactPhone'
                            value={config.contact.phone}
                            onChange={(e) => updateConfig(["contact", "phone"], e.target.value)}
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='contactAddress' className='text-xs sm:text-sm font-semibold'>
                            Address *
                        </Label>
                        <Textarea
                            id='contactAddress'
                            value={config.contact.address}
                            onChange={(e) => updateConfig(["contact", "address"], e.target.value)}
                            rows={3}
                            className='text-sm sm:text-base min-h-[80px]'
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
                <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                    <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Footer Content</CardTitle>
                    <CardDescription className='text-xs sm:text-sm mt-1'>
                        Configure footer description and copyright information
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='footerDescription' className='text-xs sm:text-sm font-semibold'>
                            Footer Description *
                        </Label>
                        <Textarea
                            id='footerDescription'
                            value={config.footer.description}
                            onChange={(e) => updateConfig(["footer", "description"], e.target.value)}
                            rows={3}
                            className='text-sm sm:text-base min-h-[100px]'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='copyrightText' className='text-xs sm:text-sm font-semibold'>
                            Copyright Text
                        </Label>
                        <Input
                            id='copyrightText'
                            value={config.footer.copyrightText || ""}
                            onChange={(e) => updateConfig(["footer", "copyrightText"], e.target.value)}
                            placeholder='All rights reserved.'
                            className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
