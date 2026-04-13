'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MLMap } from 'maplibre-gl';

export function Minimap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light' }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      },
      center: [23.4, 40.9],
      zoom: 0.5,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    const greeceBounds = [
      [19.3, 34.5],
      [29.7, 34.5],
      [29.7, 42.0],
      [19.3, 42.0],
      [19.3, 34.5],
    ];

    map.on('load', () => {
      map.addSource('viewport-box', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [greeceBounds] },
        },
      });
      map.addLayer({
        id: 'viewport-outline',
        type: 'line',
        source: 'viewport-box',
        paint: { 'line-color': '#e74c3c', 'line-width': 1.125 },
      });

      map.addSource('globe-labels', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { name: 'Europe', size: 'continent' }, geometry: { type: 'Point', coordinates: [15, 50] } },
            { type: 'Feature', properties: { name: 'Africa', size: 'continent' }, geometry: { type: 'Point', coordinates: [22, 28] } },
          ],
        },
      });
      map.addLayer({
        id: 'globe-labels-layer',
        type: 'symbol',
        source: 'globe-labels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': ['case', ['==', ['get', 'size'], 'continent'], 7, 5],
          'text-font': ['Open Sans Regular'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': [
            'case',
            ['==', ['get', 'size'], 'continent'],
            'rgba(80, 80, 80, 0.7)',
            'rgba(100, 100, 100, 0.6)',
          ],
          'text-halo-color': 'rgba(255, 255, 255, 0.5)',
          'text-halo-width': 0.5,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div id="minimap" ref={containerRef} />;
}
