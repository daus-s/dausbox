import Environment from "./environment.ts";
import type { Module, Stmt } from "./stmt.ts";
import type { Value } from "./value.ts";

class Func {
  id: string;
  args: string[];
  private env: Environment;
  private body: Module;

  constructor(id: string, args: string[], body: Module, env: Environment) {
    this.id = id;
    this.args = args;
    this.body = body;
    this.env = env;
  }

  activate(env: Environment): void {
    this.env = env;
  }

  assign(args: Value[]): void {
    if (args.length !== this.args.length) {
      throw new Error(
        `Expected ${this.args.length} arguments, got ${args.length}`,
      );
    }

    for (let i = 0; i < this.args.length; i++) {
      this.env.assign(this.args[i], args[i]);
    }
  }

  stmts(): Stmt[] {
    return this.body.body;
  }
}

export default Func;
