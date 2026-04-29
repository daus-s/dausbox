import Interpreter from "./interpreter";
import Lexer from "./lexer";
import Parser from "./parser";

class DausBox {
  private lexer: Lexer;
  private parser: Parser;
  private interpreter: Interpreter;
  private history: {
    input: string;
    output: { code: number; result: string };
  }[];

  constructor() {
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.interpreter = new Interpreter();
    this.history = [];
  }

  execute(input: string): { code: number; result: string } {
    const res = { code: -1, result: "execute not implemented: " + input };
    this.history.push({ input, output: res });

    return res;
  }

  get_history(): {
    input: string;
    output: { code: number; result: string };
  }[] {
    return this.history;
  }
}

export default DausBox;
