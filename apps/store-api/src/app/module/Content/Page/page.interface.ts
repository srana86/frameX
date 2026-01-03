export interface TPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string; // Changed from categoryId to category (string name) to match FrameX-Store footer_pages
  order?: number;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TPageCategory {
  id: string;
  name: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
