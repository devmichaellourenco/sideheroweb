import { bootGameRuntime } from '../../infrastructure/entry/boot';
import { GameViewController } from '../components/GameViewController';
import { applyStoredUiTheme } from '../components/GamePreferences';

bootGameRuntime();

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('app')) return;

  applyStoredUiTheme();
  const controller = new GameViewController(document.body);
  controller.init();
});
