import type { FeatureCollection } from 'geojson';

export type FarmType = 'finfish' | 'shellfish';

export interface Farm {
  type: FarmType;
  id: string;
  owner: string;
  category: string;
  production: string;
  stage: string;
  species: string;
  coastDist: number;
  status: string;
  eurostat: string;
  euroSpecies: string;
  euroSpeciesLatin: string;
  coords: [number, number];
}

export interface GeoData {
  finfish: FeatureCollection;
  shellfish: FeatureCollection;
  poay: FeatureCollection;
  abandoned: FeatureCollection;
  natura2000: FeatureCollection;
}

export type TypeFilter = 'all' | FarmType;
export type CoastDistFilter = 'all' | '0-200' | '200-500' | '500-1000' | '1000+';

export interface Filters {
  search: string;
  type: TypeFilter;
  category: string;
  coastDist: CoastDistFilter;
}

export interface LayerToggles {
  finfish: boolean;
  shellfish: boolean;
  abandoned: boolean;
  poay: boolean;
  natura2000: boolean;
}
