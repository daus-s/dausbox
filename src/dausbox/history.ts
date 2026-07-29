export type HistoryEntry = Input | Output | Error;

export class History {
  private history: HistoryEntry[];
  constructor() {
    this.history = [];
  }
  record(entry: HistoryEntry): void {
    this.history.push(entry);
  }
  entries(): HistoryEntry[] {
    return [...this.history];
  }
  length(): number {
    return this.history.length;
  }
}

export type Input = {
  input: string;
};
export type Output = {
  output: string;
};
export type Error = {
  error: string;
};
