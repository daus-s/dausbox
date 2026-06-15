import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import type { Module } from "./stmt.ts";
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

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Constant", value: 42 },
      },
    ],
  });
});

runner.test("parse string constant", () => {
  const ast = parse("'blessed be the maker and his waters'");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Constant",
          value: "blessed be the maker and his waters",
        },
      },
    ],
  });
});

runner.test("parse boolean constants", () => {
  const t = parse("true");

  runner.assertDeepEqual(t, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Constant", value: true },
      },
    ],
  });

  const f = parse("false");

  runner.assertDeepEqual(f, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Constant", value: false },
      },
    ],
  });
});

runner.test("parse name (variable)", () => {
  const ast = parse("foo");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Name", id: "foo" },
      },
    ],
  });
});

runner.test("parse complex parenthesized expression", () => {
  const ast = parse("(5 + 3) * 8");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "*",
          left: {
            type: "BinOp",
            op: "+",
            left: { type: "Constant", value: 5 },
            right: { type: "Constant", value: 3 },
          },
          right: { type: "Constant", value: 8 },
        },
      },
    ],
  });
});

runner.test("parse list literal", () => {
  const ast = parse("[1, 2, 3]");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "List",
          elts: [
            { type: "Constant", value: 1 },
            { type: "Constant", value: 2 },
            { type: "Constant", value: 3 },
          ],
        },
      },
    ],
  });
});

runner.test("parse empty list", () => {
  const ast = parse("[]");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "List", elts: [] },
      },
    ],
  });
});

runner.test("parse dict literal", () => {
  const ast = parse("{}");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Dict", keys: [], values: [] },
      },
    ],
  });
});

// ============================================================
// BINARY OPERATORS
// ============================================================

runner.test("parse addition", () => {
  const ast = parse("5 + 3");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "+",
          left: { type: "Constant", value: 5 },
          right: { type: "Constant", value: 3 },
        },
      },
    ],
  });
});

runner.test("parse subtraction", () => {
  const ast = parse("4 - 8");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "-",
          left: { type: "Constant", value: 4 },
          right: { type: "Constant", value: 8 },
        },
      },
    ],
  });
});

runner.test("parse multiplication", () => {
  const ast = parse("2 * 6");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "*",
          left: { type: "Constant", value: 2 },
          right: { type: "Constant", value: 6 },
        },
      },
    ],
  });
});

runner.test("parse division", () => {
  const ast = parse("10 / 2.0");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "/",
          left: { type: "Constant", value: 10 },
          right: { type: "Constant", value: 2 },
        },
      },
    ],
  });
});

runner.test("parse integer(floor) division", () => {
  const ast = parse("10 // 3");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "//",
          left: { type: "Constant", value: 10 },
          right: { type: "Constant", value: 3 },
        },
      },
    ],
  });
});

runner.test("parse modulo", () => {
  const ast = parse("10 % 3");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "%",
          left: { type: "Constant", value: 10 },
          right: { type: "Constant", value: 3 },
        },
      },
    ],
  });
});

runner.test("parse power (basic)", () => {
  const ast = parse("2 ** 3");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "**",
          left: { type: "Constant", value: 2 },
          right: { type: "Constant", value: 3 },
        },
      },
    ],
  });
});

runner.test("parse power (right-associative)", () => {
  // 2 ** 3 ** 4 should parse as 2 ** (3 ** 4)
  const ast = parse("2 ** 3 ** 4");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "**",
          left: { type: "Constant", value: 2 },
          right: {
            type: "BinOp",
            op: "**",
            left: { type: "Constant", value: 3 },
            right: { type: "Constant", value: 4 },
          },
        },
      },
    ],
  });
});

// ============================================================
// OPERATOR PRECEDENCE
// ============================================================

runner.test("precedence: multiplication before addition", () => {
  // 2 + 3 * 4 should be 2 + (3 * 4), not (2 + 3) * 4
  const ast = parse("2 + 3 * 4");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "+",
          left: { type: "Constant", value: 2 },
          right: {
            type: "BinOp",
            op: "*",
            left: { type: "Constant", value: 3 },
            right: { type: "Constant", value: 4 },
          },
        },
      },
    ],
  });
});

runner.test("precedence: multiplication before addition", () => {
  const ast = parse("2 * 3 + 4");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "+",
          left: {
            type: "BinOp",
            op: "*",
            left: { type: "Constant", value: 2 },
            right: { type: "Constant", value: 3 },
          },
          right: { type: "Constant", value: 4 },
        },
      },
    ],
  });
});

runner.test("precedence: power before multiplication", () => {
  // 2 * 3 ** 2 should be 2 * (3 ** 2) = 2 * 9
  const ast = parse("2 * 3 ** 2");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "*",
          left: { type: "Constant", value: 2 },
          right: {
            type: "BinOp",
            op: "**",
            left: { type: "Constant", value: 3 },
            right: { type: "Constant", value: 2 },
          },
        },
      },
    ],
  });
});

// ============================================================
// COMPARISONS
// ============================================================

runner.test("parse equality comparison", () => {
  const ast = parse("x == y");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Compare",
          left: { type: "Name", id: "x" },
          ops: ["=="],
          comparators: [{ type: "Name", id: "y" }],
        },
      },
    ],
  });
});

runner.test("parse chained comparisons", () => {
  // 1 < x < 10 should create Compare with ops: ["<", "<"]
  const ast = parse("1 < x < 10");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Compare",
          left: { type: "Constant", value: 1 },
          ops: ["<", "<"],
          comparators: [
            { type: "Name", id: "x" },
            { type: "Constant", value: 10 },
          ],
        },
      },
    ],
  });
});

// ============================================================
// BOOLEAN OPERATORS
// ============================================================

runner.test("parse and operator", () => {
  const ast = parse("true and false");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BoolOp",
          op: "and",
          values: [
            { type: "Constant", value: true },
            { type: "Constant", value: false },
          ],
        },
      },
    ],
  });
});

runner.test("parse or operator", () => {
  const ast = parse("apples or  bananas");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "BoolOp",
          op: "or",
          values: [
            { type: "Name", id: "apples" },
            { type: "Name", id: "bananas" },
          ],
        },
      },
    ],
  });
});

runner.test("parse not operator", () => {
  const ast = parse("not condition");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "UnaryOp",
          op: "not",
          operand: { type: "Name", id: "condition" },
        },
      },
    ],
  });
});

// ============================================================
// UNARY OPERATORS
// ============================================================

runner.test("parse unary minus", () => {
  const ast = parse("-5");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "UnaryOp",
          op: "-",
          operand: { type: "Constant", value: 5 },
        },
      },
    ],
  });
});

runner.test("parse unary plus", () => {
  const ast = parse("+4");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "UnaryOp",
          op: "+",
          operand: { type: "Constant", value: 4 },
        },
      },
    ],
  });
});

// ============================================================
// ASSIGNMENTS
// ============================================================

runner.test("parse simple assignment", () => {
  const ast = parse("x = 5");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "x" },
          value: { type: "Constant", value: 5 },
        },
      },
    ],
  });
});

runner.test("parse right-associative assignment", () => {
  // x = y = 5 should parse as x = (y = 5)
  const ast = parse("x = y = 5");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "x" },
          value: {
            type: "Assign",
            target: { type: "Name", id: "y" },
            value: { type: "Constant", value: 5 },
          },
        },
      },
    ],
  });
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

runner.test("parse subscript", () => {
  const ast = parse("foo[0]");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Subscript",
          value: { type: "Name", id: "foo" },
          slice: { type: "Constant", value: 0 },
        },
      },
    ],
  });
});

runner.test("parse chained subscripts", () => {
  const ast = parse("foo[0][1]");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Subscript",
          value: {
            type: "Subscript",
            value: { type: "Name", id: "foo" },
            slice: { type: "Constant", value: 0 },
          },
          slice: { type: "Constant", value: 1 },
        },
      },
    ],
  });
});

runner.test("parse chained calls", () => {
  // foo()[0].bar() - complex, but tests postfixExpr loop
  const ast = parse("foo()[0]");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Subscript",
          value: {
            type: "Call",
            func: { type: "Name", id: "foo" },
            args: [],
          },
          slice: { type: "Constant", value: 0 },
        },
      },
    ],
  });
});

runner.test("parse chained calls", () => {
  // foo()[0].bar() - complex, but tests postfixExpr loop
  const ast = parse("foo[0](0)");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: {
            type: "Subscript",
            value: { type: "Name", id: "foo" },
            slice: { type: "Constant", value: 0 },
          },
          args: [{ type: "Constant", value: 0 }],
        },
      },
    ],
  });
});

// ============================================================
// STATEMENTS
// ============================================================

runner.test("parse function definition", () => {
  const ast = parse("fn foo():\n  pass");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "foo",
        args: [],
        body: [],
      },
    ],
  });
});

runner.test("parse no-arg function definition (no parens)", () => {
  const ast = parse("fn foo:\n  pass");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "foo",
        args: [],
        body: [],
      },
    ],
  });
});

runner.test("parse explicit function call with no args", () => {
  const ast = parse("foo()");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "foo" },
          args: [],
        },
      },
    ],
  });
});

runner.test("parse implicit function call as identifier", () => {
  const ast = parse("foo");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: { type: "Name", id: "foo" },
      },
    ],
  });
});

runner.test("parse function call with one arg (parens)", () => {
  const ast = parse("print(1)");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "print" },
          args: [{ type: "Constant", value: 1 }],
        },
      },
    ],
  });
});

runner.test("parse function call with multiple args", () => {
  const ast = parse("foo(1, 2, 3)");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "foo" },
          args: [
            { type: "Constant", value: 1 },
            { type: "Constant", value: 2 },
            { type: "Constant", value: 3 },
          ],
        },
      },
    ],
  });
});

runner.test("parse function def with arg", () => {
  const ast = parse("fn square(a):\n    return a ** 2");

  runner.assertDeepEqual(ast, {
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
  });
});

runner.test("parse math.sqrt function", () => {
  const ast = parse(
    "fn sqrt x:\n  if x < 0:\n    return null\n  else:\n    return x ** 0.5",
  );

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "sqrt",
        args: ["x"],
        body: [
          {
            type: "If",
            cond: {
              type: "Compare",
              left: { type: "Name", id: "x" },
              ops: ["<"],
              comparators: [{ type: "Constant", value: 0 }],
            },
            body: [
              {
                type: "Return",
                value: { type: "Constant", value: null },
              },
            ],
            orelse: [
              {
                type: "Return",
                value: {
                  type: "BinOp",
                  op: "**",
                  left: { type: "Name", id: "x" },
                  right: { type: "Constant", value: 0.5 },
                },
              },
            ],
          },
        ],
      },
    ],
  });
});

runner.test("parse function def with arg (no parens)", () => {
  const ast = parse("fn square a:\n    return a ** 2");

  runner.assertDeepEqual(ast, {
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
  });
});

runner.test("parse function with multiple args", () => {
  const ast = parse("fn foo(a, b):\n    pass");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "foo",
        args: ["a", "b"],
        body: [],
      },
    ],
  });
});

runner.test("parse nested function call as an argument", () => {
  const ast = parse("use math\nprint math.sqrt 9");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "UseStmt",
        src: ["math"],
      },
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "print" },
          args: [
            {
              type: "Call",
              func: {
                type: "Attr",
                target: { type: "Name", id: "math" },
                attr: {
                  type: "Name",
                  id: "sqrt",
                },
              },
              args: [{ type: "Constant", value: 9 }],
            },
          ],
        },
      },
    ],
  });
});

runner.test("parse function with multiple statements", () => {
  const ast = parse("fn foo(a):\n    a\n    b");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "FuncDef",
        name: "foo",
        args: ["a"],
        body: [
          {
            type: "Expr",
            value: { type: "Name", id: "a" },
          },
          {
            type: "Expr",
            value: { type: "Name", id: "b" },
          },
        ],
      },
    ],
  });
});

runner.test("parse if statement", () => {
  const ast = parse("if cond:\n    pass");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "If",
        cond: { type: "Name", id: "cond" },
        body: [],
        orelse: [],
      },
    ],
  });
});

runner.test("parse if-else statement", () => {
  const ast = parse("if x:\n  y\nelse:\n  z");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "If",
        cond: { type: "Name", id: "x" },
        body: [
          {
            type: "Expr",
            value: { type: "Name", id: "y" },
          },
        ],
        orelse: [
          {
            type: "Expr",
            value: { type: "Name", id: "z" },
          },
        ],
      },
    ],
  });
});

runner.test("parse elif", () => {
  //elif orelse is a nested if statement
  const ast = parse("if x:\n  y\nelif z:\n  w");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "If",
        cond: { type: "Name", id: "x" },
        body: [
          {
            type: "Expr",
            value: { type: "Name", id: "y" },
          },
        ],
        orelse: [
          {
            type: "If",
            cond: { type: "Name", id: "z" },
            body: [
              {
                type: "Expr",
                value: { type: "Name", id: "w" },
              },
            ],
            orelse: [],
          },
        ],
      },
    ],
  });
});

runner.test("parse conditional chain", () => {
  const ast = parse("if x:\n  z\nelif y:\n  w\nelse:\n  t");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "If",
        cond: { type: "Name", id: "x" },
        body: [
          {
            type: "Expr",
            value: { type: "Name", id: "z" },
          },
        ],
        orelse: [
          {
            type: "If",
            cond: { type: "Name", id: "y" },
            body: [
              {
                type: "Expr",
                value: { type: "Name", id: "w" },
              },
            ],
            orelse: [
              {
                type: "Expr",
                value: { type: "Name", id: "t" },
              },
            ],
          },
        ],
      },
    ],
  });
});

runner.test("parse while statement", () => {
  const ast = parse("while true:\n  y");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "While",
        cond: { type: "Constant", value: true },
        body: [
          {
            type: "Expr",
            value: { type: "Name", id: "y" },
          },
        ],
      },
    ],
  });
});

runner.test("parse for loop statment", () => {
  const ast = parse("for i in []:\n  pass");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "For",
        target: { type: "Name", id: "i" },
        iter: { type: "List", elts: [] },
        body: [],
      },
    ],
  });
});

runner.test("parse multi-line program", () => {
  const ast = parse("x = 4\nx ** 2");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "x" },
          value: { type: "Constant", value: 4 },
        },
      },
      {
        type: "Expr",
        value: {
          type: "BinOp",
          op: "**",
          left: { type: "Name", id: "x" },
          right: { type: "Constant", value: 2 },
        },
      },
    ],
  });
});

runner.test("parse function def", () => {
  const ast = parse(`
fn add a, b:
  return a + b
  `);

  runner.assertDeepEqual(ast, {
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
    ],
  });
});

runner.test("parse function def (parens)", () => {
  const ast = parse(`
fn add(a, b):
  return a + b
  `);

  runner.assertDeepEqual(ast, {
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
    ],
  });
});

runner.test("parse function call (parens)", () => {
  const ast = parse("add(3,4)");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
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
  });
});

runner.test("parse function call (no-parens)", () => {
  const ast = parse("add 3, 4");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
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
  });
});

runner.test("parse function definition and call", () => {
  const ast = parse(`
fn add a, b:
  return a + b
add 3, 4
  `);

  runner.assertDeepEqual(ast, {
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
  });
});

runner.test("parse function definition and call", () => {
  const ast = parse(`
fn add a, b:
  return a + b
add 3, 4
  `);

  runner.assertDeepEqual(ast, {
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
  });
});

runner.test("parse for loop", () => {
  // COMPLETE THIS TEST
  const ast = parse("x = 1\nfor i in [1,2,3,4,5]:\n  x = x * i\nx");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
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
            assign: {
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

// when passing an argument in dosh with a literal list parentheses are required.
// there may be some flexibility if it is the second argument or later but this is
// not recommended.
//
// Ex: use `join([1, 2, 3], 4)` instead of `join [1, 2, 3], 4`
runner.test("parse base case join", () => {
  const ast = parse("join([], 1)");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "join" },
          args: [
            {
              type: "List",
              elts: [],
            },
            { type: "Constant", value: 1 },
          ],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse complex function evaluation", () => {
  const ast = parse("xs = join([1, 2], 3)\nxs = join(xs, 4)\nprint xs");

  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "xs" },
          value: {
            type: "Call",
            func: { type: "Name", id: "join" },
            args: [
              {
                type: "List",
                elts: [
                  { type: "Constant", value: 1 },
                  { type: "Constant", value: 2 },
                ],
              },
              { type: "Constant", value: 3 },
            ],
          },
        },
      },
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "xs" },
          value: {
            type: "Call",
            func: { type: "Name", id: "join" },
            args: [
              { type: "Name", id: "xs" },
              { type: "Constant", value: 4 },
            ],
          },
        },
      },
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "print" },
          args: [{ type: "Name", id: "xs" }],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

// test attributes
runner.test("parse attribute access", () => {
  const ast = parse("d.name");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Attr",
          target: { type: "Name", id: "d" },
          attr: { type: "Name", id: "name" },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse chained attribute access", () => {
  const ast = parse("d.foo.bar");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Attr",
          target: {
            type: "Attr",
            target: { type: "Name", id: "d" },
            attr: { type: "Name", id: "foo" },
          },
          attr: { type: "Name", id: "bar" },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse method call with parens", () => {
  const ast = parse("d.bark()");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: {
            type: "Attr",
            target: { type: "Name", id: "d" },
            attr: { type: "Name", id: "bark" },
          },
          args: [],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse method call with args no parens", () => {
  const ast = parse("d.greet 'rex'");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: {
            type: "Attr",
            target: { type: "Name", id: "d" },
            attr: { type: "Name", id: "greet" },
          },
          args: [{ type: "Constant", value: "rex" }],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse attr access on call result", () => {
  const ast = parse("getObj().name");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Attr",
          target: {
            type: "Call",
            func: { type: "Name", id: "getObj" },
            args: [],
          },
          attr: { type: "Name", id: "name" },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse attr assign", () => {
  const ast = parse("d.name = 'rex'");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: {
            type: "Attr",
            target: { type: "Name", id: "d" },
            attr: { type: "Name", id: "name" },
          },
          value: { type: "Constant", value: "rex" },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

//test objects
runner.test("parse obj def", () => {
  const ast = parse("obj Dog:\n  name = 'rex'");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "ObjDef",
        name: "Dog",
        body: [
          {
            type: "Assign",
            assign: {
              type: "Assign",
              target: { type: "Name", id: "name" },
              value: { type: "Constant", value: "rex" },
            },
          },
        ],
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj def with method", () => {
  const ast = parse("obj Dog:\n  fn bark:\n    print 'woof'");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "ObjDef",
        name: "Dog",
        body: [
          {
            type: "FuncDef",
            name: "bark",
            args: [],
            body: [
              {
                type: "Expr",
                value: {
                  type: "Call",
                  func: { type: "Name", id: "print" },
                  args: [{ type: "Constant", value: "woof" }],
                },
              },
            ],
          },
        ],
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj def with init", () => {
  const ast = parse("obj Dog:\n  fn init name:\n    self.name = name");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "ObjDef",
        name: "Dog",
        body: [
          {
            type: "FuncDef",
            name: "init",
            args: ["name"],
            body: [
              {
                type: "Assign",
                assign: {
                  type: "Assign",
                  target: {
                    type: "Attr",
                    target: { type: "Name", id: "self" },
                    attr: { type: "Name", id: "name" },
                  },
                  value: { type: "Name", id: "name" },
                },
              },
            ],
          },
        ],
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj instantiation no args", () => {
  const ast = parse("d = Dog()");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "d" },
          value: {
            type: "Call",
            func: { type: "Name", id: "Dog" },
            args: [],
          },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj instantiation with args", () => {
  const ast = parse("d = Dog 'rex'");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "d" },
          value: {
            type: "Call",
            func: { type: "Name", id: "Dog" },
            args: [{ type: "Constant", value: "rex" }],
          },
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj method call", () => {
  const ast = parse("d.bark()");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: {
            type: "Attr",
            target: { type: "Name", id: "d" },
            attr: { type: "Name", id: "bark" },
          },
          args: [],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse obj field access", () => {
  const ast = parse("print d.name");
  const expectedAst: Module = {
    type: "Module",
    body: [
      {
        type: "Expr",
        value: {
          type: "Call",
          func: { type: "Name", id: "print" },
          args: [
            {
              type: "Attr",
              target: { type: "Name", id: "d" },
              attr: { type: "Name", id: "name" },
            },
          ],
        },
      },
    ],
  };
  runner.assertDeepEqual(ast, expectedAst);
});

runner.test("parse use stmt", () => {
  const ast = parse("use math\n");

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [{ type: "UseStmt", src: ["math"] }],
  });
});

runner.test("parse use with super ", () => {
  const ast = parse("use super.math\n");
  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [{ type: "UseStmt", src: ["super", "math"] }],
  });
});

runner.test("parse comment starting block", () => {
  const ast = parse(
    "x = true\nif x:\n  # this is the golden path\n  print x\n",
  );

  runner.assertDeepEqual(ast, {
    type: "Module",
    body: [
      {
        type: "Assign",
        assign: {
          type: "Assign",
          target: { type: "Name", id: "x" },
          value: { type: "Constant", value: true },
        },
      },
      {
        type: "If",
        cond: { type: "Name", id: "x" },
        body: [
          {
            type: "Expr",
            value: {
              type: "Call",
              func: { type: "Name", id: "print" },
              args: [{ type: "Name", id: "x" }],
            },
          },
        ],
        orelse: [],
      },
    ],
  });
});

runner.report();
