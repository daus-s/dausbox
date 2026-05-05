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
  const code = "def func():\n    print('hello world')";
  const tokens = lexer.tokenize(code);
  runner.assertEqual(tokens.length, 12);
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
  runner.assertEqual(tokens[5].value, "");
  runner.assertEqual(tokens[5].type, "NEWLINE");
  runner.assertEqual(tokens[6].type, "INDENT");
  runner.assertEqual(tokens[6].value, "");
  runner.assertEqual(tokens[7].type, "NAME");
  runner.assertEqual(tokens[7].value, "print");
  runner.assertEqual(tokens[8].type, "LEFT_PAREN");
  runner.assertEqual(tokens[8].value, "(");
  runner.assertEqual(tokens[9].type, "STRING");
  runner.assertEqual(tokens[9].value, "hello world");
  runner.assertEqual(tokens[10].type, "RIGHT_PAREN");
  runner.assertEqual(tokens[10].value, ")");
  runner.assertEqual(tokens[11].type, "DEDENT");
});

runner.test("tokenize elif", () => {
  const lexer = new Lexer();
  const code =
    "if i // 2 == 0:\n   i = i / 2\nelif i // 2 == 1:\n    i = 3*i + 1";
  const tokens = lexer.tokenize(code);
  runner.assertEqual(tokens.length, 33);
  runner.assertEqual(tokens[0].type, "IF");
  runner.assertEqual(tokens[0].value, "if");
  runner.assertEqual(tokens[1].type, "NAME");
  runner.assertEqual(tokens[1].value, "i");
  runner.assertEqual(tokens[2].type, "SLASH_SLASH");
  runner.assertEqual(tokens[2].value, "//");
  runner.assertEqual(tokens[3].type, "NUMBER");
  runner.assertEqual(tokens[3].value, "2");
  runner.assertEqual(tokens[4].type, "EQUAL_EQUAL");
  runner.assertEqual(tokens[4].value, "==");
  runner.assertEqual(tokens[5].type, "NUMBER");
  runner.assertEqual(tokens[5].value, "0");
  runner.assertEqual(tokens[6].type, "COLON");
  runner.assertEqual(tokens[6].value, ":");
  runner.assertEqual(tokens[7].type, "NEWLINE");
  runner.assertEqual(tokens[8].type, "INDENT");
  runner.assertEqual(tokens[9].type, "NAME");
  runner.assertEqual(tokens[9].value, "i");
  runner.assertEqual(tokens[10].type, "EQUAL");
  runner.assertEqual(tokens[10].value, "=");
  runner.assertEqual(tokens[11].type, "NAME");
  runner.assertEqual(tokens[11].value, "i");
  runner.assertEqual(tokens[12].type, "SLASH");
  runner.assertEqual(tokens[12].value, "/");
  runner.assertEqual(tokens[13].type, "NUMBER");
  runner.assertEqual(tokens[13].value, "2");
  runner.assertEqual(tokens[14].type, "NEWLINE");
  runner.assertEqual(tokens[15].type, "DEDENT");
  runner.assertEqual(tokens[16].type, "ELIF");
  runner.assertEqual(tokens[16].value, "elif");
  runner.assertEqual(tokens[17].type, "NAME");
  runner.assertEqual(tokens[17].value, "i");
  runner.assertEqual(tokens[18].type, "SLASH_SLASH");
  runner.assertEqual(tokens[18].value, "//");
  runner.assertEqual(tokens[19].type, "NUMBER");
  runner.assertEqual(tokens[19].value, "2");
  runner.assertEqual(tokens[20].type, "EQUAL_EQUAL");
  runner.assertEqual(tokens[20].value, "==");
  runner.assertEqual(tokens[21].type, "NUMBER");
  runner.assertEqual(tokens[21].value, "1");
  runner.assertEqual(tokens[22].type, "COLON");
  runner.assertEqual(tokens[22].value, ":");
  runner.assertEqual(tokens[23].type, "NEWLINE");
  runner.assertEqual(tokens[24].type, "INDENT");
  runner.assertEqual(tokens[25].type, "NAME");
  runner.assertEqual(tokens[25].value, "i");
  runner.assertEqual(tokens[26].type, "EQUAL");
  runner.assertEqual(tokens[26].value, "=");
  runner.assertEqual(tokens[27].type, "NUMBER");
  runner.assertEqual(tokens[27].value, "3");
  runner.assertEqual(tokens[28].type, "STAR");
  runner.assertEqual(tokens[28].value, "*");
  runner.assertEqual(tokens[29].type, "NAME");
  runner.assertEqual(tokens[29].value, "i");
  runner.assertEqual(tokens[30].type, "PLUS");
  runner.assertEqual(tokens[30].value, "+");
  runner.assertEqual(tokens[31].type, "NUMBER");
  runner.assertEqual(tokens[31].value, "1");
  runner.assertEqual(tokens[32].type, "DEDENT");
});

runner.report();
