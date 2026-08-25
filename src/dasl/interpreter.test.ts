import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

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
  const gen = interpreter.eval(ast);
  let r = gen.next();
  while (!r.done) {
    if (r.value.type !== "tick")
      throw new Error(
        `dasl interpreter test suite: can only handle tick suspensions, got ${r.value.type}`,
      );
    r = gen.next();
  }
  return interpreter.output();
}

function read(filename: string): string {
  const location =
    path.dirname(fileURLToPath(import.meta.url)) + `/test/${filename}`; //change to location of the file istself as opposed to its invocation

  return fs.readFileSync(location, "utf-8").toString();
}

runner.test("test print", () => {
  const code = "print(42)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "42");
});

runner.test("test 2-item print", () => {
  const code = "print(42, 67)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "42, 67");
});

runner.test("test empty print", () => {
  const code = "print()";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "");
});

runner.test("test assignment returns and binary operation", () => {
  const code = "x = 4\nprint(x ** 2)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "16");
});

runner.test("function def and call", () => {
  const code = "fn add a, b:\n  return a + b\nprint add 3, 4";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "7");
});

runner.test("if statement", () => {
  const code = "if true:\n  print(67)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "67");
});

runner.test("if statement with else", () => {
  const code = "if false:\n  print(67)\nelse:\n  print(42)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "42");
});

runner.test("chained conditionals (x=true, y=false)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=true\ny=false\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "67");
});

runner.test("chained conditionals (x=true, y=true)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=true\ny=true\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "67");
});

runner.test("chained conditionals (x=false, y=true)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=false\ny=true\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "42");
});

runner.test("chained conditionals (x=false, y=false)", () => {
  const code =
    "a=67\nb=42\nc=0\nx=false\ny=false\nif x:\n  print(a)\nelif y:\n  print(b)\nelse:\n  print(c)";

  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "0");
});

runner.test("unassigned variable throws", () => {
  const code = "a=4\na + b";

  let throws = false;
  try {
    const output = run(code);
    runner.assertEqual(output.length, 0);
  } catch (e) {
    runner.assertEqual((e as Error).message, "Variable not found: b");
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("for loop", () => {
  const code = "x = 1\nfor i in [1,2,3,4,5]:\n  x = x * i\nprint(x)";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "120");
});

runner.test("range, 3 args", () => {
  const code = "print(range(1, 10, 2))";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 3, 5, 7, 9]");
});

runner.test("range, 3 args (no parens)", () => {
  const code = "print range 1, 10, 2";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 3, 5, 7, 9]");
});

runner.test("range, 2 args", () => {
  const code = "print(range(1, 10))";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 2 args (no parens)", () => {
  const code = "print range 1, 10";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 1 arg", () => {
  const code = "print(range(10))";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, 1 arg (no parens)", () => {
  const code = "print range 10 ";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]");
});

runner.test("range, invalid args", () => {
  const code = "range(1, 2, 3, 4)";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "range requires at least 1 and at most 3 arguments, got 4",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("range, invalid args (no parens)", () => {
  const code = "range 1, 2, 3, 4";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "range requires at least 1 and at most 3 arguments, got 4",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("range, empty args", () => {
  const code = "print(range())";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "range requires at least 1 and at most 3 arguments, got 0",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("evaluate program, no parens, implicit function call", () => {
  const code = "fn greet:\n  print 'Hello, world!'\ngreet";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "Hello, world!");
});

runner.test("evaluate hello world (no parens)", () => {
  const code = "print 'Hello, world!'";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "Hello, world!");
});

runner.test("while loop", () => {
  const code = "x = 0\nwhile x < 10:\n  x = x + 1\n  print x";
  const output = run(code);
  runner.assertEqual(output.length, 10);
  for (let i = 0; i < 10; i++) {
    runner.assertEqual(output[i], `${i + 1}`);
  }
});

runner.test("break exits while loop", () => {
  const code =
    "x = 0\nwhile true:\n  x = x + 1\n  if x == 5:\n    break\nprint(x)";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "5");
});

runner.test("continue skips rest of while body", () => {
  const code =
    "x = 0\nwhile x < 5:\n  x = x + 1\n  if x == 3:\n    continue\n  print(x)";
  const output = run(code);
  runner.assertEqual(output.length, 4);
  runner.assertEqual(output[0], "1");
  runner.assertEqual(output[1], "2");
  runner.assertEqual(output[2], "4");
  runner.assertEqual(output[3], "5");
});

runner.test("break exits for loop", () => {
  const code = "for i in [1,2,3,4,5]:\n  if i == 3:\n    break\n  print(i)";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "1");
  runner.assertEqual(output[1], "2");
});

runner.test("continue skips rest of for body", () => {
  const code = "for i in [1,2,3,4,5]:\n  if i == 3:\n    continue\n  print(i)";
  const output = run(code);
  runner.assertEqual(output.length, 4);
  runner.assertEqual(output[0], "1");
  runner.assertEqual(output[1], "2");
  runner.assertEqual(output[2], "4");
  runner.assertEqual(output[3], "5");
});

runner.test("function with no args, no parens call", () => {
  const code = "fn greet:\n  print 'hello'\ngreet\ngreet";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "hello");
  runner.assertEqual(output[1], "hello");
});

//add extra shadowing tests
runner.test("closure captures enclosing scope", () => {
  const code = "x = 10\nfn addx a:\n  return a + x\nprint addx 5";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "15");
});

runner.test("append: string + string", () => {
  const code = "print append 'hello', ' world'";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "hello world");
});

runner.test("append: string + number", () => {
  const code = "print append 'score: ', 42";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "score: 42");
});

runner.test("append: array + element", () => {
  const code = "xs = [1, 2, 3]\nprint append xs, 4";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 3, 4]");
});

runner.test("append: array + string element", () => {
  const code = "xs = ['a', 'b']\nprint append xs, 'c'";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[a, b, c]");
});

runner.test("append: empty array + element", () => {
  const code = "print append([], 1)";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1]");
});

runner.test("append: wrong arg count throws", () => {
  const code = "append 'a'";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "append: expects 2 arguments, got: 1",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("append: null first arg throws", () => {
  const code = "append null, 'a'";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "append: expected args:\n - string, any\n - array, any\n received:\n - null, string",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("append: one argument throws error", () => {
  let throws = false;
  try {
    run("append 'a'");
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "append: expects 2 arguments, got: 1",
    );
    throws = true;
  }
  runner.assertEqual(
    throws,
    true,
    "expected append with one argument to throw",
  );
});

runner.test("append: two bad arguments throws error", () => {
  let throws = false;
  try {
    run("append true, 'a'");
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "append: expected args:\n - string, any\n - array, any\n received:\n - bool , string",
    );
    throws = true;
  }
  runner.assertEqual(
    throws,
    true,
    "expected append with null first argument to throw",
  );
});

runner.test("append: chained appends build string", () => {
  const code = "x = append 'foo', 'bar'\nprint append x, '!'";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "foobar!");
});

runner.test("append: chained appends build array", () => {
  const code = "xs = append( [1, 2], 3)\nxs = append xs, 4\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 3, 4]");
});

runner.test("idiomatic append chain", () => {
  const code = "xs = [1,2]\nxs = append xs, 3\nxs = append xs, 4\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 3, 4]");
});

runner.test("object", () => {
  const code = "obj Dog:\n  name\nprint Dog\n";
  const output = run(code);
  runner.assertEqual(output.length, 1);
});

runner.test("object: explicit init", () => {
  const code =
    "obj Dog:\n  name\n  fn _init name:\n    self.name = name\n    print append 'created dog: ', self.name\nd = Dog 'fido'\nprint append 'hi doggy, ', d.name";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "created dog: fido");
  runner.assertEqual(output[1], "hi doggy, fido");
});

runner.test("object: implicit init", () => {
  const code = "obj Dog:\n  name\nd = Dog 'fido'\nprint d.name";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "fido");
});

runner.test("object: default values 1", () => {
  const code =
    "obj Dog:\n  name = 'fido'\n  fn _init:\n    print append 'created dog: ', self.name\nd = Dog()\nprint d.name";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "created dog: fido");
  runner.assertEqual(output[1], "fido");
});

runner.test("object: default values 2", () => {
  const code =
    "obj Coord:\n  x = 0\n  fn _init:\n    pass\nc = Coord()\nprint c.x";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "0");
});

runner.test("object: test overriden implicit init", () => {
  const code = "obj Foo:\n  bar=1\nfoo = Foo 69420\nprint foo.bar";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "69420");
});

runner.test("object: non-spanning provided init", () => {
  const code =
    "obj Observation:\n  x\n  y\n  temp\n  fn _init x, y:\n    self.x = x\n    self.y = y\n  fn record temp:\n    self.temp = temp\nobs = Observation 1, 2\nprint obs.x, obs.y, obs.temp\nobs.record 3\nprint obs.x, obs.y, obs.temp\n";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "1, 2, null");
  runner.assertEqual(output[1], "1, 2, 3");
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

runner.test("nested side effects", () => {
  const code = "n=0\nfor i in range 5:\n  n = n + i\nprint n";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "10");
});

runner.test("functions as 1st class", () => {
  const code = "fn add x,y:\n  x + y\nplus = add\nprint plus 4, 5";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "9");
});

runner.test("complex class object", () => {
  const code =
    "obj Foo:\n  fn bar:\n    print 'deez'\n  fn _init:\n    self.bar\nf = Foo()";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "deez");
});

runner.test("known bug: compare operators", () => {
  const code =
    "x = 2\nprint 0 < x < 2\nx = 3\nprint 0 < x < 2\nx = 0\nprint 0 < x < 2\nx = 1\nprint 0 < x < 2";
  const output = run(code);
  runner.assertEqual(output.length, 4);
  runner.assertEqual(output[0], "false");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "false");
  runner.assertEqual(output[3], "true");
});

runner.test("comparator: strictly less than", () => {
  const code = "print 1 < 2\nprint 2 < 1\nprint 1 < 1";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "false");
});

runner.test("comparator: strictly greater than", () => {
  const code = "print 2 > 1\nprint 1 > 2\nprint 1 > 1";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "false");
});

runner.test("comparator: less than or equal", () => {
  const code = "print 1 <= 2\nprint 1 <= 1\nprint 2 <= 1";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "true");
  runner.assertEqual(output[2], "false");
});

runner.test("comparator: greater than or equal", () => {
  const code = "print 2 >= 1\nprint 1 >= 1\nprint 1 >= 2";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "true");
  runner.assertEqual(output[2], "false");
});

runner.test("comparator: equal", () => {
  const code = "print 1 == 1\nprint 1 == 2\nprint 0 == 0";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "true");
});

runner.test("comparator: not equal", () => {
  const code = "print 1 != 2\nprint 1 != 1\nprint 0 != 1";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "true");
});

runner.test("comparator: floating point comparisons", () => {
  const code = "print 1.0 == 1\nprint 0.99 < 1\nprint 1.01 > 1";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "true");
  runner.assertEqual(output[2], "true");
});

runner.test("comparator: chained less than (true)", () => {
  const code = "print 1 < 2 < 3";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "true");
});

runner.test("comparator: chained less than (false, right fails)", () => {
  const code = "print 1 < 2 < 2";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "false");
});

runner.test("comparator: chained less than (false, left fails)", () => {
  const code = "print 2 < 1 < 3";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "false");
});

runner.test("comparator: chained greater than", () => {
  const code = "print 3 > 2 > 1\nprint 3 > 2 > 2\nprint 1 > 2 > 0";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "false");
});

runner.test("comparator: chained mixed (< and <=)", () => {
  const code = "print 1 < 2 <= 2\nprint 1 < 2 <= 1\nprint 1 <= 1 < 2";
  const output = run(code);
  runner.assertEqual(output.length, 3);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
  runner.assertEqual(output[2], "true");
});

runner.test("comparator: chained three segment", () => {
  const code = "print 1 < 2 < 3 < 4\nprint 1 < 2 < 2 < 4";
  const output = run(code);
  runner.assertEqual(output.length, 2);
  runner.assertEqual(output[0], "true");
  runner.assertEqual(output[1], "false");
});

runner.test("modulo: single-digit modulus", () => {
  const code = "print 7 % 3\n";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "1");
});

runner.test("modulo: double-digit modulus", () => {
  const code = "print 25 % 4\n";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "1");
});

runner.test("modulo: zero modulus", () => {
  const code = "print 15 % 0\n";
  try {
    run(code);
  } catch (e) {
    // Check the expected error message
    runner.assertEqual((e as Error).message, "Division by zero is not allowed");
  }
});

runner.test("modulo: negative dividend", () => {
  const code = "print(-15 % 4)\n";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "-3");
});

runner.test("list definition", () => {
  const code = "xs = [1,1,2,3,5,8]\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 1, 2, 3, 5, 8]");
});

runner.test("list index assignment: basic", () => {
  const code = "xs = [1, 2, 3]\nxs[1] = 99\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 99, 3]");
});

runner.test("list index assignment: first element", () => {
  const code = "xs = [1, 2, 3]\nxs[0] = 42\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[42, 2, 3]");
});

runner.test("list index assignment: last element", () => {
  const code = "xs = [1, 2, 3]\nxs[2] = 42\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 2, 42]");
});

runner.test("list index assignment: with variable index", () => {
  const code = "xs = [1, 2, 3]\ni = 1\nxs[i] = 77\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[1, 77, 3]");
});

runner.test("list index assignment: with expression value", () => {
  const code = "xs = [0, 0, 0]\nxs[0] = 2 ** 3\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[8, 0, 0]");
});

runner.test("list index assignment: string value", () => {
  const code = "xs = ['a', 'b', 'c']\nxs[1] = 'z'\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[a, z, c]");
});

runner.test("list index assignment: reassign same index twice", () => {
  const code = "xs = [1, 2, 3]\nxs[0] = 10\nxs[0] = 20\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[20, 2, 3]");
});

runner.test("list index assignment: inside for loop", () => {
  const code = "xs = [0, 0, 0]\nfor i in range 3:\n  xs[i] = i * 2\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[0, 2, 4]");
});

runner.test("list index assignment: out of bounds throws", () => {
  const code = "xs = [1, 2, 3]\nxs[5] = 99";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "Index out of bounds: length: 3, accepts [0, 2], got: 5",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("list index assignment: negative index throws", () => {
  const code = "xs = [1, 2, 3]\nxs[-1] = 99";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "Index out of bounds: length: 3, accepts [0, 2], got: -1",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("list index assignment: non-number index throws", () => {
  const code = "xs = [1, 2, 3]\nxs['a'] = 99";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "Cannot index array with string (expected number)",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("list index assignment: nested list element", () => {
  const code = "xs = [[1, 2], [3, 4]]\nxs[0] = [9, 9]\nprint xs";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "[[9, 9], [3, 4]]");
});

runner.test("string concatenation", () => {
  const code = "print 'a' + 'b'";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "ab");
});

runner.test("string concatenation: non-string", () => {
  const code = "print 'a' + 1";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "adding is only defined for string, string and number, number addition. got string and number.",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("string indexing", () => {
  const code = "print 'hello'[0]";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "h");
});

runner.test("string indexing: out of bounds", () => {
  const code = "print 'hello'[5]";
  let throws = false;
  try {
    run(code);
  } catch (e) {
    runner.assertEqual(
      (e as Error).message,
      "Index out of bounds: length: 5, accepts [0, 4], got: 5",
    );
    throws = true;
  }
  runner.assertEqual(throws, true);
});

runner.test("string length property", () => {
  const code = "print 'hello'.len";
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "5");
});

runner.test("_str: implicit object print", () => {
  const code =
    'obj BigOlBoy:\n  fn _init:\n    self.name = "teddy"\nb = BigOlBoy()\nprint b';
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], 'BigOlBoy:\n  name: "teddy"\n::');
});

runner.test("default obj definition fields truly inherited?", () => {
  const code = `
obj Obj:
  field = 1
  fn _init:
    pass
o1 = Obj()
print o1.field
`;
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "1");
});

runner.test("_str: implicit nested object", () => {
  const code = read("nested_obj_fields.dasl");
  const output = run(code);
  runner.assertEqual(output.length, 1);
  runner.assertEqual(
    output[0],
    'Outer:\n  space: true\n  inner: Inner:\n      state: "i"\n  ::\n::',
  );
});

runner.test("_type: number", () => {
  const output = run("print _type 5");
  runner.assertEqual(output[0], "number");
});

runner.test("_type: string", () => {
  const output = run('print _type "o-o"');
  runner.assertEqual(output[0], "string");
});

runner.test("_type: boolean", () => {
  const output = run("print _type true");
  runner.assertEqual(output[0], "bool");
});

runner.test("_type: null", () => {
  const output = run("print _type null");
  runner.assertEqual(output[0], "null");
});

runner.test("_type: array", () => {
  const output = run("print _type([])");
  runner.assertEqual(output[0], "array");
});

runner.test("_type: map", () => {
  const output = run("print _type({})");
  runner.assertEqual(output[0], "map");
});

runner.test("_type: func", () => {
  const output = run("fn f x:\n  x+1\nprint _type f");
  runner.assertEqual(output[0], "func");
});

runner.test("_type: obj", () => {
  const output = run("obj BingBong:\n  pass\no = BingBong () \nprint _type o");
  runner.assertEqual(output[0], "BingBong");
});

runner.test("_type: objdef", () => {
  const output = run("obj Type:\n  pass\nprint _type Type");
  runner.assertEqual(output[0], "objdef");
});

runner.test("flush: basic flush", () => {
  const output = run("print 'a'\nflush");
  runner.assertEqual(output.length, 0);
});

runner.test("flush: flush multiline", () => {
  const output = run("print 'a\nb'\nflush");
  runner.assertEqual(output.length, 0);
});

runner.test("flush: leave 1 entry", () => {
  const output = run("print 'a'\nprint 'b'\nflush");
  runner.assertEqual(output.length, 1);
  runner.assertEqual(output[0], "a");
});

runner.report();
