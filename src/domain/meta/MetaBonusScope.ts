import { emptyMetaBonuses, MetaBonuses } from './MetaBonuses';

let active = emptyMetaBonuses();

export const MetaBonusScope = {
  set(bonuses: MetaBonuses): void {
    active = bonuses;
  },
  get(): MetaBonuses {
    return active;
  },
  clear(): void {
    active = emptyMetaBonuses();
  },
};
