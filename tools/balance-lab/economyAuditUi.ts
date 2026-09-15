/**
 * UI da auditoria de economia no Balance Lab.
 * Inclui: ouro por fase, lojas, forja/salvage, sparklines e auditoria de inconsistências.
 */
import {
  getReferenceParty,
  renderPartyEditorHtml,
  bindPartyEditor,
  partyLabel,
  subscribePartyChange,
} from './referenceParty';
import { renderSparklineFigure, renderSparklinePair } from './sparkline';

// ── tipos locais (espelham os do catalog sem importar diretamente) ─────────────

interface PhaseRow {
  phaseId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  displayName: string;
  goldTotal: number;
  waveCount: number;
  enemyCount: number;
}

interface ShopItem {
  id: string;
  name: string;
  rarity: string;
  basePrice: number;
  effectivePrice: number;
}

interface ShopRow {
  shopId: string;
  shopName: string;
  tier: number;
  refreshCost: number;
  items: ShopItem[];
}

interface MapRow {
  mapId: string;
  mapName: string;
  mapIndex: number;
  phases: PhaseRow[];
  goldTotal: number;
  shops: ShopRow[];
}

interface ChapterOption {
  mainPhase: number;
  min: number;
  max: number;
  label: string;
}

interface ForgeSalvageRarityRow {
  rarity: string;
  nextRarity: string | null;
  canFuse: boolean;
  baseGold: number;
  goldByStage: Record<number, number>;
  fusionOpportunityCostByStage: Record<number, number>;
}

interface ForgeSalvagePhasesRow {
  rarity: string;
  refPriceTier10: number;
  epicRefPriceTier10: number;
  salvagesToAffordRef: number;
  salvagesToAffordEpic: number;
}

interface ForgeSalvagePayload {
  rarityRows: ForgeSalvageRarityRow[];
  phasesRows: ForgeSalvagePhasesRow[];
  fuseRequiredCount: number;
  refGoldPerPhaseTier10: number;
}

interface Payload {
  maps: MapRow[];
  chapters: ChapterOption[];
  forge?: ForgeSalvagePayload;
}

interface AuditIssue {
  severity: 'error' | 'warning' | 'info';
  kind: string;
  entity: string;
  message: string;
  deepLink?: string;
}

interface ConsistencyPayload {
  issues: AuditIssue[];
  counts: Record<string, number>;
  extremeStatMultiplierThreshold: number;
  generatedAt: string;
}

// ── state ─────────────────────────────────────────────────────────────────────

let payload: Payload | null = null;
let consistencyPayload: ConsistencyPayload | null = null;
let filterMapIndex: number | undefined;
let filterChapterMain: number | undefined;
let statusMessage = '';
let statusError = false;

// ── helpers ──────────────────────────────────────────────────────────────────

function setStatus(message: string, isError = false): void {
  statusMessage = message;
  statusError = isError;
  const el = document.getElementById('ea-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const json = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || json.ok === false) throw new Error(json.error || `HTTP ${response.status}`);
  return json;
}

function rarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'var(--rar-common)',
    uncommon: 'var(--rar-uncommon)',
    rare: 'var(--rar-rare)',
    epic: 'var(--rar-epic)',
    legendary: 'var(--rar-legendary)',
    mythic: 'var(--rar-mythic)',
  };
  return colors[rarity] ?? 'var(--text)';
}

function severityIcon(severity: 'error' | 'warning' | 'info'): string {
  if (severity === 'error') return '🔴';
  if (severity === 'warning') return '🟡';
  return '🔵';
}

// ── renders ──────────────────────────────────────────────────────────────────

function renderGoldSparkline(maps: MapRow[]): string {
  const allPhases = maps.flatMap((m) => m.phases);
  if (allPhases.length === 0) return '';

  const goldValues = allPhases.map((p) => p.goldTotal);
  const avgShopPrice = (() => {
    const items = maps.flatMap((m) => m.shops.flatMap((s) => s.items));
    if (items.length === 0) return 0;
    const total = items.reduce((sum, i) => sum + i.effectivePrice, 0);
    return Math.round(total / items.length);
  })();
  const epicPrice = (() => {
    const epics = maps
      .flatMap((m) => m.shops.flatMap((s) => s.items))
      .filter((i) => i.rarity === 'epic');
    if (epics.length === 0) return 0;
    return Math.round(epics.reduce((sum, i) => sum + i.effectivePrice, 0) / epics.length);
  })();

  const secondaryValues = avgShopPrice > 0 ? allPhases.map(() => avgShopPrice) : undefined;
  const thirdValues = epicPrice > 0 ? allPhases.map(() => epicPrice) : undefined;

  const parts: string[] = [
    renderSparklineFigure(goldValues, {
      label: 'Ouro por fase',
      caption: 'Ouro por fase',
      color: 'var(--accent, #d4a850)',
      secondaryValues,
      secondaryColor: 'var(--rar-rare, #4080d8)',
    }),
  ];

  if (thirdValues) {
    parts.push(
      renderSparklineFigure(allPhases.map(() => epicPrice), {
        label: 'Preço épico médio (referência horizontal)',
        caption: `Preço épico médio: ${epicPrice}`,
        color: 'var(--rar-epic, #c060e8)',
      }),
    );
  }

  const legendParts: string[] = [
    `<span style="color:var(--accent)">▬ ouro/fase</span>`,
  ];
  if (avgShopPrice > 0)
    legendParts.push(`<span style="color:var(--rar-rare)">- - média loja (${avgShopPrice})</span>`);
  if (epicPrice > 0)
    legendParts.push(`<span style="color:var(--rar-epic)">▬ preço épico (${epicPrice})</span>`);

  return `<div class="ea-sparkline-row" aria-label="Gráficos de ouro por fase vs preços de loja">
    ${parts.join('')}
    <p class="lab-hint ea-sparkline-legend">${legendParts.join(' · ')}</p>
  </div>`;
}

function renderForgeSection(forge: ForgeSalvagePayload): string {
  const stages = [1, 10, 25, 50, 100];
  const stageHeaders = stages.map((s) => `<th>Stage ${s}</th>`).join('');
  const stageHeadersFusion = stages
    .map((s) => `<th>Stage ${s}<br><small>(${forge.fuseRequiredCount}×)</small></th>`)
    .join('');

  const salvageRows = forge.rarityRows
    .map(
      (r) => `<tr>
        <td style="color:${rarityColor(r.rarity)}">${r.rarity}</td>
        <td>${r.baseGold}</td>
        ${stages.map((s) => `<td>${r.goldByStage[s] ?? '—'}</td>`).join('')}
      </tr>`,
    )
    .join('');

  const fusionRows = forge.rarityRows
    .filter((r) => r.canFuse)
    .map(
      (r) => `<tr>
        <td style="color:${rarityColor(r.rarity)}">${r.rarity} → ${r.nextRarity}</td>
        ${stages.map((s) => `<td>${r.fusionOpportunityCostByStage[s] ?? '—'}</td>`).join('')}
      </tr>`,
    )
    .join('');

  const phasesRows = forge.phasesRows
    .map(
      (r) => `<tr>
        <td style="color:${rarityColor(r.rarity)}">${r.rarity}</td>
        <td>${r.refPriceTier10}</td>
        <td>${r.salvagesToAffordRef}</td>
        <td>${r.epicRefPriceTier10}</td>
        <td>${r.salvagesToAffordEpic}</td>
      </tr>`,
    )
    .join('');

  // sparkline de gold por salvage em stage 10 para cada raridade
  const salvageGoldValues = forge.rarityRows.map((r) => r.goldByStage[10] ?? r.baseGold);

  return `<section class="ea-forge-section" aria-label="Forja e Salvage">
    <h3 class="hc-section">Forja / Salvage — Auditoria de Economia</h3>
    <p class="lab-hint">
      Ouro base salvage (stage 0) e por stage representativo.
      Custo de fusão = custo de oportunidade (${forge.fuseRequiredCount} itens × salvage).
      Referência: tier 10 (early). Ouro/fase tier 10: <strong>${forge.refGoldPerPhaseTier10}</strong>.
    </p>

    ${renderSparklineFigure(salvageGoldValues, {
      label: 'Ouro de salvage por raridade no stage 10',
      caption: 'Salvage gold por raridade (stage 10)',
      color: 'var(--rar-rare, #4080d8)',
    })}

    <h4>Salvage gold por stage</h4>
    <table class="ea-table">
      <thead><tr><th>Raridade</th><th>Base</th>${stageHeaders}</tr></thead>
      <tbody>${salvageRows}</tbody>
    </table>

    <h4>Custo de oportunidade da fusão (${forge.fuseRequiredCount}× salvage gold)</h4>
    <table class="ea-table">
      <thead><tr><th>Fusão</th>${stageHeadersFusion}</tr></thead>
      <tbody>${fusionRows}</tbody>
    </table>

    <h4>Salvages necessários para atingir preços (stage 10)</h4>
    <p class="lab-hint">Quanto salvar para acumular ouro equivalente ao preço de referência da raridade e ao preço épico.</p>
    <table class="ea-table">
      <thead>
        <tr>
          <th>Raridade</th>
          <th>Preço ref.</th><th>Salvages p/ ref.</th>
          <th>Preço épico</th><th>Salvages p/ épico</th>
        </tr>
      </thead>
      <tbody>${phasesRows}</tbody>
    </table>
  </section>`;
}

function renderConsistencySection(cp: ConsistencyPayload): string {
  if (cp.issues.length === 0) {
    return `<section class="ea-consistency-section">
      <h3 class="hc-section">Auditoria de Inconsistências</h3>
      <p class="lab-hint" style="color:var(--ok, #5a5)">✔ Nenhuma inconsistência encontrada.</p>
    </section>`;
  }

  const grouped: Record<string, AuditIssue[]> = {};
  for (const issue of cp.issues) {
    (grouped[issue.kind] ??= []).push(issue);
  }

  const countBadge = (count: number, sev: 'error' | 'warning' | 'info'): string =>
    `<span class="ea-audit-badge ea-audit-badge--${sev}">${count}</span>`;

  const summaryHtml = [
    cp.counts.error ? countBadge(cp.counts.error, 'error') + ` ${cp.counts.error} erro(s)` : '',
    cp.counts.warning
      ? countBadge(cp.counts.warning, 'warning') + ` ${cp.counts.warning} aviso(s)`
      : '',
    cp.counts.info ? countBadge(cp.counts.info, 'info') + ` ${cp.counts.info} info(s)` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const issueListHtml = cp.issues
    .map(
      (issue) =>
        `<li class="ea-audit-issue ea-audit-issue--${issue.severity}">
          <span class="ea-audit-sev">${severityIcon(issue.severity)}</span>
          <span class="ea-audit-msg">${issue.message}</span>
          ${
            issue.deepLink
              ? `<a href="${issue.deepLink}" class="ea-audit-link">→ abrir</a>`
              : ''
          }
        </li>`,
    )
    .join('');

  return `<section class="ea-consistency-section" aria-label="Auditoria de inconsistências">
    <h3 class="hc-section">Auditoria de Inconsistências
      <span class="xp-muted">${summaryHtml}</span>
    </h3>
    <p class="lab-hint">Limiar statMultiplier extremo: ${cp.extremeStatMultiplierThreshold}. Gerado: ${new Date(cp.generatedAt).toLocaleString('pt-BR')}.</p>
    <ul class="ea-audit-list" role="list">
      ${issueListHtml}
    </ul>
  </section>`;
}

export async function loadEconomyAudit(): Promise<void> {
  const params = new URLSearchParams();
  if (filterMapIndex !== undefined) params.set('mapIndex', String(filterMapIndex));
  if (filterChapterMain !== undefined) params.set('chapterMain', String(filterChapterMain));
  const data = await api<{ ok: boolean } & Payload>(`/api/economy-audit?${params}`);
  payload = { maps: data.maps, chapters: data.chapters, forge: data.forge };
}

async function loadConsistencyAudit(): Promise<void> {
  const data = await api<{ ok: boolean } & ConsistencyPayload>('/api/consistency-audit');
  consistencyPayload = {
    issues: data.issues,
    counts: data.counts,
    extremeStatMultiplierThreshold: data.extremeStatMultiplierThreshold,
    generatedAt: data.generatedAt,
  };
}

export function renderEconomyAudit(): void {
  const host = document.getElementById('lab-economy-audit');
  if (!host || !payload) return;

  const totalGold = payload.maps.reduce((sum, m) => sum + m.goldTotal, 0);
  const shopSummary = payload.maps.flatMap((m) => m.shops);
  const allItems = shopSummary.flatMap((s) => s.items);
  const cheapestItem = allItems.reduce((min, item) => (item.effectivePrice < min ? item.effectivePrice : min), Infinity);
  const mostExpensive = allItems.reduce((max, item) => (item.effectivePrice > max ? item.effectivePrice : max), 0);

  const currentParty = getReferenceParty();

  host.innerHTML = `
    <div class="xp-layout">
      <aside class="xp-sidebar">
        <p class="lab-hint">Ouro por fase + pool de lojas + forja/salvage + inconsistências. Leia-only.</p>
        <div class="mb-filter-row">
          <label>Mapa
            <select id="ea-map">
              <option value="">Todos os mapas</option>
              ${payload.maps
                .map((m) => `<option value="${m.mapIndex}" ${filterMapIndex === m.mapIndex ? 'selected' : ''}>${m.mapName}</option>`)
                .join('')}
            </select>
          </label>
          <label>Capítulo
            <select id="ea-chapter">
              <option value="">Todos os capítulos</option>
              ${payload.chapters
                .map(
                  (c) =>
                    `<option value="${c.mainPhase}" ${filterChapterMain === c.mainPhase ? 'selected' : ''}>${c.label}</option>`,
                )
                .join('')}
            </select>
          </label>
          <button type="button" class="lab-btn--info" id="ea-refresh">↺ Atualizar</button>
          <button type="button" class="lab-btn--warn" id="ea-audit-refresh">⚑ Re-auditar</button>
        </div>
        <div class="ea-summary">
          <p><strong>Ouro total visível:</strong> <span class="ea-gold">${totalGold.toLocaleString('pt-BR')}</span></p>
          ${shopSummary.length > 0 && allItems.length > 0
            ? `<p><strong>Lojas:</strong> ${shopSummary.length} · preços ${isFinite(cheapestItem) ? cheapestItem : '—'}–${mostExpensive || '—'}</p>`
            : ''}
        </div>
        <div id="ea-party-editor-wrap">
          ${renderPartyEditorHtml(currentParty)}
          <p class="lab-hint rp-economy-note">Party usada como referência de DPS nas métricas de poder (quando disponíveis).</p>
        </div>
        <p class="lab-hint"><strong>Party atual:</strong> <span id="ea-party-summary">${partyLabel(currentParty)}</span></p>
      </aside>
      <section class="xp-main">

        ${payload.maps.length > 0 ? renderGoldSparkline(payload.maps) : ''}

        ${payload.maps
          .map(
            (mapRow) => `
          <section class="ea-map-section">
            <h2 class="hc-section">Mapa ${mapRow.mapIndex} — ${mapRow.mapName}
              <span class="xp-muted">🪙 ${mapRow.goldTotal.toLocaleString('pt-BR')}</span>
            </h2>

            ${mapRow.phases.length > 0
              ? `<table class="ea-table">
                <thead>
                  <tr>
                    <th>Fase</th><th>Nome</th><th>Waves</th><th>Inimigos</th><th>Ouro</th>
                  </tr>
                </thead>
                <tbody>
                  ${mapRow.phases
                    .map(
                      (p) => `
                    <tr>
                      <td><code>${p.phaseId}</code></td>
                      <td>${p.displayName}</td>
                      <td>${p.waveCount}</td>
                      <td>${p.enemyCount}</td>
                      <td class="ea-gold">${p.goldTotal.toLocaleString('pt-BR')}</td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>`
              : '<p class="lab-hint">Nenhuma fase visível neste filtro.</p>'}

            ${mapRow.shops.length > 0
              ? `<h3 class="hc-section">Lojas do mapa ${mapRow.mapIndex}</h3>
                ${mapRow.shops
                  .map(
                    (shop) => `
                  <details class="ea-shop-card">
                    <summary>
                      <strong>${shop.shopName}</strong>
                      <span class="xp-muted">Tier ${shop.tier} · Renovar: ${shop.refreshCost} ouro</span>
                    </summary>
                    <table class="ea-table">
                      <thead>
                        <tr><th>Item</th><th>Raridade</th><th>Preço base</th><th>Preço efetivo</th></tr>
                      </thead>
                      <tbody>
                        ${shop.items
                          .map(
                            (item) => `
                          <tr>
                            <td>${item.name}</td>
                            <td style="color:${rarityColor(item.rarity)}">${item.rarity}</td>
                            <td>${item.basePrice}</td>
                            <td class="ea-gold">${item.effectivePrice}</td>
                          </tr>`,
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </details>`,
                  )
                  .join('')}`
              : ''}
          </section>`,
          )
          .join('')}

        ${payload.forge ? renderForgeSection(payload.forge) : ''}

        <div id="ea-consistency-host">
          ${consistencyPayload ? renderConsistencySection(consistencyPayload) : '<p class="lab-hint">Carregando auditoria de inconsistências…</p>'}
        </div>

        <p id="ea-status" class="lab-status${statusError ? ' is-error' : ''}" role="status">${statusMessage}</p>
      </section>
    </div>`;

  bindEconomyAudit(host);
}

function renderConsistencyHost(): void {
  const el = document.getElementById('ea-consistency-host');
  if (!el) return;
  el.innerHTML = consistencyPayload
    ? renderConsistencySection(consistencyPayload)
    : '<p class="lab-hint is-error">Falha ao carregar auditoria.</p>';
}

function bindEconomyAudit(host: HTMLElement): void {
  host.querySelector<HTMLSelectElement>('#ea-map')?.addEventListener('change', (event) => {
    const val = (event.target as HTMLSelectElement).value;
    filterMapIndex = val ? Number(val) : undefined;
  });

  host.querySelector<HTMLSelectElement>('#ea-chapter')?.addEventListener('change', (event) => {
    const val = (event.target as HTMLSelectElement).value;
    filterChapterMain = val ? Number(val) : undefined;
  });

  host.querySelector('#ea-refresh')?.addEventListener('click', () => {
    void loadEconomyAudit()
      .then(() => {
        renderEconomyAudit();
        setStatus('Auditoria atualizada.');
      })
      .catch((err: Error) => setStatus(err.message, true));
  });

  host.querySelector('#ea-audit-refresh')?.addEventListener('click', () => {
    void loadConsistencyAudit()
      .then(() => {
        renderConsistencyHost();
        setStatus('Auditoria de inconsistências atualizada.');
      })
      .catch((err: Error) => setStatus(err.message, true));
  });

  const partyEditorEl = host.querySelector<HTMLElement>('#rp-editor');
  if (partyEditorEl) {
    bindPartyEditor(partyEditorEl, (party) => {
      const summary = host.querySelector<HTMLElement>('#ea-party-summary');
      if (summary) summary.textContent = partyLabel(party);
    });
  }

  subscribePartyChange((party) => {
    const summary = host.querySelector<HTMLElement>('#ea-party-summary');
    if (summary) summary.textContent = partyLabel(party);
  });
}

export async function mountEconomyAuditTab(): Promise<void> {
  await Promise.all([
    loadEconomyAudit(),
    loadConsistencyAudit().catch(() => {
      /* auditoria não bloqueia a aba principal */
    }),
  ]);
  renderEconomyAudit();
  setStatus('Auditoria de economia carregada.');
}
