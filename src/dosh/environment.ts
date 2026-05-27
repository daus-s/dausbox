import type { Value } from "./value";

class Environment {
  private _variables: Record<string, Value> = {};
  private parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  get(name: string): Value {
    if (!(name in this._variables)) {
      if (this.parent) {
        return this.parent.get(name);
      }
      throw new Error(`Variable not found: ${name}`);
    } else {
      return this._variables[name];
    }
  }

  assign(name: string, value: Value): void {
    this._variables[name] = value;
  }

  pop(): Environment | null {
    this._variables = {};
    if (!this.parent) {
      throw new Error("Environment: cannot pop root environment");
    }
    const parent = this.parent;
    this.parent = null;
    return parent;
  }
}

export default Environment;
