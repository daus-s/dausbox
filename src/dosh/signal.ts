import type { Value } from "./value";

export class BreakSignal extends Error {
  constructor() {
    super("Error: break can only be used within loops");
  }
}

export class ContinueSignal extends Error {
  constructor() {
    super("Error: continue can only be used used within loops");
  }
}

export class ReturnSignal extends Error {
  value: Value;

  constructor(value: Value) {
    super("Error: return can only be used within functions");
    this.value = value;
  }
}
