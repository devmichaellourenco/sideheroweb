import { describe, expect, it } from 'vitest';
import { formatCombatHitNarrative } from '../../domain/services/combat/CombatLogNarrative';
import { formatBattleLogEntryHtml } from './BattleLogPresentation';

describe('formatCombatHitNarrative', () => {
  it('formata dano com ator, alvo e valor', () => {
    const text = formatCombatHitNarrative({
      actorName: 'Galneon',
      targetLabel: 'Goblin',
      skillName: 'Investida',
      kind: 'damage',
      amount: 230,
    });

    expect(text).toContain('Galneon acertou Goblin com a skill Investida.');
    expect(text).toContain('O dano causado foi de 230');
  });

  it('formata cura em linhas separadas', () => {
    const text = formatCombatHitNarrative({
      actorName: 'Elara',
      targetLabel: 'Galneon',
      skillName: 'Cura Menor',
      kind: 'heal',
      amount: 48,
    });

    expect(text).toBe(
      'Elara acertou Galneon com a skill Cura Menor.\nA cura realizada foi de 48',
    );
  });
});

describe('formatBattleLogEntryHtml', () => {
  it('destaca nomes, dano e crítico no tema claro', () => {
    const html = formatBattleLogEntryHtml(
      'Galneon acertou Goblin com a skill Investida.\nO dano causado foi de 230 CRÍTICO!',
    );

    expect(html).toContain('battle-log-name');
    expect(html).toContain('battle-log-skill');
    expect(html).toContain('battle-log-damage');
    expect(html).toContain('battle-log-crit');
    expect(html).toContain('230');
  });

  it('destaca cura e elemento', () => {
    const html = formatBattleLogEntryHtml(
      'Nix acertou Goblin com a skill Bola de Fogo. Elemento: Fogo.\nO dano causado foi de 12',
    );

    expect(html).toContain('battle-log-el--fire');
    expect(html).toContain('battle-log-damage');
  });
});
