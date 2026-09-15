/**
 * Painel de varredura de win rate por mapa no Balance Lab.
 * Consome `GET /api/combat-sim-sweep` e destaca as fases fora da faixa-alvo.
 */
import type { MapSweepSummary, PhaseSweepRow, WinRateVerdict } from './combatSimCatalog';

type SweepResponse = (MapSweepSummary & { ok: true }) | { ok: false; error: string };

const VERDICT_CLASS: Record<WinRateVerdict, string> = {
  too_hard: 'cs-sweep-row--hard',
  in_band: 'cs-sweep-row--band',
  too_easy: 'cs-sweep-row--easy',
};

const VERDICT_LABEL: Record<WinRateVerdict, string> = {
  too_hard: 'difícil',
  in_band: 'na faixa',
  too_easy: 'fácil',
};

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

/** Fetch da varredura; erros viram objeto `{ ok: false }` para render uniforme. */
export async function fetchSweep(
  mapId: string,
  opts: { profile?: string; runs?: number; seed?: number } = {},
): Promise<SweepResponse> {
  const params = new URLSearchParams({ mapId });
  if (opts.profile) params.set('profile', opts.profile);
  if (opts.runs) params.set('runs', String(opts.runs));
  if (opts.seed !== undefined) params.set('seed', String(opts.seed));
  try {
    const res = await fetch(`/api/combat-sim-sweep?${params.toString()}`);
    return (await res.json()) as SweepResponse;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function rowHtml(row: PhaseSweepRow): string {
  return `<tr class="${VERDICT_CLASS[row.verdict]}">
    <td>${row.phaseId}</td>
    <td class="cs-sweep-num">Lv${row.partyLevel}</td>
    <td class="cs-sweep-num"><strong>${pct(row.winRate)}</strong></td>
    <td class="cs-sweep-num">${row.avgCombatTime.toFixed(1)}s</td>
    <td>${VERDICT_LABEL[row.verdict]}</td>
  </tr>`;
}

function summaryHtml(data: MapSweepSummary): string {
  const rows = data.phases.map(rowHtml).join('');
  const outliers = data.outliers.length
    ? data.outliers
        .map((o) => `<code>${o.phaseId}</code> ${pct(o.winRate)} (${VERDICT_LABEL[o.verdict]})`)
        .join(' · ')
    : 'nenhum — todas dentro da faixa';

  return `
    <div class="cs-sweep-result">
      <div class="lab-totals-row cs-batch-row">
        <div class="lab-stat lab-stat--compact"><strong>${data.inBand}</strong><span>na faixa</span></div>
        <div class="lab-stat lab-stat--compact"><strong>${data.tooHard}</strong><span>difíceis</span></div>
        <div class="lab-stat lab-stat--compact"><strong>${data.tooEasy}</strong><span>fáceis</span></div>
      </div>
      <p class="lab-hint">Faixa-alvo ${pct(data.band.min)}–${pct(data.band.max)} · perfil <strong>${data.profile}</strong> · ${data.runsPerPhase}× por fase</p>
      <p class="lab-hint cs-sweep-outliers"><strong>Fora da faixa:</strong> ${outliers}</p>
      <table class="ea-table cs-sweep-table">
        <thead><tr><th>Fase</th><th>Nível</th><th>Win%</th><th>Tempo</th><th>Veredito</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/**
 * HTML do painel. Sem mapa selecionado, orienta o uso; a varredura só roda sob demanda.
 */
export function renderSweepPanelHtml(mapId: string): string {
  const disabled = mapId ? '' : 'disabled';
  const hint = mapId
    ? `Roda o simulador headless em todas as fases de <code>${mapId}</code> no nível projetado de chegada.`
    : 'Selecione um <strong>mapa</strong> no filtro acima para varrer o win rate por fase.';

  return `
    <div class="mb-sweep" id="mb-sweep">
      <h3>Varredura de win rate</h3>
      <p class="lab-hint">${hint}</p>
      <div class="cs-action-row">
        <select id="mb-sweep-profile" class="cs-runs-select" aria-label="Perfil da party">
          <option value="geared" selected>Equipado (Core)</option>
          <option value="naked">Sem gear (piso)</option>
          <option value="optimal">Otimizado (teto)</option>
        </select>
        <select id="mb-sweep-runs" class="cs-runs-select" aria-label="Runs por fase">
          <option value="10">10× (rápido, ruidoso)</option>
          <option value="20" selected>20×</option>
          <option value="30">30× (estável)</option>
        </select>
        <button type="button" class="lab-btn--info" id="mb-sweep-run" ${disabled}>▶️ Varrer mapa</button>
      </div>
      <div id="mb-sweep-result"></div>
    </div>`;
}

/**
 * Liga o botão de varredura. `getMapId` é lido no clique (o filtro pode mudar).
 */
export function bindSweepPanel(host: HTMLElement, getMapId: () => string): void {
  const button = host.querySelector<HTMLButtonElement>('#mb-sweep-run');
  const resultEl = host.querySelector<HTMLElement>('#mb-sweep-result');
  if (!button || !resultEl) return;

  button.addEventListener('click', () => {
    const mapId = getMapId();
    if (!mapId) {
      resultEl.innerHTML = '<p class="lab-hint is-error">Selecione um mapa primeiro.</p>';
      return;
    }
    const profile = host.querySelector<HTMLSelectElement>('#mb-sweep-profile')?.value || 'geared';
    const runs = parseInt(host.querySelector<HTMLSelectElement>('#mb-sweep-runs')?.value ?? '20', 10) || 20;

    resultEl.innerHTML = '<p class="lab-hint">Varrendo fases… pode levar alguns segundos.</p>';
    button.disabled = true;
    void fetchSweep(mapId, { profile, runs, seed: 7 })
      .then((data) => {
        resultEl.innerHTML = data.ok
          ? summaryHtml(data)
          : `<p class="lab-hint is-error">Erro: ${data.error}</p>`;
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}
