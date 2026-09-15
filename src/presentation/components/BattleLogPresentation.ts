import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../domain/combat/DamageElement';

const ELEMENT_ENTRIES = Object.entries(DAMAGE_ELEMENT_LABELS) as Array<[DamageElement, string]>;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightElements(text: string): string {
  let result = text;
  for (const [element, label] of ELEMENT_ENTRIES) {
    if (element === 'physical') continue;
    result = result.replace(
      new RegExp(`\\b${label}\\b`, 'g'),
      `<span class="battle-log-el battle-log-el--${element}">${label}</span>`,
    );
  }
  return result;
}

function highlightLine(line: string): string {
  let html = escapeHtml(line);

  html = html.replace(
    /^(.+?) acertou (.+?) com a skill (.+?)\./,
    '<span class="battle-log-name">$1</span> acertou <span class="battle-log-name">$2</span> com a skill <span class="battle-log-skill">$3</span>.',
  );

  html = html.replace(
    /^(.+?) usou a skill (.+?) em (.+?)\./,
    '<span class="battle-log-name">$1</span> usou a skill <span class="battle-log-skill">$2</span> em <span class="battle-log-name">$3</span>.',
  );

  html = html.replace(
    /^O (.+?) foi derrotado!/,
    'O <span class="battle-log-name">$1</span> foi derrotado!',
  );

  html = html.replace(
    /^(.+?) sofreu dano contínuo\./,
    '<span class="battle-log-name">$1</span> sofreu dano contínuo.',
  );

  html = highlightElements(html);

  html = html.replace(
    /\bCRÍTICO!?\b/gi,
    '<span class="battle-log-crit">CRÍTICO</span>',
  );

  if (/dano causado foi de/i.test(line) || /não causou dano/i.test(line)) {
    html = html.replace(/(\d+)/g, '<span class="battle-log-damage">$1</span>');
  }

  if (/cura realizada foi de/i.test(line)) {
    html = html.replace(/(\d+)/g, '<span class="battle-log-heal">$1</span>');
  }

  html = html.replace(
    /\b(ESQUIVOU!?|esquivou|bloqueio|bloqueada)\b/gi,
    '<span class="battle-log-mitigation">$1</span>',
  );

  return html;
}

/** Converte mensagem de log (possivelmente multi-linha) em HTML destacado. */
export function formatBattleLogEntryHtml(message: string): string {
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return '<p class="battle-log-line"></p>';
  }

  return lines
    .map((line) => `<p class="battle-log-line">${highlightLine(line)}</p>`)
    .join('');
}
