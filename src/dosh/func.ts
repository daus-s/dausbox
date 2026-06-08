import Environment from "./environment.ts";
import type { Module } from "./stmt.ts";
import type { Value } from "./value.ts";

class Func {
  id: string;
  args: string[];
  body: Module;
  closure: Environment;

  constructor(id: string, args: string[], body: Module, env: Environment) {
    this.id = id;
    this.args = args;
    this.body = body;
    this.closure = env;
  }

  apply(env: Environment, args: Value[]): void {
    if (args.length !== this.args.length) {
      throw new Error(
        `Expected ${this.args.length} arguments, got ${args.length}`,
      );
    }

    for (let i = 0; i < this.args.length; i++) {
      env.assign(this.args[i], args[i]);
    }
  }
}

export default Func;
