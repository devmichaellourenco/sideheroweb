import { HeroClass } from '../entities/HeroClass';
import { Attributes } from './Attributes';

/** Atributos iniciais fixos por classe — não gastam pontos de aprimoramento. */
export const BASE_ATTRIBUTES: Record<HeroClass, Attributes> = {
  knight: { str: 12, dex: 8, int: 5 },
  sorcerer: { str: 5, dex: 8, int: 12 },
  priest: { str: 6, dex: 7, int: 11 },
  berserker: { str: 14, dex: 9, int: 4 },
  archer: { str: 7, dex: 14, int: 5 },
  paladin: { str: 11, dex: 6, int: 8 },
};

export function getBaseAttributes(heroClass: HeroClass): Attributes {
  return { ...BASE_ATTRIBUTES[heroClass] };
}
