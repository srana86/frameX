import { TAffiliateSettings, CommissionLevel } from "./affiliate.interface";

/**
 * Calculate affiliate level based on delivered sales count
 * Uses salesThresholds if available, otherwise falls back to requiredSales in commissionLevels
 */
export function calculateAffiliateLevel(
  deliveredSales: number,
  settings: TAffiliateSettings
): CommissionLevel {
  // First try salesThresholds (new structure)
  if (settings.salesThresholds) {
    let currentLevel: CommissionLevel = 1;
    for (let i = 5; i >= 1; i--) {
      const level = i as CommissionLevel;
      const threshold = settings.salesThresholds[String(level)];
      if (threshold !== undefined && deliveredSales >= threshold) {
        currentLevel = level;
        break;
      }
    }
    return currentLevel;
  }

  // Fallback to old structure (requiredSales in commissionLevels)
  const levels: CommissionLevel[] = [5, 4, 3, 2, 1];
  for (const level of levels) {
    const levelConfig = settings.commissionLevels[String(level)];
    if (levelConfig?.enabled && levelConfig.requiredSales !== undefined) {
      if (deliveredSales >= levelConfig.requiredSales) {
        return level;
      }
    }
  }

  // Default to level 1 if no level requirements met
  return 1;
}

/**
 * Get next level progress for affiliate
 */
export function getNextLevelProgress(
  currentLevel: CommissionLevel,
  deliveredSales: number,
  settings: TAffiliateSettings
): { nextLevel: CommissionLevel | null; requiredSales: number; progress: number } {
  const levels: CommissionLevel[] = [1, 2, 3, 4, 5];
  const currentIndex = levels.indexOf(currentLevel);

  // Find next enabled level
  for (let i = currentIndex + 1; i < levels.length; i++) {
    const nextLevel = levels[i];
    const levelConfig = settings.commissionLevels[String(nextLevel)];

    if (levelConfig?.enabled && levelConfig.requiredSales !== undefined) {
      const requiredSales = levelConfig.requiredSales;
      const progress = Math.min(100, (deliveredSales / requiredSales) * 100);

      return {
        nextLevel,
        requiredSales,
        progress,
      };
    }
  }

  // Try salesThresholds if available
  if (settings.salesThresholds) {
    for (let i = currentIndex + 1; i < levels.length; i++) {
      const nextLevel = levels[i];
      const threshold = settings.salesThresholds[String(nextLevel)];
      if (threshold !== undefined) {
        const progress = Math.min(100, (deliveredSales / threshold) * 100);
        return {
          nextLevel,
          requiredSales: threshold,
          progress,
        };
      }
    }
  }

  return {
    nextLevel: null,
    requiredSales: 0,
    progress: 100,
  };
}

