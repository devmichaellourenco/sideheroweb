/**
 * Arena visual de batalha na aba Missões — anima snapshots do combat-sim-playback.
 */
import type {
  CombatSimSnapshot,
  EncounterPlaybackResult,
  EncounterSimulationResult,
  SimSkillSnapshot,
  SimUnitSnapshot,
} from './combatSimCatalog';
import { enemySpriteFallbackUrlForLab, enemySpriteUrlForLab } from './enemySprites';
import { heroSpriteFallbackUrlForLab, heroSpriteUrlForLab } from './heroSprites';
import {
  bindBattleReportControls,
  paintBattleReport,
  renderBattleReportShellHtml,
  resetBattleReportTab,
} from './missionBattleReportUi';

export interface ArenaDraftPayload {
  phaseId: string;
  draftPhase: {
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
  party: Array<{ heroClass: string; level: number }>;
  profile?: string;
  seed?: number;
}

const OUTCOME_LABELS: Record<string, string> = {
  victory: 'Vitória',
  wipe: 'Derrota',
  timeout: 'Timeout',
};

type PlaybackState = {
  snapshots: CombatSimSnapshot[];
  result: EncounterSimulationResult;
  index: number;
  playing: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

let playback: PlaybackState | null = null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bindSpriteFallback(img: HTMLImageElement, fallback: string): void {
  img.addEventListener('error', () => {
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = fallback;
  });
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '';
  if (seconds < 10) return seconds.toFixed(1);
  return String(Math.ceil(seconds));
}

function skillsHtml(skills: SimSkillSnapshot[] | undefined): string {
  if (!skills?.length) return '';
  return `<div class="mba-skills" aria-label="Skills">
    ${skills
      .map((skill) => {
        const ready = skill.ready ? ' mba-skill--ready' : '';
        const next = skill.highlight === 'next' ? ' mba-skill--next' : '';
        const ratio = Math.max(0, Math.min(1, skill.cooldownRatio));
        const label = skill.ready ? 'OK' : formatCountdown(skill.secondsRemaining);
        const title = skill.ready
          ? `${skill.skillName} — pronta`
          : `${skill.skillName} — ${skill.secondsRemaining.toFixed(1)}s`;
        return `<span class="mba-skill${ready}${next}" title="${escapeHtml(title)}" style="--cd:${ratio}">
          <span class="mba-skill-shade" aria-hidden="true"></span>
          <span class="mba-skill-name">${escapeHtml(skill.skillName)}</span>
          <span class="mba-skill-cd">${escapeHtml(label)}</span>
        </span>`;
      })
      .join('')}
  </div>`;
}

function unitCardHtml(unit: SimUnitSnapshot): string {
  const pct = Math.max(0, Math.min(100, (unit.hp / Math.max(1, unit.maxHp)) * 100));
  const ttaPct = Math.max(0, Math.min(100, (unit.actionTimeRatio ?? 0) * 100));
  const ttaLabel =
    (unit.actionTimeRemaining ?? 0) <= 0
      ? 'pronto'
      : `${formatCountdown(unit.actionTimeRemaining)}s`;
  const dead = unit.alive ? '' : ' mba-unit--dead';
  const role = unit.role ? ` mba-unit--${unit.role}` : '';
  const sprite =
    unit.kind === 'hero'
      ? heroSpriteUrlForLab(unit.classOrType)
      : enemySpriteUrlForLab(unit.classOrType);
  return `
    <div class="mba-unit${dead}${role}" data-unit-id="${escapeHtml(unit.id)}">
      <img class="mba-sprite" src="${sprite}" alt="" data-kind="${unit.kind}" data-type="${escapeHtml(unit.classOrType)}" />
      <div class="mba-unit-meta">
        <span class="mba-unit-name">${escapeHtml(unit.name)}</span>
        <span class="mba-unit-sub">Lv${unit.level}${unit.role ? ` · ${unit.role}` : ''}</span>
        <div class="mba-hp" aria-hidden="true">
          <div class="mba-hp-fill" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="mba-tta" title="Tempo até ação" aria-label="TTA ${ttaLabel}">
          <div class="mba-tta-track">
            <div class="mba-tta-fill" style="width:${ttaPct.toFixed(1)}%"></div>
          </div>
          <span class="mba-tta-label">${escapeHtml(ttaLabel)}</span>
        </div>
        <span class="mba-hp-text">${Math.round(unit.hp)} / ${Math.round(unit.maxHp)}</span>
        ${skillsHtml(unit.skills)}
      </div>
    </div>`;
}

export function renderArenaShellHtml(): string {
  return `
    <div class="mba-arena" id="mba-arena">
      <header class="mba-header">
        <h4>Arena de batalha</h4>
        <p class="lab-hint lab-hint--tight">Usa o rascunho atual (waves + party) — não precisa salvar antes.</p>
      </header>
      <div class="mba-toolbar">
        <button type="button" class="lab-btn--create" id="mba-play">▶ Iniciar</button>
        <button type="button" class="lab-btn--info" id="mba-pause" disabled>⏸ Pausar</button>
        <button type="button" class="lab-btn--warn" id="mba-reset" disabled>↺ Reiniciar</button>
        <label class="mba-speed-label">Velocidade
          <select id="mba-speed" class="cs-runs-select" aria-label="Velocidade da arena">
            <option value="0.5">0.5×</option>
            <option value="1" selected>1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <span id="mba-meta" class="mba-meta"></span>
      </div>
      <div class="mba-stage" id="mba-stage">
        <div class="mba-side mba-side--heroes" id="mba-heroes">
          <p class="lab-hint">Heróis aparecem ao iniciar.</p>
        </div>
        <div class="mba-divider" aria-hidden="true">×</div>
        <div class="mba-side mba-side--enemies" id="mba-enemies">
          <p class="lab-hint">Inimigos da wave atual.</p>
        </div>
      </div>
      <p id="mba-status" class="mba-status lab-hint" role="status"></p>
      ${renderBattleReportShellHtml()}
    </div>`;
}

function readSpeed(root: HTMLElement): number {
  const sel = root.querySelector<HTMLSelectElement>('#mba-speed');
  const n = Number(sel?.value ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function setStatus(root: HTMLElement, text: string, isError = false): void {
  const el = root.querySelector<HTMLElement>('#mba-status');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('is-error', isError);
}

function setMeta(root: HTMLElement, snap: CombatSimSnapshot | null, result?: EncounterSimulationResult): void {
  const el = root.querySelector<HTMLElement>('#mba-meta');
  if (!el) return;
  if (!snap) {
    el.textContent = '';
    return;
  }
  const wave = `Wave ${snap.waveIndex + 1}/${Math.max(1, snap.waveCount)}`;
  const time = `${snap.combatTime.toFixed(0)}s`;
  const outcome = result ? ` · ${OUTCOME_LABELS[result.outcome] ?? result.outcome}` : '';
  const inter = snap.intermission ? ` · ${snap.intermission}` : '';
  el.textContent = `${wave} · ${time}${inter}${outcome}`;
}

function paintSnapshot(root: HTMLElement, snap: CombatSimSnapshot): void {
  const heroes = root.querySelector<HTMLElement>('#mba-heroes');
  const enemies = root.querySelector<HTMLElement>('#mba-enemies');
  if (heroes) {
    heroes.innerHTML = snap.heroes.map(unitCardHtml).join('') || '<p class="lab-hint">Sem heróis</p>';
  }
  if (enemies) {
    const livingOrAll = snap.enemies.length
      ? snap.enemies.map(unitCardHtml).join('')
      : '<p class="lab-hint">Sem inimigos nesta wave</p>';
    enemies.innerHTML = livingOrAll;
  }

  root.querySelectorAll<HTMLImageElement>('.mba-sprite').forEach((img) => {
    const kind = img.dataset.kind;
    bindSpriteFallback(
      img,
      kind === 'hero' ? heroSpriteFallbackUrlForLab() : enemySpriteFallbackUrlForLab(),
    );
  });

  paintBattleReport(root, snap.logMessages, snap.stats);
}

function stopTimer(): void {
  if (playback?.timer != null) {
    clearTimeout(playback.timer);
    playback.timer = null;
  }
}

function syncButtons(root: HTMLElement): void {
  const play = root.querySelector<HTMLButtonElement>('#mba-play');
  const pause = root.querySelector<HTMLButtonElement>('#mba-pause');
  const reset = root.querySelector<HTMLButtonElement>('#mba-reset');
  const has = Boolean(playback);
  const playing = Boolean(playback?.playing);
  if (play) play.disabled = playing;
  if (pause) pause.disabled = !playing;
  if (reset) reset.disabled = !has;
}

function scheduleNext(root: HTMLElement): void {
  if (!playback || !playback.playing) return;
  stopTimer();
  if (playback.index >= playback.snapshots.length - 1) {
    playback.playing = false;
    const last = playback.snapshots[playback.snapshots.length - 1] ?? null;
    paintSnapshot(root, last!);
    setMeta(root, last, playback.result);
    setStatus(
      root,
      `Fim: ${OUTCOME_LABELS[playback.result.outcome] ?? playback.result.outcome} · ${playback.result.combatTime.toFixed(1)}s · ${playback.result.enemiesKilled}/${playback.result.totalEnemies} inimigos`,
    );
    syncButtons(root);
    return;
  }

  const speed = readSpeed(root);
  const delay = Math.max(40, Math.round(180 / speed));
  playback.timer = setTimeout(() => {
    if (!playback || !playback.playing) return;
    playback.index += 1;
    const snap = playback.snapshots[playback.index];
    if (!snap) return;
    paintSnapshot(root, snap);
    const atEnd = playback.index >= playback.snapshots.length - 1;
    setMeta(root, snap, atEnd ? playback.result : undefined);
    scheduleNext(root);
  }, delay);
}

function startFromIndex(root: HTMLElement, index: number): void {
  if (!playback) return;
  stopTimer();
  playback.index = Math.max(0, Math.min(index, playback.snapshots.length - 1));
  playback.playing = true;
  const snap = playback.snapshots[playback.index];
  if (snap) {
    paintSnapshot(root, snap);
    setMeta(root, snap);
  }
  syncButtons(root);
  scheduleNext(root);
}

export function disposeArenaPlayback(): void {
  stopTimer();
  if (playback) playback.playing = false;
  playback = null;
  resetBattleReportTab();
}

export async function fetchCombatSimPlayback(
  payload: ArenaDraftPayload,
): Promise<EncounterPlaybackResult & { ok: boolean; error?: string }> {
  const res = await fetch('/api/combat-sim-playback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phaseId: payload.phaseId,
      draftPhase: payload.draftPhase,
      party: payload.party,
      profile: payload.profile,
      seed: payload.seed ?? 1,
    }),
  });
  return res.json() as Promise<EncounterPlaybackResult & { ok: boolean; error?: string }>;
}

export function bindArenaControls(
  root: HTMLElement,
  getPayload: () => ArenaDraftPayload | null,
): void {
  const arena = root.querySelector<HTMLElement>('#mba-arena');
  if (!arena || arena.dataset.bound === '1') return;
  arena.dataset.bound = '1';
  bindBattleReportControls(root);

  arena.querySelector('#mba-play')?.addEventListener('click', () => {
    if (
      playback &&
      !playback.playing &&
      playback.index < playback.snapshots.length - 1
    ) {
      startFromIndex(arena, playback.index);
      setStatus(arena, 'Reproduzindo…');
      return;
    }

    const payload = getPayload();
    if (!payload) {
      setStatus(arena, 'Selecione uma missão e monte o draft.', true);
      return;
    }
    if (!payload.draftPhase.waves.length) {
      setStatus(arena, 'Draft sem waves.', true);
      return;
    }

    disposeArenaPlayback();
    setStatus(arena, 'Simulando combate…');
    syncButtons(arena);

    void fetchCombatSimPlayback(payload)
      .then((data) => {
        if (!data.ok) {
          setStatus(arena, data.error ?? 'Falha no playback', true);
          return;
        }
        playback = {
          snapshots: data.snapshots ?? [],
          result: data.result,
          index: 0,
          playing: false,
          timer: null,
        };
        if (!playback.snapshots.length) {
          setStatus(arena, 'Playback sem snapshots.', true);
          return;
        }
        setStatus(arena, 'Reproduzindo…');
        startFromIndex(arena, 0);
      })
      .catch((err: Error) => {
        setStatus(arena, err.message, true);
      });
  });

  arena.querySelector('#mba-pause')?.addEventListener('click', () => {
    if (!playback) return;
    playback.playing = false;
    stopTimer();
    setStatus(arena, 'Pausado.');
    syncButtons(arena);
  });

  arena.querySelector('#mba-reset')?.addEventListener('click', () => {
    if (!playback) return;
    stopTimer();
    playback.playing = false;
    playback.index = 0;
    const snap = playback.snapshots[0];
    if (snap) {
      paintSnapshot(arena, snap);
      setMeta(arena, snap);
    }
    setStatus(arena, 'Reiniciado — pressione Iniciar para tocar.');
    syncButtons(arena);
  });

  arena.querySelector('#mba-speed')?.addEventListener('change', () => {
    if (playback?.playing) {
      stopTimer();
      scheduleNext(arena);
    }
  });
}
