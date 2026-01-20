/**
 * Mixer Tool OG Image Generator
 *
 * Creates an OG image showing a color mix between two dyes
 * with the resulting blend and closest dye match.
 *
 * Layout (1200x630):
 * ┌──────────────────────────────────────────────────────┐
 * │  ✦ XIV DYE TOOLS      DYE MIXER        60/40 BLEND  │
 * ├──────────────────────────────────────────────────────┤
 * │                                                      │
 * │     ┌────┐    60%    ┌────────────┐    40%    ┌────┐│
 * │     │    │───────────│   RESULT   │───────────│    ││
 * │     └────┘           │            │           └────┘│
 * │   Dalamud Red        │  [Blended] │         Snow    │
 * │   #B22222            │   #D46A6A  │         White   │
 * │                      └────────────┘                  │
 * │                      ≈ Coral Pink (Δ 2.1)           │
 * │                                                      │
 * ├──────────────────────────────────────────────────────┤
 * │  🎨 xivdyetools.app                  Algorithm: CIEDE2000│
 * └──────────────────────────────────────────────────────┘
 */

import { type Dye } from '@xivdyetools/core';
import { rect, text, line, THEME, FONTS, OG_DIMENSIONS } from './base';
import { generateOGCard, LAYOUT } from './og-card';
import { findClosestDyesWithDistance, getDyeByItemId } from './dye-helpers';
import type { MatchingAlgorithm } from '../../types';

export interface MixerOGOptions {
  /** First dye itemID */
  dyeAId: number;
  /** Second dye itemID */
  dyeBId: number;
  /** Mix ratio (0-100, percentage of dyeA) */
  ratio: number;
  /** Matching algorithm */
  algorithm?: MatchingAlgorithm;
}

/**
 * Mixes two hex colors at a given ratio
 */
function mixColors(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.slice(0, 2), 16);
  const g1 = parseInt(hex1.slice(2, 4), 16);
  const b1 = parseInt(hex1.slice(4, 6), 16);

  const r2 = parseInt(hex2.slice(0, 2), 16);
  const g2 = parseInt(hex2.slice(2, 4), 16);
  const b2 = parseInt(hex2.slice(4, 6), 16);

  const mixRatio = ratio / 100;
  const r = Math.round(r1 * mixRatio + r2 * (1 - mixRatio));
  const g = Math.round(g1 * mixRatio + g2 * (1 - mixRatio));
  const b = Math.round(b1 * mixRatio + b2 * (1 - mixRatio));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generates the Mixer tool OG image SVG
 */
export function generateMixerOG(options: MixerOGOptions): string {
  const { dyeAId, dyeBId, ratio, algorithm = 'oklab' } = options;

  // Look up the dyes
  const dyeA = getDyeByItemId(dyeAId);
  const dyeB = getDyeByItemId(dyeBId);

  if (!dyeA || !dyeB) {
    return generateFallbackMixerOG(ratio, algorithm);
  }

  // Calculate mixed color
  const mixedHex = mixColors(dyeA.hex, dyeB.hex, ratio);

  // Find closest matching dye
  const matches = findClosestDyesWithDistance(mixedHex, { limit: 1 });
  const closestMatch = matches[0];

  // Build content elements
  const contentElements: string[] = [];
  const { contentTop, contentHeight } = LAYOUT;
  const centerX = OG_DIMENSIONS.width / 2;

  // Layout: centered equation [DyeA] + [DyeB] = [Result]
  const swatchSize = 120;
  const operatorGap = 35;
  const equationGap = 40;

  // Calculate total width: swatch + gap + "+" + gap + swatch + gap + "=" + gap + swatch
  const totalWidth = swatchSize * 3 + operatorGap * 4;
  const startX = centerX - totalWidth / 2;

  // Vertical centering: account for label above (15px) and info below (~60px)
  const totalVisualHeight = 15 + swatchSize + 60; // 175px total
  const swatchY = contentTop + (contentHeight - totalVisualHeight) / 2 + 15;

  // Positions
  const dyeAX = startX;
  const plusX = dyeAX + swatchSize + operatorGap;
  const dyeBX = plusX + operatorGap;
  const equalsX = dyeBX + swatchSize + operatorGap;
  const resultX = equalsX + operatorGap;

  // Dye A swatch
  contentElements.push(
    rect(dyeAX, swatchY, swatchSize, swatchSize, dyeA.hex, {
      rx: 10,
      stroke: '#ffffff',
      strokeWidth: 2,
    })
  );

  // Dye A percentage label (above)
  contentElements.push(
    text(dyeAX + swatchSize / 2, swatchY - 15, `${ratio}%`, {
      fill: THEME.accent,
      fontSize: 16,
      fontFamily: FONTS.header,
      fontWeight: 700,
      textAnchor: 'middle',
    })
  );

  // Dye A name (below)
  const dyeAName = dyeA.name.length > 12 ? dyeA.name.slice(0, 10) + '..' : dyeA.name;
  contentElements.push(
    text(dyeAX + swatchSize / 2, swatchY + swatchSize + 22, dyeAName, {
      fill: THEME.text,
      fontSize: 13,
      fontFamily: FONTS.primary,
      fontWeight: 500,
      textAnchor: 'middle',
    })
  );

  // Dye A hex (below name)
  contentElements.push(
    text(dyeAX + swatchSize / 2, swatchY + swatchSize + 40, dyeA.hex.toUpperCase(), {
      fill: THEME.textMuted,
      fontSize: 11,
      fontFamily: FONTS.mono,
      textAnchor: 'middle',
    })
  );

  // "+" operator
  contentElements.push(
    text(plusX, swatchY + swatchSize / 2 + 8, '+', {
      fill: THEME.textMuted,
      fontSize: 36,
      fontFamily: FONTS.header,
      fontWeight: 300,
      textAnchor: 'middle',
    })
  );

  // Dye B swatch
  contentElements.push(
    rect(dyeBX, swatchY, swatchSize, swatchSize, dyeB.hex, {
      rx: 10,
      stroke: '#ffffff',
      strokeWidth: 2,
    })
  );

  // Dye B percentage label (above)
  contentElements.push(
    text(dyeBX + swatchSize / 2, swatchY - 15, `${100 - ratio}%`, {
      fill: THEME.accent,
      fontSize: 16,
      fontFamily: FONTS.header,
      fontWeight: 700,
      textAnchor: 'middle',
    })
  );

  // Dye B name (below)
  const dyeBName = dyeB.name.length > 12 ? dyeB.name.slice(0, 10) + '..' : dyeB.name;
  contentElements.push(
    text(dyeBX + swatchSize / 2, swatchY + swatchSize + 22, dyeBName, {
      fill: THEME.text,
      fontSize: 13,
      fontFamily: FONTS.primary,
      fontWeight: 500,
      textAnchor: 'middle',
    })
  );

  // Dye B hex (below name)
  contentElements.push(
    text(dyeBX + swatchSize / 2, swatchY + swatchSize + 40, dyeB.hex.toUpperCase(), {
      fill: THEME.textMuted,
      fontSize: 11,
      fontFamily: FONTS.mono,
      textAnchor: 'middle',
    })
  );

  // "=" operator
  contentElements.push(
    text(equalsX, swatchY + swatchSize / 2 + 8, '=', {
      fill: THEME.textMuted,
      fontSize: 36,
      fontFamily: FONTS.header,
      fontWeight: 300,
      textAnchor: 'middle',
    })
  );

  // Result swatch
  contentElements.push(
    rect(resultX, swatchY, swatchSize, swatchSize, mixedHex, {
      rx: 10,
      stroke: THEME.accent,
      strokeWidth: 3,
    })
  );

  // Result label (above)
  contentElements.push(
    text(resultX + swatchSize / 2, swatchY - 15, 'RESULT', {
      fill: THEME.textMuted,
      fontSize: 12,
      fontFamily: FONTS.header,
      fontWeight: 600,
      textAnchor: 'middle',
    })
  );

  // Result hex (below swatch)
  contentElements.push(
    text(resultX + swatchSize / 2, swatchY + swatchSize + 22, mixedHex.toUpperCase(), {
      fill: THEME.text,
      fontSize: 13,
      fontFamily: FONTS.mono,
      fontWeight: 500,
      textAnchor: 'middle',
    })
  );

  // Closest match info (below result)
  if (closestMatch) {
    contentElements.push(
      text(resultX + swatchSize / 2, swatchY + swatchSize + 42, `≈ ${closestMatch.dye.name}`, {
        fill: THEME.textMuted,
        fontSize: 11,
        fontFamily: FONTS.primary,
        textAnchor: 'middle',
      })
    );

    const deltaColor =
      closestMatch.distance < 5
        ? THEME.success
        : closestMatch.distance < 10
          ? THEME.warning
          : THEME.error;

    contentElements.push(
      text(resultX + swatchSize / 2, swatchY + swatchSize + 60, `Δ${closestMatch.distance.toFixed(1)}`, {
        fill: deltaColor,
        fontSize: 11,
        fontFamily: FONTS.mono,
        textAnchor: 'middle',
      })
    );
  }

  return generateOGCard({
    toolName: 'Dye Mixer',
    subtitle: `${ratio}/${100 - ratio} Blend`,
    content: contentElements.join('\n'),
    algorithm,
  });
}

/**
 * Generates a fallback OG image when dyes are not found
 */
function generateFallbackMixerOG(ratio: number, algorithm: MatchingAlgorithm): string {
  const contentElements: string[] = [];
  const { contentTop, contentHeight } = LAYOUT;

  // Centered message
  contentElements.push(
    text(OG_DIMENSIONS.width / 2, contentTop + contentHeight / 2 - 20, 'Mix Dye Colors', {
      fill: THEME.text,
      fontSize: 32,
      fontFamily: FONTS.header,
      fontWeight: 600,
      textAnchor: 'middle',
    })
  );

  contentElements.push(
    text(
      OG_DIMENSIONS.width / 2,
      contentTop + contentHeight / 2 + 30,
      'Blend two FFXIV dyes and find the closest match',
      {
        fill: THEME.textMuted,
        fontSize: 18,
        fontFamily: FONTS.primary,
        textAnchor: 'middle',
      }
    )
  );

  // Example mixing visualization
  const exampleY = contentTop + contentHeight / 2 + 100;
  const centerX = OG_DIMENSIONS.width / 2;

  // Left color
  contentElements.push(rect(centerX - 200, exampleY, 60, 60, '#ef4444', { rx: 8 }));
  // Plus sign
  contentElements.push(
    text(centerX - 120, exampleY + 35, '+', {
      fill: THEME.textMuted,
      fontSize: 30,
      fontFamily: FONTS.header,
      textAnchor: 'middle',
    })
  );
  // Right color
  contentElements.push(rect(centerX - 80, exampleY, 60, 60, '#3b82f6', { rx: 8 }));
  // Equals sign
  contentElements.push(
    text(centerX + 10, exampleY + 35, '=', {
      fill: THEME.textMuted,
      fontSize: 30,
      fontFamily: FONTS.header,
      textAnchor: 'middle',
    })
  );
  // Result color
  contentElements.push(rect(centerX + 50, exampleY, 60, 60, '#9747ba', { rx: 8 }));

  return generateOGCard({
    toolName: 'Dye Mixer',
    subtitle: `${ratio}/${100 - ratio} Blend`,
    content: contentElements.join('\n'),
    algorithm,
  });
}
