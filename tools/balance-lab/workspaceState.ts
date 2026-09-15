export type BalanceLabTab =
  | 'sim'
  | 'missions'
  | 'xp'
  | 'levels'
  | 'gear'
  | 'shops'
  | 'heroes'
  | 'enemies'
  | 'economy'
  | 'upgrades'
  | 'maintenance';

type SaveAction = () => void | Promise<void>;

const dirtyByTab = new Map<BalanceLabTab, number>();
const saveByTab = new Map<BalanceLabTab, SaveAction>();
let activeTab: BalanceLabTab = 'sim';
let guardsBound = false;

// ── Auto-reload ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;
let lastVersion: string | null = null;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
type ReloadCallback = (hasDrafts: boolean, newVersion: string) => void;
let onExternalChange: ReloadCallback | null = null;

async function pollWorkspaceVersion(): Promise<void> {
  try {
    const res = await fetch('/api/workspace-version', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const version: string = data.version ?? '';
    if (!version) return;

    if (lastVersion === null) {
      lastVersion = version;
      return;
    }

    if (version !== lastVersion) {
      lastVersion = version;
      onExternalChange?.(hasWorkspaceDrafts(), version);
    }
  } catch {
    // Servidor pode estar reiniciando — ignorar silenciosamente
  }
}

function schedulePoll(): void {
  pollTimer = setTimeout(async () => {
    await pollWorkspaceVersion();
    schedulePoll();
  }, POLL_INTERVAL_MS);
}

/**
 * Inicia o polling de versão do workspace.
 * callback recebe (hasDrafts, newVersion) quando uma mudança externa é detectada.
 */
export function startWorkspaceVersionPolling(callback: ReloadCallback): void {
  onExternalChange = callback;
  if (pollTimer !== null) return;
  void pollWorkspaceVersion().then(() => schedulePoll());
}

export function stopWorkspaceVersionPolling(): void {
  if (pollTimer !== null) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  onExternalChange = null;
}

function updateTabBadge(tab: BalanceLabTab): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-lab-tab="${tab}"]`);
  if (!button) return;
  const count = dirtyByTab.get(tab) ?? 0;
  button.classList.toggle('has-dirty', count > 0);
  if (count > 0) button.dataset.dirtyCount = String(count);
  else delete button.dataset.dirtyCount;
}

export function setWorkspaceActiveTab(tab: BalanceLabTab): void {
  activeTab = tab;
}

export function registerWorkspaceSave(tab: BalanceLabTab, save: SaveAction): void {
  saveByTab.set(tab, save);
}

export function setWorkspaceDirty(tab: BalanceLabTab, count: number): void {
  dirtyByTab.set(tab, Math.max(0, Math.floor(count)));
  updateTabBadge(tab);
}

export function hasWorkspaceDrafts(): boolean {
  return [...dirtyByTab.values()].some((count) => count > 0);
}

export function bindWorkspaceGuards(): void {
  if (guardsBound) return;
  guardsBound = true;

  window.addEventListener('beforeunload', (event) => {
    if (!hasWorkspaceDrafts()) return;
    event.preventDefault();
  });

  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
    const save = saveByTab.get(activeTab);
    if (!save || (dirtyByTab.get(activeTab) ?? 0) === 0) return;
    event.preventDefault();
    void save();
  });
}

