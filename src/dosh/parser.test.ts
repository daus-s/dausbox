import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import { TestRunner } from "./testrunner.ts";

function parse(code: string) {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(code);
  console.log(tokens);
  const parser = new Parser(tokens);
  return parser.parse();
}

const runner = new TestRunner();

runner.test("parse number", () => {
  const ast = parse("42");

  runner.assertEqual(ast.body, [
    { type: "Expr", value: { type: "Constant", value: 42 } },
  ]);
});

runner.report();
