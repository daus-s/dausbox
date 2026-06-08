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
  const code = "if true:\n  print(67)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("if statement with else", () => {
  const code = "if false:\n  print(67)\nelse:\n  print(42)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("chained conditionals (x=true, y=false)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=true\ny=false\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("chained conditionals (x=true, y=true)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=true\ny=true\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "67");
});

runner.test("chained conditionals (x=false, y=true)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=false\ny=true\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "42");
});

runner.test("chained conditionals (x=false, y=false)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=false\ny=false\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

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

runner.test("break exits while loop", () => {
  const code =
    "x = 0\nwhile true:\n  x = x + 1\n  if x == 5:\n    break\nprint(x)";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "5");
});

runner.test("continue skips rest of while body", () => {
  const code =
    "x = 0\nwhile x < 5:\n  x = x + 1\n  if x == 3:\n    continue\n  print(x)";
  const result = run(code);
  runner.assertEqual(result.length, 4);
  runner.assertEqual(result[0], "1");
  runner.assertEqual(result[1], "2");
  runner.assertEqual(result[2], "4");
  runner.assertEqual(result[3], "5");
});

runner.test("break exits for loop", () => {
  const code = "for i in [1,2,3,4,5]:\n  if i == 3:\n    break\n  print(i)";
  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "1");
  runner.assertEqual(result[1], "2");
});

runner.test("continue skips rest of for body", () => {
  const code = "for i in [1,2,3,4,5]:\n  if i == 3:\n    continue\n  print(i)";
  const result = run(code);
  runner.assertEqual(result.length, 4);
  runner.assertEqual(result[0], "1");
  runner.assertEqual(result[1], "2");
  runner.assertEqual(result[2], "4");
  runner.assertEqual(result[3], "5");
});

runner.test("function with no args, no parens call", () => {
  const code = "fn greet:\n  print 'hello'\ngreet\ngreet";
  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "hello");
  runner.assertEqual(result[1], "hello");
});

//add extra shadowing tests
runner.test("closure captures enclosing scope", () => {
  const code = "x = 10\nfn addx a:\n  return a + x\nprint addx 5";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "15");
});

runner.test("join: string + string", () => {
  const code = "print join 'hello', ' world'";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "hello world");
});

runner.test("join: string + number", () => {
  const code = "print join 'score: ', 42";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "score: 42");
});

runner.test("join: array + element", () => {
  const code = "xs = [1, 2, 3]\nprint join xs, 4";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 2, 3, 4]");
});

runner.test("join: array + string element", () => {
  const code = "xs = ['a', 'b']\nprint join xs, 'c'";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[a, b, c]");
});

runner.test("join: empty array + element", () => {
  const code = "print join([], 1)";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1]");
});

runner.test("join: wrong arg count throws", () => {
  const code = "join 'a'";
  let throws = false;
  try {
    run(code);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("join: null first arg throws", () => {
  const code = "join null, 'a'";
  let throws = false;
  try {
    run(code);
  } catch (_) {
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("join: chained joins build string", () => {
  const code = "x = join 'foo', 'bar'\nprint join x, '!'";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "foobar!");
});

runner.test("join: chained joins build array", () => {
  const code = "xs = join( [1, 2], 3)\nxs = join xs, 4\nprint xs";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 2, 3, 4]");
});

runner.test("idiomatic join chain", () => {
  const code = "xs = [1,2]\nxs = join xs, 3\nxs = join xs, 4\nprint xs";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "[1, 2, 3, 4]");
});

runner.test("object", () => {
  const code = "obj Dog:\n  name\nprint Dog\n";
  const result = run(code);
  runner.assertEqual(result.length, 1);
});

runner.test("object: explicit init", () => {
  const code =
    "obj Dog:\n  name\n  fn _init name:\n    self.name = name\n    print join 'created dog: ', self.name\nd = Dog 'fido'\nprint join 'hi doggy, ', d.name";
  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "created dog: fido");
  runner.assertEqual(result[1], "hi doggy, fido");
});

runner.test("object: implicit init", () => {
  const code = "obj Dog:\n  name\nd = Dog 'fido'\nprint d.name";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "fido");
});

runner.test("object: default values 1", () => {
  const code =
    "obj Dog:\n  name = 'fido'\n  fn _init:\n    print join 'created dog: ', self.name\nd = Dog()\nprint d.name";
  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "created dog: fido");
  runner.assertEqual(result[1], "fido");
});

runner.test("object: default values 2", () => {
  const code =
    "obj Coord:\n  x = 0\n  fn _init:\n    pass\nc = Coord()\nprint c.x";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "0");
});

runner.test("object: test overriden implicit init", () => {
  const code = "obj Foo:\n  bar=1\nfoo = Foo 69420\nprint foo.bar";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "69420");
});

runner.test("object: non-spanning provided init", () => {
  const code =
    "obj Observation:\n  x\n  y\n  temp\n  fn _init x, y:\n    self.x = x\n    self.y = y\n  fn record temp:\n    self.temp = temp\nobs = Observation 1, 2\nprint obs.x, obs.y, obs.temp\nobs.record 3\nprint obs.x, obs.y, obs.temp\n";
  const result = run(code);
  runner.assertEqual(result.length, 2);
  runner.assertEqual(result[0], "1, 2, null");
  runner.assertEqual(result[1], "1, 2, 3");
});

runner.test("object: prevent leaking variables from scope", () => {
  const code = "x = 42\nobj O:\n  fn _init:\n    pass\no = O()\nprint o.x";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    throws = true;
    runner.assertEqual("Variable not found: x", (e as Error).message);
  }
  runner.assert(
    throws,
    "expected error: should not have access to outer scope",
  );
});

runner.test("functions as 1st class", () => {
  const code = "fn add x,y:\n  x + y\nplus = add\nprint plus 4, 5";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "9");
});

runner.test("complex class object", () => {
  const code =
    "obj Foo:\n  fn bar:\n    print 'deez'\n  fn _init:\n    self.bar\nf = Foo()";
  const result = run(code);
  runner.assertEqual(result.length, 1);
  runner.assertEqual(result[0], "deez");
});

runner.report();
