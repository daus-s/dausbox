import Interpreter from "./interpreter.ts";
import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import { TestRunner } from "./testrunner.ts";

const runner = new TestRunner();

function compile(code: string) {
  const lexer = new Lexer();
  const parser = new Parser();

  const tokens = lexer.tokenize(code);
  return parser.parse(tokens);
}

runner.test("test something idk", () => {
  const code = `x = 4
x ** 2`;
  const interpreter = new Interpreter();
  const ast = compile(code);

  const result = interpreter.eval(ast);
});

runner.report();
