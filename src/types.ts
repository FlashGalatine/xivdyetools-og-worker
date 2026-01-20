/**
 * XIV Dye Tools OpenGraph Worker - Type Definitions
 *
 * @module types
 */

import type { AnalyticsEngineDataset } from '@cloudflare/workers-types';

// ============================================================================
// Environment Bindings
// ============================================================================

export interface Env {
  // Environment variables
  APP_BASE_URL: string;
  OG_IMAGE_BASE_URL: string;

  // Analytics Engine binding
  ANALYTICS?: AnalyticsEngineDataset;

  // KV namespace for caching (optional, for future use)
  OG_CACHE?: KVNamespace;
}

// ============================================================================
// Tool Types
// ============================================================================

export type ToolId =
  | 'harmony'
  | 'gradient'
  | 'mixer'
  | 'swatch'
  | 'comparison'
  | 'accessibility';

export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'square'
  | 'monochromatic'
  | 'compound'
  | 'shades';

export type MatchingAlgorithm = 'oklab' | 'ciede2000' | 'euclidean';

export type VisionType =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia';

// ============================================================================
// OpenGraph Data
// ============================================================================

export interface OGData {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  siteName: string;
  themeColor?: string;
}

// ============================================================================
// Tool-Specific Share Parameters
// ============================================================================

export interface HarmonyParams {
  dye: number; // itemID
  harmony: HarmonyType;
  algo?: MatchingAlgorithm;
  perceptual?: boolean;
}

export interface GradientParams {
  start: number; // itemID
  end: number; // itemID
  steps: number;
  algo?: MatchingAlgorithm;
}

export interface MixerParams {
  dyeA: number; // itemID
  dyeB: number; // itemID
  ratio: number; // 0-100
  algo?: MatchingAlgorithm;
}

export interface SwatchParams {
  color: string; // hex without #
  algo?: MatchingAlgorithm;
  limit?: number;
}

export interface ComparisonParams {
  dyes: number[]; // array of itemIDs (1-4)
}

export interface AccessibilityParams {
  dyes: number[]; // array of itemIDs
  vision?: VisionType;
}

export type ShareParams =
  | ({ tool: 'harmony' } & HarmonyParams)
  | ({ tool: 'gradient' } & GradientParams)
  | ({ tool: 'mixer' } & MixerParams)
  | ({ tool: 'swatch' } & SwatchParams)
  | ({ tool: 'comparison' } & ComparisonParams)
  | ({ tool: 'accessibility' } & AccessibilityParams);

// ============================================================================
// Crawler Detection
// ============================================================================

export type CrawlerType =
  | 'discord'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'slack'
  | 'telegram'
  | 'whatsapp'
  | 'other'
  | 'none';

export interface CrawlerInfo {
  isCrawler: boolean;
  type: CrawlerType;
  userAgent: string;
}

// ============================================================================
// Analytics Events
// ============================================================================

export interface AnalyticsEvent {
  event: 'og_request' | 'og_image_request';
  tool: ToolId;
  crawler: CrawlerType;
  cacheHit?: boolean;
  timestamp: number;
}
