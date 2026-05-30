import Environment from "./environment.ts";
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
import Func from "./func.ts";
import type {
  AssignStmt,
  ForStmt,
  FuncDef,
  IfStmt,
  Module,
  ReturnStmt,
  Stmt,
} from "./stmt";
import type { Value } from "./value";

class Interpreter {
  private _global: Environment;
  private local: Environment;

  private _builtins: Record<string, (args: Value[]) => Value> = {};

  constructor() {
    this._global = new Environment();
    this._global.assign("_out", [] as Value[]);
    this.registerBuiltins();
    this.local = this._global;
  }

  private registerBuiltins() {
    this._builtins["print"] = (args: Value[]) => {
      const s = args.map((arg) => this.stringify(arg)).join(", ");
      const out = this.local.get("_out") as Value[];
      this.local.assign("_out", [...out, s]);
      return s;
    };
    this._global.assign(
      "print",
      new Func("print", [], { type: "Module", body: [] }, this._global),
    );
  }

  eval(ast: Module) {
    for (const stmt of ast.body) {
      this.evalStmt(stmt);
    }
  }

  debug() {
    const out = this.local.get("_out") as Value[];
    out.forEach((v) => console.log(v));
  }

  private evalStmt(stmt: Stmt): Value | null {
    switch (stmt.type) {
      case "Expr":
        return this.evalExpr(stmt.value);
      case "Assign": {
        const assign = stmt as AssignStmt;
        const name = assign.expr.target.id;
        const value = this.evalExpr(assign.expr.value);
        this.local.assign(name, value);
        return value;
      }
      case "If": {
        const ifstmt = stmt as IfStmt;
        const cond = this.evalExpr(ifstmt.cond);
        let value: Value = null;
        if (cond) {
          for (const stmt of ifstmt.body) {
            value = this.evalStmt(stmt);
          }
        } else {
          for (const stmt of ifstmt.orelse) {
            value = this.evalStmt(stmt);
          }
        }
        return value;
      }
      case "While":
        break;
      case "For": {
        const forstmt = stmt as ForStmt;
        const iter = this.evalExpr(forstmt.iter);
        if (!(iter instanceof Array)) {
          throw new Error("For loop iter must be an array");
        }
        for (const val of iter) {
          this.local.assign(forstmt.target.id, val);
          for (const stmt of forstmt.body) {
            this.evalStmt(stmt);
          }
        }
        return null;
      }
      case "FuncDef": {
        const func = stmt as FuncDef;
        this.local.assign(
          func.name,
          new Func(
            func.name,
            func.args,
            { type: "Module", body: func.body },
            new Environment(this.local),
          ),
        );
        return null;
      }
      case "Return":
        {
          const ret = stmt as ReturnStmt;
          return ret.value ? this.evalExpr(ret.value) : null;
        }
        break;
      case "Break":
        break;
      case "Continue":
        break;
    }
    return null;
  }

  private evalExpr(expr: Expr): Value {
    switch (expr.type) {
      case "Constant":
        return expr.value;
      case "Name":
        return this.local.get(expr.id);
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

    if (!(func instanceof Func)) {
      throw new Error("Call: func must be a function");
    }

    const args = expr.args.map((arg) => this.evalExpr(arg));

    if (func.id in this._builtins) {
      return this._builtins[func.id](args);
    }

    this.local = new Environment(this.local);
    func.activate(this.local);
    func.assign(args);
    let value: Value = null;
    for (const stmt of func.stmts()) {
      const result = this.evalStmt(stmt);
      value = result;
    }

    return value;
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

  private stringify(val: Value): string {
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    if (typeof val === "boolean") return val ? "True" : "False";
    if (val === null) return "None";
    if (Array.isArray(val))
      return `[${val.map((v) => this.stringify(v)).join(", ")}]`;
    return val.toString();
  }

  results(): string[] {
    const out = this.local.get("_out") as Value[];
    return out.map((v) => this.stringify(v));
  }
}

export default Interpreter;
