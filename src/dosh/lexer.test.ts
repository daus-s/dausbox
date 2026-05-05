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

runner.test("tokenize string", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("'hello'");
  runner.assertEqual(tokens.length, 1);
  runner.assertEqual(tokens[0].type, "STRING");
  runner.assertEqual(tokens[0].value, "hello");
});

runner.test("tokenize function", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("def func():\n    print('hello world')");
  runner.assertEqual(tokens.length, 10);
  runner.assertEqual(tokens[0].type, "DEF");
  runner.assertEqual(tokens[0].value, "def");
  runner.assertEqual(tokens[1].type, "NAME");
  runner.assertEqual(tokens[1].value, "func");
  runner.assertEqual(tokens[2].type, "LEFT_PAREN");
  runner.assertEqual(tokens[2].value, "(");
  runner.assertEqual(tokens[3].type, "RIGHT_PAREN");
  runner.assertEqual(tokens[3].value, ")");
  runner.assertEqual(tokens[4].type, "COLON");
  runner.assertEqual(tokens[4].value, ":");
  runner.assertEqual(tokens[5].type, "INDENT");
  runner.assertEqual(tokens[5].value, "");
  runner.assertEqual(tokens[6].type, "IDENTIFIER");
  runner.assertEqual(tokens[6].value, "print");
  runner.assertEqual(tokens[7].type, "LEFT_PAREN");
  runner.assertEqual(tokens[7].value, "(");
  runner.assertEqual(tokens[8].type, "STRING");
  runner.assertEqual(tokens[8].value, "hello world");
  runner.assertEqual(tokens[9].type, "RIGHT_PAREN");
  runner.assertEqual(tokens[9].value, ")");
});

runner.report();
