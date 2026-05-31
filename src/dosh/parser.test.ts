import type { BinOp, Constant, DictLiteral, Name } from "./expr.ts";
import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import type {
  AssignStmt,
  ExprStmt,
  ForStmt,
  FuncDef,
  IfStmt,
  Module,
  WhileStmt,
} from "./stmt.ts";
import { TestRunner } from "./testrunner.ts";

function parse(code: string) {
  const lexer = new Lexer();
  const parser = new Parser();
  const tokens = lexer.tokenize(code);
  return parser.parse(tokens);
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

runner.test("parse empty list", () => {
  const ast = parse("[]");
  runner.assertEqual(ast.type, "Module");
  runner.assertEqual(ast.body.length, 1);
  runner.assertEqual(ast.body[0].type, "Expr");
  runner.assertEqual(ast.body[0].value.type, "List");
  runner.assertEqual(ast.body[0].value.elts.length, 0);
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
  const stmt = ast.body[0] as AssignStmt;
  runner.assertEqual(stmt.type, "Assign");
  runner.assertEqual(stmt.expr.target.type, "Name");
  runner.assertEqual(stmt.expr.target.id, "x");
  runner.assertEqual(stmt.expr.value.type, "Constant");
  runner.assertEqual(stmt.expr.value.value, 5);
});

runner.test("parse right-associative assignment", () => {
  // x = y = 5 should parse as x = (y = 5)
  const ast = parse("x = y = 5");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as AssignStmt;
  runner.assertEqual(stmt.type, "Assign");
  runner.assertEqual(stmt.expr.target.type, "Name");
  runner.assertEqual(stmt.expr.target.id, "x");
  runner.assertEqual(stmt.expr.value.type, "Assign");
  runner.assertEqual(stmt.expr.value.target.type, "Name");
  runner.assertEqual(stmt.expr.value.target.id, "y");
  runner.assertEqual(stmt.expr.value.value.type, "Constant");
  runner.assertEqual(stmt.expr.value.value.value, 5);
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

runner.test("parse explicit function call with no args", () => {
  const ast = parse("foo()");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Call");
  runner.assertEqual(stmt.value.func.id, "foo");
  runner.assertEqual(stmt.value.args.length, 0);
});

runner.test("parse function call with one arg (parens)", () => {
  const ast = parse("print(1)");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Call");
  runner.assertEqual(stmt.value.func.id, "print");
  runner.assertEqual(stmt.value.args.length, 1);
});

runner.test("parse function call with multiple args", () => {
  const ast = parse("foo(1, 2, 3)");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Call");
  runner.assertEqual(stmt.value.func.id, "foo");
  runner.assertEqual(stmt.value.args.length, 3);
});

runner.test("parse subscript", () => {
  const ast = parse("foo[0]");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Subscript");
  runner.assertEqual(stmt.value.value.id, "foo");
  runner.assertEqual(stmt.value.slice.type, "Constant");
  runner.assertEqual(stmt.value.slice.value, 0);
});

runner.test("parse chained subscripts", () => {
  const ast = parse("foo[0][1]");
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Subscript");
  runner.assertEqual(stmt.value.value.type, "Subscript");
  runner.assertEqual(stmt.value.value.value.id, "foo");
  runner.assertEqual(stmt.value.value.slice.type, "Constant");
  runner.assertEqual(stmt.value.value.slice.value, 0);
  runner.assertEqual(stmt.value.slice.type, "Constant");
  runner.assertEqual(stmt.value.slice.value, 1);
});

runner.test("parse chained calls", () => {
  // foo()[0].bar() - complex, but tests postfixExpr loop
  const ast = parse("foo()[0]");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Subscript");
  runner.assertEqual(stmt.value.value.type, "Call");
  runner.assertEqual(stmt.value.value.func.id, "foo");
  runner.assertEqual(stmt.value.value.args.length, 0);
  runner.assertEqual(stmt.value.slice.type, "Constant");
  runner.assertEqual(stmt.value.slice.value, 0);
});

runner.test("parse chained calls", () => {
  // foo()[0].bar() - complex, but tests postfixExpr loop
  const ast = parse("foo[0](0)");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "Expr");
  runner.assertEqual(stmt.value.type, "Call");
  runner.assertEqual(stmt.value.func.type, "Subscript");
  runner.assertEqual(stmt.value.func.value.id, "foo");
  runner.assertEqual(stmt.value.args.length, 1);
  runner.assertEqual(stmt.value.args[0].type, "Constant");
  runner.assertEqual(stmt.value.args[0].value, 0);
});

// ============================================================
// STATEMENTS
// ============================================================

runner.test("parse function definition", () => {
  const ast = parse("fn foo():\n  pass");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "FuncDef");
  runner.assertEqual(stmt.name, "foo");
  runner.assertEqual(stmt.args.length, 0);
  runner.assertEqual(stmt.body.length, 0);
});

runner.test("parse no-arg function definition (no parens)", () => {
  const ast = parse("fn foo:\n  pass");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0];
  runner.assertEqual(stmt.type, "FuncDef");
  runner.assertEqual(stmt.name, "foo");
  runner.assertEqual(stmt.args.length, 0);
  runner.assertEqual(stmt.body.length, 0);
});

runner.test("parse function def with arg", () => {
  const ast = parse("fn square(a):\n    return a ** 2");
  const expectedAst = {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "square",
        args: ["a"],
        body: [
          {
            type: "Return",
            value: {
              type: "BinOp",
              op: "**",
              left: { type: "Name", id: "a" },
              right: { type: "Constant", value: 2 },
            },
          },
        ],
      },
    ],
  };
  runner.assertEqual(ast.body.length, 1);
  runner.assertDeepEqual(ast.body[0], expectedAst.body[0]);
});

runner.test("parse function with multiple args", () => {
  const ast = parse("fn foo(a, b):\n    pass");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as FuncDef;
  runner.assertEqual(stmt.type, "FuncDef");
  runner.assertEqual(stmt.name, "foo");
  runner.assertEqual(stmt.args.length, 2);
  runner.assertEqual(stmt.args[0], "a");
  runner.assertEqual(stmt.args[1], "b");
  runner.assertEqual(stmt.body.length, 0);
});

runner.test("parse if statement", () => {
  const ast = parse("if cond:\n    pass");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as IfStmt;
  runner.assertEqual(stmt.type, "If");
  runner.assertEqual(stmt.cond.type, "Name");
  runner.assertEqual(stmt.cond.id, "cond");
  runner.assertEqual(stmt.body.length, 0);
});

runner.test("parse if-else statement", () => {
  const ast = parse("if x:\n  y\nelse:\n  z");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as IfStmt;
  runner.assertEqual(stmt.type, "If");
  runner.assertEqual(stmt.cond.type, "Name");
  runner.assertEqual(stmt.cond.id, "x");
  runner.assertEqual(stmt.body.length, 1);
  const bodyStmt = stmt.body[0];
  runner.assertEqual(bodyStmt.type, "Expr");
  runner.assertEqual(bodyStmt.value.type, "Name");
  runner.assertEqual(bodyStmt.value.id, "y");
  runner.assertEqual(stmt.orelse.length, 1);
  const elseBodyStmt = stmt.orelse[0];
  runner.assertEqual(elseBodyStmt.type, "Expr");
  runner.assertEqual(elseBodyStmt.value.type, "Name");
  runner.assertEqual(elseBodyStmt.value.id, "z");
});

runner.test("parse elif", () => {
  //elif orelse is a nested if statement
  const ast = parse("if x:\n  y\nelif z:\n  w");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as IfStmt;
  runner.assertEqual(stmt.type, "If");
  runner.assertEqual(stmt.cond.type, "Name");
  runner.assertEqual(stmt.cond.id, "x");
  runner.assertEqual(stmt.body.length, 1);
  const bodyStmt = stmt.body[0];
  runner.assertEqual(bodyStmt.type, "Expr");
  runner.assertEqual(bodyStmt.value.type, "Name");
  runner.assertEqual(bodyStmt.value.id, "y");
  runner.assertEqual(stmt.orelse.length, 1);
  const elseBodyStmt = stmt.orelse[0] as IfStmt;
  runner.assertEqual(elseBodyStmt.type, "If");
  runner.assertEqual(elseBodyStmt.cond.type, "Name");
  runner.assertEqual(elseBodyStmt.cond.id, "z");
  runner.assertEqual(elseBodyStmt.body.length, 1);
  const elseBodyStmt2 = elseBodyStmt.body[0];
  runner.assertEqual(elseBodyStmt2.type, "Expr");
  runner.assertEqual(elseBodyStmt2.value.type, "Name");
  runner.assertEqual(elseBodyStmt2.value.id, "w");
});

runner.test("parse conditional chain", () => {
  const ast = parse("if x:\n  z\nelif y:\n  w\nelse:\n  t");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as IfStmt;
  runner.assertEqual(stmt.type, "If");
  runner.assertEqual(stmt.cond.type, "Name");
  runner.assertEqual(stmt.cond.id, "x");
  runner.assertEqual(stmt.body.length, 1);
  const bodyStmt = stmt.body[0];
  runner.assertEqual(bodyStmt.type, "Expr");
  runner.assertEqual(bodyStmt.value.type, "Name");
  runner.assertEqual(bodyStmt.value.id, "z");
  runner.assertEqual(stmt.orelse.length, 1);
  const elseBodyStmt = stmt.orelse[0] as IfStmt;
  runner.assertEqual(elseBodyStmt.type, "If");
  runner.assertEqual(elseBodyStmt.cond.type, "Name");
  runner.assertEqual(elseBodyStmt.cond.id, "y");
  runner.assertEqual(elseBodyStmt.body.length, 1);
  const elseBodyStmt2 = elseBodyStmt.body[0];
  runner.assertEqual(elseBodyStmt2.type, "Expr");
  runner.assertEqual(elseBodyStmt2.value.type, "Name");
  runner.assertEqual(elseBodyStmt2.value.id, "w");
  runner.assertEqual(elseBodyStmt.orelse.length, 1);
  const elseBodyStmt3 = elseBodyStmt.orelse[0];
  runner.assertEqual(elseBodyStmt3.type, "Expr");
  runner.assertEqual(elseBodyStmt3.value.type, "Name");
  runner.assertEqual(elseBodyStmt3.value.id, "t");
});

runner.test("parse while statement", () => {
  const ast = parse("while True:\n  y");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as WhileStmt;
  runner.assertEqual(stmt.type, "While");
  runner.assertEqual(stmt.cond.type, "Constant");
  runner.assertEqual(stmt.cond.value, true);
  runner.assertEqual(stmt.body.length, 1);
  const bodyStmt1 = stmt.body[0];

  runner.assertEqual(bodyStmt1.type, "Expr");
  runner.assertEqual(bodyStmt1.value.type, "Name");
  runner.assertEqual(bodyStmt1.value.id, "y");
});

runner.test("parse for loop statment", () => {
  const ast = parse("for i in []:\n  pass");
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as ForStmt;
  runner.assertEqual(stmt.type, "For");
  runner.assertEqual(stmt.target.type, "Name");
  runner.assertEqual(stmt.target.id, "i");
});

runner.test("parse multi-line program", () => {
  const ast = parse("x = 4\nx ** 2");
  runner.assertEqual(ast.body.length, 2);
  const stmt1 = ast.body[0] as AssignStmt;
  runner.assertEqual(stmt1.type, "Assign");
  runner.assertEqual(stmt1.expr.target.type, "Name");
  runner.assertEqual(stmt1.expr.target.id, "x");
  runner.assertEqual(stmt1.expr.value.type, "Constant");
  runner.assertEqual(stmt1.expr.value.value, 4);
  const stmt2 = ast.body[1] as ExprStmt;
  runner.assertEqual(stmt2.type, "Expr");
  runner.assertEqual(stmt2.value.type, "BinOp");
  runner.assertEqual(stmt2.value.op, "**");
  runner.assertEqual(stmt2.value.left.type, "Name");
  runner.assertEqual(stmt2.value.left.id, "x");
  runner.assertEqual(stmt2.value.right.type, "Constant");
  runner.assertEqual(stmt2.value.right.value, 2);
});

runner.test("parse function def", () => {
  const ast = parse(`
fn add a, b:
  return a + b
  `);
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as FuncDef;
  runner.assertEqual(stmt.type, "FuncDef");
  runner.assertEqual(stmt.name, "add");
  runner.assertEqual(stmt.args.length, 2);
  runner.assertEqual(stmt.args[0], "a");
  runner.assertEqual(stmt.args[1], "b");
});

runner.test("parse function def (parens)", () => {
  const ast = parse(`
fn add(a, b):
  return a + b
  `);
  runner.assertEqual(ast.body.length, 1);
  const stmt = ast.body[0] as FuncDef;
  runner.assertEqual(stmt.type, "FuncDef");
  runner.assertEqual(stmt.name, "add");
  runner.assertEqual(stmt.args.length, 2);
  runner.assertEqual(stmt.args[0], "a");
  runner.assertEqual(stmt.args[1], "b");
});

runner.test("parse function call (parens)", () => {
  const ast = parse("add(3,4)");

  const stmt = ast.body[0] as ExprStmt;
  const expectedStmt = {
    type: "Expr",
    value: {
      type: "Call",
      func: { type: "Name", id: "add" },
      args: [
        { type: "Constant", value: 3 },
        { type: "Constant", value: 4 },
      ],
    },
  };
  runner.assertDeepEqual(stmt, expectedStmt);
});

runner.test("parse function call (no-parens)", () => {
  const ast = parse("add 3, 4");

  const stmt = ast.body[0] as ExprStmt;
  const expectedStmt = {
    type: "Expr",
    value: {
      type: "Call",
      func: { type: "Name", id: "add" },
      args: [
        { type: "Constant", value: 3 },
        { type: "Constant", value: 4 },
      ],
    },
  };
  runner.assertDeepEqual(stmt, expectedStmt);
});

runner.test("parse function definition and call", () => {
  const ast = parse(`
fn add a, b:
  return a + b
add 3, 4
  `);
  runner.assertEqual(ast.body.length, 2);
  const defStmt = ast.body[0] as FuncDef;
  const callStmt = ast.body[1] as ExprStmt;

  const expectedDefStmt: FuncDef = {
    type: "FuncDef",
    name: "add",
    args: ["a", "b"],
    body: [
      {
        type: "Return",
        value: {
          type: "BinOp",
          op: "+",
          left: { type: "Name", id: "a" },
          right: { type: "Name", id: "b" },
        },
      },
    ],
  };

  const expectedCallStmt: ExprStmt = {
    type: "Expr",
    value: {
      type: "Call",
      func: { type: "Name", id: "add" },
      args: [
        { type: "Constant", value: 3 },
        { type: "Constant", value: 4 },
      ],
    },
  };
  runner.assertDeepEqual(callStmt, expectedCallStmt);
  runner.assertDeepEqual(defStmt, expectedDefStmt);
});

runner.test("parse function definition and call", () => {
  const ast = parse(`
fn add a, b:
  return a + b
add 3, 4
  `);

  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "add",
        args: ["a", "b"],
        body: [
          {
            type: "Return",
            value: {
              type: "BinOp",
              op: "+",
              left: { type: "Name", id: "a" },
              right: { type: "Name", id: "b" },
            },
          },
        ],
      },
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "add" },
          args: [
            { type: "Constant", value: 3 },
            { type: "Constant", value: 4 },
          ],
        },
      },
    ],
  };

  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse for loop", () => {
  // COMPLETE THIS TEST
  const ast = parse("x = 1\nfor i in [1,2,3,4,5]:\n  x = x * i\nx");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        expr: {
          type: "Assign",
          target: { type: "Name", id: "x" },
          value: { type: "Constant", value: 1 },
        },
      },
      {
        type: "For",
        target: { type: "Name", id: "i" },
        iter: {
          type: "List",
          elts: [
            { type: "Constant", value: 1 },
            { type: "Constant", value: 2 },
            { type: "Constant", value: 3 },
            { type: "Constant", value: 4 },
            { type: "Constant", value: 5 },
          ],
        },
        body: [
          {
            type: "Assign",
            expr: {
              type: "Assign",
              target: { type: "Name", id: "x" },
              value: {
                type: "BinOp",
                op: "*",
                left: { type: "Name", id: "x" },
                right: { type: "Name", id: "i" },
              },
            },
          },
        ],
      },
      {
        type: "Expr",
        value: { type: "Name", id: "x" },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.report();
