# XIV Dye Tools OpenGraph Worker

A Cloudflare Worker that serves dynamic OpenGraph metadata for XIV Dye Tools, enabling rich social media previews when users share links on Discord, Twitter, Facebook, and other platforms.

## Overview

When someone shares a XIV Dye Tools link (e.g., a Harmony palette or Swatch match), social media platforms need to fetch preview information. However, XIV Dye Tools is a Single Page Application (SPA) that renders content client-side via JavaScript. Social media crawlers don't execute JavaScript, so they only see an empty shell.

This worker solves that by:
1. Intercepting requests to XIV Dye Tools URLs
2. Detecting if the request is from a social media crawler
3. Returning pre-rendered HTML with dynamic `og:meta` tags for crawlers
4. Passing regular users through to the SPA unchanged

## Features

### Dynamic OG Image Generation

Generates custom preview images for each tool:

| Tool | Preview Content |
|------|-----------------|
| **Harmony** | Base dye with color harmony wheel (complementary, triadic, etc.) |
| **Gradient** | Start/end dyes with stepped gradient visualization |
| **Mixer** | Two dyes with blend result and ratio indicator |
| **Swatch** | Input color with top 4 matching dyes and delta values |

Images are rendered as SVG and converted to PNG using `resvg-wasm` for maximum compatibility.

### Crawler Detection

Automatically detects these platforms:
- Discord
- Twitter/X
- Facebook (includes Instagram & WhatsApp)
- LinkedIn
- Slack
- Telegram
- iMessage (Applebot)

### Analytics

Tracks OG requests and image generation via Cloudflare Analytics Engine:
- Event type (metadata request, image request)
- Tool being shared
- Crawler platform
- Cache hit/miss status

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Discord/Twitter shares link                                    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Cloudflare Edge │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐    Crawler?    ┌─────────────────┐        │
│  │   OG Worker     │───────Yes─────▶│  Generate HTML  │        │
│  │                 │                 │  with og:meta   │        │
│  └────────┬────────┘                 └────────┬────────┘        │
│           │                                   │                  │
│           │ No                                ▼                  │
│           ▼                          ┌─────────────────┐        │
│  ┌─────────────────┐                 │  og:image URL   │        │
│  │   Proxy to SPA  │                 │  /og/tool/...   │        │
│  └─────────────────┘                 └────────┬────────┘        │
│                                               │                  │
│                                               ▼                  │
│                                      ┌─────────────────┐        │
│                                      │  SVG → PNG      │        │
│                                      │  (resvg-wasm)   │        │
│                                      └─────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
xivdyetools-og-worker/
├── src/
│   ├── index.ts              # Hono app entry point & route definitions
│   ├── types.ts              # TypeScript type definitions
│   ├── crawler-detector.ts   # User-Agent based crawler detection
│   ├── og-data-generator.ts  # OG metadata generation per tool
│   ├── fonts/                # Embedded TTF fonts
│   │   ├── Onest-VariableFont_wght.ttf
│   │   ├── SpaceGrotesk-VariableFont_wght.ttf
│   │   └── Habibi-Regular.ttf
│   └── services/
│       ├── fonts.ts          # Font loading utilities
│       ├── renderer.ts       # SVG → PNG conversion with resvg-wasm
│       └── svg/
│           ├── index.ts      # SVG module exports
│           ├── base.ts       # SVG primitives (rect, text, circle)
│           ├── og-card.ts    # Shared card layout template
│           ├── dye-helpers.ts # Dye lookup & character color search
│           ├── harmony.ts    # Harmony tool OG image
│           ├── gradient.ts   # Gradient tool OG image
│           ├── mixer.ts      # Mixer tool OG image
│           └── swatch.ts     # Swatch tool OG image
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

## API Routes

### Tool Routes (Crawler Detection)

These routes intercept normal app URLs:

| Route | Description |
|-------|-------------|
| `GET /harmony/*` | Harmony tool with query params |
| `GET /gradient/*` | Gradient tool with query params |
| `GET /mixer/*` | Mixer tool with query params |
| `GET /swatch/*` | Swatch tool with query params |
| `GET /comparison/*` | Comparison tool |
| `GET /accessibility/*` | Accessibility tool |

### OG Image Routes

Direct image generation endpoints:

| Route | Example |
|-------|---------|
| `/og/harmony/:dyeId/:harmonyType.png` | `/og/harmony/5771/complementary.png` |
| `/og/gradient/:startId/:endId/:steps.png` | `/og/gradient/5729/5736/5.png` |
| `/og/mixer/:dyeAId/:dyeBId/:ratio.png` | `/og/mixer/27869/5729/60.png` |
| `/og/swatch/:color/:limit.png` | `/og/swatch/8B4513/4.png` |
| `/og/default.png` | Default site preview image |

All image routes support an optional `?algo=` query param (`oklab`, `ciede2000`, `rgb`).

### Utility Routes

| Route | Description |
|-------|-------------|
| `GET /health` | Health check endpoint |
| `GET /` | Root - redirects users, serves OG for crawlers |

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for deployment)

### Setup

```bash
# Install dependencies
npm install

# Create local environment file
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values

# Start development server
npm run dev
```

### Testing Locally

```bash
# Generate a Harmony image
curl http://localhost:8787/og/harmony/5771/complementary.png -o test.png

# Test crawler detection (fake Discord user-agent)
curl -H "User-Agent: Mozilla/5.0 (compatible; Discordbot/2.0)" \
     http://localhost:8787/harmony/?dye=5771
```

### Type Checking

```bash
npm run type-check
```

## Deployment

### Deploy to Default Environment

```bash
npm run deploy
```

### Deploy to Production

```bash
npm run deploy:production
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_BASE_URL` | Base URL of the main XIV Dye Tools app |
| `OG_IMAGE_BASE_URL` | Base URL for OG image generation |

### wrangler.toml

Key configuration options:

```toml
# Worker name
name = "xivdyetools-og-worker"

# Route patterns to intercept
routes = [
  { pattern = "xivdyetools.app/harmony/*", zone_name = "xivdyetools.app" },
  # ... more routes
]

# Analytics Engine for tracking
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "xivdyetools_og_analytics"

# Font file handling
[[rules]]
type = "Data"
globs = ["**/*.ttf"]
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `hono` | Lightweight web framework for Cloudflare Workers |
| `@resvg/resvg-wasm` | SVG → PNG rendering via WebAssembly |
| `@xivdyetools/core` | FFXIV dye database and color utilities |
| `@xivdyetools/types` | Shared TypeScript types |

## Design Decisions

### Why SVG → PNG instead of Satori/React?

While Satori (used by Vercel OG) is popular, we chose manual SVG generation because:
1. **Smaller bundle size** - No React runtime needed
2. **Full control** - Precise pixel-level layout for complex visualizations
3. **Performance** - Direct string concatenation is fast at the edge

### Why resvg-wasm?

- Pure WebAssembly - runs anywhere without native dependencies
- Excellent text rendering with embedded fonts
- Supports all SVG features we need

### Character Color Position Display

The Swatch tool shows where the input color appears in the FFXIV character creator (e.g., "Eye Colors - Row 4, Col 3"). This uses an 8-column grid matching the in-game UI.

## License

MIT
