import { GearDto, HeroDto } from '../../application/dto/GameStateDto';
import { evaluateGearRequirements } from '../../application/mappers/GearRequirementPresentationMapper';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderGearRequirementLines(hero: HeroDto, gear: GearDto): string {
  const { lines } = evaluateGearRequirements(hero, gear);

  const rows = lines
    .map((line) => {
      const statusClass = line.met
        ? 'gear-requirement-line--met'
        : 'gear-requirement-line--unmet';

      return `
        <span class="gear-requirement-line ${statusClass}">
          ${escapeHtml(line.label)}: ${line.current} / ${line.required}
        </span>
      `;
    })
    .join('');

  return `
    <div class="gear-requirement-lines">
      <span class="gear-requirement-lines-title">Requisitos</span>
      ${rows}
    </div>
  `;
}

export {
  canHeroEquipGear,
  evaluateGearRequirements,
} from '../../application/mappers/GearRequirementPresentationMapper';
