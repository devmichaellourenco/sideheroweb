import { BENCH_XP_RATIO } from './PartyConstants';

export class BenchXpPolicy {
  static benchExperience(activePartyXp: number): number {
    if (activePartyXp <= 0) {
      return 0;
    }

    return Math.floor(activePartyXp * BENCH_XP_RATIO);
  }
}
