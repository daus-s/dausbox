import type { BinOp, Constant, DictLiteral, Name } from "./expr.ts";
import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import type { ExprStmt } from "./stmt.ts";
import { TestRunner } from "./testrunner.ts";

function parse(code: string) {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(code);
  const parser = new Parser(tokens);
  return parser.parse();
}

const runner = new TestRunner();

runner.test("parse number", () => {
  const ast = parse("42");

  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual((ast.body[0] as ExprStmt).value.type, "Constant");
  runner.assertEqual(((ast.body[0] as ExprStmt).value as Constant).value, 42);
});

runner.test("parse string constant", () => {
  const ast = parse("'blessed be the maker and his waters'");

  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual((ast.body[0] as ExprStmt).value.type, "Constant");
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as Constant).value,
    "blessed be the maker and his waters",
  );
});

runner.test("parse boolean constants", () => {
  const t = parse("True");

  runner.assertEqual(t.type, "Module");
  runner.assertEqual(t.body.length, 1);
  runner.assertEqual(t.body[0].type, "Expr");
  runner.assertEqual((t.body[0] as ExprStmt).value.type, "Constant");
  runner.assertEqual(((t.body[0] as ExprStmt).value as Constant).value, true);

  const f = parse("False");

  runner.assertEqual(f.type, "Module");
  runner.assertEqual(f.body.length, 1);
  runner.assertEqual(f.body[0].type, "Expr");
  runner.assertEqual((f.body[0] as ExprStmt).value.type, "Constant");
  runner.assertEqual(((f.body[0] as ExprStmt).value as Constant).value, false);
});

runner.test("parse name (variable)", () => {
  const ast = parse("foo");

  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual((ast.body[0] as ExprStmt).value.type, "Name");
  runner.assertEqual(((ast.body[0] as ExprStmt).value as Name).id, "foo");
});

runner.test("parse complex parenthesized expression", () => {
  const ast = parse("(5 + 3) * 8");

  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual((ast.body[0] as ExprStmt).value.type, "BinOp");
  runner.assertEqual(((ast.body[0] as ExprStmt).value as BinOp).op, "*");
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).left.type,
    "BinOp",
  );
  runner.assertEqual(((ast.body[0] as ExprStmt).value as BinOp).left.op, "+");
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).left.left.type,
    "Constant",
  );
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).left.left.value,
    5,
  );
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).left.right.type,
    "Constant",
  );
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).left.right.value,
    3,
  );
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as BinOp).right.type,
    "Constant",
  );
  runner.assertEqual(((ast.body[0] as ExprStmt).value as BinOp).right.value, 8);
});

runner.test("parse list literal", () => {
  const ast = parse("[1, 2, 3]");
  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual(ast.body[0].value.type, "List");
  runner.assertEqual(ast.body[0].value.elts.length, 3);
  runner.assertEqual(ast.body[0].value.elts[0].type, "Constant");
  runner.assertEqual(ast.body[0].value.elts[0].value, 1);
  runner.assertEqual(ast.body[0].value.elts[1].type, "Constant");
  runner.assertEqual(ast.body[0].value.elts[1].value, 2);
  runner.assertEqual(ast.body[0].value.elts[2].type, "Constant");
  runner.assertEqual(ast.body[0].value.elts[2].value, 3);
});

runner.test("parse dict literal", () => {
  const ast = parse("{}");
  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual((ast.body[0] as ExprStmt).value.type, "Dict");
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as DictLiteral).keys.length,
    0,
  );
  runner.assertEqual(
    ((ast.body[0] as ExprStmt).value as DictLiteral).values.length,
    0,
  );
});

// ============================================================
// BINARY OPERATORS
// ============================================================

runner.test("parse addition", () => {
  const ast = parse("5 + 3");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "+");
  runner.assertEqual(expr.left.value, 5);
  runner.assertEqual(expr.right.value, 3);
});

runner.test("parse subtraction", () => {
  const ast = parse("4 - 8");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "-");
  runner.assertEqual(expr.left.value, 4);
  runner.assertEqual(expr.right.value, 8);
});

runner.test("parse multiplication", () => {
  const ast = parse("2 * 6");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "*");
  runner.assertEqual(expr.left.value, 2);
  runner.assertEqual(expr.right.value, 6);
});

runner.test("parse division", () => {
  const ast = parse("10 / 2.0");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "/");
  runner.assertEqual(expr.left.value, 10);
  runner.assertEqual(expr.right.value, 2);
});

runner.test("parse integer(floor) division", () => {
  const ast = parse("10 // 3");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "//");
  runner.assertEqual(expr.left.value, 10);
  runner.assertEqual(expr.right.value, 3);
});

runner.test("parse modulo", () => {
  const ast = parse("10 % 3");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "%");
  runner.assertEqual(expr.left.value, 10);
  runner.assertEqual(expr.right.value, 3);
});

runner.test("parse power (basic)", () => {
  const ast = parse("2 ** 3");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "**");
  runner.assertEqual(expr.left.value, 2);
  runner.assertEqual(expr.right.value, 3);
});

runner.test("parse power (right-associative)", () => {
  // 2 ** 3 ** 4 should parse as 2 ** (3 ** 4)
  const ast = parse("2 ** 3 ** 4");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "**");
  runner.assertEqual(expr.left.value, 2);
  runner.assertEqual(expr.right.type, "BinOp");
  runner.assertEqual(expr.right.op, "**");
  runner.assertEqual(expr.right.left.value, 3);
  runner.assertEqual(expr.right.right.value, 4);
});

// ============================================================
// OPERATOR PRECEDENCE
// ============================================================

runner.test("precedence: multiplication before addition", () => {
  // 2 + 3 * 4 should be 2 + (3 * 4), not (2 + 3) * 4
  const ast = parse("2 + 3 * 4");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "+");
  runner.assertEqual(expr.left.value, 2);
  runner.assertEqual(expr.right.type, "BinOp");
  runner.assertEqual(expr.right.op, "*");
  runner.assertEqual(expr.right.left.value, 3);
  runner.assertEqual(expr.right.right.value, 4);
});

runner.test("precedence: multiplication before addition", () => {
  const ast = parse("2 * 3 + 4");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "+");
  runner.assertEqual(expr.left.type, "BinOp");
  runner.assertEqual(expr.left.op, "*");
  runner.assertEqual(expr.left.left.value, 2);
  runner.assertEqual(expr.left.right.value, 3);
  runner.assertEqual(expr.right.value, 4);
});

runner.test("precedence: power before multiplication", () => {
  // 2 * 3 ** 2 should be 2 * (3 ** 2) = 2 * 9
  const ast = parse("2 * 3 ** 2");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BinOp");
  runner.assertEqual(expr.op, "*");
  runner.assertEqual(expr.left.value, 2);
  runner.assertEqual(expr.right.type, "BinOp");
  runner.assertEqual(expr.right.op, "**");
  runner.assertEqual(expr.right.left.value, 3);
  runner.assertEqual(expr.right.right.value, 2);
});

// ============================================================
// COMPARISONS
// ============================================================

runner.test("parse equality comparison", () => {
  const ast = parse("x == y");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "Compare");
  runner.assertEqual(expr.ops[0], "==");
  runner.assertEqual(expr.left.type, "Name");
  runner.assertEqual(expr.left.id, "x");
  runner.assertEqual(expr.comparators[0].type, "Name");
  runner.assertEqual(expr.comparators[0].id, "y");
});

runner.test("parse chained comparisons", () => {
  // 1 < x < 10 should create Compare with ops: ["<", "<"]

  const ast = parse("1 < x < 10");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "Compare");
  runner.assertEqual(expr.ops[0], "<");
  runner.assertEqual(expr.ops[1], "<");
  runner.assertEqual(expr.left.type, "Constant");
  runner.assertEqual(expr.left.value, 1);
  runner.assertEqual(expr.comparators[0].type, "Name");
  runner.assertEqual(expr.comparators[0].id, "x");
  runner.assertEqual(expr.comparators[1].type, "Constant");
  runner.assertEqual(expr.comparators[1].value, 10);
});

// ============================================================
// BOOLEAN OPERATORS
// ============================================================

runner.test("parse and operator", () => {
  const ast = parse("True and False");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BoolOp");
  runner.assertEqual(expr.op, "and");
  runner.assertEqual(expr.values.length, 2);
  runner.assertEqual(expr.values[0].type, "Constant");
  runner.assertEqual(expr.values[0].value, true);
  runner.assertEqual(expr.values[1].type, "Constant");
  runner.assertEqual(expr.values[1].value, false);
});

runner.test("parse or operator", () => {
  const ast = parse("apples or  bananas");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "BoolOp");
  runner.assertEqual(expr.op, "or");
  runner.assertEqual(expr.values.length, 2);
  runner.assertEqual(expr.values[0].type, "Name");
  runner.assertEqual(expr.values[0].id, "apples");
  runner.assertEqual(expr.values[1].type, "Name");
  runner.assertEqual(expr.values[1].id, "bananas");
});

runner.test("parse not operator", () => {
  const ast = parse("not condition");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "UnaryOp");
  runner.assertEqual(expr.op, "not");
  runner.assertEqual(expr.operand.type, "Name");
  runner.assertEqual(expr.operand.id, "condition");
});

// ============================================================
// UNARY OPERATORS
// ============================================================

runner.test("parse unary minus", () => {
  const ast = parse("-5");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "UnaryOp");
  runner.assertEqual(expr.op, "-");
  runner.assertEqual(expr.operand.type, "Constant");
  runner.assertEqual(expr.operand.value, 5);
});

runner.test("parse unary plus", () => {
  const ast = parse("+4");
  const expr = ast.body[0].value;
  runner.assertEqual(expr.type, "UnaryOp");
  runner.assertEqual(expr.op, "+");
  runner.assertEqual(expr.operand.type, "Constant");
  runner.assertEqual(expr.operand.value, 4);
});

// ============================================================
// ASSIGNMENTS
// ============================================================

runner.test("parse simple assignment", () => {
  const ast = parse("x = 5");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Assign");
  runner.assertEqual(stmt.value.target.id, "x");
  runner.assertEqual(stmt.value.value.type, "Constant");
  runner.assertEqual(stmt.value.value.value, 5);
});

runner.test("parse right-associative assignment", () => {
  // x = y = 5 should parse as x = (y = 5)
  const ast = parse("x = y = 5");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.value.type, "Assign");
  runner.assertEqual(stmt.value.target.type, "Name");
  runner.assertEqual(stmt.value.value.type, "Assign");
  runner.assertEqual(stmt.value.value.target.id, "y");
  runner.assertEqual(stmt.value.value.value.type, "Constant");
  runner.assertEqual(stmt.value.value.value.value, 5);
});

runner.test("fail to parse non identifier assignment", () => {
  let thrown = false;
  try {
    parse("1 = 2");
  } catch {
    thrown = true;
  }
  runner.assertEqual(thrown, true);
});

// ============================================================
// FUNCTION CALLS & SUBSCRIPTS
// ============================================================

runner.test("parse function call with no args", () => {
  const ast = parse("foo()");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Call");
  runner.assertEqual(stmt.func.id, "foo");
  runner.assertEqual(stmt.args.length, 0);
});

runner.test("parse function call with one arg", () => {
  throw new Error("not yet implemented");
});

runner.test("parse function call with multiple args", () => {
  throw new Error("not yet implemented");
});

runner.test("parse subscript", () => {
  throw new Error("not yet implemented");
});

runner.test("parse chained calls", () => {
  // foo()[0].bar() - complex, but tests postfixExpr loop
  throw new Error("not yet implemented");
});

runner.report();
