/**
 * Party de referência compartilhada entre as abas Missões e Economia.
 * Persiste apenas em localStorage — nunca altera o save do jogo.
 */

const STORAGE_KEY = 'balance-lab:reference-party';

export interface PartyMemberSpec {
  heroClass: string;
  level: number;
}

const DEFAULT_PARTY: readonly PartyMemberSpec[] = [
  { heroClass: 'sorcerer', level: 1 },
  { heroClass: 'knight', level: 1 },
  { heroClass: 'priest', level: 1 },
];

const DEFAULT_MEMBER_LEVEL = 1;

export const HERO_CLASS_OPTIONS: readonly string[] = [
  'knight',
  'sorcerer',
  'priest',
  'berserker',
  'archer',
  'paladin',
];

const CLASS_LABELS: Record<string, string> = {
  knight: 'Knight',
  sorcerer: 'Sorcerer',
  priest: 'Priest',
  berserker: 'Berserker',
  archer: 'Archer',
  paladin: 'Paladin',
};

function classLabel(heroClass: string): string {
  return CLASS_LABELS[heroClass] ?? heroClass;
}

// ── Persistência ──────────────────────────────────────────────────────────────

function isValidMember(value: unknown): value is PartyMemberSpec {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m['heroClass'] === 'string' &&
    HERO_CLASS_OPTIONS.includes(m['heroClass'] as string) &&
    typeof m['level'] === 'number' &&
    m['level'] >= 1 &&
    m['level'] <= 100
  );
}

export function loadReferenceParty(): PartyMemberSpec[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PARTY.map((m) => ({ ...m }));
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_PARTY.map((m) => ({ ...m }));
    const valid = parsed.filter(isValidMember).slice(0, 3);
    if (valid.length === 0) return DEFAULT_PARTY.map((m) => ({ ...m }));
    return valid;
  } catch {
    return DEFAULT_PARTY.map((m) => ({ ...m }));
  }
}

export function saveReferenceParty(party: PartyMemberSpec[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(party));
  } catch {
    // quota excedida ou ambiente sem storage — ignorar silenciosamente
  }
}

// ── Estado reativo (singleton) ────────────────────────────────────────────────

let _party: PartyMemberSpec[] = loadReferenceParty();
const _listeners: Array<(party: PartyMemberSpec[]) => void> = [];

export function getReferenceParty(): readonly PartyMemberSpec[] {
  return _party;
}

export function setReferenceParty(party: PartyMemberSpec[]): void {
  _party = party.slice(0, 3);
  saveReferenceParty(_party);
  for (const fn of _listeners) fn(_party);
}

export function subscribePartyChange(fn: (party: PartyMemberSpec[]) => void): () => void {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

// ── Conversão query string ────────────────────────────────────────────────────

/**
 * Serializa a party para query: `sorcerer:1,knight:1,priest:1`.
 */
export function partyToQueryParam(party: readonly PartyMemberSpec[]): string {
  return party.map((m) => `${m.heroClass}:${m.level}`).join(',');
}

/**
 * Faz parse de `sorcerer:10,knight:10` em PartyMemberSpec[].
 * Retorna null se inválido.
 */
export function parsePartyQueryParam(raw: string): PartyMemberSpec[] | null {
  try {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const members: PartyMemberSpec[] = [];
    for (const part of parts) {
      const colonIdx = part.lastIndexOf(':');
      if (colonIdx === -1) return null;
      const heroClass = part.slice(0, colonIdx);
      const level = parseInt(part.slice(colonIdx + 1), 10);
      if (!HERO_CLASS_OPTIONS.includes(heroClass) || !Number.isFinite(level) || level < 1) {
        return null;
      }
      members.push({ heroClass, level });
    }
    if (members.length === 0) return null;
    return members.slice(0, 3);
  } catch {
    return null;
  }
}

// ── Rótulo legível ────────────────────────────────────────────────────────────

export function partyLabel(party: readonly PartyMemberSpec[]): string {
  if (party.length === 0) return '(sem membros)';
  return party.map((m) => `${classLabel(m.heroClass)} Lv.${m.level}`).join(' + ');
}

// ── Widget de edição ─────────────────────────────────────────────────────────

function memberRowHtml(member: PartyMemberSpec, index: number): string {
  const classOptions = HERO_CLASS_OPTIONS.map(
    (c) => `<option value="${c}" ${c === member.heroClass ? 'selected' : ''}>${classLabel(c)}</option>`,
  ).join('');

  return `
    <div class="rp-member" data-rp-index="${index}">
      <select class="rp-class" data-rp-field="class" aria-label="Classe do membro ${index + 1}">
        ${classOptions}
      </select>
      <label class="rp-level-wrap">Lv.
        <input type="number" class="rp-level" data-rp-field="level" min="1" max="100"
               value="${member.level}" aria-label="Nível do membro ${index + 1}" />
      </label>
      ${index > 0 ? `<button type="button" class="rp-btn-remove lab-btn--icon" data-rp-remove="${index}" title="Remover membro">×</button>` : ''}
    </div>`;
}

export function clampPartyLevel(level: number): number {
  return Math.max(1, Math.min(100, Math.floor(level)));
}

/** Aplica o mesmo nível a todos os membros (mantém classes). */
export function withPartyLevel(
  party: readonly PartyMemberSpec[],
  level: number,
): PartyMemberSpec[] {
  const next = clampPartyLevel(level);
  return party.map((member) => ({ ...member, level: next }));
}

export function renderPartyEditorHtml(party: readonly PartyMemberSpec[]): string {
  const rows = party.map((m, i) => memberRowHtml(m, i)).join('');
  const canAdd = party.length < 3;
  const bulkLevel = party[0]?.level ?? DEFAULT_MEMBER_LEVEL;
  return `
    <div class="rp-editor" id="rp-editor">
      <p class="rp-label">Party de referência</p>
      <div class="rp-bulk-level">
        <label class="rp-level-wrap">Lv. todos
          <input type="number" class="rp-level rp-level-all" id="rp-level-all" min="1" max="100"
                 value="${bulkLevel}" aria-label="Nível de todos os membros" />
        </label>
        <button type="button" class="lab-btn--info rp-btn-level-all">Aplicar a todos</button>
      </div>
      <div class="rp-members">${rows}</div>
      ${canAdd ? `<button type="button" class="lab-btn--create rp-btn-add">+ membro</button>` : ''}
      <button type="button" class="lab-btn--warn rp-btn-reset">↺ padrão</button>
      <span class="rp-summary lab-hint">${partyLabel(party)}</span>
    </div>`;
}

function readPartyFromEditor(host: HTMLElement): PartyMemberSpec[] {
  const members: PartyMemberSpec[] = [];
  host.querySelectorAll<HTMLElement>('.rp-member').forEach((row) => {
    const classSelect = row.querySelector<HTMLSelectElement>('.rp-class');
    const levelInput = row.querySelector<HTMLInputElement>('.rp-level');
    const heroClass = classSelect?.value ?? 'knight';
    const level = clampPartyLevel(
      parseInt(levelInput?.value ?? String(DEFAULT_MEMBER_LEVEL), 10) || DEFAULT_MEMBER_LEVEL,
    );
    members.push({ heroClass, level });
  });
  return members;
}

function updateSummary(host: HTMLElement, party: PartyMemberSpec[]): void {
  const summary = host.querySelector<HTMLElement>('.rp-summary');
  if (summary) summary.textContent = partyLabel(party);
}

export function bindPartyEditor(host: HTMLElement, onChange?: (party: PartyMemberSpec[]) => void): void {
  function commit(): void {
    const party = readPartyFromEditor(host);
    setReferenceParty(party);
    updateSummary(host, party);
    onChange?.(party);
  }

  function rerender(): void {
    const party = getReferenceParty();
    host.innerHTML = renderPartyEditorHtml(party);
    bindPartyEditor(host, onChange);
    onChange?.(party as PartyMemberSpec[]);
  }

  host.querySelectorAll<HTMLSelectElement>('.rp-class').forEach((sel) => {
    sel.addEventListener('change', commit);
  });
  host.querySelectorAll<HTMLInputElement>('.rp-member .rp-level').forEach((inp) => {
    inp.addEventListener('change', commit);
    inp.addEventListener('input', commit);
  });

  const applyAllLevels = (): void => {
    const bulkInput = host.querySelector<HTMLInputElement>('#rp-level-all');
    const level = clampPartyLevel(
      parseInt(bulkInput?.value ?? String(DEFAULT_MEMBER_LEVEL), 10) || DEFAULT_MEMBER_LEVEL,
    );
    if (bulkInput) bulkInput.value = String(level);
    const party = withPartyLevel(readPartyFromEditor(host), level);
    setReferenceParty(party);
    rerender();
  };

  host.querySelector<HTMLButtonElement>('.rp-btn-level-all')?.addEventListener('click', applyAllLevels);
  host.querySelector<HTMLInputElement>('#rp-level-all')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyAllLevels();
    }
  });

  host.querySelector<HTMLButtonElement>('.rp-btn-add')?.addEventListener('click', () => {
    const party = readPartyFromEditor(host);
    if (party.length >= 3) return;
    party.push({ heroClass: 'knight', level: DEFAULT_MEMBER_LEVEL });
    setReferenceParty(party);
    rerender();
  });

  host.querySelectorAll<HTMLButtonElement>('[data-rp-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.rpRemove);
      const party = readPartyFromEditor(host);
      party.splice(idx, 1);
      setReferenceParty(party);
      rerender();
    });
  });

  host.querySelector<HTMLButtonElement>('.rp-btn-reset')?.addEventListener('click', () => {
    setReferenceParty(DEFAULT_PARTY.map((m) => ({ ...m })));
    rerender();
  });
}
