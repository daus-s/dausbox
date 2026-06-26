type HistoryEntry =
  | { input: string; output: string; error?: never }
  | { input: string; output?: never; error: string };

export class History {
  private history: HistoryEntry[];

  constructor() {
    this.history = [];
  }

  record(input: string, result: { output: string } | { error: string }): void {
    if ("output" in result) {
      this.history.push({ input, output: result.output });
    } else if ("error" in result) {
      this.history.push({ input, error: result.error });
    }
  }

  entries(): HistoryEntry[] {
    return [...this.history];
  }

  length(): number {
    return this.history.length;
  }
}
