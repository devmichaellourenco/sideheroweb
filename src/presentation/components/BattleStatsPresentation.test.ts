import { describe, expect, it } from 'vitest';
import { renderBattleStatsPanel } from './BattleStatsPresentation';

const sampleStats = {
  damageDealt: 1150,
  healingDone: 340,
  damageTaken: 510,
  damageMitigated: 220,
  critCount: 5,
  damageByElement: {
    physical: 650,
    fire: 150,
    cold: 350,
    lightning: 0,
    air: 0,
  },
  damageTakenByElement: {
    physical: 280,
    fire: 150,
    cold: 80,
    lightning: 0,
    air: 0,
  },
  damageMitigatedByElement: {
    physical: 120,
    fire: 60,
    cold: 40,
    lightning: 0,
    air: 0,
  },
  heroes: [
    {
      heroId: 'h1',
      name: 'Galneon',
      damageDealt: 650,
      healingDone: 0,
      damageTaken: 200,
      damageMitigated: 100,
      critCount: 3,
      basicAttackUses: 12,
      skillUses: 5,
      damageByElement: {
        physical: 650,
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      damageTakenByElement: {
        physical: 200,
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      damageMitigatedByElement: {
        physical: 100,
        fire: 0,
        cold: 0,
        lightning: 0,
        air: 0,
      },
    },
    {
      heroId: 'h2',
      name: 'Elara',
      damageDealt: 150,
      healingDone: 340,
      damageTaken: 80,
      damageMitigated: 40,
      critCount: 1,
      basicAttackUses: 4,
      skillUses: 6,
      damageByElement: {
        physical: 0,
        fire: 150,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      damageTakenByElement: {
        physical: 0,
        fire: 80,
        cold: 0,
        lightning: 0,
        air: 0,
      },
      damageMitigatedByElement: {
        physical: 0,
        fire: 40,
        cold: 0,
        lightning: 0,
        air: 0,
      },
    },
    {
      heroId: 'h3',
      name: 'Nix',
      damageDealt: 350,
      healingDone: 0,
      damageTaken: 230,
      damageMitigated: 80,
      critCount: 1,
      basicAttackUses: 8,
      skillUses: 4,
      damageByElement: {
        physical: 0,
        fire: 0,
        cold: 350,
        lightning: 0,
        air: 0,
      },
      damageTakenByElement: {
        physical: 80,
        fire: 70,
        cold: 80,
        lightning: 0,
        air: 0,
      },
      damageMitigatedByElement: {
        physical: 20,
        fire: 20,
        cold: 40,
        lightning: 0,
        air: 0,
      },
    },
  ],
  skills: [
    {
      heroId: 'h1',
      heroName: 'Galneon',
      skillId: 'thrust',
      skillName: 'Investida',
      uses: 5,
      damageDealt: 400,
      healingDone: 0,
      cooldownLabel: '10s',
      cooldownTooltip:
        'Base = 2 turns × 5s = 10.00s\nLevel 1: sem redução por level → 10.00s\nCDR do equipamento = 0.0%\nRecarga efetiva = 10.00 × (1 − 0.0%) = 10.00s',
    },
  ],
};

describe('BattleStatsPresentation', () => {
  it('renderiza aba geral com totais, heróis e skills', () => {
    const html = renderBattleStatsPanel(sampleStats);

    expect(html).toContain('battle-stats-panel');
    expect(html).toContain('data-battle-stats-tab="general"');
    expect(html).toContain('Dano causado');
    expect(html).toContain('1150');
    expect(html).toContain('Dano mitigado');
    expect(html).toContain('220');
    expect(html).toContain('Galneon');
    expect(html).toContain('Investida');
    expect(html).toContain('12 atk');
    expect(html).toContain('CD 10s');
    expect(html).toContain('Base = 2 turns × 5s = 10.00s');
    expect(html).toContain('battle-stats-hero-card');
    expect(html).not.toContain('battle-stats-hero-elements');
  });

  it('aba geral lista cadência ASPD/TTA da party e inimigos', () => {
    const html = renderBattleStatsPanel(sampleStats, {
      activeParty: [
        {
          id: 'h1',
          name: 'Galneon',
          attackSpeed: 0.54,
          actionTimeRemaining: 0.8,
          actionTimeTotal: 1.85,
        } as never,
      ],
      enemies: [
        {
          id: 'e1',
          name: 'Goblin',
          attackSpeed: 0.5,
          actionTimeRemaining: 1,
          actionTimeTotal: 2,
        } as never,
      ],
    });

    expect(html).toContain('Cadência (ASPD · TTA)');
    expect(html).toContain('0.54/s · 1.85s');
    expect(html).toContain('Goblin');
    expect(html).toContain('0.50/s · 2.00s');
  });

  it('aba de dano causado mostra ranking total e por elemento', () => {
    const html = renderBattleStatsPanel(sampleStats, { activeTab: 'damage' });

    expect(html).toContain('data-battle-stats-tab-panel="damage"');
    expect(html).toContain('battle-stats-bar-row');
    expect(html).toContain('Total');
    expect(html).toContain('Físico');
    expect(html).toContain('Gelo');
    expect(html).toContain('Fogo');
    expect(html).not.toContain('Raio');
    expect(html).toContain('650');
    expect(html).toContain('Elara');
    expect(html).toContain('Nix');
  });

  it('aba de dano sofrido mostra ranking total e por elemento', () => {
    const html = renderBattleStatsPanel(sampleStats, { activeTab: 'taken' });

    expect(html).toContain('data-battle-stats-tab-panel="taken"');
    expect(html).toContain('Total');
    expect(html).toContain('Físico');
    expect(html).toContain('Fogo');
    expect(html).toContain('Gelo');
    expect(html).toContain('Galneon');
    expect(html).toContain('Elara');
  });

  it('aba de dano mitigado mostra ranking total e por elemento', () => {
    const html = renderBattleStatsPanel(sampleStats, { activeTab: 'mitigated' });

    expect(html).toContain('data-battle-stats-tab-panel="mitigated"');
    expect(html).toContain('Total');
    expect(html).toContain('Físico');
    expect(html).toContain('Fogo');
    expect(html).toContain('Gelo');
    expect(html).toContain('Galneon');
    expect(html).toContain('Nix');
  });

  it('aba de críticos lista heróis com barras', () => {
    const html = renderBattleStatsPanel(sampleStats, { activeTab: 'crits' });

    expect(html).toContain('data-battle-stats-tab-panel="crits"');
    expect(html).toContain('battle-stats-bar-fill');
    expect(html).toContain('Galneon');
    expect(html).toContain('>3<');
  });
});
