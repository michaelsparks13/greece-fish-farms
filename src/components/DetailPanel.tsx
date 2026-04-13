'use client';

import type { Farm } from '@/lib/types';

export type DetailContent =
  | { kind: 'farm'; farm: Farm }
  | { kind: 'poay'; props: Record<string, unknown> }
  | null;

interface Props {
  content: DetailContent;
  onClose: () => void;
}

function formatDist(coastDist: number): string {
  return coastDist > 1000
    ? `${(coastDist / 1000).toFixed(1)} km`
    : `${Math.round(coastDist)} m`;
}

export function DetailPanel({ content, onClose }: Props) {
  const hidden = content === null;
  return (
    <div className={`detail-panel${hidden ? ' hidden' : ''}`} id="detail-panel">
      <button type="button" className="close-btn" id="close-detail" onClick={onClose}>
        ×
      </button>
      <div id="detail-content">
        {content?.kind === 'farm' && <FarmDetail farm={content.farm} />}
        {content?.kind === 'poay' && <PoayDetail props={content.props} />}
      </div>
    </div>
  );
}

function FarmDetail({ farm }: { farm: Farm }) {
  const distLabel = formatDist(farm.coastDist);
  return (
    <>
      <div className="detail-title">{farm.id}</div>
      <div className="detail-subtitle">{farm.owner}</div>

      <div className="detail-section">
        <h3>Classification</h3>
        <div className="detail-field">
          <span className="detail-field-label">Type</span>
          <span className="detail-field-value">
            {farm.type === 'finfish' ? 'Fed' : 'Non-fed'}
          </span>
        </div>
        <div className={`detail-type-note ${farm.type}`}>
          {farm.type === 'finfish'
            ? 'Carnivorous or omnivorous — when farmed, often fed fishmeal reduced from wild-caught fish'
            : 'Filter feeder — consumes naturally occurring algae and plankton'}
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Category</span>
          <span className="detail-field-value">{farm.category}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Status</span>
          <span className="detail-field-value">{farm.status || 'N/A'}</span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Production</h3>
        <div className="detail-field">
          <span className="detail-field-label">Method</span>
          <span className="detail-field-value">{farm.production || 'N/A'}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Stage</span>
          <span className="detail-field-value">{farm.stage || 'N/A'}</span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Species</h3>
        <div className="detail-field">
          <span className="detail-field-label">Species</span>
          <span className="detail-field-value">{farm.species || 'N/A'}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Eurostat Group</span>
          <span className="detail-field-value">{farm.euroSpecies || 'N/A'}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Scientific Name</span>
          <span className="detail-field-value">{farm.euroSpeciesLatin || 'N/A'}</span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Location</h3>
        <div className="detail-field">
          <span className="detail-field-label">Coast Distance</span>
          <span className="detail-field-value">{distLabel}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Coordinates</span>
          <span className="detail-field-value">
            {farm.coords[1].toFixed(4)}, {farm.coords[0].toFixed(4)}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Eurostat</h3>
        <div className="detail-field">
          <span className="detail-field-label">Code</span>
          <span className="detail-field-value">{farm.eurostat || 'N/A'}</span>
        </div>
      </div>
    </>
  );
}

function PoayDetail({ props }: { props: Record<string, unknown> }) {
  const zoneEn = String(props.zone_en ?? '');
  const zoneGr = String(props.zone_gr ?? '');
  const nameGr = String(props.name_gr ?? '');
  return (
    <>
      <div className="detail-title">Fish Farm Expansion Zone</div>
      <div className="detail-subtitle">{zoneEn || zoneGr}</div>

      <div className="detail-section">
        <h3>Zone Information</h3>
        <div className="detail-field">
          <span className="detail-field-label">Name (EN)</span>
          <span className="detail-field-value">{zoneEn || 'N/A'}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Name (GR)</span>
          <span className="detail-field-value">{zoneGr || 'N/A'}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Designation</span>
          <span className="detail-field-value">{nameGr || 'N/A'}</span>
        </div>
      </div>

      <div className="detail-section">
        <h3>Background</h3>
        <p className="detail-note">
          Greece&apos;s 2011 aquaculture framework established 25 POAY zones nationwide, but more
          than a decade later only about half have been approved or are partially operational,
          with delays in completing the spatial planning framework undermining the government&apos;s
          own development goals.
        </p>
        <a
          className="detail-source-link"
          href="https://www.tovima.com/stories/europe-wants-more-fish-farms-is-greece-ready/"
          target="_blank"
          rel="noopener"
        >
          Source: ToVima
        </a>
      </div>
    </>
  );
}
