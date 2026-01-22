export interface TReview {
  id?: string;
  productSlug: string; // Changed from productId to productSlug to match FrameX-Store
  name: string; // Changed from customerName to name
  rating: number; // 1-5
  review?: string; // Changed from comment to review
  initials?: string; // Auto-generated from name
  date?: string; // Formatted date string
  verified?: boolean; // Whether the review is verified (purchased product)
  avatarColor?: string; // CSS gradient class for avatar
  images?: string[]; // Array of image URLs
  createdAt?: Date;
  updatedAt?: Date;
}
