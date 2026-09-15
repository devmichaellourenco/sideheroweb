import { formatBattleLogEntryHtml } from './BattleLogPresentation';

function appendMessage(container: HTMLElement, message: string): void {
  const item = document.createElement('li');
  item.className = 'battle-log-entry';
  item.innerHTML = formatBattleLogEntryHtml(message);
  container.prepend(item);
}

function rebuild(container: HTMLElement, messages: readonly string[]): void {
  const fragment = document.createDocumentFragment();
  for (const message of [...messages].reverse()) {
    const item = document.createElement('li');
    item.className = 'battle-log-entry';
    item.innerHTML = formatBattleLogEntryHtml(message);
    fragment.append(item);
  }
  container.replaceChildren(fragment);
}

export class BattleLogRenderer {
  private signature = '';

  render(container: HTMLElement, messages: readonly string[]): void {
    const signature = messages.join('\u0001');
    if (signature === this.signature) {
      return;
    }

    if (messages.length === 0) {
      container.replaceChildren();
      this.signature = '';
      return;
    }

    const previousMessages = this.signature ? this.signature.split('\u0001') : [];
    const canIncrement =
      previousMessages.length > 0 &&
      messages.length >= previousMessages.length &&
      previousMessages.every((message, index) => messages[index] === message);

    if (canIncrement && messages.length > previousMessages.length) {
      const added = messages.slice(previousMessages.length);
      for (const message of [...added].reverse()) {
        appendMessage(container, message);
      }

      while (container.childElementCount > messages.length) {
        container.lastElementChild?.remove();
      }

      this.signature = signature;
      return;
    }

    rebuild(container, messages);
    this.signature = signature;
  }

  reset(): void {
    this.signature = '';
  }
}
