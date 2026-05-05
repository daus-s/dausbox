import { TestRunner } from "./testrunner.ts";
import Lexer from "./lexer.ts";

const runner = new TestRunner();

runner.test("tokenize number", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("42");
  runner.assertEqual(tokens.length, 1);
  runner.assertEqual(tokens[0].type, "NUMBER");
  runner.assertEqual(tokens[0].value, "42");
});

runner.report();
