import Func from "./func.ts";
import { ObjDef } from "./object.ts";
import { type Value } from "./value.ts";

class Environment {
  private _variables: Record<string, Value> = {};
  private parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  get(name: string, depth: number = Infinity): Value {
    if (depth < 0) {
      throw new Error(`Variable not found: ${name}`);
    }
    if (!(name in this._variables)) {
      if (this.parent) {
        return this.parent.get(name, depth - 1);
      }
      throw new Error(`Variable not found: ${name}`);
    } else {
      return this._variables[name];
    }
  }

  assign(name: string, value: Value): void {
    this._variables[name] = value;
  }

  pop(): Environment {
    if (!this.parent) {
      throw new Error("Environment: cannot pop root environment");
    }
    return this.parent;
  }

  entries(): [string, Value][] {
    return Object.entries(this._variables);
  }

  debug(): void {
    console.log(this.toString());
  }

  toString(): string {
    const s = [];
    if (!this.parent) {
      s.push("Environment: root\n___________________________________________");
    } else {
      s.push(this.parent.toString());
      s.push(
        "___________________________________________\nNew Environment\n___________________________________________",
      );
    }
    for (const e of this.entries()) {
      if (e[1] instanceof Func) {
        s.push(`[function] ${e[0]}`);
      } else if (e[1] instanceof ObjDef) {
        s.push(`[class] ${e[0]}`);
      } else {
        s.push(`[variable] ${e[0]}`);
      }
    }

    return s.join("\n");
  }

  has(name: string): boolean {
    if (name in this._variables) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(name);
    }
    return false;
  }
}

export default Environment;
