import { GameStateDto } from '../../application/dto/GameStateDto';
import {
  EquipPickerModalRenderer,
  EquipPickerMode,
} from '../components/EquipPickerModalRenderer';
import { GearSlotKey } from '../components/GearPresentation';

export type InlineEquipTarget =
  | { kind: 'slot'; heroId: string; slot: GearSlotKey }
  | { kind: 'gear'; gearId: string };

export interface InlineEquipHandlers {
  onSelectGear: (heroId: string, gearId: string) => void;
  onSelectHero: (heroId: string, gearId: string) => void;
  onUnequip: (heroId: string, slot: GearSlotKey) => void;
  onSortChange: () => void;
  onUpgradesOnlyChange: () => void;
  onClose: () => void;
}

export class InlineEquipController {
  private readonly picker = new EquipPickerModalRenderer();
  private target: InlineEquipTarget | null = null;

  getTarget(): InlineEquipTarget | null {
    return this.target;
  }

  getActiveSlot(): { heroId: string; slot: GearSlotKey } | null {
    if (this.target?.kind !== 'slot') return null;
    return { heroId: this.target.heroId, slot: this.target.slot };
  }

  toggleSlot(heroId: string, slot: GearSlotKey): void {
    if (
      this.target?.kind === 'slot' &&
      this.target.heroId === heroId &&
      this.target.slot === slot
    ) {
      this.target = null;
      return;
    }
    this.target = { kind: 'slot', heroId, slot };
  }

  openGear(gearId: string): void {
    this.target = { kind: 'gear', gearId };
  }

  close(): void {
    this.target = null;
  }

  isOpen(): boolean {
    return this.target !== null;
  }

  toPickerMode(): EquipPickerMode | null {
    if (!this.target) return null;
    if (this.target.kind === 'slot') {
      return { type: 'slot', heroId: this.target.heroId, slot: this.target.slot };
    }
    return { type: 'gear', gearId: this.target.gearId };
  }

  render(host: HTMLElement, state: GameStateDto, handlers: InlineEquipHandlers): void {
    const mode = this.toPickerMode();
    if (!mode || mode.type !== 'gear') {
      host.innerHTML = '';
      host.classList.add('hidden');
      return;
    }

    host.classList.remove('hidden');
    host.innerHTML = `
      <div class="inline-equip-panel">
        <div class="inline-equip-header">
          <span class="inline-equip-title">Escolha o herói</span>
          <button type="button" class="inline-equip-close" data-inline-equip-close aria-label="Fechar">✕</button>
        </div>
        <div class="inline-equip-body" data-inline-equip-body></div>
      </div>
    `;

    host.querySelector('[data-inline-equip-close]')?.addEventListener('click', () => {
      handlers.onClose();
    });

    const body = host.querySelector('[data-inline-equip-body]') as HTMLElement;
    this.picker.render(body, state, mode, {
      onSelectGear: handlers.onSelectGear,
      onSelectHero: handlers.onSelectHero,
      onUnequip: handlers.onUnequip,
      onSortChange: handlers.onSortChange,
      onUpgradesOnlyChange: handlers.onUpgradesOnlyChange,
    });
  }
}
