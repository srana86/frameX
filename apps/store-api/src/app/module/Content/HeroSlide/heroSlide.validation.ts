import { z } from "zod";

// Create hero slide validation schema
const createHeroSlideValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    image: z.string().optional(), // URL or will be uploaded
    mobileImage: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    link: z.string().optional(),
    textPosition: z.enum(["left", "center", "right"]).optional(),
    textColor: z.string().optional(),
    overlay: z.boolean().optional(),
    overlayOpacity: z.number().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Update hero slide validation schema
const updateHeroSlideValidationSchema = z.object({
  body: z.object({
    image: z.string().optional(),
    mobileImage: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    link: z.string().optional(),
    textPosition: z.enum(["left", "center", "right"]).optional(),
    textColor: z.string().optional(),
    overlay: z.boolean().optional(),
    overlayOpacity: z.number().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const HeroSlideValidation = {
  createHeroSlideValidationSchema,
  updateHeroSlideValidationSchema,
};
