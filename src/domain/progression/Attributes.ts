export type AttributeKey = 'str' | 'dex' | 'int';

export interface Attributes {
  str: number;
  dex: number;
  int: number;
}

export function createAttributes(str = 0, dex = 0, int = 0): Attributes {
  return { str, dex, int };
}

export function addAttributes(base: Attributes, bonus: Attributes): Attributes {
  return {
    str: base.str + bonus.str,
    dex: base.dex + bonus.dex,
    int: base.int + bonus.int,
  };
}

export function getAttributeValue(attrs: Attributes, key: AttributeKey): number {
  return attrs[key];
}
