/**
 * Aba Manutenção do Balance Lab.
 *
 * Funcionalidades:
 *  - Promoção segura de overrides para catálogo canônico (JSON-backed e TS-backed)
 *  - Histórico de backups com diff entre dois snapshots
 *  - Export / preview / import de Balance Pack (todos os overrides)
 */

const SCOPE_LABELS: Record<string, string> = {
  'gear-items': 'Itens (gear-items.catalog.json)',
  shops: 'Lojas (shops.catalog.json)',
  'phase-battle': 'Batalhas de missão (TS-backed — revisão manual)',
  'phase-reward': 'Recompensas de fase (TS-backed — revisão manual)',
  'hero-combat': 'Personagens (TS-backed — revisão manual)',
  'hero-level-xp': 'XP por nível (TS-backed — revisão manual)',
  'enemy-combat': 'Inimigos (TS-backed — revisão manual)',
  upgrades: 'Melhorias (TS-backed — revisão manual)',
};

const JSON_BACKED = new Set(['gear-items', 'shops']);

type DiffEntry = {
  path: string;
  before: unknown;
  after: unknown;
  kind: 'added' | 'removed' | 'changed';
};

type DiffResult = {
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: DiffEntry[];
};

type PackPreviewScope = {
  scope: string;
  changeCount: number;
  nonempty: boolean;
  diff: DiffResult;
};

let maintenanceMounted = false;
let pendingPack: unknown = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusEl(): HTMLElement | null {
  return document.getElementById('maint-status');
}

function setStatus(msg: string, isError = false): void {
  const el = getStatusEl();
  if (!el) return;
  el.textContent = msg;
  el.className = `lab-status${isError ? ' is-error' : ''}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function valueLabel(v: unknown): string {
  if (v === undefined) return '—';
  if (typeof v === 'string') return `"${escapeHtml(v)}"`;
  return escapeHtml(JSON.stringify(v) ?? '—');
}

// ── Promoção ─────────────────────────────────────────────────────────────────

async function fetchPreview(scope: string): Promise<void> {
  const container = document.getElementById('maint-preview-result');
  if (!container) return;
  container.innerHTML = '<p class="lab-hint">Carregando preview…</p>';

  try {
    const res = await fetch(`/api/promotion/preview?scope=${encodeURIComponent(scope)}`);
    const data = await res.json();

    if (!data.ok) {
      container.innerHTML = `<p class="lab-status is-error">${escapeHtml(data.error ?? 'Erro desconhecido')}</p>`;
      return;
    }

    if (data.tsBackedOnly) {
      const patchStr = JSON.stringify(data.patchJson, null, 2);
      container.innerHTML = `
        <div class="maint-ts-notice">
          <p class="lab-status is-error">
            ⚠ Catálogo TS-backed — <strong>revisão manual necessária</strong>.
            Copie o patch abaixo e aplique no arquivo TypeScript correspondente.
          </p>
          <p class="lab-hint">Chaves do override: ${escapeHtml((data.overrideKeys ?? []).join(', ') || '(vazio)')}</p>
          <button type="button" class="lab-btn--info" id="btn-copy-patch">Copiar patch JSON</button>
          <pre class="maint-patch-code">${escapeHtml(patchStr)}</pre>
        </div>
      `;
      document.getElementById('btn-copy-patch')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(patchStr);
          setStatus('Patch copiado!');
        } catch {
          setStatus('Não foi possível copiar.', true);
        }
      });
      return;
    }

    const diff: DiffResult = data.diff ?? { added: [], removed: [], changed: [] };
    const total = diff.added.length + diff.removed.length + diff.changed.length;

    if (total === 0) {
      container.innerHTML = `<p class="lab-hint">Nenhuma diferença encontrada. Override já está refletido no catálogo ou vazio.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="maint-diff-summary">
        <span class="maint-diff-badge maint-diff-badge--added">${diff.added.length} adicionados</span>
        <span class="maint-diff-badge maint-diff-badge--removed">${diff.removed.length} removidos</span>
        <span class="maint-diff-badge maint-diff-badge--changed">${diff.changed.length} alterados</span>
      </div>
      <div class="maint-diff-table-wrap">
        <table class="maint-diff-table">
          <thead><tr><th>Tipo</th><th>Caminho</th><th>Antes</th><th>Depois</th></tr></thead>
          <tbody>
            ${[...diff.added, ...diff.changed, ...diff.removed]
              .map(
                (entry) => `
              <tr class="maint-diff-row maint-diff-row--${entry.kind}">
                <td><span class="maint-diff-kind">${entry.kind}</span></td>
                <td class="maint-diff-path"><code>${escapeHtml(entry.path)}</code></td>
                <td class="maint-diff-val">${valueLabel(entry.before)}</td>
                <td class="maint-diff-val">${valueLabel(entry.after)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="maint-apply-row">
        <button type="button" class="lab-btn--warn" id="btn-apply-promotion" data-scope="${escapeHtml(scope)}">
          Aplicar ao catálogo e limpar override
        </button>
        <p class="lab-hint maint-apply-warning">
          ⚠ Ação irreversível (backup automático criado). Confirme antes de prosseguir.
        </p>
      </div>
    `;

    document.getElementById('btn-apply-promotion')?.addEventListener('click', () => {
      void applyPromotion(scope);
    });
  } catch (err) {
    container.innerHTML = `<p class="lab-status is-error">${escapeHtml(String(err))}</p>`;
  }
}

async function applyPromotion(scope: string): Promise<void> {
  const confirmed = window.confirm(
    `Incorporar os overrides de "${SCOPE_LABELS[scope] ?? scope}" ao catálogo JSON canônico?\n\n` +
      'Um backup de ambos os arquivos será criado. O override será zerado após a promoção.\n\n' +
      'Confirmar?',
  );
  if (!confirmed) return;

  setStatus('Aplicando promoção…');
  try {
    const res = await fetch('/api/promotion/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, confirmed: true }),
    });
    const data = await res.json();

    if (!data.ok) {
      setStatus(`Erro: ${data.error ?? 'Falha'}`, true);
      return;
    }

    const container = document.getElementById('maint-preview-result');
    if (container) {
      const total =
        (data.diff?.added?.length ?? 0) +
        (data.diff?.removed?.length ?? 0) +
        (data.diff?.changed?.length ?? 0);
      container.innerHTML = `
        <div class="maint-success">
          <p class="lab-status">✓ Promoção aplicada com sucesso em ${data.promotedAt ?? ''}.</p>
          <p class="lab-hint">${total} alterações incorporadas ao catálogo.</p>
          <p class="lab-hint">Backup do catálogo: <code>${escapeHtml(String(data.backupCatalogPath ?? '—'))}</code></p>
          <p class="lab-hint">Backup do override: <code>${escapeHtml(String(data.backupOverridePath ?? '—'))}</code></p>
          <p class="lab-hint lab-hint--tight">Faça rebuild da extensão para aplicar as mudanças ao jogo.</p>
        </div>
      `;
    }
    setStatus('Promoção aplicada.');
  } catch (err) {
    setStatus(`Erro: ${String(err)}`, true);
  }
}

// ── Diff de backups ───────────────────────────────────────────────────────────

async function loadBackupsForScope(scope: string): Promise<Array<{ id: string; path: string }>> {
  const res = await fetch(`/api/backups?scope=${encodeURIComponent(scope)}`);
  const data = await res.json();
  return data.ok ? (data.backups ?? []) : [];
}

async function fetchBackupDiff(): Promise<void> {
  const scopeSelect = document.getElementById('maint-diff-scope') as HTMLSelectElement | null;
  const aSelect = document.getElementById('maint-diff-a') as HTMLSelectElement | null;
  const bSelect = document.getElementById('maint-diff-b') as HTMLSelectElement | null;
  const container = document.getElementById('maint-diff-result');
  if (!scopeSelect || !aSelect || !bSelect || !container) return;

  const scope = scopeSelect.value;
  const a = aSelect.value;
  const b = bSelect.value;

  if (!a || !b) {
    setStatus('Selecione dois backups para comparar.', true);
    return;
  }
  if (a === b) {
    setStatus('Selecione backups diferentes para comparar.', true);
    return;
  }

  container.innerHTML = '<p class="lab-hint">Calculando diff…</p>';
  try {
    const url = `/api/backups/diff?scope=${encodeURIComponent(scope)}&a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      container.innerHTML = `<p class="lab-status is-error">${escapeHtml(data.error ?? 'Erro')}</p>`;
      return;
    }

    const diff: DiffResult = data.diff ?? { added: [], removed: [], changed: [] };
    const total = diff.added.length + diff.removed.length + diff.changed.length;

    if (total === 0) {
      container.innerHTML = `<p class="lab-hint">Snapshots idênticos — sem diferenças.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="maint-diff-summary">
        <span class="maint-diff-badge maint-diff-badge--added">${diff.added.length} adicionados</span>
        <span class="maint-diff-badge maint-diff-badge--removed">${diff.removed.length} removidos</span>
        <span class="maint-diff-badge maint-diff-badge--changed">${diff.changed.length} alterados</span>
      </div>
      <div class="maint-diff-table-wrap">
        <table class="maint-diff-table">
          <thead><tr><th>Tipo</th><th>Caminho</th><th>${escapeHtml(a)} (A)</th><th>${escapeHtml(b)} (B)</th></tr></thead>
          <tbody>
            ${[...diff.added, ...diff.changed, ...diff.removed]
              .map(
                (entry) => `
              <tr class="maint-diff-row maint-diff-row--${entry.kind}">
                <td><span class="maint-diff-kind">${entry.kind}</span></td>
                <td class="maint-diff-path"><code>${escapeHtml(entry.path)}</code></td>
                <td class="maint-diff-val">${valueLabel(entry.before)}</td>
                <td class="maint-diff-val">${valueLabel(entry.after)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="lab-status is-error">${escapeHtml(String(err))}</p>`;
  }
}

async function updateBackupSelects(scope: string): Promise<void> {
  const aSelect = document.getElementById('maint-diff-a') as HTMLSelectElement | null;
  const bSelect = document.getElementById('maint-diff-b') as HTMLSelectElement | null;
  if (!aSelect || !bSelect) return;

  const backups = await loadBackupsForScope(scope);
  const opts =
    backups.length === 0
      ? `<option value="">Nenhum backup disponível</option>`
      : backups.map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.id)}</option>`).join('');

  aSelect.innerHTML = `<option value="">— selecione A —</option>${opts}`;
  bSelect.innerHTML = `<option value="">— selecione B —</option>${opts}`;

  const container = document.getElementById('maint-diff-result');
  if (container) container.innerHTML = '';
}

// ── Balance Pack ──────────────────────────────────────────────────────────────

function downloadPackJson(pack: unknown, label?: string | null): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeLabel = (label ?? 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const blob = new Blob([`${JSON.stringify(pack, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `side-hero-balance-pack-${safeLabel || 'workspace'}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderPackDiffTable(diff: DiffResult, limit = 40): string {
  const rows = [...diff.added, ...diff.changed, ...diff.removed].slice(0, limit);
  if (rows.length === 0) return '<p class="lab-hint">Sem diferenças neste scope.</p>';
  const extra =
    diff.added.length + diff.removed.length + diff.changed.length > limit
      ? `<p class="lab-hint lab-hint--tight">Mostrando ${limit} de ${
          diff.added.length + diff.removed.length + diff.changed.length
        } alterações.</p>`
      : '';
  return `
    ${extra}
    <div class="maint-diff-table-wrap">
      <table class="maint-diff-table">
        <thead><tr><th>Tipo</th><th>Caminho</th><th>Antes</th><th>Depois</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (entry) => `
            <tr class="maint-diff-row maint-diff-row--${entry.kind}">
              <td><span class="maint-diff-kind">${entry.kind}</span></td>
              <td class="maint-diff-path"><code>${escapeHtml(entry.path)}</code></td>
              <td class="maint-diff-val">${valueLabel(entry.before)}</td>
              <td class="maint-diff-val">${valueLabel(entry.after)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function renderPackPreview(preview: {
  label: string | null;
  exportedAt: string;
  totalChanges: number;
  scopes: PackPreviewScope[];
}): void {
  const container = document.getElementById('maint-pack-preview');
  if (!container) return;

  container.innerHTML = `
    <div class="maint-diff-summary">
      <span class="maint-diff-badge maint-diff-badge--changed">${preview.totalChanges} alterações</span>
      <span class="xp-muted">${escapeHtml(preview.label ?? '(sem rótulo)')} · ${escapeHtml(
        preview.exportedAt,
      )}</span>
    </div>
    ${preview.scopes
      .map((row) => {
        const checked = row.changeCount > 0 ? 'checked' : '';
        const disabled = row.changeCount === 0 ? 'disabled' : '';
        return `
        <details class="maint-pack-scope" ${row.changeCount > 0 ? 'open' : ''}>
          <summary>
            <label>
              <input type="checkbox" data-pack-scope="${escapeHtml(row.scope)}" ${checked} ${disabled} />
              <strong>${escapeHtml(SCOPE_LABELS[row.scope] ?? row.scope)}</strong>
              <span class="xp-muted">${row.changeCount} mudança(s)${
                row.nonempty ? '' : ' · payload vazio'
              }</span>
            </label>
          </summary>
          ${renderPackDiffTable(row.diff)}
        </details>`;
      })
      .join('')}
    <div class="maint-apply-row">
      <button type="button" class="lab-btn--warn" id="btn-import-pack" ${
        preview.totalChanges === 0 ? 'disabled' : ''
      }>
        Importar scopes selecionados
      </button>
      <p class="lab-hint maint-apply-warning">
        ⚠ Substitui os overrides selecionados. Backup automático por scope antes de gravar.
      </p>
    </div>
  `;

  document.getElementById('btn-import-pack')?.addEventListener('click', () => {
    void importPendingPack();
  });
}

async function exportBalancePack(): Promise<void> {
  const labelInput = document.getElementById('maint-pack-label') as HTMLInputElement | null;
  const label = labelInput?.value.trim() || undefined;
  setStatus('Exportando balance pack…');
  try {
    const qs = label ? `?label=${encodeURIComponent(label)}` : '';
    const res = await fetch(`/api/balance-pack${qs}`);
    const data = await res.json();
    if (!data.ok) {
      setStatus(`Erro: ${data.error ?? 'Falha ao exportar'}`, true);
      return;
    }
    downloadPackJson(data.pack, data.pack?.label);
    const nonempty = (data.pack?.meta?.nonemptyScopes ?? []).length;
    setStatus(`Pack exportado (${nonempty} scope(s) com dados).`);
  } catch (err) {
    setStatus(`Erro: ${String(err)}`, true);
  }
}

async function previewPackFile(file: File): Promise<void> {
  setStatus('Lendo pack…');
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    pendingPack = parsed;
    const res = await fetch('/api/balance-pack/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack: parsed }),
    });
    const data = await res.json();
    if (!data.ok && data.error) {
      setStatus(`Erro: ${data.error}`, true);
      const container = document.getElementById('maint-pack-preview');
      if (container) container.innerHTML = `<p class="lab-status is-error">${escapeHtml(data.error)}</p>`;
      return;
    }
    renderPackPreview(data);
    setStatus(
      data.totalChanges === 0
        ? 'Pack idêntico ao workspace atual.'
        : `Preview pronto: ${data.totalChanges} alteração(ões).`,
    );
  } catch (err) {
    setStatus(`Erro: ${String(err)}`, true);
  }
}

async function importPendingPack(): Promise<void> {
  if (!pendingPack) {
    setStatus('Carregue um pack antes de importar.', true);
    return;
  }
  const selected = Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-pack-scope]:checked'),
  ).map((el) => el.dataset.packScope!);

  if (selected.length === 0) {
    setStatus('Selecione ao menos um scope com alterações.', true);
    return;
  }

  const confirmed = window.confirm(
    `Importar ${selected.length} scope(s) do balance pack?\n\n` +
      selected.map((s) => `• ${SCOPE_LABELS[s] ?? s}`).join('\n') +
      '\n\nUm backup de cada override será criado antes da substituição.',
  );
  if (!confirmed) return;

  setStatus('Importando pack…');
  try {
    const res = await fetch('/api/balance-pack/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack: pendingPack, confirmed: true, scopes: selected }),
    });
    const data = await res.json();
    if (!data.ok) {
      setStatus(`Erro: ${data.error ?? 'Falha ao importar'}`, true);
      return;
    }
    const imported = (data.imported ?? []) as string[];
    setStatus(
      imported.length === 0
        ? data.message ?? 'Nada importado.'
        : `Importado: ${imported.join(', ')}. Rebuild da extensão para o jogo.`,
    );
    const container = document.getElementById('maint-pack-preview');
    if (container) {
      container.innerHTML = `
        <div class="maint-success">
          <p class="lab-status">✓ Importação concluída em ${escapeHtml(String(data.importedAt ?? ''))}.</p>
          <p class="lab-hint">Scopes: ${escapeHtml(imported.join(', ') || '(nenhum)')}</p>
        </div>`;
    }
  } catch (err) {
    setStatus(`Erro: ${String(err)}`, true);
  }
}

// ── Render da aba ─────────────────────────────────────────────────────────────

function renderMaintenanceTab(): void {
  const host = document.getElementById('lab-maintenance');
  if (!host) return;

  const scopeOptionsHtml = Object.entries(SCOPE_LABELS)
    .map(([id, label]) => {
      const badge = JSON_BACKED.has(id) ? ' ✓' : ' (manual)';
      return `<option value="${escapeHtml(id)}">${escapeHtml(label)}${badge}</option>`;
    })
    .join('');

  host.innerHTML = `
    <section class="maint-section">
      <h2 class="lab-panel-title">Manutenção<span>promoção, backups e diff</span></h2>

      <!-- Promoção de overrides -->
      <div class="maint-card">
        <h3>Promoção de overrides para catálogo canônico</h3>
        <p class="lab-hint">
          Scopes <strong>JSON-backed</strong> (✓) permitem promoção automática com backup + diff.
          Scopes TS-backed (manual) geram patch JSON para revisão manual — <strong>nunca sobrescrevem</strong> arquivos TypeScript.
        </p>
        <div class="maint-form-row">
          <label class="lab-field">
            <span class="lab-field-name">Scope</span>
            <select id="maint-promo-scope">${scopeOptionsHtml}</select>
          </label>
          <button type="button" class="lab-btn--info" id="btn-preview-promotion">
            Preview / Gerar patch
          </button>
        </div>
        <div id="maint-preview-result"></div>
      </div>

      <!-- Histórico de backups e diff -->
      <div class="maint-card">
        <h3>Histórico de backups e diff</h3>
        <p class="lab-hint">Compare dois snapshots de backup. Selecione o scope, depois os backups A e B.</p>
        <div class="maint-form-row">
          <label class="lab-field">
            <span class="lab-field-name">Scope</span>
            <select id="maint-diff-scope">${scopeOptionsHtml}</select>
          </label>
          <button type="button" class="lab-btn--info" id="btn-load-backups">Carregar backups</button>
        </div>
        <div class="maint-form-row">
          <label class="lab-field">
            <span class="lab-field-name">Backup A (antes)</span>
            <select id="maint-diff-a"><option value="">— carregue primeiro —</option></select>
          </label>
          <label class="lab-field">
            <span class="lab-field-name">Backup B (depois)</span>
            <select id="maint-diff-b"><option value="">— carregue primeiro —</option></select>
          </label>
        </div>
        <div class="maint-form-row">
          <button type="button" class="lab-btn--primary" id="btn-diff-backups">Comparar</button>
        </div>
        <div id="maint-diff-result"></div>
      </div>

      <!-- Balance Pack -->
      <div class="maint-card">
        <h3>Balance Pack — export / import de overrides</h3>
        <p class="lab-hint">
          Empacota <strong>todos</strong> os arquivos de override do workspace em um JSON versionado
          (<code>side-hero-balance-pack</code>). Útil para backup de sessão, troca entre máquinas e review.
          Não inclui catálogos canônicos — só overrides.
        </p>
        <div class="maint-form-row">
          <label class="lab-field">
            <span class="lab-field-name">Rótulo (opcional)</span>
            <input type="text" id="maint-pack-label" placeholder="ex.: early-game-v2" />
          </label>
          <button type="button" class="lab-btn--create" id="btn-export-pack">Exportar pack</button>
          <label class="lab-btn--info maint-file-btn">
            Carregar pack…
            <input type="file" id="maint-pack-file" accept="application/json,.json" hidden />
          </label>
        </div>
        <div id="maint-pack-preview"></div>
      </div>

      <p id="maint-status" class="lab-status" role="status"></p>
    </section>
  `;

  // Eventos — promoção
  document.getElementById('btn-preview-promotion')?.addEventListener('click', () => {
    const scope = (document.getElementById('maint-promo-scope') as HTMLSelectElement)?.value;
    if (scope) void fetchPreview(scope);
  });

  // Eventos — diff de backups
  document.getElementById('btn-load-backups')?.addEventListener('click', async () => {
    const scope = (document.getElementById('maint-diff-scope') as HTMLSelectElement)?.value;
    if (scope) await updateBackupSelects(scope);
  });

  document.getElementById('btn-diff-backups')?.addEventListener('click', () => {
    void fetchBackupDiff();
  });

  // Eventos — balance pack
  document.getElementById('btn-export-pack')?.addEventListener('click', () => {
    void exportBalancePack();
  });
  document.getElementById('maint-pack-file')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void previewPackFile(file);
    input.value = '';
  });
}

// ── Ponto de entrada ──────────────────────────────────────────────────────────

export async function mountMaintenanceTab(): Promise<void> {
  if (maintenanceMounted) return;
  maintenanceMounted = true;
  renderMaintenanceTab();
}
