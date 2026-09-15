import { imgTag } from '../assets/AssetCatalog';

/** Preview no topo do tooltip — altura 82px, largura proporcional. */
export function renderTooltipPreviewImage(src: string, alt: string): string {
  return `
    <span class="tooltip-preview">
      ${imgTag(src, alt, 'tooltip-preview-image')}
    </span>
  `.trim();
}
