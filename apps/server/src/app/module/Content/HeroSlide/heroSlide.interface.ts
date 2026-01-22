export interface THeroSlide {
  id: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  link?: string;
  textPosition?: "left" | "center" | "right";
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  order?: number;
  enabled?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
