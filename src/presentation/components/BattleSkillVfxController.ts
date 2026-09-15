import { CombatSkillVfxDto } from '../../application/dto/CombatSkillVfxDto';
import { getAssetUrl } from '../assets/AssetCatalog';
import {
  extractCharacterSpritePath,
  getHeroAttackAnimSheet,
  type HeroAttackAnimSheet,
} from '../assets/HeroAttackAnimCatalog';
import {
  getSkillVfxDefinition,
  getSkillVfxImpactSvgPath,
  getSkillVfxSvgPath,
  SkillVfxDefinition,
  SkillVfxSpriteSheetDefinition,
} from '../assets/SkillVfxCatalog';

const DEFAULT_DURATION_MS = 520;

export class BattleSkillVfxController {
  private readonly heroAttackAnimGeneration = new WeakMap<HTMLElement, number>();

  constructor(
    private readonly layer: HTMLElement,
    private readonly battleStrip: HTMLElement,
  ) {}

  show(events: CombatSkillVfxDto[]): void {
    if (!events.length) return;

    for (const event of events) {
      this.flashSkillSlot(event);
      this.playHeroAttackAnim(event);
      const definition = getSkillVfxDefinition(event.skillId);
      if (!definition) continue;

      void this.spawn(event, definition);
    }
  }

  private flashSkillSlot(event: CombatSkillVfxDto): void {
    const cardSelector =
      event.attackerSide === 'hero'
        ? `[data-hero-id="${event.attackerId}"]`
        : `[data-enemy-id="${event.attackerId}"]`;
    const card = this.battleStrip.querySelector<HTMLElement>(cardSelector);
    const slot = card?.querySelector<HTMLElement>(`[data-skill-id="${event.skillId}"]`);
    if (!slot) return;

    slot.classList.add('combat-skill-slot--fired');
    window.setTimeout(() => slot.classList.remove('combat-skill-slot--fired'), 650);
  }

  /** Troca o portrait estático pela folha de ataque do herói (ex.: Galneon basic). */
  private playHeroAttackAnim(event: CombatSkillVfxDto): void {
    if (event.attackerSide !== 'hero') return;

    const hitbox = this.findAnchor('hero', event.attackerId);
    if (!hitbox) return;

    const portrait = hitbox.querySelector<HTMLImageElement>('img.hero-image');
    if (!portrait?.src) return;

    const spritePath = extractCharacterSpritePath(portrait.src);
    if (!spritePath) return;

    const sheet = getHeroAttackAnimSheet(spritePath, event.skillId);
    if (!sheet) return;

    const sheetUrl = getAssetUrl(sheet.path);
    if (!sheetUrl) return;

    hitbox.querySelectorAll('.hero-attack-anim').forEach((node) => node.remove());

    const generation = (this.heroAttackAnimGeneration.get(hitbox) ?? 0) + 1;
    this.heroAttackAnimGeneration.set(hitbox, generation);

    hitbox.classList.add('hero-sprite--attacking');

    const anim = document.createElement('div');
    anim.className = 'hero-attack-anim';
    anim.setAttribute('aria-hidden', 'true');
    this.applyHeroAttackSheet(anim, sheet, sheetUrl);
    hitbox.appendChild(anim);

    window.setTimeout(() => {
      if (this.heroAttackAnimGeneration.get(hitbox) !== generation) return;
      anim.remove();
      hitbox.classList.remove('hero-sprite--attacking');
    }, sheet.frameDurationMs + 40);
  }

  private applyHeroAttackSheet(
    el: HTMLElement,
    sheet: HeroAttackAnimSheet,
    sheetUrl: string,
  ): void {
    const frameCount = sheet.columns * sheet.rows;
    const cols = sheet.columns;
    const rows = sheet.rows;

    el.style.backgroundImage = `url("${sheetUrl}")`;
    el.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;

    const keyframes: Keyframe[] = [];
    for (let i = 0; i < frameCount; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols <= 1 ? 0 : (col / (cols - 1)) * 100;
      const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
      keyframes.push({
        backgroundPosition: `${x}% ${y}%`,
        offset: i / frameCount,
        easing: 'step-end',
      });
    }
    keyframes.push({
      backgroundPosition: keyframes[frameCount - 1]?.backgroundPosition ?? '0% 0%',
      offset: 1,
    });

    el.animate(keyframes, {
      duration: sheet.frameDurationMs,
      iterations: 1,
      fill: 'forwards',
    });
  }

  private async spawn(event: CombatSkillVfxDto, definition: SkillVfxDefinition): Promise<void> {
    const targetAnchor = this.findAnchor(event.targetSide, event.targetId);
    if (!targetAnchor) return;

    const stripRect = this.battleStrip.getBoundingClientRect();
    const toRect = targetAnchor.getBoundingClientRect();

    if (definition.placement === 'target_column') {
      const frame = this.resolveColumnFrame(definition, stripRect, toRect);
      this.spawnColumn(event, definition, frame.x, frame.y, frame.width, frame.height);
      return;
    }

    const impactCenterX = toRect.left - stripRect.left + toRect.width / 2;
    const impactYRatio = definition.anchorYRatio ?? 0.32;
    const impactCenterY =
      toRect.top - stripRect.top + toRect.height * impactYRatio + (definition.offsetY ?? 0);

    if (definition.motion === 'rise') {
      // Hitbox do ator (= sprite), não o card inteiro (barras/skills).
      const offsetY = definition.offsetY ?? 0;
      const riseX = toRect.left - stripRect.left + toRect.width / 2 - definition.width / 2;
      const riseY = toRect.bottom - stripRect.top - definition.height + offsetY;
      this.spawnRise(event, definition, { x: riseX, y: riseY });
      if (definition.impact) {
        const impactDelay = definition.impact.delayMs ?? definition.durationMs;
        window.setTimeout(() => {
          this.spawnImpact(definition, impactCenterX, impactCenterY, event.skillId);
        }, impactDelay);
      }
      return;
    }

    const needsAttacker =
      definition.motion === 'projectile' || definition.placement === 'caster';
    const attackerAnchor = needsAttacker
      ? this.findAnchor(event.attackerSide, event.attackerId)
      : null;
    if (needsAttacker && !attackerAnchor) return;

    const fromRect = attackerAnchor?.getBoundingClientRect();
    const yRatio = definition.anchorYRatio ?? 0.32;
    const offsetY = definition.offsetY ?? 0;

    const startX = fromRect
      ? fromRect.left - stripRect.left + fromRect.width / 2 - definition.width / 2
      : 0;
    const startY = fromRect
      ? fromRect.top - stripRect.top + fromRect.height * yRatio - definition.height / 2 + offsetY
      : 0;
    const endX = toRect.left - stripRect.left + toRect.width / 2 - definition.width / 2;
    const endY =
      toRect.top - stripRect.top + toRect.height * yRatio - definition.height / 2 + offsetY;

    const placementTarget = definition.placement === 'target';
    const anchorRect = placementTarget ? toRect : fromRect ?? toRect;
    const anchorX = anchorRect.left - stripRect.left + anchorRect.width / 2 - definition.width / 2;
    const anchorY =
      anchorRect.top - stripRect.top + anchorRect.height * yRatio - definition.height / 2 + offsetY;

    if (definition.motion === 'self') {
      this.spawnSelfPulse(definition, anchorX, anchorY, event.skillId);
    } else if (definition.motion === 'melee') {
      this.spawnMelee(event, definition, anchorX, anchorY);
    } else if (definition.motion === 'aoe') {
      this.spawnAoe(event, definition, anchorX, anchorY);
    } else {
      this.spawnProjectile(event, definition, { startX, startY, endX, endY });
    }

    if (definition.impact && definition.motion !== 'self') {
      const impactDelay = definition.impact.delayMs ?? definition.durationMs;
      window.setTimeout(() => {
        this.spawnImpact(definition, impactCenterX, impactCenterY, event.skillId);
      }, impactDelay);
    }
  }

  private resolveColumnFrame(
    definition: SkillVfxDefinition,
    stripRect: DOMRect,
    targetRect: DOMRect,
  ): { x: number; y: number; width: number; height: number } {
    const height = stripRect.height;
    const aspectRatio = definition.columnAspectRatio ?? definition.width / definition.height;
    const width = height * aspectRatio;
    const x = targetRect.left - stripRect.left + targetRect.width / 2 - width / 2;

    return { x, y: 0, width, height };
  }

  private spawnColumn(
    event: CombatSkillVfxDto,
    definition: SkillVfxDefinition,
    anchorX: number,
    anchorY: number,
    width: number,
    height: number,
  ): void {
    const svgUrl = getAssetUrl(getSkillVfxSvgPath(event.skillId, definition.svgFile));
    if (!svgUrl) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--column';
    this.applyGlowClass(host, definition.glow);
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.style.setProperty('--vfx-from-x', `${anchorX}px`);
    host.style.setProperty('--vfx-from-y', `${anchorY}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);
    if (definition.svgObjectPosition) {
      host.style.setProperty('--vfx-object-position', definition.svgObjectPosition);
    }
    host.appendChild(this.createSvgFrame(svgUrl, definition.rotationDeg));
    this.layer.appendChild(host);

    window.setTimeout(() => host.remove(), definition.durationMs + 80);
  }

  private spawnAoe(
    event: CombatSkillVfxDto,
    definition: SkillVfxDefinition,
    anchorX: number,
    anchorY: number,
  ): void {
    const svgUrl = getAssetUrl(getSkillVfxSvgPath(event.skillId, definition.svgFile));
    if (!svgUrl) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--aoe';
    this.applyGlowClass(host, definition.glow);
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${definition.width}px`;
    host.style.height = `${definition.height}px`;
    host.style.setProperty('--vfx-from-x', `${anchorX}px`);
    host.style.setProperty('--vfx-from-y', `${anchorY}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);
    host.appendChild(this.createSvgFrame(svgUrl, definition.rotationDeg));
    this.layer.appendChild(host);

    window.setTimeout(() => host.remove(), definition.durationMs + 80);
  }

  private spawnMelee(
    event: CombatSkillVfxDto,
    definition: SkillVfxDefinition,
    anchorX: number,
    anchorY: number,
  ): void {
    const visual = this.createSkillVisual(event.skillId, definition, { loop: false });
    if (!visual) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--melee';
    this.applyGlowClass(host, definition.glow);
    if (event.attackerSide === 'enemy') {
      host.classList.add('battle-skill-vfx--melee-rtl');
    }
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${definition.width}px`;
    host.style.height = `${definition.height}px`;
    host.style.setProperty('--vfx-from-x', `${anchorX}px`);
    host.style.setProperty('--vfx-from-y', `${anchorY}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);
    host.appendChild(visual);
    this.layer.appendChild(host);

    window.setTimeout(() => host.remove(), definition.durationMs + 80);
  }

  private spawnRise(
    event: CombatSkillVfxDto,
    definition: SkillVfxDefinition,
    coords: { x: number; y: number },
  ): void {
    const visual = this.createSkillVisual(event.skillId, definition, { loop: false });
    if (!visual) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--rise';
    this.applyGlowClass(host, definition.glow);
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${definition.width}px`;
    host.style.height = `${definition.height}px`;
    host.style.setProperty('--vfx-from-x', `${coords.x}px`);
    host.style.setProperty('--vfx-from-y', `${coords.y}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);
    host.appendChild(visual);
    this.layer.appendChild(host);

    window.setTimeout(() => host.remove(), definition.durationMs + 80);
  }

  private spawnProjectile(
    event: CombatSkillVfxDto,
    definition: SkillVfxDefinition,
    coords: { startX: number; startY: number; endX: number; endY: number },
  ): void {
    const visual = this.createSkillVisual(event.skillId, definition, { loop: true });
    if (!visual) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--projectile';
    this.applyGlowClass(host, definition.glow);
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${definition.width}px`;
    host.style.height = `${definition.height}px`;
    host.style.setProperty('--vfx-from-x', `${coords.startX}px`);
    host.style.setProperty('--vfx-from-y', `${coords.startY}px`);
    host.style.setProperty('--vfx-to-x', `${coords.endX}px`);
    host.style.setProperty('--vfx-to-y', `${coords.endY}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);

    if (event.attackerSide === 'enemy') {
      host.classList.add('battle-skill-vfx--rtl');
    }

    host.appendChild(visual);
    this.layer.appendChild(host);

    const duration = definition.durationMs || DEFAULT_DURATION_MS;
    window.setTimeout(() => host.remove(), duration + 80);
  }

  private createSkillVisual(
    skillId: string,
    definition: SkillVfxDefinition,
    options: { loop: boolean },
  ): HTMLElement | null {
    if (definition.spriteSheet) {
      return this.createSpriteSheetFrame(definition.spriteSheet, {
        durationMs: definition.durationMs,
        loop: options.loop,
      });
    }

    const svgUrl = getAssetUrl(getSkillVfxSvgPath(skillId, definition.svgFile));
    if (!svgUrl) return null;
    return this.createSvgFrame(svgUrl, definition.rotationDeg);
  }

  private createSpriteSheetFrame(
    sheet: SkillVfxSpriteSheetDefinition,
    options: { durationMs: number; loop?: boolean },
  ): HTMLElement | null {
    const sheetUrl = getAssetUrl(sheet.path);
    if (!sheetUrl) return null;

    const frameCount = sheet.columns * sheet.rows;
    const cycleMs = sheet.frameDurationMs ?? options.durationMs;
    const cols = sheet.columns;
    const rows = sheet.rows;
    const loop = options.loop ?? true;

    const el = document.createElement('div');
    el.className = 'battle-skill-vfx__sheet';
    el.style.backgroundImage = `url("${sheetUrl}")`;
    el.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
    el.style.setProperty('--vfx-sheet-duration', `${cycleMs}ms`);
    el.setAttribute('aria-hidden', 'true');

    const keyframes: Keyframe[] = [];
    for (let i = 0; i < frameCount; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols <= 1 ? 0 : (col / (cols - 1)) * 100;
      const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
      keyframes.push({
        backgroundPosition: `${x}% ${y}%`,
        offset: i / frameCount,
        easing: 'step-end',
      });
    }
    keyframes.push({
      backgroundPosition: keyframes[frameCount - 1]?.backgroundPosition ?? '0% 0%',
      offset: 1,
    });

    el.animate(keyframes, {
      duration: cycleMs,
      iterations: loop ? Infinity : 1,
      fill: loop ? 'none' : 'forwards',
    });

    return el;
  }

  private spawnSelfPulse(
    definition: SkillVfxDefinition,
    startX: number,
    startY: number,
    skillId: string,
  ): void {
    const svgUrl = getAssetUrl(getSkillVfxSvgPath(skillId, definition.svgFile));
    if (!svgUrl) return;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--self';
    if (definition.glow === 'heal') {
      host.classList.add('battle-skill-vfx--heal');
    } else {
      this.applyGlowClass(host, definition.glow);
    }
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${definition.width}px`;
    host.style.height = `${definition.height}px`;
    host.style.setProperty('--vfx-from-x', `${startX}px`);
    host.style.setProperty('--vfx-from-y', `${startY}px`);
    host.style.setProperty('--vfx-to-x', `${startX}px`);
    host.style.setProperty('--vfx-to-y', `${startY}px`);
    host.style.setProperty('--vfx-duration', `${definition.durationMs}ms`);
    host.appendChild(this.createSvgFrame(svgUrl, definition.rotationDeg));
    this.layer.appendChild(host);

    window.setTimeout(() => host.remove(), definition.durationMs + 80);
  }

  private spawnImpact(
    definition: SkillVfxDefinition,
    centerX: number,
    centerY: number,
    skillId: string,
  ): void {
    const impact = definition.impact;
    if (!impact) return;

    const left = centerX - impact.width / 2;
    const top = centerY - impact.height / 2;

    const host = document.createElement('div');
    host.className = 'battle-skill-vfx battle-skill-vfx--impact';
    this.applyGlowClass(host, definition.glow);
    host.setAttribute('aria-hidden', 'true');
    host.style.width = `${impact.width}px`;
    host.style.height = `${impact.height}px`;
    host.style.setProperty('--vfx-from-x', `${left}px`);
    host.style.setProperty('--vfx-from-y', `${top}px`);
    host.style.setProperty('--vfx-duration', `${impact.durationMs}ms`);

    if (impact.spriteSheet) {
      const sheet = this.createSpriteSheetFrame(impact.spriteSheet, {
        durationMs: impact.durationMs,
        loop: false,
      });
      if (!sheet) return;
      host.appendChild(sheet);
    } else {
      const impactPath = getSkillVfxImpactSvgPath(skillId, impact);
      if (!impactPath) return;
      const svgUrl = getAssetUrl(impactPath);
      if (!svgUrl) return;
      host.appendChild(this.createSvgObject(svgUrl));
    }

    this.layer.appendChild(host);
    window.setTimeout(() => host.remove(), impact.durationMs + 80);
  }

  private applyGlowClass(host: HTMLElement, glow?: SkillVfxDefinition['glow']): void {
    if (!glow) return;
    host.classList.add(`battle-skill-vfx--${glow}`);
  }

  private createSvgFrame(svgUrl: string, rotationDeg?: number): HTMLElement {
    if (!rotationDeg) {
      return this.createSvgObject(svgUrl);
    }

    const frame = document.createElement('div');
    frame.className = 'battle-skill-vfx__rotator';
    frame.style.setProperty('--vfx-rotation', `${rotationDeg}deg`);
    frame.appendChild(this.createSvgObject(svgUrl));
    return frame;
  }

  private createSvgObject(svgUrl: string): HTMLObjectElement {
    const svgHost = document.createElement('object');
    svgHost.className = 'battle-skill-vfx__svg';
    svgHost.type = 'image/svg+xml';
    svgHost.data = svgUrl;
    svgHost.setAttribute('aria-hidden', 'true');
    return svgHost;
  }

  private findAnchor(side: 'hero' | 'enemy', actorId: string): HTMLElement | null {
    if (side === 'hero') {
      return this.battleStrip.querySelector(
        `[data-hero-id="${actorId}"] [data-float-anchor="hero"]`,
      );
    }

    return this.battleStrip.querySelector(
      `[data-enemy-id="${actorId}"] [data-float-anchor="enemy"]`,
    );
  }
}
