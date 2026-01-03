"use client";

import { useEffect, useState } from "react";
import type { PromotionalBanner } from "@/app/api/promotional-banner/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export function PromotionalBannerClient() {
  const [banner, setBanner] = useState<PromotionalBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBanner();
  }, []);

  const loadBanner = async () => {
    try {
      const res = await fetch("/api/promotional-banner");
      if (!res.ok) throw new Error("Failed to load banner");
      const data = await res.json();
      setBanner(data);
    } catch (error) {
      toast.error("Failed to load promotional banner");
      setBanner({
        id: "promotional_banner_v1",
        enabled: false,
        text: "",
        backgroundColor: "#f3f4f6",
        textColor: "#6b7280",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!banner) return;
    setSaving(true);
    try {
      const res = await fetch("/api/promotional-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banner),
      });
      if (!res.ok) throw new Error("Failed to save banner");
      toast.success("Promotional banner saved successfully!");
      await loadBanner();
    } catch (error) {
      toast.error("Failed to save promotional banner");
    } finally {
      setSaving(false);
    }
  };

  const updateBanner = (field: keyof PromotionalBanner, value: any) => {
    if (!banner) return;
    setBanner({ ...banner, [field]: value });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <div className='flex items-center gap-3'>
          <Spinner className='h-5 w-5' />
          <span className='text-base font-medium text-muted-foreground'>Loading promotional banner settings...</span>
        </div>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className='rounded-xl border-2 p-12 text-center bg-muted/30'>
        <p className='text-base font-medium text-muted-foreground'>Failed to load promotional banner configuration.</p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <Card className='border-2 shadow-sm'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-xl'>Banner Configuration</CardTitle>
          <CardDescription className='text-base'>Customize the promotional banner that appears at the top of your website</CardDescription>
        </CardHeader>
        <CardContent className='space-y-8'>
          <div className='flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-r from-muted/50 to-muted/30'>
            <div className='space-y-1'>
              <Label htmlFor='enabled' className='text-sm font-semibold'>
                Enable Banner
              </Label>
              <p className='text-sm text-muted-foreground'>Show or hide the promotional banner</p>
            </div>
            <Switch id='enabled' checked={banner.enabled} onCheckedChange={(checked) => updateBanner("enabled", checked)} />
          </div>

          {banner.enabled && (
            <div className='space-y-8'>
              <div className='space-y-3'>
                <Label htmlFor='text' className='text-sm font-semibold'>
                  Banner Text *
                </Label>
                <Input
                  id='text'
                  value={banner.text}
                  onChange={(e) => updateBanner("text", e.target.value)}
                  placeholder='Free shipping on orders over $75 • Fast delivery • 30-day returns'
                  className='h-11 text-base'
                />
                <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>The main text to display in the banner</p>
              </div>

              <div className='space-y-3'>
                <Label htmlFor='link' className='text-sm font-semibold'>
                  Link URL (Optional)
                </Label>
                <Input
                  id='link'
                  type='url'
                  value={banner.link || ""}
                  onChange={(e) => updateBanner("link", e.target.value)}
                  placeholder='https://example.com/promotion'
                  className='h-11 text-base'
                />
                <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
                  Optional link to redirect users when they click the banner
                </p>
              </div>

              {banner.link && (
                <div className='space-y-3'>
                  <Label htmlFor='linkText' className='text-sm font-semibold'>
                    Link Text (Optional)
                  </Label>
                  <Input
                    id='linkText'
                    value={banner.linkText || ""}
                    onChange={(e) => updateBanner("linkText", e.target.value)}
                    placeholder='Learn More'
                    className='h-11 text-base'
                  />
                  <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>Text to display for the link button</p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <Label htmlFor='backgroundColor' className='text-sm font-semibold'>
                    Background Color
                  </Label>
                  <div className='flex gap-3'>
                    <Input
                      id='backgroundColor'
                      type='color'
                      value={banner.backgroundColor || "#f3f4f6"}
                      onChange={(e) => updateBanner("backgroundColor", e.target.value)}
                      className='w-24 h-11 rounded-lg cursor-pointer'
                    />
                    <Input
                      type='text'
                      value={banner.backgroundColor || "#f3f4f6"}
                      onChange={(e) => updateBanner("backgroundColor", e.target.value)}
                      placeholder='#f3f4f6'
                      className='flex-1 font-mono h-11 text-base'
                    />
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label htmlFor='textColor' className='text-sm font-semibold'>
                    Text Color
                  </Label>
                  <div className='flex gap-3'>
                    <Input
                      id='textColor'
                      type='color'
                      value={banner.textColor || "#6b7280"}
                      onChange={(e) => updateBanner("textColor", e.target.value)}
                      className='w-24 h-11 rounded-lg cursor-pointer'
                    />
                    <Input
                      type='text'
                      value={banner.textColor || "#6b7280"}
                      onChange={(e) => updateBanner("textColor", e.target.value)}
                      placeholder='#6b7280'
                      className='flex-1 font-mono h-11 text-base'
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className='space-y-4'>
                <Label className='text-sm font-semibold'>Live Preview</Label>
                <div
                  className='rounded-xl border-2 p-6 text-center text-base shadow-lg transition-all'
                  style={{
                    backgroundColor: banner.backgroundColor || "#f3f4f6",
                    color: banner.textColor || "#6b7280",
                  }}
                >
                  <div className='flex items-center justify-center gap-3 flex-wrap'>
                    <span className='font-medium'>{banner.text || "Banner text will appear here"}</span>
                    {banner.link && banner.linkText && (
                      <a
                        href={banner.link}
                        className='underline font-semibold hover:opacity-80 transition-opacity px-3 py-1 rounded-md bg-black/10'
                        onClick={(e) => e.preventDefault()}
                      >
                        {banner.linkText}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='flex justify-end gap-3 pt-6 border-t-2'>
        <Button onClick={handleSave} disabled={saving} size='lg' className='min-w-[140px]'>
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
