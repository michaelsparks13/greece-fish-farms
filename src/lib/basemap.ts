import type { Map as MLMap, StyleSpecification } from 'maplibre-gl';

// Next.js inlines `process.env.NEXT_PUBLIC_*` at build time by literal text
// substitution, so this must stay a direct property access (no destructuring,
// no dynamic key). An empty string here means the key was missing at build.
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

export type BasemapId = 'backdrop-dark' | 'backdrop-light';

const CARTO_VARIANT: Record<BasemapId, string> = {
  'backdrop-dark': 'dark_nolabels',
  'backdrop-light': 'light_nolabels',
};

const KEY_HELP =
  'Set NEXT_PUBLIC_MAPTILER_KEY in app/.env.local for local dev and in the deploy ' +
  'environment (Netlify site env vars / GitHub Actions secret). The key must also ' +
  'allow the page origin at https://cloud.maptiler.com/account/keys/';

/**
 * The basemap the site used before moving to MapTiler. CARTO now stamps an
 * "API KEY REQUIRED" watermark on these free raster tiles, but they still
 * render, so they are the safety net whenever MapTiler is unavailable.
 */
export function cartoFallbackStyle(id: BasemapId): StyleSpecification {
  const variant = CARTO_VARIANT[id];
  return {
    version: 8,
    sources: {
      'carto-fallback': {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
          `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      },
    },
    layers: [
      { id: 'carto-fallback-layer', type: 'raster', source: 'carto-fallback', minzoom: 0, maxzoom: 20 },
    ],
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  };
}

/**
 * Style to hand to `new maplibregl.Map()`: the MapTiler Cloud vector style
 * when a key was baked in at build time, otherwise the CARTO fallback.
 */
export function basemapStyle(id: BasemapId): string | StyleSpecification {
  if (!MAPTILER_KEY) {
    console.warn(`NEXT_PUBLIC_MAPTILER_KEY was not set at build time; using CARTO fallback tiles. ${KEY_HELP}`);
    return cartoFallbackStyle(id);
  }
  return `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`;
}

/**
 * Swap to the CARTO fallback if MapTiler rejects the style request, which
 * happens when the key is invalid or the page's origin is not on the key's
 * allow-list. Only the style.json request is watched: once a style has loaded,
 * its tiles are served under the same key and origin check.
 * Call right after constructing the map. Every `style.load` handler runs again
 * after the swap, so those handlers must be idempotent.
 */
export function installBasemapFallback(map: MLMap, id: BasemapId): void {
  let fellBack = false;
  map.on('error', (e) => {
    const err = (e as { error?: { status?: number; url?: string } }).error;
    if (fellBack || !err?.url) return;
    if (!err.url.includes('api.maptiler.com') || !err.url.includes('/style.json')) return;
    if (err.status !== 401 && err.status !== 403) return;
    fellBack = true;
    console.warn(`MapTiler rejected the style request (${err.status}); using CARTO fallback tiles. ${KEY_HELP}`);
    map.setStyle(cartoFallbackStyle(id));
  });
}

/**
 * Turn the loaded MapTiler style into a flat, label-free backdrop: drop every
 * symbol (text/icon) layer and the hillshade layer. The app draws its own
 * country labels on top, and the previous CARTO "nolabels" tiles had no relief.
 * Call from a `style.load` handler, before the first render. Harmless on the
 * CARTO fallback style, which has neither kind of layer.
 */
export function flattenBasemap(map: MLMap): void {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    if (layer.type === 'symbol' || layer.type === 'hillshade') {
      map.removeLayer(layer.id);
    }
  }
}
