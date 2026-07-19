type HistoryEntry = Input | Output | Error;

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

type Input = {
  input: string;
};

type Output = {
  output: string;
};

type Error = {
  error: string;
};
