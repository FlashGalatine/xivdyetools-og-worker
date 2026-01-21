import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts', // Entry point with Hono routes - tested via integration tests
        'src/services/fonts.ts', // Requires binary font imports
        'src/services/renderer.ts', // Requires WASM initialization
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
    // Enable experimental import attributes support for JSON modules
    server: {
      deps: {
        inline: ['@xivdyetools/core', '@xivdyetools/types'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
