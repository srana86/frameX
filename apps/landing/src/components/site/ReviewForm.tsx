"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Upload, Star } from "lucide-react";
import imageCompression from "browser-image-compression";
import { apiRequest } from "@/lib/api-client";

type ReviewFormProps = {
  productName: string;
  productSlug?: string;
};

export function ReviewForm({ productName, productSlug }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setUploading(true);
    try {
      // Compress image before uploading
      const originalSizeMB = file.size / 1024 / 1024;

      // Adaptive compression based on file size
      // For larger files, use more aggressive compression
      const isLargeFile = originalSizeMB > 2;
      const compressionOptions = {
        maxSizeMB: 1, // Target maximum size in MB (will compress until under this)
        maxWidthOrHeight: isLargeFile ? 1600 : 1920, // Reduce dimensions more for large files
        useWebWorker: true, // Use web worker for better performance
        fileType: file.type, // Preserve original file type
        initialQuality: isLargeFile ? 0.7 : 0.85, // Lower quality for larger files
      };

      let compressedFile: File;
      try {
        compressedFile = await imageCompression(file, compressionOptions);
        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
        if (compressionRatio !== "0.0") {
          console.log(`[ReviewForm] Image compressed: ${compressionRatio}% reduction`);
        }
      } catch (compressionError) {
        console.warn("[ReviewForm] Compression failed, using original file:", compressionError);
        // If compression fails, use original file
        compressedFile = file;
      }

      const form = new FormData();
      form.append("file", compressedFile);
      form.append("folder", "reviews");
      form.append("resource_type", "auto");

      const data = await apiRequest<any>("POST", "/upload", form, {
        "Content-Type": "multipart/form-data",
      });
      const url = data?.secure_url || data?.url;

      if (typeof url === "string") {
        setImages([...images, url]);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    if (!review.trim()) {
      toast.error("Please write a review");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (review.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        rating,
        review: review.trim(),
        name: name.trim(),
        images: images.length > 0 ? images : undefined,
      };

      if (!productSlug) {
        toast.error("Product information missing");
        return;
      }

      await apiRequest("POST", `/products/${productSlug}/reviews`, reviewData);

      toast.success("Review submitted successfully!");

      // Reset form
      setRating(0);
      setReview("");
      setName("");
      setImages([]);

      // Reload the page to show the new review
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='rounded-2xl bg-card p-6 shadow-lg border'>
      <h2 className='text-2xl font-bold mb-6'>Write a Review</h2>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Product Name */}
        <div>
          <Label className='text-sm font-medium mb-2 block'>Product</Label>
          <p className='text-muted-foreground'>{productName}</p>
        </div>

        {/* Rating */}
        <div>
          <Label className='text-sm font-medium mb-3 block'>
            Rating <span className='text-destructive'>*</span>
          </Label>
          <div className='flex items-center gap-2'>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type='button'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className='transition-transform hover:scale-110'
              >
                <Star
                  className={`w-8 h-8 transition-colors ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"
                    }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className='ml-2 text-sm text-muted-foreground'>
                {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor='review-name' className='text-sm font-medium mb-2 block'>
            Your Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='review-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter your name'
            maxLength={50}
            required
          />
        </div>

        {/* Review Text */}
        <div>
          <Label htmlFor='review-text' className='text-sm font-medium mb-2 block'>
            Your Review <span className='text-destructive'>*</span>
          </Label>
          <Textarea
            id='review-text'
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder='Share your experience with this product...'
            rows={6}
            maxLength={1000}
            required
            className='resize-none'
          />
          <p className='text-xs text-muted-foreground mt-1'>{review.length}/1000 characters (minimum 10 characters)</p>
        </div>

        {/* Image Upload */}
        <div>
          <Label className='text-sm font-medium mb-2 block'>
            Photos (Optional)
            <span className='text-xs text-muted-foreground ml-2'>Max 5 images</span>
          </Label>
          <div className='space-y-3'>
            {images.length > 0 && (
              <div className='flex flex-wrap gap-3'>
                {images.map((url, index) => (
                  <div key={index} className='relative group'>
                    <div className='relative w-24 h-24 rounded-lg overflow-hidden border border-border'>
                      <img src={url} alt={`Review image ${index + 1}`} className='w-full h-full object-cover' />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 5 && (
              <label className='inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors'>
                <Upload className='w-4 h-4' />
                <span className='text-sm'>Upload Photo</span>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Allow up to 50MB - will be compressed automatically
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error("Image size must be less than 50MB");
                        return;
                      }
                      handleImageUpload(file);
                    }
                    e.currentTarget.value = "";
                  }}
                  disabled={uploading}
                />
              </label>
            )}
            {uploading && <p className='text-sm text-muted-foreground'>Uploading image...</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex items-center gap-3 pt-4 border-t border-border'>
          <Button type='submit' disabled={submitting || !rating || !review.trim() || !name.trim()}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setRating(0);
              setReview("");
              setName("");
              setImages([]);
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
