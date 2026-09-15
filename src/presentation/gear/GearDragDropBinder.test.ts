// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindGearDragDrop } from './GearDragDropBinder';
import { serializeGearDragSource } from './GearDragDropPolicy';

function mountInventoryDragDom(): HTMLElement {
  const root = document.createElement('div');
  const payload = encodeURIComponent(
    serializeGearDragSource({ kind: 'inventory', gearId: 'g1', slot: 'weapon' }),
  );
  root.innerHTML = `
    <div
      role="button"
      class="inventory-grid-slot"
      draggable="true"
      data-drag-gear="${payload}"
    >item</div>
    <div
      role="button"
      class="equipment-slot gear-drop-target"
      data-drop-gear-hero="h1"
      data-drop-gear-slot="weapon"
    >weapon slot</div>
    <div class="inventory-grid" data-drop-zone="inventory">inventory zone</div>
  `;
  document.body.append(root);
  return root;
}

function dragDataTransfer(): DataTransfer {
  const store = new Map<string, string>();
  return {
    dropEffect: 'none',
    effectAllowed: 'all',
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: [],
    clearData: () => store.clear(),
    getData: (format: string) => store.get(format) ?? '',
    setData: (format: string, data: string) => {
      store.set(format, data);
    },
    setDragImage: () => undefined,
  } as DataTransfer;
}

function createDragEvent(
  type: string,
  dataTransfer: DataTransfer,
  options: { cancelable?: boolean } = {},
): DragEvent {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: options.cancelable ?? false,
  });
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: dataTransfer,
  });
  return event;
}

describe('GearDragDropBinder', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('permite drop de inventário no slot compatível e chama onEquip', () => {
    const root = mountInventoryDragDom();
    const onEquip = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip,
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const target = root.querySelector('[data-drop-gear-slot="weapon"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    expect(target.classList.contains('gear-drop-target--valid')).toBe(true);

    const over = createDragEvent('dragover', dt, { cancelable: true });
    target.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    expect(target.classList.contains('gear-drop-target--valid')).toBe(true);

    target.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onEquip).toHaveBeenCalledWith('h1', 'g1');
  });

  it('permite drop de oferta da loja no slot e chama onBuyAndEquipShopOffer', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({ kind: 'shop', offerId: 'shop-1-0-o0', slot: 'weapon' }),
    );
    root.innerHTML = `
      <article draggable="true" data-drag-gear="${payload}" data-shop-offer="shop-1-0-o0">offer</article>
      <div
        role="button"
        class="equipment-slot gear-drop-target"
        data-drop-gear-hero="h1"
        data-drop-gear-slot="weapon"
      >weapon</div>
    `;
    document.body.append(root);

    const onBuyAndEquipShopOffer = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer,
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const target = root.querySelector('[data-drop-gear-slot="weapon"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    target.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onBuyAndEquipShopOffer).toHaveBeenCalledWith('shop-1-0-o0', 'h1');
  });

  it('destaca o slot compatível no dragstart sem precisar passar o mouse', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({ kind: 'inventory', gearId: 'g1', slot: 'armor' }),
    );
    root.innerHTML = `
      <div role="button" draggable="true" data-drag-gear="${payload}">armor item</div>
      <div role="button" data-drop-gear-hero="h1" data-drop-gear-slot="weapon">weapon</div>
      <div role="button" data-drop-gear-hero="h1" data-drop-gear-slot="armor">armor</div>
      <div role="button" data-drop-gear-hero="h1" data-drop-gear-slot="accessory">accessory</div>
    `;
    document.body.append(root);

    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    source.dispatchEvent(createDragEvent('dragstart', dragDataTransfer()));

    expect(root.querySelector('[data-drop-gear-slot="armor"]')?.classList.contains('gear-drop-target--valid')).toBe(
      true,
    );
    expect(root.querySelector('[data-drop-gear-slot="weapon"]')?.classList.contains('gear-drop-target--valid')).toBe(
      false,
    );
    expect(
      root.querySelector('[data-drop-gear-slot="accessory"]')?.classList.contains('gear-drop-target--valid'),
    ).toBe(false);
  });

  it('desequipa ao soltar item equipado na zona do inventário', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({
        kind: 'equipped',
        gearId: 'g2',
        heroId: 'h1',
        slot: 'armor',
      }),
    );
    root.innerHTML = `
      <div role="button" draggable="true" data-drag-gear="${payload}">equipped</div>
      <div class="inventory-grid" data-drop-zone="inventory">inventory</div>
    `;
    document.body.append(root);

    const onUnequip = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip,
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const zone = root.querySelector('[data-drop-zone="inventory"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    const over = createDragEvent('dragover', dt, { cancelable: true });
    zone.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);

    zone.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onUnequip).toHaveBeenCalledWith('h1', 'armor');
  });

  it('envia item do baú ao inventário ao soltar na zona do inventário', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({ kind: 'stash', gearId: 'g5', slot: 'weapon' }),
    );
    root.innerHTML = `
      <div role="button" draggable="true" data-drag-gear="${payload}">stash item</div>
      <div class="inventory-dock-slot stash-inventory-slot" data-drop-zone="inventory">inventário</div>
    `;
    document.body.append(root);

    const onMoveFromStash = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash,
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const zone = root.querySelector('[data-drop-zone="inventory"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    expect(zone.classList.contains('gear-drop-target--valid')).toBe(true);

    const over = createDragEvent('dragover', dt, { cancelable: true });
    zone.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);

    zone.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onMoveFromStash).toHaveBeenCalledWith('g5');
  });

  it('destrói item do baú ao soltar no slot destruir', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({ kind: 'stash', gearId: 'g6', slot: 'armor' }),
    );
    root.innerHTML = `
      <div role="button" draggable="true" data-drag-gear="${payload}">stash item</div>
      <div class="inventory-destroy-slot" data-drop-zone="destroy">destroy</div>
    `;
    document.body.append(root);

    const onDestroyGear = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear,
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const destroySlot = root.querySelector('[data-drop-zone="destroy"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    expect(destroySlot.classList.contains('gear-drop-target--valid')).toBe(true);

    destroySlot.dispatchEvent(createDragEvent('dragover', dt, { cancelable: true }));
    destroySlot.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onDestroyGear).toHaveBeenCalledWith({
      kind: 'stash',
      gearId: 'g6',
      slot: 'armor',
    });
  });

  it('abre destruição ao soltar item do inventário no slot destruir', () => {
    const root = document.createElement('div');
    const payload = encodeURIComponent(
      serializeGearDragSource({ kind: 'inventory', gearId: 'g9', slot: 'weapon' }),
    );
    root.innerHTML = `
      <div role="button" draggable="true" data-drag-gear="${payload}">item</div>
      <div class="inventory-destroy-slot" data-drop-zone="destroy">destroy</div>
    `;
    document.body.append(root);

    const onDestroyGear = vi.fn();
    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear,
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-gear]') as HTMLElement;
    const destroySlot = root.querySelector('[data-drop-zone="destroy"]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    expect(destroySlot.classList.contains('gear-drop-target--valid')).toBe(true);

    destroySlot.dispatchEvent(createDragEvent('dragover', dt, { cancelable: true }));
    destroySlot.dispatchEvent(createDragEvent('drop', dt, { cancelable: true }));
    expect(onDestroyGear).toHaveBeenCalledWith({
      kind: 'inventory',
      gearId: 'g9',
      slot: 'weapon',
    });
  });

  it('ativa cursor de arraste de party no body durante drag de herói', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <article class="formation-slot" draggable="true" data-drag-party-hero="h1" data-party-from-index="0">
        <div class="formation-slot-sprite">hero</div>
      </article>
      <article class="formation-slot formation-slot--empty" data-drop-party-slot="1"></article>
    `;
    document.body.append(root);

    bindGearDragDrop(root, {
      canEditGear: () => true,
      canEditParty: () => true,
      onEquip: vi.fn(),
      onUnequip: vi.fn(),
      onMoveToStash: vi.fn(),
      onMoveFromStash: vi.fn(),
      onMoveFromStashThenEquip: vi.fn(),
      onEquippedToStash: vi.fn(),
      onMoveEquippedGear: vi.fn(),
      onDestroyGear: vi.fn(),
      onBuyAndEquipShopOffer: vi.fn(),
      onPartySlotDrop: vi.fn(),
      onPartyActiveToBench: vi.fn(),
      onPartyReorder: vi.fn(),
    });

    const source = root.querySelector('[data-drag-party-hero]') as HTMLElement;
    const dt = dragDataTransfer();

    source.dispatchEvent(createDragEvent('dragstart', dt));
    expect(document.body.classList.contains('party-drag-active')).toBe(true);
    expect(source.classList.contains('party-dragging')).toBe(true);

    const gapOver = createDragEvent('dragover', dt, { cancelable: true });
    root.dispatchEvent(gapOver);
    expect(gapOver.defaultPrevented).toBe(true);
    expect(dt.dropEffect).toBe('move');

    source.dispatchEvent(createDragEvent('dragend', dt));
    expect(document.body.classList.contains('party-drag-active')).toBe(false);
    expect(source.classList.contains('party-dragging')).toBe(false);
  });
});
