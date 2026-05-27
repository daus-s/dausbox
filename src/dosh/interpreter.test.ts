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

runner.test("if statement", () => {
  const code = "if True:\n  67";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("if statement with else", () => {
  const code = "if False:\n  67\nelse:\n  42";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("chained conditionals (x=True, y=False)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=True\ny=False\nif x:\n  a\nelif y:\n  b\nelse:\n  c";

  const result = run(code);
  runner.assertEqual(result.length, 6);
  runner.assertEqual(result[0], "67");
  runner.assertEqual(result[1], "42");
  runner.assertEqual(result[2], "0");
  runner.assertEqual(result[3], "True");
  runner.assertEqual(result[4], "False");
  runner.assertEqual(result[5], "67");
});

runner.test("chained conditionals (x=True, y=True)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=True\ny=True\nif x:\n  a\nelif y:\n  b\nelse:\n  c";

  const result = run(code);
  runner.assertEqual(result.length, 6);
  runner.assertEqual(result[5], "67");
});

runner.test("chained conditionals (x=False, y=True)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=False\ny=True\nif x:\n  a\nelif y:\n  b\nelse:\n  c";

  const result = run(code);
  runner.assertEqual(result.length, 6);
  runner.assertEqual(result[5], "42");
});

runner.test("chained conditionals (x=False, y=False)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=False\ny=False\nif x:\n  a\nelif y:\n  b\nelse:\n  c";
  console.log();

  const result = run(code);
  runner.assertEqual(result.length, 6);
  runner.assertEqual(result[5], "0");
});

runner.test("unassigned variable throws", () => {
  const code = "a=4\na + b";

  let throws = false;
  try {
    const result = run(code);
    runner.assertEqual(result.length, 0);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("for loop", () => {
  const code = "x = 1\nfor i in [1,2,3,4,5]:\n  x = x * i\nx";
  const result = run(code);
  runner.assertEqual(result.length, 3);
  runner.assertEqual(result[2], "120");
});
runner.report();
