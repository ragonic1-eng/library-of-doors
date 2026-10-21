export interface DialogueTurn { role: "player" | "character"; text: string }

/** Accept both old clients (latest input in history) and the prior-history contract. */
export function priorTurns(history: DialogueTurn[], playerLine?: string): DialogueTurn[] {
  const last = history.at(-1);
  return playerLine !== undefined && last?.role === "player" && last.text === playerLine
    ? history.slice(0, -1) : history;
}

export function shouldConclude(history: DialogueTurn[], maxTurns: number): boolean {
  return maxTurns > 0 && history.filter((turn) => turn.role === "player").length + 1 >= maxTurns;
}
