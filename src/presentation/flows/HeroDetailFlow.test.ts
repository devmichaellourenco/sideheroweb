import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroDetailFlow } from './HeroDetailFlow';
import type { IGameClient } from '../../application/ports/IGameClient';
import type { HeroDetailModalRenderer } from '../components/HeroDetailModalRenderer';
import type { ToastController } from '../components/ToastController';
import type { RewardCelebrationPort } from '../delight/RewardCelebrationPort';
import type { AscendClassConfirmDialog } from '../components/AscendClassConfirmDialog';
import type { ImprovementResetConfirmDialog } from '../components/ImprovementResetConfirmDialog';

describe('HeroDetailFlow', () => {
  const send = vi.fn();
  const client = { send } as unknown as IGameClient;
  const heroDetailModal = {
    setActiveTab: vi.fn(),
    setSkillNodes: vi.fn(),
    setAscensionData: vi.fn(),
    render: vi.fn(),
  } as unknown as HeroDetailModalRenderer;

  let flow: HeroDetailFlow;

  beforeEach(() => {
    send.mockReset();
    flow = new HeroDetailFlow(
      client,
      heroDetailModal,
      {} as ToastController,
      {} as RewardCelebrationPort,
      {} as AscendClassConfirmDialog,
      {} as ImprovementResetConfirmDialog,
      () => undefined,
      () => undefined,
    );
  });

  it('carrega árvore de ascensão ao abrir/trocar para a aba Skills', async () => {
    send.mockImplementation(async (msg: { type: string; heroId: string }) => {
      if (msg.type === 'GET_HERO_SKILL_TREE') {
        return { ok: true, skillNodes: [{ id: 'fireball' }] };
      }
      if (msg.type === 'GET_HERO_ASCENSION_TREE') {
        return {
          ok: true,
          ascensionOptions: [],
          ascensionName: 'Feiticeira',
          ascensionSkillNodes: [{ id: `${msg.heroId}-evo`, name: 'Skill Evo' }],
        };
      }
      return { ok: false };
    });

    await flow.prepareOpen('mage-1', 'skills');

    expect(send).toHaveBeenCalledWith({ type: 'GET_HERO_SKILL_TREE', heroId: 'mage-1' });
    expect(send).toHaveBeenCalledWith({ type: 'GET_HERO_ASCENSION_TREE', heroId: 'mage-1' });
    expect(flow.ascensionSkillNodes).toEqual([{ id: 'mage-1-evo', name: 'Skill Evo' }]);

    await flow.changeTab('mage-2', 'skills');
    expect(send).toHaveBeenCalledWith({ type: 'GET_HERO_ASCENSION_TREE', heroId: 'mage-2' });
    expect(flow.ascensionSkillNodes).toEqual([{ id: 'mage-2-evo', name: 'Skill Evo' }]);
  });
});
