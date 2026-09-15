export function debounce(callback: () => void, delayMs = 180): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(callback, delayMs);
  };
}

