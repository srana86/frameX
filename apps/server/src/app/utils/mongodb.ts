/**
 * MongoDB utility functions for Mongoose operations
 * Provides helpers for common database operations
 */

import mongoose from "mongoose";

/**
 * Remove MongoDB _id field and return clean object
 * Useful for maintaining compatibility with Next.js API responses
 */
export function removeMongoId<T extends { _id?: any; [key: string]: any }>(
  doc: T | null
): Omit<T, "_id"> | null {
  if (!doc) return null;
  const { _id, ...data } = doc;
  return data as Omit<T, "_id">;
}

/**
 * Remove _id from array of documents
 */
export function removeMongoIdFromArray<
  T extends { _id?: any; [key: string]: any },
>(docs: T[]): Omit<T, "_id">[] {
  return docs.map((doc) => {
    const { _id, ...data } = doc;
    return data as Omit<T, "_id">;
  });
}

/**
 * Convert Mongoose document to plain object and remove _id
 */
export function toPlainObject<T>(doc: mongoose.Document | null): T | null {
  if (!doc) return null;
  const obj = doc.toObject();
  const { _id, ...data } = obj;
  return data as T;
}

/**
 * Convert array of Mongoose documents to plain objects
 */
export function toPlainObjectArray<T>(docs: mongoose.Document[]): T[] {
  return docs.map((doc) => {
    const obj = doc.toObject();
    const { _id, ...data } = obj;
    return data as T;
  });
}

/**
 * Check if a date string is expiring soon (within 7 days)
 */
export function isExpiringSoon(endDate: string | Date): boolean {
  const end = new Date(endDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Check if a date is past due
 */
export function isPastDue(endDate: string | Date): boolean {
  const end = new Date(endDate);
  const now = new Date();
  return now > end;
}

/**
 * Calculate period end date based on start date and billing cycle
 */
export function calculatePeriodEnd(
  startDate: Date,
  billingCycleMonths: number = 1
): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + billingCycleMonths);
  return endDate;
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
