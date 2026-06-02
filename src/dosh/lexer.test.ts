import { TestRunner } from "./testrunner.ts";
import Lexer from "./lexer.ts";

const runner = new TestRunner();

runner.test("tokenize assignment", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("x = 67");
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[0].value, "x");
  runner.assertEqual(tokens[1].type, "EQUAL");
  runner.assertEqual(tokens[1].value, "=");
  runner.assertEqual(tokens[2].type, "NUMBER");
  runner.assertEqual(tokens[2].value, "67");
});

runner.test("tokenize number", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("42");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "NUMBER");
  runner.assertEqual(tokens[0].value, "42");
});

runner.test("tokenize string", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("'hello'");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "STRING");
  runner.assertEqual(tokens[0].value, "hello");
});

runner.test("tokenize function", () => {
  const lexer = new Lexer();
  const code = "fn func():\n  pass";
  const tokens = lexer.tokenize(code);
  runner.assertEqual(tokens.length - 1, 9);
  runner.assertEqual(tokens[0].type, "FUNC");
  runner.assertEqual(tokens[0].value, "fn");
  runner.assertEqual(tokens[1].type, "IDENTIFIER");
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
  runner.assertEqual(tokens[7].type, "PASS");
  runner.assertEqual(tokens[7].value, "pass");
  runner.assertEqual(tokens[8].type, "DEDENT");
  runner.assertEqual(tokens[8].value, "");
  runner.assertEqual(tokens[9].type, "EOF");
  runner.assertEqual(tokens[9].value, "");
});

runner.test("tokenize elif", () => {
  const lexer = new Lexer();
  const code =
    "if i // 2 == 0:\n   i = i / 2\nelif i // 2 == 1:\n    i = 3*i + 1";
  const tokens = lexer.tokenize(code);
  runner.assertEqual(tokens.length - 1, 33);
  runner.assertEqual(tokens[0].type, "IF");
  runner.assertEqual(tokens[0].value, "if");
  runner.assertEqual(tokens[1].type, "IDENTIFIER");
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
  runner.assertEqual(tokens[9].type, "IDENTIFIER");
  runner.assertEqual(tokens[9].value, "i");
  runner.assertEqual(tokens[10].type, "EQUAL");
  runner.assertEqual(tokens[10].value, "=");
  runner.assertEqual(tokens[11].type, "IDENTIFIER");
  runner.assertEqual(tokens[11].value, "i");
  runner.assertEqual(tokens[12].type, "SLASH");
  runner.assertEqual(tokens[12].value, "/");
  runner.assertEqual(tokens[13].type, "NUMBER");
  runner.assertEqual(tokens[13].value, "2");
  runner.assertEqual(tokens[14].type, "NEWLINE");
  runner.assertEqual(tokens[15].type, "DEDENT");
  runner.assertEqual(tokens[16].type, "ELIF");
  runner.assertEqual(tokens[16].value, "elif");
  runner.assertEqual(tokens[17].type, "IDENTIFIER");
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
  runner.assertEqual(tokens[25].type, "IDENTIFIER");
  runner.assertEqual(tokens[25].value, "i");
  runner.assertEqual(tokens[26].type, "EQUAL");
  runner.assertEqual(tokens[26].value, "=");
  runner.assertEqual(tokens[27].type, "NUMBER");
  runner.assertEqual(tokens[27].value, "3");
  runner.assertEqual(tokens[28].type, "STAR");
  runner.assertEqual(tokens[28].value, "*");
  runner.assertEqual(tokens[29].type, "IDENTIFIER");
  runner.assertEqual(tokens[29].value, "i");
  runner.assertEqual(tokens[30].type, "PLUS");
  runner.assertEqual(tokens[30].value, "+");
  runner.assertEqual(tokens[31].type, "NUMBER");
  runner.assertEqual(tokens[31].value, "1");
  runner.assertEqual(tokens[32].type, "DEDENT");
});

// === BUG 1: NUMBER TOKENIZATION DOESN'T CONSUME LAST DIGIT ===
runner.test("bug: number tokenization leaves last digit unconsumed", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("123");
  // tokenizeNumber() calls step() inside the while loop but then step() is called again in main loop
  // This should be 1 token but might be 2 or have wrong value
  runner.assertEqual(tokens.length - 1, 1, "Should have exactly 1 token");
  runner.assertEqual(tokens[0].type, "NUMBER");
  runner.assertEqual(tokens[0].value, "123");
});

// === BUG 2: FLOAT NUMBERS ===
runner.test("tokenize float", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("3.14");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "NUMBER");
  runner.assertEqual(tokens[0].value, "3.14");
});

runner.test("tokenize float with trailing dot", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("3.");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "NUMBER");
  runner.assertEqual(tokens[0].value, "3.");
});

// === BUG 3: IDENTIFIER TOKENIZATION DOESN'T CONSUME NUMBERS IN IDENTIFIER ===
runner.test("tokenize identifier with numbers", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("var42");
  // tokenizeIdentifier only matches [a-zA-Z_], not digits!
  runner.assertEqual(tokens.length - 1, 1, "Should be 1 token, not var + 42");
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[0].value, "var42");
});

runner.test("tokenize identifier with underscore", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("_private_var");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[0].value, "_private_var");
});

// === BUG 4: GREATER_EQUAL TOKEN BUG ===
runner.test("bug: greater_equal has wrong token value", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(">=");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "GREATER_EQUAL");
  // BUG: pushToken called with "<=" instead of ">="
  runner.assertEqual(tokens[0].value, ">=", "Should be >= not <=");
});

// === BUG 5: OPERATOR DOESN'T STEP AFTER MATCHING ===
runner.test("tokenizeOperator doesn't consume operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("+");
  // Single character operator consumes char but the logic at end calls step() again
  // Wait, looking at code: char1 in operatorMap -> pushToken -> step() -> return
  // Then main loop calls step() again. So we skip the next char!
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "PLUS");
  runner.assertEqual(tokens[0].value, "+");
});

// === BUG 6: UNRECOGNIZED OPERATOR ===
runner.test("tokenize unrecognized operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("@");
  // Unknown operator: just calls step() and returns
  // The '@' gets skipped
  runner.assertEqual(
    tokens.length - 1,
    0,
    "Unrecognized operator @ is silently consumed",
  );
});

// === BUG 7: MULTIPLE STATEMENTS ON ONE LINE ===
runner.test("tokenize multiple operators in sequence", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("a+b");
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[0].value, "a");
  runner.assertEqual(tokens[1].type, "PLUS");
  runner.assertEqual(tokens[1].value, "+");
  runner.assertEqual(tokens[2].type, "IDENTIFIER");
  runner.assertEqual(tokens[2].value, "b");
});

// === BUG 8: DOUBLE CHARACTER OPERATORS CALL STEP TWICE ===
runner.test("tokenize equality operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("==");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "EQUAL_EQUAL");
  runner.assertEqual(tokens[0].value, "==");
});

runner.test("tokenize not-equal operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("!=");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "BANG_EQUAL");
  runner.assertEqual(tokens[0].value, "!=");
});

runner.test("tokenize power operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("**");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "POWER");
  runner.assertEqual(tokens[0].value, "**");
});

runner.test("tokenize floor divide operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("//");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "SLASH_SLASH");
  runner.assertEqual(tokens[0].value, "//");
});

// === BUG 9: STEP CALLED TWICE FOR SINGLE CHAR OPERATORS ===
runner.test("multiple single operators in sequence", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("+-*/");
  // If step() is being called twice for single-char operators, chars will be skipped
  runner.assertEqual(tokens.length - 1, 4);
  runner.assertEqual(tokens[0].type, "PLUS");
  runner.assertEqual(tokens[1].type, "MINUS");
  runner.assertEqual(tokens[2].type, "STAR");
  runner.assertEqual(tokens[3].type, "SLASH");
});

// === BUG 10: WHITESPACE HANDLING ===
runner.test("tokenize with spaces between tokens", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("a + b");
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[1].type, "PLUS");
  runner.assertEqual(tokens[2].type, "IDENTIFIER");
});

runner.test("tokenize with tabs", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("a\t+\tb");
  runner.assertEqual(tokens.length - 1, 3);
});

// === BUG 11: NEWLINE AND INDENTATION TRACKING ===
runner.test("tokenize multi-line with proper indents", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("if x:\n    y");
  // Should have: IF, NAME(x), COLON, NEWLINE, INDENT, NAME(y)
  const types = tokens.map((t) => t.type);
  runner.assertEqual(types.includes("IF"), true);
  runner.assertEqual(types.includes("NEWLINE"), true);
  runner.assertEqual(types.includes("INDENT"), true);
});

runner.test("dedent token generation", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("if x:\n    y\nz");
  // Should have INDENT then DEDENT when returning to top level
  const types = tokens.map((t) => t.type);
  runner.assertEqual(types.includes("DEDENT"), true);
});

// === BUG 12: EMPTY LINES AND COMMENTS ===
runner.test("skip comments", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("x = 5  # this is a comment");
  // Comment should be skipped, no tokens after the 5
  runner.assertEqual(tokens.length - 1, 3); // NAME, EQUAL, NUMBER, NEWLINE (if any)
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[1].type, "EQUAL");
  runner.assertEqual(tokens[2].type, "NUMBER");
});

runner.test("comment at start of line", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("# comment\nx = 1");
  // Comment line should produce no tokens except possible NEWLINE
  const hasComment = tokens.some((t) => t.value.includes("comment"));
  runner.assertEqual(hasComment, false);
});

// === BUG 13: STRING EDGE CASES ===
runner.test("string with escaped quotes", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize('"\\"hello\\""');
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "STRING");
  runner.assertEqual(tokens[0].value, '"hello"');
});

runner.test("string with escaped newline", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize('"hello\\nworld"');
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "STRING");
  runner.assertEqual(tokens[0].value, "hello\nworld");
});

runner.test("string with mixed escape sequences", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize('"\\t\\n\\r"');
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].value, "\t\n\r");
});

runner.test("unterminated string error", () => {
  try {
    const lexer = new Lexer();
    lexer.tokenize('"unterminated');
    runner.assert(false, "Should throw error for unterminated string");
  } catch (e) {
    runner.assert(true, `Correctly throws error: ${e}`);
  }
});

// === BUG 14: KEYWORDS VS IDENTIFIERS ===
runner.test("all keywords tokenize correctly", () => {
  const keywords = [
    "if",
    "elif",
    "else",
    "while",
    "for",
    "in",
    "def",
    "return",
    "break",
    "continue",
    "and",
    "or",
    "not",
    "True",
    "False",
    "None",
  ];

  for (const kw of keywords) {
    const lexer = new Lexer();
    const tokens = lexer.tokenize(kw);
    runner.assertEqual(tokens.length - 1, 1, `Keyword ${kw} should be 1 token`);
    runner.assertEqual(tokens[0].value, kw);
  }
});

// === BUG 15: COMPARISON OPERATORS ===
runner.test("less than operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("<");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "LESS");
});

runner.test("less or equal operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("<=");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "LESS_EQUAL");
  runner.assertEqual(tokens[0].value, "<=");
});

runner.test("greater than operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(">");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "GREATER");
});

runner.test("comparison chain", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("a<b");
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[1].type, "LESS");
  runner.assertEqual(tokens[2].type, "IDENTIFIER");
});

// === BUG 16: COMPLEX EXPRESSIONS ===
runner.test("complex math expression", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("x = (a + b) * c ** 2");
  runner.assertEqual(
    tokens.some((t) => t.type === "EQUAL"),
    true,
  );
  runner.assertEqual(
    tokens.some((t) => t.type === "LEFT_PAREN"),
    true,
  );
  runner.assertEqual(
    tokens.some((t) => t.type === "RIGHT_PAREN"),
    true,
  );
  runner.assertEqual(
    tokens.some((t) => t.type === "POWER"),
    true,
  );
});

// === BUG 17: EMPTY INPUT ===
runner.test("empty input", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("");
  runner.assertEqual(tokens.length - 1, 0);
});

runner.test("only whitespace", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("   ");
  runner.assertEqual(tokens.length - 1, 0);
});

runner.test("only newline", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("\n");
  // Should have at least a NEWLINE token
  runner.assertEqual(
    tokens.some((t) => t.type === "NEWLINE"),
    true,
  );
});

// === BUG 18: SPECIAL TOKENS ===
runner.test("arrow operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("->");
  runner.assertEqual(tokens.length - 1, 1);
  runner.assertEqual(tokens[0].type, "ARROW");
  runner.assertEqual(tokens[0].value, "->");
});

runner.test("dot operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("a.b");
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[1].type, "DOT");
  runner.assertEqual(tokens[2].type, "IDENTIFIER");
});

// === BUG 19: STEP LOGIC IN MAIN LOOP ===
runner.test("step called after tokenizeOperator for single char", () => {
  const lexer = new Lexer();
  // Looking at code: single-char operator calls step() then return
  // Then main loop calls step() AGAIN - this skips the next character!
  const tokens = lexer.tokenize("a+b");
  // If double-stepping happens, we might lose 'b'
  runner.assertEqual(tokens.length - 1, 3);
  runner.assertEqual(tokens[2].value, "b");
});

// === BUG 20: MULTIPLE STEP CALLS ===
runner.test("tokenizeNumber double stepping", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("12 34");
  runner.assertEqual(tokens.length - 1, 2);
  runner.assertEqual(tokens[0].value, "12");
  runner.assertEqual(tokens[1].value, "34");
});

runner.test("identifier followed by operator", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("abc+");
  runner.assertEqual(tokens.length - 1, 2);
  runner.assertEqual(tokens[0].type, "IDENTIFIER");
  runner.assertEqual(tokens[0].value, "abc");
  runner.assertEqual(tokens[1].type, "PLUS");
});

// === BUG 21: OPERATOR NOT STEPPING ===
runner.test("unmatched operator just steps and returns", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("$ %");
  // '$' is not in operatorMap, so it just steps() and returns
  // Then main loop steps() again - double stepping happens
  // Then '%' is tokenized as PERCENT
  // So we lose the '$' entirely
  const hasPercent = tokens.some((t) => t.type === "PERCENT");
  runner.assertEqual(hasPercent, true);
});

runner.test("series of known operators", () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize("()[]{}");
  runner.assertEqual(tokens.length - 1, 6);
  runner.assertEqual(tokens[0].type, "LEFT_PAREN");
  runner.assertEqual(tokens[1].type, "RIGHT_PAREN");
  runner.assertEqual(tokens[2].type, "LEFT_BRACKET");
  runner.assertEqual(tokens[3].type, "RIGHT_BRACKET");
  runner.assertEqual(tokens[4].type, "LEFT_BRACE");
  runner.assertEqual(tokens[5].type, "RIGHT_BRACE");
});

runner.report();
