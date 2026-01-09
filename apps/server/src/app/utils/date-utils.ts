/**
 * Date utility functions
 * Provides helpers for date calculations
 */

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
