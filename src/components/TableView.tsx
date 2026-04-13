'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Farm } from '@/lib/types';
import { SearchIcon } from './SearchIcon';
import { formatCoastDist, generateCSV, downloadCSV } from '@/lib/data';

const ROWS_PER_PAGE = 100;

type SortField =
  | 'owner'
  | 'type'
  | 'category'
  | 'species'
  | 'production'
  | 'stage'
  | 'coastDist'
  | 'status'
  | 'eurostat'
  | 'id'
  | 'lat'
  | 'lng';

interface Column {
  key: SortField;
  label: string;
  info?: string;
}

const COLUMNS: Column[] = [
  { key: 'owner', label: 'Owner' },
  {
    key: 'type',
    label: 'Type',
    info:
      'Fed species (e.g. sea bass, sea bream) are carnivorous or omnivorous and, when farmed, are often fed fishmeal reduced from wild-caught fish. Non-fed species (e.g. mussels) are filter feeders that consume algae and plankton.',
  },
  { key: 'category', label: 'Category', info: 'The farm classification such as cage-based, pond, or hatchery' },
  { key: 'species', label: 'Species' },
  { key: 'production', label: 'Production' },
  { key: 'stage', label: 'Stage' },
  { key: 'coastDist', label: 'Coast Dist.' },
  { key: 'status', label: 'Status' },
  { key: 'eurostat', label: 'Eurostat', info: 'EU statistical classification code used for harmonized aquaculture reporting' },
  { key: 'id', label: 'Site ID' },
  { key: 'lat', label: 'Lat' },
  { key: 'lng', label: 'Lon' },
];

interface Props {
  visible: boolean;
  filteredFarms: Farm[];
}

function getFarmValue(farm: Farm, key: SortField): string | number {
  if (key === 'lat') return farm.coords[1];
  if (key === 'lng') return farm.coords[0];
  return (farm as unknown as Record<string, string | number>)[key];
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

export function TableView({ visible, filteredFarms }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('owner');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filteredFarms]);

  const searched = useMemo(() => {
    if (!debouncedSearch) return filteredFarms;
    const s = debouncedSearch.toLowerCase();
    return filteredFarms.filter(
      (f) =>
        f.owner.toLowerCase().includes(s) ||
        f.id.toLowerCase().includes(s) ||
        f.species.toLowerCase().includes(s) ||
        f.category.toLowerCase().includes(s)
    );
  }, [debouncedSearch, filteredFarms]);

  const sorted = useMemo(() => {
    const numeric = sortField === 'lat' || sortField === 'lng' || sortField === 'coastDist';
    return [...searched].sort((a, b) => {
      let av = getFarmValue(a, sortField);
      let bv = getFarmValue(b, sortField);
      if (numeric) {
        const an = Number(av) || 0;
        const bn = Number(bv) || 0;
        return sortDir === 'asc' ? an - bn : bn - an;
      }
      av = String(av ?? '').toLowerCase();
      bv = String(bv ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searched, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const pages = getPageNumbers(safePage, totalPages);

  const onHeaderClick = (key: SortField) => {
    if (sortField === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const onDownload = () => {
    const csv = generateCSV(searched);
    downloadCSV(csv, 'greece-fish-farms.csv');
  };

  const changePage = (p: number) => {
    setPage(p);
    if (wrapperRef.current) wrapperRef.current.scrollTop = 0;
  };

  return (
    <div id="table-container" className={visible ? '' : 'hidden'}>
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search-box">
            <SearchIcon size={14} />
            <input
              type="text"
              id="table-search"
              placeholder="Search farms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="table-count">{searched.length} farms</span>
        </div>
        <div className="table-toolbar-right">
          <button type="button" className="download-btn" onClick={onDownload}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>
      <div className="table-wrapper" ref={wrapperRef}>
        <table id="data-table">
          <thead>
            <tr id="table-header">
              {COLUMNS.map((col) => {
                const isSorted = sortField === col.key;
                const arrow = isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
                return (
                  <th
                    key={col.key}
                    className={isSorted ? 'sorted' : ''}
                    onClick={() => onHeaderClick(col.key)}
                  >
                    {col.info && (
                      <span
                        className="col-info"
                        data-tip={col.info}
                        onClick={(e) => e.stopPropagation()}
                      >
                        &#9432;
                      </span>
                    )}
                    {col.label}
                    <span className="sort-icon">{arrow}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((farm) => (
              <tr key={`${farm.type}-${farm.id}`}>
                <td>{farm.owner || 'N/A'}</td>
                <td>{farm.type === 'finfish' ? 'Fed' : 'Non-fed'}</td>
                <td>{farm.category || 'N/A'}</td>
                <td>{farm.species || 'N/A'}</td>
                <td>{farm.production || 'N/A'}</td>
                <td>{farm.stage || 'N/A'}</td>
                <td>{formatCoastDist(farm.coastDist)}</td>
                <td>{farm.status || 'N/A'}</td>
                <td>{farm.eurostat || 'N/A'}</td>
                <td>{farm.id}</td>
                <td>{farm.coords[1].toFixed(4)}</td>
                <td>{farm.coords[0].toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            type="button"
            className="page-btn"
            disabled={safePage === 1}
            onClick={() => changePage(safePage - 1)}
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} className="page-ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`page-btn${p === safePage ? ' active' : ''}`}
                onClick={() => changePage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="page-btn"
            disabled={safePage === totalPages}
            onClick={() => changePage(safePage + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
