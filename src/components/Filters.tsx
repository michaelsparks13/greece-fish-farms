'use client';

import { SearchIcon } from './SearchIcon';
import type { Filters as FiltersType, TypeFilter, CoastDistFilter } from '@/lib/types';

interface Props {
  filters: FiltersType;
  onFiltersChange: (patch: Partial<FiltersType>) => void;
  onClear: () => void;
  resultsCount: number;
  categories: string[];
}

const COAST_OPTIONS: { value: CoastDistFilter; label: string }[] = [
  { value: 'all', label: 'All Distances' },
  { value: '0-200', label: '< 200 m' },
  { value: '200-500', label: '200 – 500 m' },
  { value: '500-1000', label: '500 m – 1 km' },
  { value: '1000+', label: 'Over 1 km' },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'finfish', label: 'Fed' },
  { value: 'shellfish', label: 'Non-fed' },
];

export function Filters({ filters, onFiltersChange, onClear, resultsCount, categories }: Props) {
  return (
    <>
      <div className="filters">
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            id="search"
            placeholder="Search by owner or site ID..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Type</label>
          <div className="filter-buttons" id="type-filter">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`filter-btn${filters.type === opt.value ? ' active' : ''}`}
                onClick={() => onFiltersChange({ type: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Farm Category</label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => onFiltersChange({ category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Coastal Distance</label>
          <select
            id="coast-dist-filter"
            value={filters.coastDist}
            onChange={(e) => onFiltersChange({ coastDist: e.target.value as CoastDistFilter })}
          >
            {COAST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="results-header">
        <span id="results-count">{resultsCount} results</span>
        <button type="button" className="clear-btn" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </>
  );
}
