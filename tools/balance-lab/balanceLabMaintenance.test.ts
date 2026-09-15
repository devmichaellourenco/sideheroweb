/**
 * Testes puros para os utilitários do Balance Lab Manutenção:
 *  - diff JSON recursivo
 *  - segurança de path (isPathSafe)
 *  - tokens de versão
 *
 * Nota: promotion preview/apply envolvem I/O real de arquivo e são
 * testados via integração manual / balance-lab server em execução.
 */
import { describe, expect, it } from 'vitest';

// ── Importações dos módulos ESM de scripts/ ───────────────────────────────────
// Os módulos são puro JS sem dependências de Node (exceto version.mjs).
// Para testes unitários importamos as funções diretamente com resolução relativa.

import { diffJsonSnapshots } from '../../scripts/balance-lab/diff.mjs';
import { isPathSafe } from '../../scripts/balance-lab/backup.mjs';
import { computeVersionToken } from '../../scripts/balance-lab/version.mjs';
import {
  mergeGearItemsIntoCanonical,
  mergeShopsIntoCanonical,
} from '../../scripts/balance-lab/promotion.mjs';

describe('promotion merge', () => {
  it('mescla overrides de item no catálogo canônico em array', () => {
    const catalog = [
      { id: 'sword', name: 'Espada', basePrice: 10 },
      { id: 'shield', name: 'Escudo', basePrice: 20 },
    ];
    const merged = mergeGearItemsIntoCanonical(catalog, {
      items: { sword: { name: 'Espada reforçada', basePrice: 30 } },
    });

    expect(merged).toEqual([
      { id: 'sword', name: 'Espada reforçada', basePrice: 30 },
      { id: 'shield', name: 'Escudo', basePrice: 20 },
    ]);
    expect(catalog[0]?.basePrice).toBe(10);
  });

  it('atualiza, adiciona e remove lojas no catálogo canônico em array', () => {
    const catalog = [
      { id: 'camp', name: 'Acampamento', catalogItemIds: ['sword'] },
      { id: 'old', name: 'Antiga', catalogItemIds: [] },
    ];
    const merged = mergeShopsIntoCanonical(catalog, {
      shops: {
        camp: { name: 'Intendente' },
        forge: { name: 'Forja', catalogItemIds: ['shield'] },
      },
      deletedShopIds: ['old'],
    });

    expect(merged).toEqual([
      { id: 'camp', name: 'Intendente', catalogItemIds: ['sword'] },
      { id: 'forge', name: 'Forja', catalogItemIds: ['shield'] },
    ]);
  });
});

// ── diffJsonSnapshots ─────────────────────────────────────────────────────────

describe('diffJsonSnapshots', () => {
  it('retorna vazio quando snapshots são idênticos', () => {
    const snap = { a: 1, b: 'x' };
    const result = diffJsonSnapshots(snap, snap);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });

  it('detecta adição de chave de nível raiz', () => {
    const result = diffJsonSnapshots({ a: 1 }, { a: 1, b: 2 });
    expect(result.added).toHaveLength(1);
    expect(result.added[0].path).toBe('b');
    expect(result.added[0].after).toBe(2);
    expect(result.added[0].before).toBeUndefined();
  });

  it('detecta remoção de chave de nível raiz', () => {
    const result = diffJsonSnapshots({ a: 1, b: 2 }, { a: 1 });
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].path).toBe('b');
    expect(result.removed[0].before).toBe(2);
    expect(result.removed[0].after).toBeUndefined();
  });

  it('detecta alteração de valor escalar', () => {
    const result = diffJsonSnapshots({ a: 1 }, { a: 99 });
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].path).toBe('a');
    expect(result.changed[0].before).toBe(1);
    expect(result.changed[0].after).toBe(99);
  });

  it('detecta mudança em chave aninhada com path composto', () => {
    const a = { items: { sword: { basePrice: 100 } } };
    const b = { items: { sword: { basePrice: 200 } } };
    const result = diffJsonSnapshots(a, b);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].path).toBe('items.sword.basePrice');
    expect(result.changed[0].before).toBe(100);
    expect(result.changed[0].after).toBe(200);
  });

  it('detecta adição de objeto aninhado inteiro', () => {
    const a = { items: {} };
    const b = { items: { new_item: { name: 'Espada', basePrice: 50 } } };
    const result = diffJsonSnapshots(a, b);
    expect(result.added.length).toBeGreaterThan(0);
    const names = result.added.map((e) => e.path);
    expect(names.some((p) => p.startsWith('items.new_item'))).toBe(true);
  });

  it('detecta alterações em múltiplos níveis simultaneamente', () => {
    const a = { x: 1, nested: { y: 2 } };
    const b = { x: 10, nested: { y: 20 } };
    const result = diffJsonSnapshots(a, b);
    expect(result.changed).toHaveLength(2);
    const paths = result.changed.map((e) => e.path);
    expect(paths).toContain('x');
    expect(paths).toContain('nested.y');
  });

  it('classifica corretamente kind para cada tipo', () => {
    const a = { keep: 1, change: 'old', remove: true };
    const b = { keep: 1, change: 'new', add: 42 };
    const result = diffJsonSnapshots(a, b);
    expect(result.changed[0].kind).toBe('changed');
    expect(result.removed[0].kind).toBe('removed');
    expect(result.added[0].kind).toBe('added');
  });

  it('lida com arrays como valores opacos (compara por JSON)', () => {
    const a = { arr: [1, 2, 3] };
    const b = { arr: [1, 2, 4] };
    const result = diffJsonSnapshots(a, b);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].path).toBe('arr');
  });

  it('path com chave contendo ponto usa sintaxe de índice', () => {
    const a = { 'a.b': 1 };
    const b = { 'a.b': 2 };
    const result = diffJsonSnapshots(a, b);
    expect(result.changed[0].path).toContain('"a.b"');
  });
});

// ── isPathSafe ────────────────────────────────────────────────────────────────

describe('isPathSafe', () => {
  it('retorna true quando path está dentro do diretório permitido', () => {
    expect(isPathSafe('/data/backups/file.json', '/data/backups')).toBe(true);
  });

  it('retorna false para path traversal clássico', () => {
    expect(isPathSafe('/data/../../etc/passwd', '/data/backups')).toBe(false);
  });

  it('retorna false para path fora do diretório permitido', () => {
    expect(isPathSafe('/other/dir/file.json', '/data/backups')).toBe(false);
  });

  it('retorna true para o próprio diretório', () => {
    expect(isPathSafe('/data/backups', '/data/backups')).toBe(true);
  });

  it('retorna false se path parecer um subdiretório mas não for filho direto', () => {
    expect(isPathSafe('/data/backupsOther/file.json', '/data/backups')).toBe(false);
  });

  it('funciona com trailing slash no diretório permitido', () => {
    expect(isPathSafe('/data/backups/file.json', '/data/backups/')).toBe(true);
  });
});

// ── computeVersionToken ───────────────────────────────────────────────────────

describe('computeVersionToken', () => {
  it('retorna string não vazia', () => {
    const token = computeVersionToken({ a: 1000, b: 2000 });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('tokens diferentes para mtimes diferentes', () => {
    const t1 = computeVersionToken({ scope: 1000000 });
    const t2 = computeVersionToken({ scope: 1000001 });
    expect(t1).not.toBe(t2);
  });

  it('tokens iguais para os mesmos mtimes', () => {
    const mtimes = { 'gear-items': 123456, shops: 654321 };
    expect(computeVersionToken(mtimes)).toBe(computeVersionToken(mtimes));
  });

  it('trata valores null como 0 (arquivo inexistente)', () => {
    const withNull = computeVersionToken({ a: null, b: 100 });
    const withZero = computeVersionToken({ a: 0, b: 100 });
    expect(withNull).toBe(withZero);
  });

  it('retorna token estável ("0") quando todos são null', () => {
    const token = computeVersionToken({ a: null, b: null });
    expect(token).toBe((0).toString(36));
  });
});
