import Environment from "./environment.ts";
import type Func from "./func.ts";
import { type Value } from "./value.ts";

class Obj {
  env: Environment;

  constructor(def: ObjDef) {
    this.env = new Environment(def.env);
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

  constructor(name: string, env: Environment) {
    this.name = name;
    this.env = env;
  }

  init(): Func | null {
    if (this.env.has("_init")) {
      return this.env.get("_init") as Func;
    }
    return null;
  }
}

export { Obj, ObjDef };
