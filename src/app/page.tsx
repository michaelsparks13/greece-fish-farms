'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Legend } from '@/components/Legend';
import { DetailPanel, type DetailContent } from '@/components/DetailPanel';
import { MethodologyModal } from '@/components/MethodologyModal';
import { TableView } from '@/components/TableView';
import {
  loadAllData,
  processFarms,
  getCategories,
  applyFarmFilters,
} from '@/lib/data';
import type {
  Farm,
  Filters,
  GeoData,
  LayerToggles,
} from '@/lib/types';

const MapView = dynamic(() => import('@/components/Map').then((m) => m.MapView), {
  ssr: false,
});
const Minimap = dynamic(() => import('@/components/Minimap').then((m) => m.Minimap), {
  ssr: false,
});

const INITIAL_FILTERS: Filters = {
  search: '',
  type: 'all',
  category: 'all',
  coastDist: 'all',
};

const INITIAL_TOGGLES: LayerToggles = {
  finfish: true,
  shellfish: true,
  abandoned: true,
  poay: true,
  natura2000: true,
};

export default function Page() {
  const [data, setData] = useState<GeoData | null>(null);
  const [allFarms, setAllFarms] = useState<Farm[]>([]);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [toggles, setToggles] = useState<LayerToggles>(INITIAL_TOGGLES);
  const [activeTab, setActiveTab] = useState<'map' | 'table'>('map');
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailContent>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flySignal, setFlySignal] = useState<{ farm: Farm; nonce: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllData()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setAllFarms(processFarms(d));
      })
      .catch((e) => console.error('Failed to load data', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => getCategories(allFarms), [allFarms]);
  const filteredFarms = useMemo(
    () => applyFarmFilters(allFarms, filters),
    [allFarms, filters]
  );

  const onFiltersChange = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const onClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const onTabChange = useCallback((tab: 'map' | 'table') => {
    setActiveTab(tab);
    if (tab === 'table') {
      setDetail(null);
    }
  }, []);

  const onSelectFarmFromSidebar = useCallback(
    (farm: Farm) => {
      if (activeTab === 'table') setActiveTab('map');
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
        setSidebarOpen(false);
      }
      setActiveFarmId(farm.id);
      setDetail({ kind: 'farm', farm });
      setFlySignal({ farm, nonce: Date.now() });
    },
    [activeTab]
  );

  const onSelectFarmFromMap = useCallback((farm: Farm) => {
    setActiveFarmId(farm.id);
    setDetail({ kind: 'farm', farm });
  }, []);

  const onSelectPoay = useCallback((props: Record<string, unknown>) => {
    setDetail({ kind: 'poay', props });
  }, []);

  const onEmptyMapClick = useCallback(() => {
    setDetail(null);
    setActiveFarmId(null);
  }, []);

  const onCloseDetail = useCallback(() => {
    setDetail(null);
    setActiveFarmId(null);
  }, []);

  const onToggleLayer = useCallback((key: keyof LayerToggles) => {
    setToggles((t) => ({ ...t, [key]: !t[key] }));
  }, []);

  return (
    <>
      <div id="app">
        <Sidebar
          open={sidebarOpen}
          activeTab={activeTab}
          data={data}
          allFarms={allFarms}
          filteredFarms={filteredFarms}
          categories={categories}
          filters={filters}
          activeFarmId={activeFarmId}
          onTabChange={onTabChange}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
          onSelectFarm={onSelectFarmFromSidebar}
          onOpenMethodology={() => setMethodologyOpen(true)}
        />
        <div
          id="sidebar-overlay"
          className={sidebarOpen ? 'active' : ''}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          id="map-container"
          style={{ display: activeTab === 'map' ? undefined : 'none' }}
        >
          <button
            type="button"
            id="sidebar-toggle"
            className="sidebar-toggle"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          {data && (
            <MapView
              data={data}
              allFarms={allFarms}
              filters={filters}
              toggles={toggles}
              flySignal={flySignal}
              onSelectFarm={onSelectFarmFromMap}
              onSelectPoay={onSelectPoay}
              onEmptyClick={onEmptyMapClick}
            />
          )}
          <Legend toggles={toggles} onToggle={onToggleLayer} />
          <Minimap />
        </div>
        <TableView visible={activeTab === 'table'} filteredFarms={filteredFarms} />
      </div>
      {activeTab === 'map' && <DetailPanel content={detail} onClose={onCloseDetail} />}
      <MethodologyModal open={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
    </>
  );
}
