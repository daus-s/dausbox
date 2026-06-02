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
  interpreter.debug();
  return interpreter.results();
}

runner.test("test print", () => {
  const code = "print(42)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("test 2-item print", () => {
  const code = "print(42, 67)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42, 67");
});

runner.test("test empty print", () => {
  const code = "print()";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "");
});

runner.test("test assignment returns and binary operation", () => {
  const code = "x = 4\nprint(x ** 2)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "16");
});

runner.test("function def and call", () => {
  const code = "fn add a, b:\n  return a + b\nprint add 3, 4";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "7");
});

runner.test("if statement", () => {
  const code = "if True:\n  print(67)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("if statement with else", () => {
  const code = "if False:\n  print(67)\nelse:\n  print(42)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("chained conditionals (x=True, y=False)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=True\ny=False\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("chained conditionals (x=True, y=True)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=True\ny=True\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("chained conditionals (x=False, y=True)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=False\ny=True\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("chained conditionals (x=False, y=False)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=False\ny=False\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "0");
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
  const code = "x = 1\nfor i in [1,2,3,4,5]:\n  x = x * i\nprint(x)";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "120");
});

runner.test("range, 3 args", () => {
  const code = "print(range(1, 10, 2))";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 3, 5, 7, 9]");
});

runner.test("range, 3 args (no parens)", () => {
  const code = "print range 1, 10, 2";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 3, 5, 7, 9]");
});

runner.test("range, 2 args", () => {
  const code = "print(range(1, 10))";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 2 args (no parens)", () => {
  const code = "print range 1, 10";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 1 arg", () => {
  const code = "print(range(10))";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 1 arg (no parens)", () => {
  const code = "print range 10 ";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, invalid args", () => {
  const code = "range(1, 2, 3, 4)";
  let throws = false;
  try {
    run(code);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("range, invalid args (no parens)", () => {
  const code = "range 1, 2, 3, 4";
  let throws = false;
  try {
    run(code);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("range, empty args", () => {
  const code = "print(range())";
  let throws = false;
  try {
    run(code);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("evaluate program, no parens, implicit function call", () => {
  const code = "fn greet:\n  print 'Hello, world!'\ngreet";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "Hello, world!");
});

runner.test("evaluate hello world (no parens)", () => {
  const code = "print 'Hello, world!'";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "Hello, world!");
});

runner.test("while loop", () => {
  const code = "x = 0\nwhile x < 10:\n  x = x + 1\n  print x";
  const result = run(code);
  runner.assertEqual(result.length, 10);
  for (let i = 0; i < 10; i++) {
    runner.assertEqual(result[i], `${i + 1}`);
  }
});

runner.report();
