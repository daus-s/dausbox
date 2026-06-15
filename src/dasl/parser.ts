import type { Assign, Expr } from "./expr";
import type { Module, Stmt } from "./stmt";
import type { Token } from "./token";

class Parser {
  private tokens: Token[] = [];
  private idx: number = 0;

  constructor() {}

  parse(tokens: Token[]): Module {
    this.tokens = tokens;
    const stmts = new Array<Stmt>();

    while (!this.isDone()) {
      const stmt = this.parseStmt();
      if (stmt) stmts.push(stmt);
    }

    return { type: "Module", body: stmts };
  }

  private prev(): Token {
    if (this.idx === 0) throw new Error("prev: index out of bounds");
    return this.tokens[this.idx - 1];
  }

  private peek(): Token {
    return this.tokens[this.idx];
  }

  private step(): Token {
    return this.tokens[this.idx++];
  }

  private check(type: string): boolean {
    return this.peek().type === type;
  }

  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.step();
        return true;
      }
    }
    return false;
  }

  private consume(type: string, message: string): Token {
    if (this.check(type)) {
      return this.step();
    }
    throw new Error(message);
  }

  private consumeMany(type: string, message: string) {
    this.consume(type, message); //must consume at least 1
    while (this.match(type)) {
      void 0;
    }
  }

  private isDone() {
    return this.idx >= this.tokens.length || this.peek().type === "EOF";
  }

  private canStartArg(): boolean {
    return (
      this.check("IDENTIFIER") ||
      this.check("NUMBER") ||
      this.check("STRING") ||
      this.check("LEFT_PAREN") ||
      this.check("LEFT_BRACKET") ||
      this.check("TRUE") ||
      this.check("FALSE") ||
      this.check("NONE")
    );
  }

  private parseStmt(): Stmt | null {
    if (this.match("FUNC")) return this.funcDef();
    if (this.match("OBJ")) return this.objDef();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("FOR")) return this.forStatement();
    if (this.match("USE")) return this.useStatement();
    if (this.match("RETURN")) return this.returnStatement();

    if (this.match("PASS") || this.match("NEWLINE")) return null;

    if (this.match("BREAK")) return { type: "Break" };
    if (this.match("CONTINUE")) return { type: "Continue" };

    if (this.match("INDENT")) {
      throw new Error("Unexpected indent: ident at unexpected position");
    } else if (this.match("DEDENT")) {
      throw new Error(
        "Unexpected dedent: found dedeny without corresponding indent",
      );
    }

    return this.expressionStatement();
  }

  private funcDef(): Stmt | null {
    const name = this.consume(
      "IDENTIFIER",
      "Expected identifier after `fn` keyword",
    );
    let parens: boolean = false;
    if (this.match("LEFT_PAREN")) parens = true;

    const args = this.parseArgs(parens);

    this.consume("COLON", "Expected ':'");
    this.consumeMany("NEWLINE", "Expected newline after function definition");
    this.consume("INDENT", "Expected indent after function definition");

    const stmts: Stmt[] = [];

    while (!this.match("DEDENT")) {
      const stmt = this.parseStmt();
      if (stmt) stmts.push(stmt);
    }

    return { type: "FuncDef", name: name.value, args, body: stmts };
  }

  private objDef(): Stmt | null {
    const name = this.consume(
      "IDENTIFIER",
      "Expected identifier after `obj` keyword",
    );

    this.consume("COLON", "Expected ':'");
    this.consumeMany("NEWLINE", "Expected newline after `obj` definition");
    this.consume("INDENT", "Expected indent after `obj` definition");

    const stmts: Stmt[] = [];

    while (!this.match("DEDENT")) {
      const stmt = this.parseStmt();
      if (stmt) stmts.push(stmt);
    }

    return { type: "ObjDef", name: name.value, body: stmts };
  }

  private parseArgs(parens: boolean = false): string[] {
    const args: string[] = [];

    if (!parens && this.check("COLON")) {
      return [];
    } else if (parens && this.check("RIGHT_PAREN")) {
      this.consume("RIGHT_PAREN", "Expected ')'");
      return [];
    }

    while (true) {
      const arg = this.consume("IDENTIFIER", "Expected argument");
      args.push(arg.value);

      if (!this.check("COMMA")) break; // Break loop when no comma found
      this.consume("COMMA", "Expected ','");
    }

    if (parens) this.consume("RIGHT_PAREN", "Expected ')'");

    return args;
  }

  private ifStatement(): Stmt | null {
    const cond = this.expr();
    this.consume("COLON", "Expected ':'");
    this.consumeMany("NEWLINE", "Expected 'NEWLINE'");
    this.consume("INDENT", "Expected 'INDENT'");

    const body: Stmt[] = [];

    while (!this.match("DEDENT")) {
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
    }

    if (this.match("ELSE")) {
      this.consume("COLON", "Expected ':'");
      this.consumeMany("NEWLINE", "Expected 'NEWLINE'");
      this.consume("INDENT", "Expected 'INDENT'");

      const orelse: Stmt[] = [];
      while (!this.match("DEDENT")) {
        const stmt = this.parseStmt();
        if (stmt) orelse.push(stmt);
      }
      return { type: "If", cond, body, orelse };
    } else if (this.match("ELIF")) {
      const if_expr = this.ifStatement();

      if (!if_expr) return null;

      return { type: "If", cond, body, orelse: [if_expr] };
    }

    return { type: "If", cond, body, orelse: [] };
  }

  private whileStatement(): Stmt | null {
    const cond = this.expr();
    this.consume("COLON", "Expected ':'");
    this.consumeMany("NEWLINE", "Expected 'NEWLINE'");
    this.consume("INDENT", "Expected 'INDENT'");

    const body: Stmt[] = [];
    while (!this.match("DEDENT")) {
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
    }
    return { type: "While", cond, body };
  }

  private forStatement(): Stmt | null {
    const target = this.expr();
    if (target.type !== "Name")
      throw new Error("Error: for loop target must be an identifier");
    this.consume("IN", "Expected 'IN'");

    const iter = this.expr();

    this.consume("COLON", "Expected ':'");
    this.consumeMany("NEWLINE", "Expected 'NEWLINE'");
    this.consume("INDENT", "Expected 'INDENT'");

    const body: Stmt[] = [];
    while (!this.match("DEDENT")) {
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
    }
    return { type: "For", target, iter, body };
  }

  private useStatement(): Stmt | null {
    const src = [];
    while (this.check("SUPER") || this.check("IDENTIFIER")) {
      if (!this.match("SUPER")) {
        const s = this.consume("IDENTIFIER", "Expected identifier.");

        src.push(s.value);
      } else {
        src.push("super");
      }

      if (!this.match("DOT")) break;
    }

    this.match("NEWLINE");

    return {
      type: "UseStmt",
      src,
    };
  }

  private returnStatement(): Stmt | null {
    return {
      type: "Return",
      value: this.expr(),
    };
  }

  private expressionStatement(): Stmt | null {
    const expr = this.expr();

    this.match("NEWLINE");

    if (expr.type === "Assign") {
      return { type: "Assign", assign: expr };
    }

    return { type: "Expr", value: expr };
  }

  private expr(): Expr {
    return this.assignExpr();
  }

  private assignExpr(): Expr {
    const left = this.orExpr();

    if (this.match("EQUAL")) {
      if (
        !(
          left.type === "Name" ||
          left.type === "Attr" ||
          left.type === "Subscript"
        )
      ) {
        throw new Error(
          `Invalid assignment target.\n  - expected: Name | Attr | Subscript\n  - received: ${left.type}`,
        );
      }

      const right = this.assignExpr();

      return { type: "Assign", target: left, value: right } as Assign;
    }

    return left;
  }

  private orExpr(): Expr {
    let left = this.andExpr();

    while (this.match("OR")) {
      const right = this.andExpr();
      left = { type: "BoolOp", op: "or", values: [left, right] };
    }

    return left;
  }

  private andExpr(): Expr {
    let left = this.notExpr();

    while (this.match("AND")) {
      const right = this.notExpr();
      left = { type: "BoolOp", op: "and", values: [left, right] };
    }

    return left;
  }

  private notExpr(): Expr {
    if (this.match("NOT")) {
      const expr = this.notExpr();
      return { type: "UnaryOp", op: "not", operand: expr };
    }

    return this.compExpr();
  }

  private compExpr(): Expr {
    const left = this.addExpr();

    const ops = new Array<string>();
    const comparators = new Array<Expr>();

    while (
      this.match(
        "EQUAL_EQUAL",
        "BANG_EQUAL",
        "LESS",
        "LESS_EQUAL",
        "GREATER",
        "GREATER_EQUAL",
      )
    ) {
      switch (this.prev().type) {
        case "EQUAL_EQUAL":
          ops.push("==");
          break;
        case "BANG_EQUAL":
          ops.push("!=");
          break;
        case "LESS":
          ops.push("<");
          break;
        case "LESS_EQUAL":
          ops.push("<=");
          break;
        case "GREATER":
          ops.push(">");
          break;
        case "GREATER_EQUAL":
          ops.push(">=");
          break;
      }
      comparators.push(this.addExpr());
    }

    if (ops.length === 0) return left;

    return { type: "Compare", left, ops, comparators };
  }

  private addExpr(): Expr {
    let left = this.mulExpr();

    while (this.match("PLUS", "MINUS")) {
      const op = this.prev().value as string;
      const right = this.mulExpr();
      left = { type: "BinOp", op, left, right };
    }

    return left;
  }

  private mulExpr(): Expr {
    let left = this.powExpr();

    while (this.match("STAR", "SLASH", "SLASH_SLASH", "PERCENT")) {
      const op = this.prev().value as string;
      const right = this.powExpr();
      left = { type: "BinOp", op, left, right };
    }

    return left;
  }

  private powExpr(): Expr {
    const left = this.unaryExpr();

    if (this.match("POWER")) {
      const right = this.powExpr();
      return { type: "BinOp", op: "**", left, right };
    }

    return left;
  }

  private unaryExpr(): Expr {
    if (this.match("PLUS", "MINUS")) {
      const op = this.prev().value as string;
      const expr = this.unaryExpr();
      return {
        type: "UnaryOp",
        op,
        operand: expr,
      };
    }

    return this.postfixExpr();
  }

  private postfixExpr(): Expr {
    let expr = this.primaryExpr();

    while (
      this.check("LEFT_PAREN") ||
      this.check("LEFT_BRACKET") ||
      this.check("DOT") ||
      this.canStartArg()
    ) {
      if (this.match("LEFT_PAREN")) {
        const args: Expr[] = [];

        while (!this.match("RIGHT_PAREN")) {
          args.push(this.expr());

          if (this.match("RIGHT_PAREN")) {
            break;
          } else if (this.match("COMMA")) {
            continue;
          } else {
            throw new Error("Expected ',' or ')'");
          }
        }

        expr = { type: "Call", func: expr, args };
      } else if (this.match("LEFT_BRACKET")) {
        const key = this.expr();
        this.consume("RIGHT_BRACKET", "Unclosed delimiter '[', expected ']'");
        expr = { type: "Subscript", collection: expr, key };
      } else if (this.canStartArg()) {
        const args: Expr[] = [];
        do {
          args.push(this.expr());
        } while (this.match("COMMA"));
        expr = { type: "Call", func: expr, args };
      } else if (this.match("DOT")) {
        const attr = this.consume("IDENTIFIER", "Expected attribute name");

        expr = {
          type: "Attr",
          target: expr,
          attr: { type: "Name", id: attr.value as string },
        };
      }
    }

    return expr;
  }

  private primaryExpr(): Expr {
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE", "NONE")) {
      switch (this.prev().type) {
        case "TRUE":
          return { type: "Constant", value: true };
        case "FALSE":
          return { type: "Constant", value: false };
        case "NONE":
          return { type: "Constant", value: null };
        case "NUMBER":
          return { type: "Constant", value: Number(this.prev().value) };
        case "STRING":
          return { type: "Constant", value: this.prev().value };
      }
    } else if (this.match("IDENTIFIER")) {
      return { type: "Name", id: this.prev().value as string };
    } else if (this.match("LEFT_PAREN")) {
      const expr = this.expr();
      this.consume("RIGHT_PAREN", "Unclosed delimiter '(', expected ')'");
      return expr;
    } else if (this.match("LEFT_BRACE")) {
      const keys: Expr[] = [];
      const values: Expr[] = [];
      while (!this.match("RIGHT_BRACE")) {
        const key = this.expr();
        this.consume("COLON", "Expected ':' after key in dictionary");
        const value = this.expr();
        keys.push(key);
        values.push(value);
      }
      return { type: "Dict", keys, values };
    } else if (this.match("LEFT_BRACKET")) {
      const elts: Expr[] = [];
      while (true) {
        if (this.match("RIGHT_BRACKET")) break;
        elts.push(this.expr());
        if (this.match("RIGHT_BRACKET")) break;
        this.consume("COMMA", "Expected ',' or ']' after element in list");
      }
      return { type: "List", elts };
    }

    throw new Error("Expected primary expression, got " + this.peek().type);
  }
}

export default Parser;
