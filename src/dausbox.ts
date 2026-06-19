import Interpreter from "./dasl/interpreter";
import Lexer from "./dasl/lexer";
import Parser from "./dasl/parser";

import { stringify } from "./dasl/value";

import { History } from "./history";

class DausBox {
  private lexer: Lexer;
  private parser: Parser;
  private interpreter: Interpreter;

  private quiet: boolean = true;
  private msgs: number = 0;

  history: History;

  constructor() {
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.interpreter = new Interpreter();
    this.history = new History();
  }

  static async create(): Promise<DausBox> {
    const box = new DausBox();
    const res = await fetch("/dasl/kernel.dasl");
    if (!res.ok) throw new Error(`Failed to fetch kernel.dasl: ${res.status}`);
    const kernel = await res.text();
    console.log("kernel: ", kernel);
    box.execute(kernel);

    box.quiet = false;
    return box;
  }

  execute(input: string): void {
    let err: string | null = "lex";
    try {
      console.log("DausBox: executing:", input);

      const tokens = this.lexer.tokenize(input);

      err = "par";
      const ast = this.parser.parse(tokens);

      // TODO: handle multi line stmts

      err = "int";
      const res = this.interpreter.eval(ast);

      err = null;

      // handle multi line stmts???
      this.interpreter.debug();

      const newMsgs = this.interpreter.output().slice(this.msgs);

      this.msgs += newMsgs.length;

      if (this.quiet) return;

      let output = "";

      for (const msg of newMsgs) {
        output += msg + "\n";
      }

      const rs = res != null ? "**" + stringify(res) + "**" : "";

      output += rs + "\n";

      if (output) {
        this.history.record(input, { output });
      } else {
        this.history.record(input, { output });
      }
    } catch (e) {
      if (err === "lex") {
        this.history.record(input, { error: "Lexer:" + (e as Error).message });
      } else if (err === "par") {
        this.history.record(input, { error: "Parser:" + (e as Error).message });
      } else if (err === "int") {
        this.history.record(input, {
          error: "Interpreter: " + (e as Error).message,
        });
      }
    }
  }

  get_history(): History {
    return this.history;
  }
}

export default DausBox;
