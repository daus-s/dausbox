import Interpreter from "./interpreter.ts";
import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import { TestRunner } from "./testrunner.ts";
import type { Token } from "./token.ts";

const runner = new TestRunner();

function run(code: string) {
  const lexer = new Lexer();
  const parser = new Parser();
  const interpreter = new Interpreter();

  const tokens: Token[] = lexer.tokenize(code);
  const ast = parser.parse(tokens);
  interpreter.eval(ast);
  return interpreter.results();
}

runner.test("test assignment returns and binary operation", () => {
  const code = "x = 4\nx ** 2";

  const result = run(code);
  runner.assertEqual(result[0], "4");
  runner.assertEqual(result[1], "16");
});

runner.test("function def and call", () => {
  const code = "def add(a, b):\n  return a + b\nadd(3, 4)";

  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "None");
  runner.assertEqual(result[1], "7");
});

runner.report();
