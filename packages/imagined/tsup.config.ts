import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom'],
    outDir: 'dist',
    splitting: false,
    sourcemap: true,
    minify: false,
    target: 'node16',
    bundle: true,
    treeshake: true
  },
  // CLI macro bundle
  {
    entry: ['src/macro.ts'],
    format: ['esm'],
    dts: true,
    clean: false, // Don't clean since we're using same outDir
    outDir: 'dist',
    splitting: false,
    sourcemap: false,
    minify: false,
    target: 'node16',
    bundle: true,
    banner: {
      js: '#!/usr/bin/env node'
    },
    external: []  // Bundle everything for CLI
  }
])