import Environment from "./environment";
import type {
  BinOp,
  BoolOp,
  Call,
  Compare,
  DictLiteral,
  Expr,
  ListLiteral,
  Subscript,
  UnaryOp,
} from "./expr";
import type { Module, Stmt } from "./stmt";
import type { Value } from "./value";

class Interpreter {
  private global: Environment;
  private local: Environment;
  private output: string[] = [];

  constructor() {
    this.global = new Environment();
  }

  eval(ast: Module) {
    for (const stmt of ast.body) {
      this.evalStmt(stmt);
    }
  }

  private evalStmt(stmt: Stmt) {
    switch (stmt.type) {
      case "Expr":
        this.evalExpr(stmt.value);
        break;
      case "Assign":
        break;
      case "If":
        break;
      case "While":
        break;
      case "For":
        break;
      case "FuncDef":
        break;
      case "Return":
        break;
      case "Break":
        break;
      case "Continue":
        break;
    }
  }

  private evalExpr(expr: Expr): Value {
    switch (expr.type) {
      case "Constant":
        return expr.value;
      case "Name":
        return this.global.get(expr.id);
      case "Assign": {
        const value = this.evalExpr(expr.value);
        this.local.assign(expr.target.id, value);
        return value;
      }
      case "BinOp":
        return this.evalBinOpExpr(expr);
      case "UnaryOp":
        return this.evalUnaryOpExpr(expr);
      case "Compare":
        return this.evalCompareExpr(expr);
      case "BoolOp":
        return this.evalBoolOpExpr(expr);
      case "Call":
        return this.evalCallExpr(expr);
      case "Subscript":
        return this.evalSubscriptExpr(expr);
      case "List": {
        const list = expr as ListLiteral;
        return list.elts.map((elt) => this.evalExpr(elt));
      }
      case "Dict": {
        const dict = expr as DictLiteral;
        return new Map(
          dict.keys.map((key, i) => [
            this.evalExpr(key),
            this.evalExpr(dict.values[i]),
          ]),
        );
      }
    }
  }

  private evalBinOpExpr(expr: BinOp): Value {
    const left = this.evalExpr(expr.left);
    const right = this.evalExpr(expr.right);

    if (typeof left !== "number" || typeof right !== "number") {
      throw new Error("BinOp: left and right must be numbers");
    }

    switch (expr.op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "//":
        return Math.floor(left / right);
      case "**":
        return Math.pow(left, right);
      default:
        throw new Error(`Unknown BinOp operator: ${expr.op}`);
    }
  }

  private evalUnaryOpExpr(expr: UnaryOp): Value {
    const operand = this.evalExpr(expr.operand);

    switch (expr.op) {
      case "-":
        if (typeof operand !== "number") {
          throw new Error("UnaryOp (-): operand must be a number");
        }
        return -operand;
      case "+":
        if (typeof operand !== "number") {
          throw new Error("UnaryOp (+): operand must be a number");
        }
        return operand;
      case "not":
        if (typeof operand !== "boolean") {
          throw new Error("UnaryOp (not): operand must be a boolean");
        }
        return !operand;
      default:
        throw new Error(`Unknown UnaryOp: ${expr.op}`);
    }
  }

  private evalCompareExpr(expr: Compare): Value {
    const val = this.evalExpr(expr.left);
    if (expr.ops.length !== expr.comparators.length) {
      throw new Error("Compare: ops and comparators must have the same length");
    }

    let result: boolean = false;
    for (const [op, right] of expr.ops.map(
      (op, i) => [op, expr.comparators[i]] as [string, Expr],
    )) {
      const comp = this.evalExpr(right);
      switch (op) {
        case "==":
          if (typeof val !== typeof comp) {
            return false;
          }

          result = val === comp;
          break;
        case "!=":
          if (typeof val !== typeof comp) {
            return true;
          }

          result = val !== comp;
          break;
        case "<":
          if (typeof val !== "number" || typeof comp !== "number") {
            throw new Error("CompareOp (<): operands must be numbers");
          }

          result = val < comp;
          break;
        case "<=":
          if (typeof val !== "number" || typeof comp !== "number") {
            throw new Error("CompareOp (<=): operands must be numbers");
          }

          result = val <= comp;
          break;
        case ">":
          if (typeof val !== "number" || typeof comp !== "number") {
            throw new Error("CompareOp (>): operands must be numbers");
          }

          result = val > comp;
          break;
        case ">=":
          if (typeof val !== "number" || typeof comp !== "number") {
            throw new Error("CompareOp (>=): operands must be numbers");
          }

          result = val >= comp;
          break;
        default:
          throw new Error(`Unknown CompareOp: ${op}`);
      }
    }

    return result;
  }

  private evalBoolOpExpr(expr: BoolOp): Value {
    if (!(expr.op === "and" || expr.op === "or")) {
      throw new Error(`Unknown BoolOp: ${expr.op}`);
    }

    for (const value of expr.values) {
      const val = this.evalExpr(value);
      if (typeof val !== "boolean")
        throw new Error("BoolOp: values must be booleans");

      switch (expr.op) {
        case "and":
          if (!val) return false;
          break;
        case "or":
          if (val) return true;
          break;
      }
    }
    switch (expr.op) {
      case "and":
        return true;
      case "or":
        return false;
    }
  }

  private evalCallExpr(expr: Call): Value {
    const func = this.evalExpr(expr.func);
    if (typeof func !== "function") {
      throw new Error("Call: func must be a function");
    }

    const args = expr.args.map((arg) => this.evalExpr(arg));
    return func(...args);
  }

  private evalSubscriptExpr(expr: Subscript): Value {
    const val = this.evalExpr(expr.value);
    const index = this.evalExpr(expr.slice);
    if (!Array.isArray(val)) {
      throw new Error("Subscript: val must be an array");
    }
    if (typeof index !== "number") {
      throw new Error("Subscript: index must be a number");
    }
    return val[index];
  }
}

export default Interpreter;
