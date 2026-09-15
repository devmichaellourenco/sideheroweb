import { GameStateDto } from '../../application/dto/GameStateDto';
import { renderStageProgressBar } from './StageProgressBarPresentation';

export class StageProgressBarRenderer {
  private lastKey = '';

  constructor(private readonly root: HTMLElement) {}

  render(state: GameStateDto): void {
    const progress = state.phaseRun?.stageProgress ?? null;
    if (!progress || progress.markers.length === 0) {
      // Mantém a última barra durante intermissão (troca de fase) para não colapsar o layout.
      if (state.combatIntermission && this.lastKey && this.lastKey !== 'hidden') {
        return;
      }

      if (this.lastKey !== 'hidden') {
        this.root.innerHTML = '';
        this.root.classList.add('hidden');
        this.root.setAttribute('aria-hidden', 'true');
        this.lastKey = 'hidden';
      }
      return;
    }

    const key = `${progress.phaseId}|${progress.fillRatio}|${progress.markers
      .map((m) => `${m.id}:${m.status}`)
      .join(',')}`;
    if (key === this.lastKey) return;

    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.innerHTML = renderStageProgressBar(progress);
    this.lastKey = key;
  }
}
