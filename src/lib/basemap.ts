import type { Map as MLMap } from 'maplibre-gl';

// Next.js inlines `process.env.NEXT_PUBLIC_*` at build time by literal text
// substitution, so this must stay a direct property access (no destructuring,
// no dynamic key). An empty string here means the key was missing at build.
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

export type BasemapId = 'backdrop-dark' | 'backdrop-light';

/**
 * URL of a MapTiler Cloud vector style. CARTO's free raster basemaps started
 * requiring an API key (they now render an "API KEY REQUIRED" watermark), so
 * the site moved to MapTiler, which the China fish-farms map already uses.
 */
export function basemapStyleUrl(id: BasemapId): string {
  if (!MAPTILER_KEY) {
    console.warn(
      'NEXT_PUBLIC_MAPTILER_KEY was not set at build time — basemap tiles will ' +
        'fail with 403. Add it to app/.env.local for local dev and to the GitHub ' +
        'Actions secret for deploys.'
    );
  }
  return `https://api.maptiler.com/maps/${id}/style.json?key=${MAPTILER_KEY}`;
}

/**
 * Turn the loaded MapTiler style into a flat, label-free backdrop: drop every
 * symbol (text/icon) layer and the hillshade layer. The app draws its own
 * country labels on top, and the previous CARTO "nolabels" tiles had no relief.
 * Call from a `style.load` handler, before the first render.
 */
export function flattenBasemap(map: MLMap): void {
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    if (layer.type === 'symbol' || layer.type === 'hillshade') {
      map.removeLayer(layer.id);
    }
  }
}
