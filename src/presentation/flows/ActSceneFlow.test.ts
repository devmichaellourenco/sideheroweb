// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { ActSceneDto } from '../../application/dto/CampaignDto';
import { ActSceneFlow } from './ActSceneFlow';

const scene: ActSceneDto = {
  id: 'stendra-act-1',
  mapId: 'stendra',
  actNumber: 1,
  title: 'Portões de Stendra',
  recap: 'Recap',
  preview: 'Preview',
  imageAssetPath: 'campaign/stendra/scene_1.png',
  unlocked: true,
  viewed: false,
};

function mountActSceneDom(): {
  root: HTMLElement;
  stage: HTMLElement;
  backdrop: HTMLElement;
} {
  const root = document.createElement('div');
  root.id = 'act-scene-root';
  root.className = 'act-scene-root hidden';

  const backdrop = document.createElement('div');
  backdrop.id = 'act-scene-backdrop';
  backdrop.className = 'act-scene-backdrop';

  const stage = document.createElement('div');
  stage.id = 'act-scene-stage';
  stage.className = 'act-scene-stage';

  root.append(backdrop, stage);
  document.body.append(root);

  return { root, stage, backdrop };
}

describe('ActSceneFlow', () => {
  it('exibe overlay removendo hidden do container raiz', () => {
    const { root, stage, backdrop } = mountActSceneDom();
    const flow = new ActSceneFlow(root, stage, backdrop);

    flow.show(scene);

    expect(flow.isBlocking()).toBe(true);
    expect(root.classList.contains('hidden')).toBe(false);
    expect(stage.innerHTML).toContain('act-scene-overlay-card--full-bleed');
    expect(stage.innerHTML).toContain('data-act-scene-overlay="stendra-act-1"');
    expect(stage.innerHTML).toContain('data-act-scene-dismiss');
    expect(document.body.classList.contains('act-scene-open')).toBe(true);
  });

  it('dispensa overlay e libera avanço', () => {
    const { root, stage, backdrop } = mountActSceneDom();
    const flow = new ActSceneFlow(root, stage, backdrop);

    flow.show(scene);
    flow.dismiss();

    expect(flow.isBlocking()).toBe(false);
    expect(root.classList.contains('hidden')).toBe(true);
    expect(stage.innerHTML).toBe('');
    expect(document.body.classList.contains('act-scene-open')).toBe(false);
  });
});
