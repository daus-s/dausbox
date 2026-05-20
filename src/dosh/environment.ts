import type { Value } from "./value";

class Environment {
  private _variables: Record<string, Value> = {};
  private _parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this._parent = parent;
  }

  get(name: string): Value {
    if (!(name in this._variables)) {
      if (this._parent) {
        return this._parent.get(name);
      }
      throw new Error(`Variable not found: ${name}`);
    } else {
      return this._variables[name];
    }
  }

  assign(name: string, value: Value): void {
    this._variables[name] = value;
  }
}

export default Environment;
