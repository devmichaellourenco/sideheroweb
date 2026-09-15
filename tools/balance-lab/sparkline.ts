/**
 * Helper compartilhado de sparkline/SVG para o Balance Lab.
 * Sem dependências externas — puro DOM-string, funciona em browser e Node.
 */

export interface SparklineOptions {
  width?: number;
  height?: number;
  /** Cor CSS da linha primária. */
  color?: string;
  /** Valores da linha secundária (ex.: preço épico vs ouro). */
  secondaryValues?: number[];
  secondaryColor?: string;
  /** aria-label do <svg>. */
  label?: string;
  showDots?: boolean;
  padding?: number;
}

export interface SparklineFigureOptions extends SparklineOptions {
  caption: string;
}

// ── helpers internos ─────────────────────────────────────────────────────────

function normalizeToUnit(values: number[], min: number, max: number): number[] {
  const range = max - min || 1;
  return values.map((v) => 1 - (v - min) / range);
}

function toPoints(
  normalized: number[],
  width: number,
  height: number,
  padding: number,
): string {
  const iw = width - 2 * padding;
  const ih = height - 2 * padding;
  const n = normalized.length;
  return normalized
    .map((ny, i) => {
      const x = padding + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
      const y = padding + ny * ih;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function polyline(points: string, stroke: string, dash?: string): string {
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"${dashAttr}/>`;
}

// ── exports públicos ─────────────────────────────────────────────────────────

/**
 * Gera uma string SVG inline responsiva (viewBox, preserveAspectRatio="none").
 * Linhas secundárias opcionais são desenhadas tracejadas.
 */
export function renderSparklineSvg(values: number[], options: SparklineOptions = {}): string {
  if (values.length === 0) return '';

  const {
    width = 200,
    height = 48,
    color = 'var(--accent, #d4a850)',
    secondaryValues,
    secondaryColor = 'var(--rar-epic, #c060e8)',
    label = 'Gráfico de tendência',
    showDots = false,
    padding = 4,
  } = options;

  const all = [...values, ...(secondaryValues ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);

  const primNorm = normalizeToUnit(values, min, max);
  const primPoints = toPoints(primNorm, width, height, padding);
  const primLine = polyline(primPoints, color);

  const secLine =
    secondaryValues && secondaryValues.length > 0
      ? (() => {
          const secNorm = normalizeToUnit(secondaryValues, min, max);
          const secPoints = toPoints(secNorm, width, height, padding);
          return polyline(secPoints, secondaryColor, '4 2');
        })()
      : '';

  const iw = width - 2 * padding;
  const ih = height - 2 * padding;
  const dots = showDots
    ? primNorm
        .map((ny, i) => {
          const n = primNorm.length;
          const cx = padding + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
          const cy = padding + ny * ih;
          return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2" fill="${color}"/>`;
        })
        .join('')
    : '';

  return (
    `<svg role="img" aria-label="${label}" viewBox="0 0 ${width} ${height}"` +
    ` preserveAspectRatio="none" width="100%" height="${height}" style="display:block;overflow:visible">` +
    primLine +
    secLine +
    dots +
    `</svg>`
  );
}

/**
 * Envolve o sparkline em `<figure>` com `<figcaption>` acessível.
 */
export function renderSparklineFigure(
  values: number[],
  options: SparklineFigureOptions,
): string {
  if (values.length === 0) return '';
  const ariaLabel = options.label ?? options.caption;
  return (
    `<figure class="lab-sparkline" role="img" aria-label="${ariaLabel}">` +
    renderSparklineSvg(values, options) +
    `<figcaption class="lab-sparkline-caption">${options.caption}</figcaption>` +
    `</figure>`
  );
}

/**
 * Renderiza dois sparklines lado a lado com legendas.
 */
export function renderSparklinePair(
  primary: { values: number[]; caption: string; color?: string },
  secondary: { values: number[]; caption: string; color?: string },
): string {
  return (
    `<div class="lab-sparkline-pair">` +
    renderSparklineFigure(primary.values, {
      caption: primary.caption,
      color: primary.color,
    }) +
    renderSparklineFigure(secondary.values, {
      caption: secondary.caption,
      color: secondary.color,
    }) +
    `</div>`
  );
}
