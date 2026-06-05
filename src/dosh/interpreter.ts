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
import { BreakSignal, ContinueSignal, ReturnSignal } from "./signal.ts";
import type {
  AssignStmt,
  ExprStmt,
  ForStmt,
  FuncDef,
  IfStmt,
  Module,
  ReturnStmt,
  Stmt,
  WhileStmt,
} from "./stmt";
import { typeOf, type Value } from "./value.ts";

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
      const out = this._global.get("_out") as Value[];
      this._global.assign("_out", [...out, s]);
      return s;
    };
    this._global.assign(
      "print",
      new Func(
        "print",
        ["...args"],
        { type: "Module", body: [] },
        this._global,
      ),
    );

    //range is only builtin to allow function overloading
    this._builtins["range"] = (args: Value[]) => {
      if (args.length < 1 || args.length > 3)
        throw new Error(
          "range requires at least 1 and at most 3 arguments, got " +
            args.length,
        );

      if (args.length === 1 && typeof args[0] === "number") {
        if (!Number.isInteger(args[0]))
          throw new Error(
            "range: argument must be an integer. expected: number, received: " +
              args[0],
          );
        return Array.from({ length: args[0] as number }, (_, index) => index);
      } else if (args.length === 2 || args.length === 3) {
        const start = args[0];
        const end = args[1];
        const step = args[2] ?? 1;
        if (
          typeof start !== "number" ||
          typeof end !== "number" ||
          typeof step !== "number"
        )
          throw new Error(
            "range: all arguments must be numbers, " +
              args.map((arg) => typeof arg).join(", "),
          );
        if (step === 0) throw new Error("range: step must not be zero");
        return Array.from(
          { length: Math.ceil((end - start) / step) },
          (_, index) => start + index * step,
        );
      } else {
        throw new Error(
          "range: Invalid arguments provided\nexpects:\n - length: number\n - start: number, end: number # default step: 1\n - start: number, end: number, step: number",
        );
      }
    };

    this._global.assign(
      "range",
      new Func(
        "range",
        ["length", "start", "step"],
        { type: "Module", body: [] },
        this._global,
      ),
    );

    this._builtins["join"] = (args: Value[]) => {
      if (args.length !== 2 || args[0] === null || args[1] === null)
        throw new Error("join: expects two arguments");

      const type1 = typeOf(args[0]);
      const type2 = typeOf(args[1]);
      switch (type1) {
        case "string": {
          const str = args[0] as string;
          if (type2 === "string") {
            const x = args[1] as string;
            return str + x;
          } else {
            const num = this.stringify(args[1]);
            return str + num;
          }
        }
        case "array": {
          const arr = args[0] as Value[];
          const newArr = [...arr, args[1]];
          return newArr;
        }
      }

      return null;
    };

    this._global.assign(
      "join",
      new Func("join", ["xs", "x"], { type: "Module", body: [] }, this._global),
    );
  }

  eval(ast: Module): Value {
    let value: Value = null;
    for (const stmt of ast.body) {
      value = this.evalStmt(stmt);
    }
    return value;
  }

  private evalStmt(stmt: Stmt): Value | null {
    switch (stmt.type) {
      case "Expr": {
        const expr = stmt as ExprStmt;
        const val = this.evalExpr(expr.value);

        if (!(val instanceof Func)) {
          return val;
        }

        if (val && val instanceof Func && val.args.length === 0) {
          this.local = new Environment(this.local);
          val.activate(this.local);
          val.assign([]);
          try {
            return this.eval(val.body);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              return e.value;
            } else {
              throw e;
            }
          } finally {
            this.local = this.local.pop();
          }
        }

        return val;
      }
      case "Assign": {
        const assign = stmt as AssignStmt;
        const name = assign.assign.target.id;
        const value = this.evalExpr(assign.assign.value);
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
      case "While": {
        const whilestmt = stmt as WhileStmt;
        let cond = this.evalExpr(whilestmt.cond);
        w: while (cond) {
          for (const stmt of whilestmt.body) {
            try {
              this.evalStmt(stmt);
            } catch (e) {
              if (e instanceof BreakSignal) break w;
              if (e instanceof ContinueSignal) continue w;

              throw e;
            }
          }
          cond = this.evalExpr(whilestmt.cond);
        }
        return null;
      }
      case "For": {
        const forstmt = stmt as ForStmt;
        const iter = this.evalExpr(forstmt.iter);
        if (!(iter instanceof Array)) {
          throw new Error("For loop iter must be an array");
        }
        f: for (const i of iter) {
          this.local.assign(forstmt.target.id, i);
          for (const stmt of forstmt.body) {
            try {
              this.evalStmt(stmt);
            } catch (e) {
              if (e instanceof BreakSignal) break f;
              else if (e instanceof ContinueSignal) continue f;

              throw e;
            }
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
          const value = ret.value ? this.evalExpr(ret.value) : null;

          throw new ReturnSignal(value);
        }
        break;
      case "Break":
        throw new BreakSignal();
      case "Continue":
        throw new ContinueSignal();
    }
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
      throw new Error(`Call: func must be a function, got ${func}`);
    }

    const args = expr.args.map((arg) => this.evalExpr(arg));

    if (func.id in this._builtins) {
      return this._builtins[func.id](args);
    }

    this.local = new Environment(this.local);
    func.activate(this.local);
    func.assign(args);
    try {
      return this.eval(func.body);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        return e.value;
      } else {
        throw e;
      }
    } finally {
      this.local = this.local.pop();
    }
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

  // END LOGIC ==================================================================================

  // BEGIN OUTPUT ===============================================================================

  private stringify(val: Value): string {
    if (typeof val === "string") return val;
    if (typeof val === "number") return val.toString();
    if (typeof val === "boolean") return val ? "True" : "False";
    if (val === null) return "None";
    if (Array.isArray(val))
      return `[${val.map((v) => this.stringify(v)).join(", ")}]`;
    return val.toString();
  }

  debug() {
    const out = this._global.get("_out") as Value[];
    out.forEach((v) => console.log(v));
  }

  results(): string[] {
    const out = this.local.get("_out") as Value[];
    return out.map((v) => this.stringify(v));
  }
}

export default Interpreter;
