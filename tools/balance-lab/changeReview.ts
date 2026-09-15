function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function confirmChangeReview(
  title: string,
  changeCount: number,
  payload: unknown,
): Promise<boolean> {
  const dialog = document.createElement('dialog');
  dialog.className = 'lab-review-dialog';
  const json = JSON.stringify(payload, null, 2);
  dialog.innerHTML = `
    <form method="dialog" class="lab-review-shell">
      <header>
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${changeCount} alteração(ões) serão gravadas.</p>
        </div>
        <button type="submit" value="cancel" class="lab-btn--ghost" aria-label="Fechar">×</button>
      </header>
      <pre>${escapeHtml(json)}</pre>
      <footer>
        <button type="submit" value="cancel" class="lab-btn--ghost">Voltar</button>
        <button type="submit" value="confirm" class="lab-btn--primary">Confirmar e salvar</button>
      </footer>
    </form>
  `;
  document.body.append(dialog);
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener(
      'close',
      () => {
        const confirmed = dialog.returnValue === 'confirm';
        dialog.remove();
        resolve(confirmed);
      },
      { once: true },
    );
  });
}

