/**
 * Post-build step: generate the service worker.
 *
 * WHY: vite-plugin-pwa writes sw.js from its closeBundle hook, but that hook
 * is not invoked under Vite 8 (rolldown) — the build finishes with
 * registerSW.js present but sw.js missing, so every page load logs a 404
 * when the registration script requests /sw.js. This script generates the
 * same workbox SW deterministically after `vite build`.
 *
 * Precached assets are hashed by Vite, so the SW updates itself whenever the
 * bundle changes. Icons/manifest are excluded (no-cache headers + query
 * cache-busting handle those).
 */
import { generateSW } from 'workbox-build';

const result = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,css,html,png,svg,json}'],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
});

console.log(`sw.js generated: ${result.count} files precached (${result.size} bytes)`);
