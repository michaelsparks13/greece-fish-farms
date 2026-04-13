'use client';

import { useEffect, useRef } from 'react';
import type { Farm } from '@/lib/types';

interface Props {
  farms: Farm[];
  activeId: string | null;
  onSelect: (farm: Farm) => void;
}

export function FarmList({ farms, activeId, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLDivElement>(
      `.farm-item[data-id="${CSS.escape(activeId)}"]`
    );
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  return (
    <div id="farm-list" className="farm-list" ref={listRef}>
      {farms.map((farm) => {
        const isActive = farm.id === activeId;
        return (
          <div
            key={`${farm.type}-${farm.id}`}
            className={`farm-item${isActive ? ' active' : ''}`}
            data-id={farm.id}
            onClick={() => onSelect(farm)}
          >
            <div className="farm-item-header">
              <span className="farm-item-name">{farm.owner || 'Unknown Owner'}</span>
              <span className={`farm-item-type type-${farm.type}`}>
                {farm.type === 'finfish' ? 'Fed' : 'Non-fed'}
              </span>
            </div>
            <div className="farm-item-meta">
              <span>{farm.category}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
