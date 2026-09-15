import { StageProgressDto, StageProgressMarkerDto } from '../../application/dto/StageProgressDto';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kindLabel(kind: StageProgressMarkerDto['kind']): string {
  if (kind === 'elite') return 'Elite';
  if (kind === 'boss') return 'Boss';
  if (kind === 'chest') return 'Baú';
  if (kind === 'portal') return 'Portal';
  return 'Wave';
}

function statusSuffix(status: StageProgressMarkerDto['status']): string {
  if (status === 'cleared') return 'concluído';
  if (status === 'current') return 'atual';
  return 'futuro';
}

function markerIcon(marker: StageProgressMarkerDto): string {
  if (marker.kind === 'trash') {
    const src = getAssetUrl(ASSETS.ui.stageSwords);
    if (src) {
      return `<img class="stage-progress-marker__icon" src="${src}" alt="" aria-hidden="true" />`;
    }
    return `<span class="stage-progress-marker__glyph" aria-hidden="true">⚔</span>`;
  }
  if (marker.kind === 'elite') {
    return `<span class="stage-progress-marker__glyph stage-progress-marker__glyph--crystal" aria-hidden="true">◆</span>`;
  }
  if (marker.kind === 'boss') {
    return `<span class="stage-progress-marker__glyph stage-progress-marker__glyph--crown" aria-hidden="true">♛</span>`;
  }
  if (marker.kind === 'chest') {
    const src = getAssetUrl(ASSETS.ui.stageChest);
    if (src) {
      return `<img class="stage-progress-marker__icon" src="${src}" alt="" aria-hidden="true" />`;
    }
    return `<span class="stage-progress-marker__glyph" aria-hidden="true">▣</span>`;
  }
  return `<span class="stage-progress-marker__glyph" aria-hidden="true">◎</span>`;
}

function renderMarker(marker: StageProgressMarkerDto): string {
  const leftPct = Math.round(marker.trackRatio * 1000) / 10;
  const name = kindLabel(marker.kind);

  return `
    <li
      class="stage-progress-marker stage-progress-marker--${marker.kind} stage-progress-marker--${marker.status}"
      data-stage-marker="${escapeHtml(marker.id)}"
      data-stage-kind="${marker.kind}"
      data-stage-status="${marker.status}"
      style="left: ${leftPct}%"
      title="${escapeHtml(name)} (${statusSuffix(marker.status)})"
      aria-label="${escapeHtml(name)}, ${statusSuffix(marker.status)}"
    >
      <span class="stage-progress-marker__medallion">${markerIcon(marker)}</span>
    </li>
  `;
}

export function renderStageProgressBar(progress: StageProgressDto): string {
  const fillPct = Math.round(Math.max(0, Math.min(1, progress.fillRatio)) * 100);

  return `
    <div
      class="stage-progress-bar"
      role="group"
      aria-label="Progresso da fase ${escapeHtml(progress.displayName)}"
      data-stage-progress
    >
      <div class="stage-progress-bar__frame" aria-hidden="true">
        <div class="stage-progress-bar__track">
          <div class="stage-progress-bar__fill" style="width: ${fillPct}%"></div>
        </div>
      </div>
      <ol class="stage-progress-bar__markers">
        ${progress.markers.map(renderMarker).join('')}
      </ol>
    </div>
  `;
}
