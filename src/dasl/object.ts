import Environment from "./environment.ts";
import Func from "./func.ts";
import { type Value } from "./value.ts";

class Obj {
  _type: string;
  env: Environment;
  attrs: string[];

  constructor(def: ObjDef) {
    this._type = def.name;
    this.env = new Environment(def.env);
    this.attrs = def.getAttrs();
  }

  access(name: string): Value {
    return this.env.get(name, 1);
  }

  assign(name: string, value: Value): void {
    this.env.assign(name, value);
  }
}

class ObjDef {
  name: string;
  env: Environment;
  private attrs: string[];

  constructor(name: string, env: Environment) {
    this.name = name;
    this.env = env;
    this.attrs = env
      .entries()
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([k, _v]) => k);
  }

  has(name: string): boolean {
    return this.env.has(name);
  }

  init(): Func | null {
    if (this.env.has("_init")) {
      return this.env.get("_init") as Func;
    }
    return null;
  }

  getAttrs(): string[] {
    return this.attrs;
  }
}

export { Obj, ObjDef };
