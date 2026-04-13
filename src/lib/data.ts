import type { FeatureCollection, Feature } from 'geojson';
import type { Farm, GeoData, Filters, CoastDistFilter } from './types';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export async function loadAllData(): Promise<GeoData> {
  const [finfish, shellfish, poay, abandoned, natura2000] = await Promise.all([
    fetch(`${BASE}/data/finfish.geojson`).then((r) => r.json()),
    fetch(`${BASE}/data/shellfish.geojson`).then((r) => r.json()),
    fetch(`${BASE}/data/poay_zones.geojson`).then((r) => r.json()),
    fetch(`${BASE}/data/abandoned.geojson`).then((r) => r.json()),
    fetch(`${BASE}/data/natura2000_marine.geojson`).then((r) => r.json()),
  ]);
  return { finfish, shellfish, poay, abandoned, natura2000 };
}

export function processFarms(data: GeoData): Farm[] {
  const farms: Farm[] = [];

  data.finfish.features.forEach((f) => {
    const p = (f.properties || {}) as Record<string, unknown>;
    const coords = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
    farms.push({
      type: 'finfish',
      id: String(p.site_id ?? ''),
      owner: String(p.owner_name ?? ''),
      category: String(p.farm_type ?? ''),
      production: String(p.production ?? ''),
      stage: String(p.producti_1 ?? ''),
      species: String(p.species_so ?? ''),
      coastDist: Number(p.coast_dist) || 0,
      status: String(p.status ?? ''),
      eurostat: String(p.eurostatco ?? ''),
      euroSpecies: String(p.eurospecie ?? ''),
      euroSpeciesLatin: String(p.eurospeci0 ?? ''),
      coords,
    });
  });

  data.shellfish.features.forEach((f) => {
    const p = (f.properties || {}) as Record<string, unknown>;
    const coords = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
    const rawStatus = String(p.status ?? '');
    farms.push({
      type: 'shellfish',
      id: String(p.site_id ?? ''),
      owner: String(p.owner ?? ''),
      category: String(p.farmtype ?? ''),
      production: String(p.prod_metho ?? ''),
      stage: String(p.prod_stage ?? ''),
      species: String(p.species ?? ''),
      coastDist: Number(p.distance_t) || 0,
      status: !rawStatus || rawStatus.toLowerCase() === 'n.a.' ? 'Active' : rawStatus,
      eurostat: String(p.eurostatco ?? ''),
      euroSpecies: String(p.species_gr ?? ''),
      euroSpeciesLatin: String(p.species_na ?? ''),
      coords,
    });
  });

  return farms;
}

export function getCategories(farms: Farm[]): string[] {
  const set = new Set<string>();
  for (const f of farms) if (f.category && f.category !== 'n.a.') set.add(f.category);
  return Array.from(set).sort();
}

export function matchCoastDist(dist: number, range: CoastDistFilter): boolean {
  const d = Number(dist) || 0;
  switch (range) {
    case '0-200':
      return d < 200;
    case '200-500':
      return d >= 200 && d < 500;
    case '500-1000':
      return d >= 500 && d < 1000;
    case '1000+':
      return d >= 1000;
    default:
      return true;
  }
}

export function applyFarmFilters(farms: Farm[], filters: Filters): Farm[] {
  const s = filters.search.toLowerCase();
  return farms.filter((f) => {
    if (filters.type !== 'all' && f.type !== filters.type) return false;
    if (filters.category !== 'all' && f.category !== filters.category) return false;
    if (filters.coastDist !== 'all' && !matchCoastDist(f.coastDist, filters.coastDist)) return false;
    if (s) {
      if (
        !f.owner.toLowerCase().includes(s) &&
        !f.id.toLowerCase().includes(s) &&
        !f.species.toLowerCase().includes(s) &&
        !f.category.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });
}

export function filterGeoJson(
  fc: FeatureCollection,
  predicate: (f: Feature) => boolean
): FeatureCollection {
  return { type: 'FeatureCollection', features: fc.features.filter(predicate) };
}

export function filterMapFinfish(fc: FeatureCollection, filters: Filters): FeatureCollection {
  return filterGeoJson(fc, (feat) => {
    if (filters.type === 'shellfish') return false;
    const p = (feat.properties || {}) as Record<string, unknown>;
    if (filters.category !== 'all' && p.farm_type !== filters.category) return false;
    if (filters.coastDist !== 'all' && !matchCoastDist(Number(p.coast_dist) || 0, filters.coastDist))
      return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !String(p.owner_name ?? '').toLowerCase().includes(s) &&
        !String(p.site_id ?? '').toLowerCase().includes(s) &&
        !String(p.species_so ?? '').toLowerCase().includes(s) &&
        !String(p.farm_type ?? '').toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });
}

export function filterMapShellfish(fc: FeatureCollection, filters: Filters): FeatureCollection {
  return filterGeoJson(fc, (feat) => {
    if (filters.type === 'finfish') return false;
    const p = (feat.properties || {}) as Record<string, unknown>;
    if (filters.category !== 'all' && p.farmtype !== filters.category) return false;
    if (filters.coastDist !== 'all' && !matchCoastDist(Number(p.distance_t) || 0, filters.coastDist))
      return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !String(p.owner ?? '').toLowerCase().includes(s) &&
        !String(p.site_id ?? '').toLowerCase().includes(s) &&
        !String(p.species ?? '').toLowerCase().includes(s) &&
        !String(p.farmtype ?? '').toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.coastDist !== 'all' ||
    !!filters.search
  );
}

export function formatCoastDist(val: number): string {
  if (!val || val === 0) return 'N/A';
  return val > 1000 ? `${(val / 1000).toFixed(1)} km` : `${Math.round(val)} m`;
}

export function generateCSV(farms: Farm[]): string {
  const headers = [
    'Site ID', 'Owner', 'Type', 'Category', 'Species',
    'Production', 'Stage', 'Coast Distance (m)', 'Status', 'Eurostat Code',
    'Eurostat Species', 'Scientific Name', 'Lat', 'Lon',
  ];

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const str = String(v);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = farms.map((farm) =>
    [
      escape(farm.id),
      escape(farm.owner),
      escape(farm.type),
      escape(farm.category),
      escape(farm.species),
      escape(farm.production),
      escape(farm.stage),
      farm.coastDist || '',
      escape(farm.status),
      escape(farm.eurostat),
      escape(farm.euroSpecies),
      escape(farm.euroSpeciesLatin),
      farm.coords[1].toFixed(6),
      farm.coords[0].toFixed(6),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
