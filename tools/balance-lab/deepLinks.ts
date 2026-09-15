/**
 * Atalhos de teclado e deep-links por hash para o Balance Lab.
 *
 * - Alt+ArrowLeft / Alt+ArrowRight: navega entre abas adjacentes.
 * - Ctrl/Cmd+1..0 (0=10): seleciona aba por posição.
 * - Hash com query: `#gear?id=...`, `#enemies?id=...`, `#heroes?class=...`
 *   Ex.: `http://localhost:5179/#enemies?id=goblin_raider`
 *
 * Não cresce lab.ts — toda lógica reside aqui.
 */

export type LabTabId = string;

export interface DeepLinkParams {
  tab: LabTabId;
  /** Parâmetro de entidade: id, class, etc. */
  entityKey?: string;
  entityValue?: string;
}

// ── Parse / serialização de hash ──────────────────────────────────────────────

/**
 * Faz parse de `#missions`, `#gear?id=iron_sword` ou `#heroes?class=knight`.
 * Retorna null se o hash for vazio.
 */
export function parseHashDeepLink(hash: string): DeepLinkParams | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;

  const qIdx = raw.indexOf('?');
  if (qIdx === -1) {
    return { tab: raw };
  }

  const tab = raw.slice(0, qIdx);
  const queryStr = raw.slice(qIdx + 1);
  const params = new URLSearchParams(queryStr);

  // Suporta ?id=..., ?class=..., ?type=...
  const entityKey = ['id', 'class', 'type'].find((k) => params.has(k));
  const entityValue = entityKey ? (params.get(entityKey) ?? undefined) : undefined;

  return { tab, entityKey, entityValue };
}

/**
 * Constrói o hash para um link profundo, sem quebrar hashs simples existentes.
 */
export function buildHashDeepLink(tab: LabTabId, entityKey?: string, entityValue?: string): string {
  if (!entityKey || !entityValue) return `#${tab}`;
  return `#${tab}?${entityKey}=${encodeURIComponent(entityValue)}`;
}

/**
 * Atualiza `location.hash` com deep-link, preservando o comportamento de
 * `history.replaceState` já usado em `lab.ts`.
 */
export function updateHashDeepLink(tab: LabTabId, entityKey?: string, entityValue?: string): void {
  const hash = buildHashDeepLink(tab, entityKey, entityValue);
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash);
  }
}

// ── Atalhos de teclado ────────────────────────────────────────────────────────

export interface KeyboardShortcutOptions {
  /** Lista de IDs de aba em ordem de exibição. */
  tabs: readonly LabTabId[];
  /** Aba ativa atual (será lida em cada evento). */
  getActiveTab: () => LabTabId;
  /** Callback chamado quando o atalho solicita troca de aba. */
  onSwitchTab: (tab: LabTabId) => void;
}

export function initKeyboardShortcuts(options: KeyboardShortcutOptions): () => void {
  const { tabs, getActiveTab, onSwitchTab } = options;

  function handler(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement).tagName;
    // Não intercepta quando o foco está em campos de texto
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const isMod = event.ctrlKey || event.metaKey;

    // Alt+ArrowLeft — aba anterior
    if (event.altKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      const idx = tabs.indexOf(getActiveTab());
      if (idx > 0) onSwitchTab(tabs[idx - 1]!);
      return;
    }

    // Alt+ArrowRight — aba seguinte
    if (event.altKey && event.key === 'ArrowRight') {
      event.preventDefault();
      const idx = tabs.indexOf(getActiveTab());
      if (idx >= 0 && idx < tabs.length - 1) onSwitchTab(tabs[idx + 1]!);
      return;
    }

    // Ctrl/Cmd+1..0 — aba por posição (0 = posição 10)
    if (isMod && /^[0-9]$/.test(event.key)) {
      const digit = parseInt(event.key, 10);
      const tabIndex = digit === 0 ? 9 : digit - 1;
      if (tabIndex >= 0 && tabIndex < tabs.length) {
        event.preventDefault();
        onSwitchTab(tabs[tabIndex]!);
      }
    }
  }

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

// ── Resolvedores de entidade por aba ─────────────────────────────────────────

/**
 * Mapa de entidade registrável: cada aba pode registrar um callback
 * que será chamado com o valor da entidade ao abrir via deep-link.
 */
type EntitySelector = (value: string) => void;

const entitySelectors = new Map<LabTabId, EntitySelector>();

/**
 * Registra o seletor de entidade de uma aba (ex.: `selectEnemy` da aba enemies).
 * O callback recebe o valor do parâmetro de entidade (id/class/type).
 */
export function registerEntitySelector(tab: LabTabId, selector: EntitySelector): void {
  entitySelectors.set(tab, selector);
}

/**
 * Dispara o seletor registrado para a aba, se houver.
 */
export function applyEntityDeepLink(params: DeepLinkParams): void {
  if (!params.entityValue) return;
  const selector = entitySelectors.get(params.tab);
  selector?.(params.entityValue);
}
