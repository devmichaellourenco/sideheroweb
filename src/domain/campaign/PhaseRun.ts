import { PhaseId } from './CampaignIds';

export interface PhaseRunProps {
  phaseId: PhaseId;
  waveIndex: number;
}

export class PhaseRun {
  readonly phaseId: PhaseId;
  readonly waveIndex: number;

  private constructor(props: PhaseRunProps) {
    this.phaseId = props.phaseId;
    this.waveIndex = Math.max(0, props.waveIndex);
  }

  static start(phaseId: PhaseId): PhaseRun {
    return new PhaseRun({ phaseId, waveIndex: 0 });
  }

  static restore(props: PhaseRunProps): PhaseRun {
    return new PhaseRun(props);
  }

  advanceWave(): PhaseRun {
    return new PhaseRun({ phaseId: this.phaseId, waveIndex: this.waveIndex + 1 });
  }

  resetWaves(): PhaseRun {
    return new PhaseRun({ phaseId: this.phaseId, waveIndex: 0 });
  }

  toProps(): PhaseRunProps {
    return { phaseId: this.phaseId, waveIndex: this.waveIndex };
  }
}
