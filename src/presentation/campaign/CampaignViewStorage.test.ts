import { describe, expect, it, beforeEach } from 'vitest';
import {
  getStoredCampaignViewMode,
  isMapNewToPlayer,
  isMapSeen,
  markMapSeen,
  setStoredCampaignViewMode,
} from './CampaignViewStorage';

describe('CampaignViewStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persiste e recupera o modo de visualização', () => {
    expect(getStoredCampaignViewMode()).toBeNull();
    setStoredCampaignViewMode('world');
    expect(getStoredCampaignViewMode()).toBe('world');
    setStoredCampaignViewMode('region');
    expect(getStoredCampaignViewMode()).toBe('region');
  });

  it('rastreia mapas vistos para banner de desbloqueio', () => {
    expect(isMapSeen('gruftall')).toBe(false);
    expect(isMapNewToPlayer('gruftall', true)).toBe(true);

    markMapSeen('gruftall');

    expect(isMapSeen('gruftall')).toBe(true);
    expect(isMapNewToPlayer('gruftall', true)).toBe(false);
    expect(isMapNewToPlayer('gruftall', false)).toBe(false);
  });
});
