export type HistoryEntry = Input | Output | Error;

export type Input = {
  input: string;
};
export type Output = {
  output: string;
  markdown?: boolean;
  result?: boolean;
};
export type Error = {
  error: string;
};

export class History {
  private history: HistoryEntry[];
  constructor() {
    this.history = [];
  }
  record(entry: HistoryEntry): void {
    this.history.push(entry);
    this.emit();
  }
  entries(): HistoryEntry[] {
    return [...this.history];
  }
  length(): number {
    return this.history.length;
  }

  private listeners: Set<Listener> = new Set();

  revise(out: string[]) {
    //rewrite history beginning from the first element. any elements the new copy is missing will be left blank at the end
    let idx = 0;
    let changed = false;
    const revised: HistoryEntry[] = [];

    for (const e of this.history) {
      if ("output" in e && !e.markdown && !e.result) {
        if (idx >= out.length) {
          //simply dont push onto revised
          changed = true;
        } else if (e.output !== out[idx]) {
          changed = true;
          revised.push({ output: out[idx] });
        } else {
          revised.push(e);
        }
        idx++;
      } else {
        revised.push(e);
      }
    }
    for (let i = idx; i < out.length; i++) {
      this.history.push({ output: out[i] });
    }

    if (changed) {
      this.history = revised;
      this.emit();
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.entries());
    return () => {
      this.listeners.delete(fn);
    };
  }

  emit() {
    const snapshot = this.entries();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

type Listener = (entries: HistoryEntry[]) => void;
