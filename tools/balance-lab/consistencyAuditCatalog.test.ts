/**
 * Testes unitários puros para o catálogo de auditoria de inconsistências.
 * Não alteram dados — somente verificam estrutura e contratos do payload.
 */
import { describe, expect, it } from 'vitest';
import {
  buildConsistencyAuditPayload,
  EXTREME_STAT_MULTIPLIER_THRESHOLD,
  type AuditIssue,
  type AuditSeverity,
} from './consistencyAuditCatalog';

describe('buildConsistencyAuditPayload — contrato de tipos', () => {
  const payload = buildConsistencyAuditPayload();

  it('retorna objeto com issues, counts, threshold e generatedAt', () => {
    expect(payload).toHaveProperty('issues');
    expect(payload).toHaveProperty('counts');
    expect(payload).toHaveProperty('extremeStatMultiplierThreshold');
    expect(payload).toHaveProperty('generatedAt');
  });

  it('issues é um array', () => {
    expect(Array.isArray(payload.issues)).toBe(true);
  });

  it('extremeStatMultiplierThreshold bate com a constante exportada', () => {
    expect(payload.extremeStatMultiplierThreshold).toBe(EXTREME_STAT_MULTIPLIER_THRESHOLD);
  });

  it('generatedAt é uma data ISO válida', () => {
    expect(() => new Date(payload.generatedAt)).not.toThrow();
    expect(isNaN(new Date(payload.generatedAt).getTime())).toBe(false);
  });

  it('counts tem chaves error, warning, info', () => {
    expect(payload.counts).toHaveProperty('error');
    expect(payload.counts).toHaveProperty('warning');
    expect(payload.counts).toHaveProperty('info');
  });

  it('soma de counts bate com total de issues', () => {
    const total = payload.counts.error + payload.counts.warning + payload.counts.info;
    expect(total).toBe(payload.issues.length);
  });
});

describe('buildConsistencyAuditPayload — estrutura de cada issue', () => {
  const payload = buildConsistencyAuditPayload();
  const VALID_SEVERITIES: AuditSeverity[] = ['error', 'warning', 'info'];
  const VALID_KINDS = [
    'item_in_no_shop',
    'shop_empty_pool',
    'shop_no_eligible_items_in_tier',
    'shop_missing_epic_at_milestone',
    'phase_extreme_stat_multiplier',
    'upgrade_missing_parent',
    'upgrade_zero_cost',
    'upgrade_overlapping_branch',
  ];

  for (const issue of payload.issues) {
    it(`issue "${issue.entity}" tem severity válida`, () => {
      expect(VALID_SEVERITIES).toContain(issue.severity);
    });

    it(`issue "${issue.entity}" tem kind válido`, () => {
      expect(VALID_KINDS).toContain(issue.kind);
    });

    it(`issue "${issue.entity}" tem message string não vazia`, () => {
      expect(typeof issue.message).toBe('string');
      expect(issue.message.trim().length).toBeGreaterThan(0);
    });

    it(`issue "${issue.entity}" tem entity string não vazia`, () => {
      expect(typeof issue.entity).toBe('string');
      expect(issue.entity.trim().length).toBeGreaterThan(0);
    });

    if (issue.deepLink) {
      it(`deep-link de "${issue.entity}" começa com #`, () => {
        expect(issue.deepLink).toMatch(/^#/);
      });
    }
  }
});

describe('buildConsistencyAuditPayload — regra statMultiplier extremo', () => {
  it(`limiar EXTREME_STAT_MULTIPLIER_THRESHOLD é ${EXTREME_STAT_MULTIPLIER_THRESHOLD}`, () => {
    expect(EXTREME_STAT_MULTIPLIER_THRESHOLD).toBeGreaterThan(1);
  });

  it('issues de fase extrema têm kind phase_extreme_stat_multiplier', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'phase_extreme_stat_multiplier',
    )) {
      expect(issue.severity).toBe('warning');
      expect(issue.message).toContain('statMultiplier=');
      expect(issue.message).toContain(String(EXTREME_STAT_MULTIPLIER_THRESHOLD));
    }
  });
});

describe('buildConsistencyAuditPayload — regras de loja', () => {
  it('issues de loja com pool vazio têm severity error', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'shop_empty_pool',
    )) {
      expect(issue.severity).toBe('error');
    }
  });

  it('issues de loja sem itens elegíveis têm severity error', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'shop_no_eligible_items_in_tier',
    )) {
      expect(issue.severity).toBe('error');
    }
  });

  it('issues de loja sem épico quando milestone permite têm severity warning', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'shop_missing_epic_at_milestone',
    )) {
      expect(issue.severity).toBe('warning');
    }
  });
});

describe('buildConsistencyAuditPayload — upgrades', () => {
  it('issues de parent inexistente têm severity error', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'upgrade_missing_parent',
    )) {
      expect(issue.severity).toBe('error');
      expect(issue.message).toContain('parent');
    }
  });

  it('issues de custo zero têm severity warning', () => {
    const payload = buildConsistencyAuditPayload();
    for (const issue of payload.issues.filter(
      (i: AuditIssue) => i.kind === 'upgrade_zero_cost',
    )) {
      expect(issue.severity).toBe('warning');
    }
  });

  it('layout atual não tem irmãos saindo do mesmo pai na mesma direção', () => {
    const payload = buildConsistencyAuditPayload();
    const overlapping = payload.issues.filter(
      (i: AuditIssue) => i.kind === 'upgrade_overlapping_branch',
    );
    expect(overlapping.map((i) => i.message)).toEqual([]);
  });
});

describe('buildConsistencyAuditPayload — idempotência', () => {
  it('chamadas consecutivas retornam o mesmo número de issues', () => {
    const a = buildConsistencyAuditPayload();
    const b = buildConsistencyAuditPayload();
    expect(a.issues.length).toBe(b.issues.length);
    expect(a.counts).toEqual(b.counts);
  });
});
