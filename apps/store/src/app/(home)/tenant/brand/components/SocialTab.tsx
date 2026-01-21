"use client";

import { useBrandConfig } from "./brand-config-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SocialTab() {
    const { config, updateConfig } = useBrandConfig();

    return (
        <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
            <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Social Media Links</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                    Add your social media profiles to connect with customers
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                    <Label htmlFor='socialFacebook' className='text-xs sm:text-sm font-semibold'>
                        Facebook URL
                    </Label>
                    <Input
                        id='socialFacebook'
                        type='url'
                        value={config.social.facebook || ""}
                        onChange={(e) => updateConfig(["social", "facebook"], e.target.value)}
                        placeholder='https://facebook.com/yourbrand'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='socialTwitter' className='text-xs sm:text-sm font-semibold'>
                        Twitter URL
                    </Label>
                    <Input
                        id='socialTwitter'
                        type='url'
                        value={config.social.twitter || ""}
                        onChange={(e) => updateConfig(["social", "twitter"], e.target.value)}
                        placeholder='https://twitter.com/yourbrand'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='socialInstagram' className='text-xs sm:text-sm font-semibold'>
                        Instagram URL
                    </Label>
                    <Input
                        id='socialInstagram'
                        type='url'
                        value={config.social.instagram || ""}
                        onChange={(e) => updateConfig(["social", "instagram"], e.target.value)}
                        placeholder='https://instagram.com/yourbrand'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='socialYoutube' className='text-xs sm:text-sm font-semibold'>
                        YouTube URL
                    </Label>
                    <Input
                        id='socialYoutube'
                        type='url'
                        value={config.social.youtube || ""}
                        onChange={(e) => updateConfig(["social", "youtube"], e.target.value)}
                        placeholder='https://youtube.com/yourbrand'
                        className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                </div>
            </CardContent>
        </Card>
    );
}
