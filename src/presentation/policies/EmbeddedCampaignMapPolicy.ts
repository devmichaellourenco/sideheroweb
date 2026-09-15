export type EmbeddedCampaignMapState = {
  loadoutEditOpen: boolean;
  combatIntermission: unknown;
};

export type EmbeddedCampaignMapFlags = {
  battleStartActive: boolean;
  victoryOverlayActive: boolean;
  battleResultPending: boolean;
  campaignModalOpen: boolean;
};

/**
 * Mapa embutido só no hub, depois do Continuar do resultado.
 * Intermissão terminal / overlay de CLEAR/DEFEAT têm prioridade.
 */
export function shouldShowEmbeddedCampaignMap(
  state: EmbeddedCampaignMapState,
  flags: EmbeddedCampaignMapFlags,
): boolean {
  if (!state.loadoutEditOpen) return false;
  if (state.combatIntermission) return false;
  if (flags.battleResultPending) return false;
  if (flags.victoryOverlayActive) return false;
  if (flags.battleStartActive) return false;
  if (flags.campaignModalOpen) return false;
  return true;
}
