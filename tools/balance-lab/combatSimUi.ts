/**
 * Helpers de UI compartilhados para exibir resultados de simulação de combate.
 * Usado por missionBattlesUi.ts e enemyCombatUi.ts — sem duplicação de fetch/format.
 */
import type { BatchSimulationResult, EncounterSimulationResult } from './combatSimCatalog';
import { getReferenceParty, partyToQueryParam } from './referenceParty';

// ── Labels e formatação ────────────────────────────────────────────────────────

const OUTCOME_LABELS: Record<string, string> = {
  victory: '✅ Vitória',
  wipe: '☠️ Derrota',
  timeout: '⏳ Timeout',
};

const OUTCOME_CLASSES: Record<string, string> = {
  victory: 'cs-outcome--victory',
  wipe: 'cs-outcome--wipe',
  timeout: 'cs-outcome--timeout',
};

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function secs(n: number): string {
  return `${n.toFixed(1)}s`;
}

// ── Render HTML ────────────────────────────────────────────────────────────────

/**
 * Gera o HTML para exibir o resultado de uma simulação em batch.
 */
export function renderBatchResultHtml(data: BatchSimulationResult & { ok: boolean }, runs: number, phaseId?: string): string {
  const single = data.perRun[0] as EncounterSimulationResult | undefined;
  const outcomeClass = single ? OUTCOME_CLASSES[single.outcome] ?? '' : '';
  const outcomeLabel = single ? OUTCOME_LABELS[single.outcome] ?? single.outcome : '—';

  const heroRows = (single?.heroes ?? [])
    .map(
      (h) => `<tr>
        <td>${h.heroClass} Lv${h.level}</td>
        <td>${Math.round(h.remainingHp).toLocaleString('pt-BR')} / ${Math.round(h.maxHp).toLocaleString('pt-BR')}</td>
        <td>${pct(h.hpPercent)}</td>
      </tr>`,
    )
    .join('');

  const batchSection =
    runs > 1
      ? `<div class="lab-totals-row cs-batch-row">
          <div class="lab-stat lab-stat--compact"><strong>${pct(data.winRate)}</strong><span>Taxa vitória</span></div>
          <div class="lab-stat lab-stat--compact"><strong>${secs(data.avgCombatTime)}</strong><span>Tempo médio</span></div>
          <div class="lab-stat lab-stat--compact"><strong>${secs(data.minCombatTime)}–${secs(data.maxCombatTime)}</strong><span>Min–Max</span></div>
          <div class="lab-stat lab-stat--compact"><strong>${pct(data.avgHpPercent)}</strong><span>HP médio restante</span></div>
          <div class="lab-stat lab-stat--compact"><strong>${data.avgWavesCleared.toFixed(1)}</strong><span>Waves limpas (média)</span></div>
        </div>`
      : '';

  const phaseLabel = phaseId ? `<code>${phaseId}</code> · ` : '';

  return `
    <div class="mb-wave-power-summary cs-sim-result">
      <h4>▶️ Simulação real ${phaseLabel}${runs}× run${runs > 1 ? 's' : ''}</h4>
      ${batchSection}
      ${
        single
          ? `<div class="cs-single-run">
            <span class="cs-outcome ${outcomeClass}">${outcomeLabel}</span>
            <span class="lab-hint lab-hint--tight">${secs(single.combatTime)} · ${single.wavesCleared} wave${single.wavesCleared !== 1 ? 's' : ''} · ${single.enemiesKilled}/${single.totalEnemies} inimigos</span>
            ${
              heroRows
                ? `<table class="ea-table cs-hero-table">
                    <thead><tr><th>Herói</th><th>HP restante</th><th>%</th></tr></thead>
                    <tbody>${heroRows}</tbody>
                  </table>`
                : ''
            }
          </div>`
          : ''
      }
    </div>`;
}

// ── Fetch helper ───────────────────────────────────────────────────────────────

export interface CombatSimRequest {
  phaseId?: string;
  waveIndex?: number;
  slots?: Array<{ enemyType: string; role: string; count: number; level?: number }>;
  draftPhase?: {
    displayName?: string;
    difficultyTier?: number;
    statMultiplier?: number;
    waves: Array<{
      id?: string;
      goldMultiplier?: number;
      slots: Array<{
        enemyType: string;
        role: string;
        count: number;
        level?: number;
        displayName?: string;
      }>;
    }>;
  };
  party?: Array<{ heroClass: string; level: number }>;
  /** Preenche gear/atributos/skills da party: `naked` | `geared` | `optimal`. */
  profile?: string;
  runs?: number;
  seed?: number;
  maxSeconds?: number;
}

/**
 * Faz POST /api/combat-sim e retorna o resultado parseado.
 */
export async function fetchCombatSim(req: CombatSimRequest): Promise<BatchSimulationResult & { ok: boolean; error?: string }> {
  const res = await fetch('/api/combat-sim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<BatchSimulationResult & { ok: boolean; error?: string }>;
}

/**
 * Renderiza o resultado de simulação em um container DOM.
 * Limpa conteúdo anterior antes de inserir.
 */
export function renderSimResult(
  container: HTMLElement,
  data: (BatchSimulationResult & { ok: boolean; error?: string }) | null,
  runs: number,
  phaseId?: string,
): void {
  if (!data) {
    container.innerHTML = '<p class="lab-hint">Nenhum resultado.</p>';
    return;
  }
  if (!data.ok) {
    container.innerHTML = `<p class="lab-hint is-error">Erro: ${data.error ?? 'desconhecido'}</p>`;
    return;
  }
  container.innerHTML = renderBatchResultHtml(data, runs, phaseId);
}

// ── Widget de seleção de runs ──────────────────────────────────────────────────

/**
 * Renderiza um `<select>` de repetições para o usuário escolher quantas runs fazer.
 */
export function renderRunsSelectHtml(id: string, defaultValue = 1): string {
  return `<select id="${id}" class="cs-runs-select" aria-label="Número de simulações">
    <option value="1" ${defaultValue === 1 ? 'selected' : ''}>1×</option>
    <option value="5" ${defaultValue === 5 ? 'selected' : ''}>5×</option>
    <option value="20" ${defaultValue === 20 ? 'selected' : ''}>20×</option>
  </select>`;
}

/**
 * Lê o valor atual do select de runs.
 */
export function readRunsSelect(root: HTMLElement, id: string): number {
  const sel = root.querySelector<HTMLSelectElement>(`#${id}`);
  return sel ? parseInt(sel.value, 10) || 1 : 1;
}

// ── Widget de perfil de referência ─────────────────────────────────────────────

const PROFILE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'geared', label: 'Equipado (Core)' },
  { value: 'naked', label: 'Sem gear (piso)' },
  { value: 'optimal', label: 'Otimizado (teto)' },
];

/**
 * Seletor do build da party. Sem ele o sim roda com heróis pelados e o win rate
 * não representa o jogador real.
 */
export function renderProfileSelectHtml(id: string, defaultValue = 'geared'): string {
  const options = PROFILE_OPTIONS.map(
    (opt) =>
      `<option value="${opt.value}" ${opt.value === defaultValue ? 'selected' : ''}>${opt.label}</option>`,
  ).join('');
  return `<select id="${id}" class="cs-runs-select" aria-label="Perfil da party">${options}</select>`;
}

/**
 * Lê o perfil selecionado.
 */
export function readProfileSelect(root: HTMLElement, id: string, fallback = 'geared'): string {
  const sel = root.querySelector<HTMLSelectElement>(`#${id}`);
  return sel?.value || fallback;
}

/**
 * Retorna a party de referência do lab como array de {heroClass, level}.
 */
export function getRefPartyForApi(): Array<{ heroClass: string; level: number }> {
  return getReferenceParty().map((m) => ({ heroClass: m.heroClass, level: m.level }));
}

export { partyToQueryParam };
