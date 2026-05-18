import type { Assign, Expr } from "./expr";
import type { Module, Stmt } from "./stmt";
import type { Token } from "./token";

class Parser {
  private tokens: Token[];
  private idx: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Module {
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
    if (this.check(type)) return this.step();
    throw new Error(message);
  }

  private isDone() {
    return this.idx >= this.tokens.length || this.peek().type === "EOF";
  }

  private parseStmt(): Stmt | null {
    if (this.match("DEF")) return this.funcDef();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("FOR")) return this.forStatement();
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("BREAK")) return this.breakStatement();
    if (this.match("CONTINUE")) return this.continueStatement();

    return this.expressionStatement();
  }

  private funcDef(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private ifStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private whileStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private forStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private returnStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private breakStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private continueStatement(): Stmt | null {
    throw new Error("Method not implemented.");
  }

  private expressionStatement(): Stmt | null {
    const expr = this.expr();

    if (expr.type === "BinOp" && expr.op === "=") {
      if (expr.left.type !== "Name")
        throw new Error("Invalid assignment target.");
      return { type: "Assign", target: expr.left, value: expr.right };
    }

    if (this.match("NEWLINE")) this.step();

    return { type: "Expr", value: expr };
  }

  private expr(): Expr {
    return this.assignExpr();
  }

  private assignExpr(): Expr {
    const left = this.orExpr();

    if (this.match("EQUAL")) {
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
    const expr = this.primaryExpr();

    while (this.match("LEFT_PAREN", "LEFT_BRACKET")) {
      if (this.match("LEFT_PAREN")) {
        const args: Expr[] = [];

        while (!this.match("RIGHT_PAREN")) {
          args.push(this.expr());
        }

        return { type: "Call", func: expr, args };
      } else if (this.match("LEFT_BRACKET")) {
        const index = this.expr();
        this.consume("RIGHT_BRACKET", "Unclosed delimiter '[', expected ']'");
        return { type: "Subscript", value: expr, slice: index };
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
        elts.push(this.expr());

        if (this.match("RIGHT_BRACKET")) break;

        this.consume("COMMA", "Expected ',' or ']' after element in list");
      }
      return { type: "List", elts };
    }

    throw new Error("Expected primary expression");
  }
}

export default Parser;
