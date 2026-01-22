"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import CloudImage from "@/components/site/CloudImage";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import apiClient from "@/lib/api-client";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  showPreview?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  folder = "uploads",
  showPreview = true,
  required = false,
  placeholder = "https://example.com/image.jpg",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [localValue, setLocalValue] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const justUploadedRef = useRef(false);

  // Sync local value with prop value when it changes from parent
  // But don't override if we just uploaded (to prevent race condition)
  useEffect(() => {
    if (!justUploadedRef.current) {
      setLocalValue(value || "");
    } else {
      // Reset the flag after a short delay to allow parent to catch up
      setTimeout(() => {
        justUploadedRef.current = false;
      }, 100);
    }
  }, [value]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      // Compress image before uploading
      const originalSizeMB = file.size / 1024 / 1024;
      console.log("[ImageUpload] Original file size:", originalSizeMB.toFixed(2), "MB");

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
        const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

        console.log("[ImageUpload] Compression complete:", {
          original: `${originalSizeMB} MB`,
          compressed: `${compressedSizeMB} MB`,
          ratio: `${compressionRatio}% reduction`,
        });

        if (compressionRatio !== "0.0") {
          toast.success(`Image compressed: ${compressionRatio}% smaller`);
        }
      } catch (compressionError) {
        console.warn("[ImageUpload] Compression failed, using original file:", compressionError);
        // If compression fails, use original file
        compressedFile = file;
      }

      const form = new FormData();
      form.append("file", compressedFile);
      form.append("folder", folder);
      form.append("resource_type", "image");

      console.log("[ImageUpload] Starting upload...", {
        fileName: compressedFile.name,
        fileSize: compressedFile.size,
        folder,
      });

      // Use apiClient directly for FormData uploads (apiRequest sets Content-Type to JSON)
      const response = await apiClient.post("/upload", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      console.log("[ImageUpload] Upload response:", { status: response.status, data });

      // Cloudinary returns secure_url in the response
      const url = data?.secure_url || data?.url;

      if (typeof url === "string" && url.trim() !== "") {
        console.log("[ImageUpload] Upload successful, setting URL:", url);
        // Mark that we just uploaded to prevent useEffect from resetting
        justUploadedRef.current = true;
        // Update local state immediately for instant feedback (input field and preview)
        setLocalValue(url);
        // Call onChange to update parent component - this will trigger updateConfig
        onChange(url);
        toast.success("Image uploaded successfully");
      } else {
        console.error("[ImageUpload] Invalid upload response - full data:", JSON.stringify(data, null, 2));
        throw new Error("Invalid response from server - no URL received");
      }
    } catch (error: any) {
      console.error("[ImageUpload] Error during upload:", error);
      toast.error(error?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className='space-y-2'>
      <Label>
        {label} {required && "*"}
      </Label>
      <div className='space-y-2'>
        <div className='flex gap-2 items-stretch'>
          <Input
            type='text'
            value={localValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalValue(newValue);
              onChange(newValue);
            }}
            onBlur={() => {
              // Ensure value is synced on blur
              if (localValue !== value) {
                onChange(localValue);
              }
            }}
            placeholder={placeholder}
            className='flex-1'
            disabled={uploading}
            autoComplete='off'
          />
          <input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileChange} className='hidden' disabled={uploading} />
          <Button
            type='button'
            variant='outline'
            disabled={uploading}
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className='shrink-0 whitespace-nowrap h-9 md:h-10'
          >
            {uploading ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                <span>Upload</span>
              </>
            )}
          </Button>
        </div>
        {showPreview && localValue && (
          <div className='relative h-48 w-full rounded-lg overflow-hidden border bg-muted'>
            <CloudImage src={localValue} alt='Preview' fill className='object-cover' />
            <Button
              type='button'
              variant='destructive'
              size='icon'
              className='absolute top-2 right-2'
              onClick={() => {
                setLocalValue("");
                onChange("");
              }}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}
        <p className='text-xs text-muted-foreground'>Enter an image URL or click "Upload" to upload from your computer</p>
      </div>
    </div>
  );
}
