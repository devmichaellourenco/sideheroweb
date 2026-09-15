export function isImportantLogEntry(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('derrotado') ||
    normalized.includes('baú') ||
    normalized.includes('otimizou equipe') ||
    normalized.includes('equipado') ||
    normalized.includes('party derrotada') ||
    normalized.includes('abriu') ||
    normalized.includes('itens recebidos') ||
    normalized.includes('comprou') ||
    normalized.includes('renovou a loja') ||
    normalized.includes('comprou melhoria')
  );
}

export function filterBattleLogMessages(
  messages: string[],
  importantOnly: boolean,
): string[] {
  if (!importantOnly) return messages;
  return messages.filter((message) => isImportantLogEntry(message));
}
