"use client";

import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import { Slider } from "@/components/ui/slider";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface HeroSlidesClientProps {
  storeId: string;
}

export function HeroSlidesClient({ storeId }: HeroSlidesClientProps) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    setLoading(true);
    try {
      const { createStoreApiClient } = await import("@/lib/store-api-client");
      const client = createStoreApiClient(storeId);
      const data = await client.get<HeroSlide[]>("/hero-slides");
      setSlides(data || []);
    } catch (error) {
      console.error("Failed to load hero slides:", error);
      toast.error("Failed to load hero slides");
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const addNewSlide = () => {
    const newSlide: HeroSlide = {
      image: "",
      mobileImage: "",
      title: "",
      subtitle: "",
      description: "",
      buttonText: "",
      buttonLink: "",
      textPosition: "center",
      textColor: "#ffffff",
      overlay: true,
      overlayOpacity: 0.4,
      order: slides.length,
      enabled: true,
    };
    setSlides([...slides, newSlide]);
    setEditingIndex(slides.length);
  };

  const updateSlide = (index: number, field: keyof HeroSlide, value: any) => {
    const updated = [...slides];
    (updated[index] as any)[field] = value;
    setSlides(updated);
  };

  const deleteSlide = async (id: string | undefined, index: number) => {
    if (!id) {
      // Remove unsaved slide
      const updated = slides.filter((_, i) => i !== index);
      setSlides(updated);
      setEditingIndex(null);
      return;
    }

    try {
      const { createStoreApiClient } = await import("@/lib/store-api-client");
      const client = createStoreApiClient(storeId);
      await client.delete(`/hero-slides/${id}`);
      toast.success("Slide deleted successfully");
      await loadSlides();
      setEditingIndex(null);
    } catch (error) {
      toast.error("Failed to delete slide");
    }
  };

  const saveSlide = async (slide: HeroSlide, index: number) => {
    if (!slide.image || slide.image.trim() === "") {
      toast.error("Image is required to save the slide");
      return;
    }

    setSaving(true);
    try {
      const { createStoreApiClient } = await import("@/lib/store-api-client");
      const client = createStoreApiClient(storeId);

      if (slide.id) {
        await client.put(`/hero-slides`, slide);
      } else {
        await client.post("/hero-slides", slide);
      }

      toast.success("Slide saved successfully");
      await loadSlides();
      setEditingIndex(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const updated = [...slides];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update all orders
    updated.forEach((slide, i) => {
      slide.order = i;
    });

    setSlides(updated);

    // Save all slides to update their orders
    setSaving(true);
    try {
      const { createStoreApiClient } = await import("@/lib/store-api-client");
      const client = createStoreApiClient(storeId);

      await Promise.all(
        updated.map((slide) => {
          if (!slide.id) return Promise.resolve();
          return client.put("/hero-slides", slide);
        })
      );
      toast.success("Slides reordered successfully");
      await loadSlides();
    } catch (error) {
      toast.error("Failed to reorder slides");
      await loadSlides();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <div className='flex items-center gap-3'>
          <Spinner className='h-5 w-5' />
          <span className='text-base font-medium text-muted-foreground'>Loading hero slides...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <Card className='border-2 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl'>Hero Slides Management</CardTitle>
              <CardDescription className='text-base mt-1'>Create and manage slides for your homepage hero section</CardDescription>
            </div>
            <Button onClick={addNewSlide} size='lg' className='shadow-md'>
              <Plus className='mr-2 h-4 w-4' />
              Add Slide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {slides.length === 0 ? (
            <div className='text-center py-16 border-2 border-dashed rounded-xl bg-muted/30'>
              <div className='space-y-3'>
                <div className='mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
                  <Plus className='h-8 w-8 text-muted-foreground' />
                </div>
                <div>
                  <p className='text-base font-medium text-foreground'>No hero slides yet</p>
                  <p className='text-sm text-muted-foreground mt-1'>Click "Add Slide" to create your first slide</p>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              {slides.map((slide, index) => (
                <Card
                  key={slide.id || index}
                  className={`border-2 shadow-sm transition-all ${editingIndex === index ? "border-primary shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
                    }`}
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <GripVertical className='w-5 h-5 text-muted-foreground' />
                        <div>
                          <CardTitle className='text-lg font-semibold'>Slide {index + 1}</CardTitle>
                          {!slide.enabled && <span className='text-xs text-muted-foreground font-medium'>(Disabled)</span>}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => moveSlide(index, "up")}
                          disabled={index === 0}
                          className='h-9 w-9'
                        >
                          <ArrowUp className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => moveSlide(index, "down")}
                          disabled={index === slides.length - 1}
                          className='h-9 w-9'
                        >
                          <ArrowDown className='h-4 w-4' />
                        </Button>
                        <Button
                          variant={editingIndex === index ? "default" : "outline"}
                          size='sm'
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className='min-w-[80px]'
                        >
                          {editingIndex === index ? "Close" : "Edit"}
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => deleteSlide(slide.id, index)}
                          className='text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {editingIndex === index && (
                    <CardContent className='space-y-8 pt-6'>
                      <div className='p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg'>
                        <p className='text-sm text-blue-900 dark:text-blue-100'>
                          <strong>Note:</strong> Only the image is required. All other fields are optional - you can upload and save just an
                          image if you prefer.
                        </p>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                        <div className='space-y-6'>
                          <div className='space-y-3'>
                            <ImageUpload
                              value={slide.image}
                              onChange={(url) => updateSlide(index, "image", url)}
                              label='Desktop Image (Required)'
                              folder='hero-slides'
                              required
                              placeholder='https://example.com/image.jpg'
                            />
                          </div>

                          <div className='space-y-3'>
                            <ImageUpload
                              value={slide.mobileImage || ""}
                              onChange={(url) => updateSlide(index, "mobileImage", url)}
                              label='Mobile Image (Optional)'
                              folder='hero-slides'
                              placeholder='https://example.com/mobile-image.jpg'
                            />
                            <p className='text-xs text-muted-foreground'>
                              If not provided, the desktop image will be used on mobile devices
                            </p>
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Title (Optional)</Label>
                            <Input
                              value={slide.title || ""}
                              onChange={(e) => updateSlide(index, "title", e.target.value)}
                              placeholder='Find Your Next Favorite Pair'
                              className='h-11 text-base'
                            />
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Subtitle (Optional)</Label>
                            <Input
                              value={slide.subtitle || ""}
                              onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                              placeholder='Sleek, comfortable, and built for your everyday.'
                              className='h-11 text-base'
                            />
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Description (Optional)</Label>
                            <Textarea
                              value={slide.description || ""}
                              onChange={(e) => updateSlide(index, "description", e.target.value)}
                              placeholder='Additional description text...'
                              rows={4}
                              className='text-base'
                            />
                          </div>
                        </div>

                        <div className='space-y-6'>
                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Button Text (Optional)</Label>
                            <Input
                              value={slide.buttonText || ""}
                              onChange={(e) => updateSlide(index, "buttonText", e.target.value)}
                              placeholder='Shop Now'
                              className='h-11 text-base'
                            />
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Button Link (Optional)</Label>
                            <Input
                              value={slide.buttonLink || ""}
                              onChange={(e) => updateSlide(index, "buttonLink", e.target.value)}
                              placeholder='/products'
                              className='h-11 text-base'
                            />
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Text Position (Optional)</Label>
                            <Select
                              value={slide.textPosition || "center"}
                              onValueChange={(value) => updateSlide(index, "textPosition", value)}
                            >
                              <SelectTrigger className='h-11'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='left'>Left</SelectItem>
                                <SelectItem value='center'>Center</SelectItem>
                                <SelectItem value='right'>Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className='space-y-3'>
                            <Label className='text-sm font-semibold'>Text Color (Optional)</Label>
                            <div className='flex gap-3'>
                              <Input
                                type='color'
                                value={slide.textColor}
                                onChange={(e) => updateSlide(index, "textColor", e.target.value)}
                                className='w-24 h-11 rounded-lg cursor-pointer'
                              />
                              <Input
                                type='text'
                                value={slide.textColor}
                                onChange={(e) => updateSlide(index, "textColor", e.target.value)}
                                placeholder='#ffffff'
                                className='flex-1 font-mono h-11 text-base'
                              />
                            </div>
                          </div>

                          <div className='flex items-center justify-between p-4 rounded-lg border bg-muted/30'>
                            <div className='space-y-0.5'>
                              <Label className='text-sm font-semibold'>Overlay (Optional)</Label>
                              <p className='text-xs text-muted-foreground'>Add dark overlay for better text readability</p>
                            </div>
                            <Switch
                              checked={slide.overlay !== undefined ? slide.overlay : true}
                              onCheckedChange={(checked) => updateSlide(index, "overlay", checked)}
                            />
                          </div>

                          {slide.overlay && (
                            <div className='space-y-3 p-4 rounded-lg border bg-muted/30'>
                              <Label className='text-sm font-semibold'>
                                Overlay Opacity: {Math.round((slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4) * 100)}%
                              </Label>
                              <Slider
                                value={[slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4]}
                                onValueChange={([value]) => updateSlide(index, "overlayOpacity", value)}
                                min={0}
                                max={1}
                                step={0.1}
                                className='w-full'
                              />
                            </div>
                          )}

                          <div className='flex items-center justify-between p-4 rounded-lg border bg-muted/30'>
                            <div className='space-y-0.5'>
                              <Label className='text-sm font-semibold'>Enabled</Label>
                              <p className='text-xs text-muted-foreground'>Show this slide on the homepage</p>
                            </div>
                            <Switch checked={slide.enabled} onCheckedChange={(checked) => updateSlide(index, "enabled", checked)} />
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className='space-y-4'>
                        <Label className='text-sm font-semibold'>Live Preview</Label>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {/* Desktop Preview */}
                          <div className='space-y-2'>
                            <Label className='text-xs font-medium text-muted-foreground'>Desktop Preview</Label>
                            <div className='relative w-full h-[200px] sm:h-[300px] rounded-xl overflow-hidden border-2 shadow-lg bg-muted'>
                              {slide.image ? (
                                <>
                                  <CloudImage src={slide.image} alt='Desktop Preview' fill className='object-cover' />
                                  {slide.overlay && (
                                    <div
                                      className='absolute inset-0'
                                      style={{
                                        backgroundColor: `rgba(0, 0, 0, ${slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4
                                          })`,
                                      }}
                                    />
                                  )}
                                  <div
                                    className={`absolute inset-0 flex flex-col justify-center p-4 ${slide.textPosition === "left"
                                      ? "items-start text-left"
                                      : slide.textPosition === "right"
                                        ? "items-end text-right"
                                        : "items-center text-center"
                                      }`}
                                    style={{ color: slide.textColor }}
                                  >
                                    <h2 className='text-lg sm:text-xl font-bold drop-shadow-lg'>{slide.title || "Title"}</h2>
                                    {slide.subtitle && <p className='mt-2 text-sm sm:text-base drop-shadow-md'>{slide.subtitle}</p>}
                                    {slide.description && (
                                      <p className='mt-2 text-xs sm:text-sm drop-shadow-md max-w-2xl line-clamp-2'>{slide.description}</p>
                                    )}
                                    {slide.buttonText && (
                                      <Button size='sm' className='mt-3 shadow-lg' asChild>
                                        <a href={slide.buttonLink || "#"}>{slide.buttonText}</a>
                                      </Button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className='flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted to-muted/50'>
                                  <p className='text-sm'>Add desktop image</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mobile Preview */}
                          <div className='space-y-2'>
                            <Label className='text-xs font-medium text-muted-foreground'>Mobile Preview</Label>
                            <div className='relative w-full h-[200px] sm:h-[300px] rounded-xl overflow-hidden border-2 shadow-lg bg-muted'>
                              {slide.mobileImage || slide.image ? (
                                <>
                                  <CloudImage
                                    src={slide.mobileImage || slide.image || ""}
                                    alt='Mobile Preview'
                                    fill
                                    className='object-cover'
                                  />
                                  {slide.overlay && (
                                    <div
                                      className='absolute inset-0'
                                      style={{
                                        backgroundColor: `rgba(0, 0, 0, ${slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4
                                          })`,
                                      }}
                                    />
                                  )}
                                  <div
                                    className={`absolute inset-0 flex flex-col justify-center p-4 ${slide.textPosition === "left"
                                      ? "items-start text-left"
                                      : slide.textPosition === "right"
                                        ? "items-end text-right"
                                        : "items-center text-center"
                                      }`}
                                    style={{ color: slide.textColor }}
                                  >
                                    <h2 className='text-base sm:text-lg font-bold drop-shadow-lg'>{slide.title || "Title"}</h2>
                                    {slide.subtitle && <p className='mt-1 text-xs sm:text-sm drop-shadow-md'>{slide.subtitle}</p>}
                                    {slide.description && (
                                      <p className='mt-1 text-xs drop-shadow-md max-w-2xl line-clamp-2'>{slide.description}</p>
                                    )}
                                    {slide.buttonText && (
                                      <Button size='sm' className='mt-2 shadow-lg text-xs' asChild>
                                        <a href={slide.buttonLink || "#"}>{slide.buttonText}</a>
                                      </Button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className='flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted to-muted/50'>
                                  <p className='text-sm'>Add image</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-end pt-4 border-t'>
                        <Button onClick={() => saveSlide(slide, index)} disabled={saving} size='lg' className='min-w-[140px]'>
                          {saving ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className='mr-2 h-4 w-4' />
                              Save Slide
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
