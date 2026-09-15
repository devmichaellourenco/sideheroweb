import { describe, expect, it } from 'vitest';
import { shouldShowEmbeddedCampaignMap } from './EmbeddedCampaignMapPolicy';

const hub = {
  loadoutEditOpen: true,
  combatIntermission: null,
};

const idleFlags = {
  battleStartActive: false,
  victoryOverlayActive: false,
  battleResultPending: false,
  campaignModalOpen: false,
};

describe('shouldShowEmbeddedCampaignMap', () => {
  it('mostra o mapa no hub após o resultado', () => {
    expect(shouldShowEmbeddedCampaignMap(hub, idleFlags)).toBe(true);
  });

  it('esconde o mapa durante CLEAR/DEFEAT pendente', () => {
    expect(
      shouldShowEmbeddedCampaignMap(
        {
          loadoutEditOpen: true,
          combatIntermission: { variant: 'phase-clear' },
        },
        idleFlags,
      ),
    ).toBe(false);
    expect(
      shouldShowEmbeddedCampaignMap(hub, { ...idleFlags, battleResultPending: true }),
    ).toBe(false);
    expect(
      shouldShowEmbeddedCampaignMap(hub, { ...idleFlags, victoryOverlayActive: true }),
    ).toBe(false);
  });

  it('esconde o mapa fora do hub ou com START/modal', () => {
    expect(
      shouldShowEmbeddedCampaignMap({ loadoutEditOpen: false, combatIntermission: null }, idleFlags),
    ).toBe(false);
    expect(shouldShowEmbeddedCampaignMap(hub, { ...idleFlags, battleStartActive: true })).toBe(
      false,
    );
    expect(shouldShowEmbeddedCampaignMap(hub, { ...idleFlags, campaignModalOpen: true })).toBe(
      false,
    );
  });
});
