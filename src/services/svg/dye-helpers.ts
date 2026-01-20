/**
 * Dye Helper Functions for OG Image Generation
 *
 * Provides utilities for finding dye matches with distance values,
 * which the core library's findClosestDye doesn't directly expose.
 */

import {
  DyeService,
  dyeDatabase,
  ColorConverter,
  CharacterColorService,
  type Dye,
} from '@xivdyetools/core';

// Shared service instances
export const dyeService = new DyeService(dyeDatabase);
export const characterColorService = new CharacterColorService();

/**
 * Result of looking up a character color by hex
 */
export interface CharacterColorLookup {
  /** Display name of the category (e.g., "Eye Colors") */
  categoryName: string;
  /** The index within the category (0-based) */
  index: number;
  /** Row in the character creator grid (1-based) */
  row: number;
  /** Column in the character creator grid (1-based) */
  col: number;
}

/**
 * Category display names mapping
 */
const SHARED_CATEGORY_NAMES: Record<string, string> = {
  eyeColors: 'Eye Colors',
  highlightColors: 'Highlights',
  lipColorsDark: 'Lip Colors (Dark)',
  lipColorsLight: 'Lip Colors (Light)',
  tattooColors: 'Tattoo/Limbal',
  facePaintColorsDark: 'Face Paint (Dark)',
  facePaintColorsLight: 'Face Paint (Light)',
};

/**
 * All subraces for searching race-specific colors
 */
const ALL_SUBRACES = [
  'Midlander', 'Highlander', // Hyur
  'Wildwood', 'Duskwight', // Elezen
  'Plainsfolk', 'Dunesfolk', // Lalafell
  'SeekerOfTheSun', 'KeeperOfTheMoon', // Miqo'te
  'SeaWolf', 'Hellsguard', // Roegadyn
  'Raen', 'Xaela', // Au Ra
  'Rava', 'Veena', // Viera
  'Helion', 'TheLost', // Hrothgar
] as const;

const GENDERS = ['Male', 'Female'] as const;

/**
 * Find a character color by its hex value.
 * Searches all shared AND race-specific color categories for a match.
 *
 * @param hex - The hex color to look up (with or without #)
 * @returns The category and position info, or null if not found
 */
export function findCharacterColorByHex(hex: string): CharacterColorLookup | null {
  // Normalize hex to uppercase with #
  const normalizedHex = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;

  // Search all shared categories first
  const sharedCategories = [
    'eyeColors',
    'highlightColors',
    'lipColorsDark',
    'lipColorsLight',
    'tattooColors',
    'facePaintColorsDark',
    'facePaintColorsLight',
  ] as const;

  for (const category of sharedCategories) {
    const colors = characterColorService.getSharedColors(category);
    const found = colors.find((c) => c.hex.toUpperCase() === normalizedHex);

    if (found) {
      // Character color sheets use 8 columns
      const col = (found.index % 8) + 1;
      const row = Math.floor(found.index / 8) + 1;

      return {
        categoryName: SHARED_CATEGORY_NAMES[category] || category,
        index: found.index,
        row,
        col,
      };
    }
  }

  // Search race-specific categories (hair and skin colors)
  for (const subrace of ALL_SUBRACES) {
    for (const gender of GENDERS) {
      // Search hair colors
      const hairColors = characterColorService.getHairColors(subrace, gender);
      const foundHair = hairColors.find((c) => c.hex.toUpperCase() === normalizedHex);
      if (foundHair) {
        const col = (foundHair.index % 8) + 1;
        const row = Math.floor(foundHair.index / 8) + 1;
        return {
          categoryName: `Hair Colors`,
          index: foundHair.index,
          row,
          col,
        };
      }

      // Search skin colors
      const skinColors = characterColorService.getSkinColors(subrace, gender);
      const foundSkin = skinColors.find((c) => c.hex.toUpperCase() === normalizedHex);
      if (foundSkin) {
        const col = (foundSkin.index % 8) + 1;
        const row = Math.floor(foundSkin.index / 8) + 1;
        return {
          categoryName: `Skin Colors`,
          index: foundSkin.index,
          row,
          col,
        };
      }
    }
  }

  return null;
}

/**
 * Result of a dye match with its distance
 */
export interface DyeMatch {
  dye: Dye;
  distance: number;
}

/**
 * Find multiple closest dyes to a given hex color, with their distances.
 *
 * This fills a gap in the core library where findClosestDye only returns
 * a single dye without the distance value.
 *
 * @param hex - Target color in hex format
 * @param options - Search options
 * @returns Array of dye matches sorted by distance (closest first)
 */
export function findClosestDyesWithDistance(
  hex: string,
  options: {
    limit?: number;
    excludeIds?: number[];
  } = {}
): DyeMatch[] {
  const { limit = 5, excludeIds = [] } = options;
  const excludeSet = new Set(excludeIds);

  // Get all dyes and filter
  const allDyes = dyeService.getAllDyes();
  const candidates = allDyes.filter((dye) => !excludeSet.has(dye.id));

  // Calculate distances using OKLAB (perceptually uniform)
  const withDistances = candidates.map((dye) => ({
    dye,
    distance: ColorConverter.getDeltaE_Oklab(hex, dye.hex),
  }));

  // Sort by distance and return top matches
  return withDistances.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

/**
 * Get a single dye by its itemID
 */
export function getDyeByItemId(itemId: number): Dye | undefined {
  const allDyes = dyeService.getAllDyes();
  return allDyes.find((d) => d.itemID === itemId);
}
