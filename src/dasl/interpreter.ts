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
} from "./expr.ts";
import type {
  AssignStmt,
  ExprStmt,
  ForStmt,
  FuncDef,
  IfStmt,
  Module,
  ObjStmt,
  ReturnStmt,
  Stmt,
  UseStmt,
  WhileStmt,
} from "./stmt.ts";

import { type Value } from "./value.ts";
import Environment from "./environment.ts";
import Func from "./func.ts";
import { Obj, ObjDef } from "./object.ts";

import { BreakSignal, ContinueSignal, ReturnSignal } from "./signal.ts";

type Resolver = (src: string[]) => Module;

class Interpreter {
  private useResolver: Resolver | null = null;

  private global: Environment;
  private local: Environment;

  private _builtins: Record<string, (args: Value[]) => Value> = {};

  constructor() {
    this.global = new Environment();
    this.global.assign("_out", [] as Value[]);
    this.registerBuiltins();
    this.local = this.global;
  }

  register(name: string, args: string[], func: (args: Value[]) => Value) {
    //this allows functions with side effects outside of dasl
    this._builtins[name] = func;
    this.global.assign(
      name,
      new Func(name, args, { type: "Module", body: [] }, this.global),
    );
  }

  private registerBuiltins() {
    this.register("print", ["...args"], (args: Value[]) => {
      const _str = this.global.get("_str");
      if (!(_str instanceof Func))
        throw new Error("builtin _str is not recognized as a function");
      const s = args
        .map((arg) => {
          return this._str(arg);
        })
        .join(", ");
      const out = this.global.get("_out") as Value[];
      this.global.assign("_out", [...out, s]);
      return null;
    });

    this.register("flush", [], (args: Value[]) => {
      if (args.length > 0)
        throw new Error(`flush: takes no arguments, ${args.length} provided. `);

      const out = this.global.get("_out") as string[];
      const last = out[out.length - 1] ?? null;

      this.global.assign("_out", out.slice(0, -1));

      return last;
    });

    //range is only builtin to allow function overloading
    this.register("range", ["length", "start", "step"], (args: Value[]) => {
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
    });

    this.register("append", ["xs", "x"], (args: Value[]) => {
      if (args.length !== 2)
        throw new Error("append: expects 2 arguments, got: " + args.length);
      const type1 = this._type(args[0]);
      const type2 = this._type(args[1]);
      switch (type1) {
        case "string": {
          const str = args[0] as string;
          if (type2 === "string") {
            return (str + args[1]) as string;
          } else {
            return str + this._str(args[1]);
          }
        }
        case "array": {
          const arr = args[0] as Value[];
          const newArr = [...arr, args[1]];
          return newArr;
        }
      }
      throw new Error(
        `append: expected args:\n - string, any\n - array, any\n received:\n - ${type1}, ${type2}`,
      );
    });

    this.register("_type", ["x"], (args: Value[]) => {
      if (args.length !== 1)
        throw new Error("_type: expects one argument, got: " + args.length);
      return this._type(args[0]);
    });

    this.register("_str", ["x"], (args: Value[]) => {
      if (args.length !== 1)
        throw new Error("_str: expects one argument, got: " + args.length);
      return this._str(args[0]);
    });

    this.register("_millis", [], (args: Value[]) => {
      if (args.length !== 0)
        throw new Error("_millis: expects no arguments, got: " + args.length);
      return Date.now() as number;
    });
  }

  setResolver(resolver: Resolver) {
    this.useResolver = resolver;
  }

  private resolve(src: string[]): Module {
    if (!this.useResolver)
      throw new Error("tried to resolve use without defined resolver");

    return this.useResolver(src);
  }

  eval(ast: Module): Value {
    let value: Value = null;
    for (const stmt of ast.body) {
      value = this.evalStmt(stmt);
    }
    return value;
  }

  private evalStmt(stmt: Stmt): Value {
    switch (stmt.type) {
      case "Expr": {
        const expr = stmt as ExprStmt;
        const val = this.evalExpr(expr.value);

        if (val instanceof Func) {
          const func: Func = val;

          if (func.id in this._builtins) {
            return this._builtins[func.id]([]);
          }

          if (expr.value.type === "Attr") {
            const inst = this.evalExpr(expr.value.target);

            if (!(inst instanceof Obj))
              throw new Error(
                "invalid method call, expected Object, got " + this._type(inst),
              );

            return this.callMethod(func, inst, []);
          }

          return this.callFunc(func, []);
        }

        return val;
      }
      case "Assign": {
        const assign = (stmt as AssignStmt).assign;

        switch (assign.target.type) {
          case "Name": {
            const name = assign.target.id;
            const value = this.evalExpr(assign.value);
            this.local.assign(name, value);
            return value;
          }
          case "Attr": {
            const obj = this.evalExpr(assign.target.target);

            if (!(obj instanceof Obj)) {
              throw new Error(`Invalid target type: ${assign.target.type}`);
            }

            const name = assign.target.attr.id;
            const value = this.evalExpr(assign.value);

            obj.assign(name, value);

            return value;
          }
          case "Subscript": {
            const collection = this.evalExpr(assign.target.collection);
            const key = this.evalExpr(assign.target.key);

            if (this._type(collection) === "array") {
              const arr = collection as Value[];

              if (typeof key !== "number")
                throw new Error(
                  `Cannot index array with ${this._type(key)} (expected number)`,
                );

              const index = key as number;

              if (index < 0 || index > arr.length - 1)
                throw new Error(
                  `Index out of bounds: length: ${arr.length}, accepts [0, ${arr.length - 1}], got: ${index}`,
                );

              arr[index] = this.evalExpr(assign.value);
              return arr[index];
            } else if (this._type(collection) === "map") {
              const map = collection as Map<Value, Value>;

              map.set(key, this.evalExpr(assign.value));

              return map.get(key) ?? null;
            } else {
              throw new Error(
                `object is not known to be subscriptable. got: ${this._type(collection)}`,
              );
            }
          }
          default:
            throw new Error(`Invalid target type: ${assign.target}`);
        }
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
      case "ObjDef": {
        const obj = stmt as ObjStmt;

        const env = new Environment(this.local);

        const name = obj.name;
        const body = obj.body;

        this.local = env;
        for (const stmt of body) {
          switch (stmt.type) {
            case "Expr": {
              const type = stmt.value.type;
              if (type !== "Name") {
                throw new Error(`Expected field to be a Name, got: ${type}`);
              }
              env.assign(stmt.value.id, null);
              break;
            }
            case "Assign":
            case "FuncDef":
            case "ObjDef":
              this.evalStmt(stmt);
              break;

            default:
              throw new Error(
                `Unexpected statement type in Object definition. expected: Expr | Assign | FuncDef | ObjDef got: ${stmt.type}`,
              );
          }
        }

        if (!env.has("_init")) {
          const fields = env.entries().filter((e) => !(e[1] instanceof Func));

          const initFunc = new Func(
            "_init",
            fields.map(([name]) => name),
            {
              type: "Module",
              body: fields.map(([name]) => ({
                type: "Assign",
                assign: {
                  type: "Assign",
                  target: {
                    type: "Attr",
                    target: { type: "Name", id: "self" },
                    attr: { type: "Name", id: name },
                  },
                  value: { type: "Name", id: name },
                },
              })),
            },
            env,
          );
          env.assign("_init", initFunc);
        }

        this.local = this.local.pop();
        this.local.assign(name, new ObjDef(name, env));

        return null;
      }
      case "UseStmt": {
        const use = stmt as UseStmt;

        const ast = this.resolve(use.src);

        const moddef = new ObjDef("module", new Environment(this.global));
        const mod = new Obj(moddef);
        mod.assign("_name", use.src[use.src.length - 1]);

        const saved = this.local;

        this.local = mod.env;

        this.eval(ast);

        this.local = saved;

        this.local.assign(use.src[use.src.length - 1], mod);

        return null;
      }
      case "Return": {
        const ret = stmt as ReturnStmt;
        const value = ret.value ? this.evalExpr(ret.value) : null;

        throw new ReturnSignal(value);
      }
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
        const target = expr.target;

        switch (target.type) {
          case "Attr": {
            const obj = this.evalExpr(target.target);

            if (!(obj instanceof Obj))
              throw new Error("Invalid attribute target: " + this._type(obj));

            obj.assign(target.attr.id, value);

            return value;
          }
          case "Name":
            this.local.assign(target.id, value);
            return value;
          case "Subscript": {
            const collection = this.evalExpr(target.collection);
            const key = this.evalExpr(target.key);

            if (this._type(collection) === "array") {
              const arr = collection as Value[];

              if (typeof key !== "number")
                throw new Error(
                  `Cannot index array with ${this._type(key)} (expected number)`,
                );

              const index = key as number;

              if (index < 0 || index > arr.length - 1)
                throw new Error(
                  `Index out of bounds: length: ${arr.length}, accepts [0, ${arr.length - 1}], got: ${index}`,
                );

              arr[index] = value;
              return value;
            } else if (this._type(collection) === "map") {
              const map = collection as Map<Value, Value>;

              map.set(key, value);
              return value;
            } else {
              throw new Error(
                `object is not known to be subscriptable. got: ${this._type(collection)}`,
              );
            }
          }
          default:
            throw new Error(
              `Invalid target type, cannot assign to ${target.type}`,
            );
        }
      }
      case "Attr": {
        const target = this.evalExpr(expr.target);

        if (expr.attr.id === "len") {
          if (this._type(target) === "string") {
            return (target as string).length;
          } else if (this._type(target) === "array") {
            return (target as Value[]).length;
          } else {
            throw new Error("Invalid attribute target: " + this._type(target));
          }
        }

        if (!(target instanceof Obj))
          throw new Error("Invalid attribute target: " + this._type(target));

        if (expr.attr.id === "_str") {
          return this._str(target);
        }

        const value = target.access(expr.attr.id);

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

    if (expr.op === "+") {
      if (typeof left === "string" && typeof right === "string") {
        return left + right;
      } else if (typeof left === "number" && typeof right === "number") {
        return left + right;
      } else {
        throw new Error(
          `adding is only defined for string, string and number, number addition. got ${this._type(left)} and ${this._type(right)}.`,
        );
      }
    }

    if (typeof left !== "number" || typeof right !== "number") {
      throw new Error(
        `cannot perform operation on ${this._type(left)} and ${this._type(right)}.`,
      );
    }

    switch (expr.op) {
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
    let left = this.evalExpr(expr.left);
    if (expr.ops.length !== expr.comparators.length) {
      throw new Error("Compare: ops and comparators must have the same length");
    }

    for (const [op, comp] of expr.ops.map(
      (op, i) => [op, expr.comparators[i]] as [string, Expr],
    )) {
      const right = this.evalExpr(comp);
      if (!this.compare(left, op, right)) return false;

      left = right;
    }
    return true;
  }

  private compare(left: Value, op: string, right: Value): boolean {
    switch (op) {
      case "==":
        if (typeof left !== typeof right) {
          return false;
        }

        if (Array.isArray(left) && Array.isArray(right)) {
          if (left.length !== right.length) return false;

          let equal = true;
          for (let i = 0; i < left.length; i++) {
            equal &&= this.compare(left[i], "==", right[i]);
          }
          return equal;
        }

        return left === right;
      case "!=":
        return !this.compare(left, "==", right);
      case "<":
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error("CompareOp (<): operands must be numbers");
        }

        return left < right;
      case "<=":
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error("CompareOp (<=): operands must be numbers");
        }

        return left <= right;
      case ">":
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error("CompareOp (>): operands must be numbers");
        }

        return left > right;
      case ">=":
        if (typeof left !== "number" || typeof right !== "number") {
          throw new Error("CompareOp (>=): operands must be numbers");
        }

        return left >= right;
      default:
        throw new Error(`Unknown CompareOp: ${op}`);
    }
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
    const callee = this.evalExpr(expr.func);

    if (!(callee instanceof Func) && !(callee instanceof ObjDef)) {
      throw new Error(
        `Call: func must be a function, got ${this._type(callee)}`,
      );
    }

    const args = expr.args.map((arg) => this.evalExpr(arg));

    if (callee instanceof Func) {
      const func = callee as Func;

      if (func.id in this._builtins) {
        return this._builtins[func.id](args);
      }

      if (expr.func.type === "Attr") {
        const inst = this.evalExpr(expr.func.target);

        if (!(inst instanceof Obj))
          throw new Error("Invalid attribute target.");

        return this.callMethod(func, inst, args);
      } else {
        return this.callFunc(func, args);
      }
    } else if (callee instanceof ObjDef) {
      return this.callConstructor(callee, args);
    }

    throw new Error("can only call objects of type Func or constructors");
  }

  private callFunc(func: Func, args: Value[]): Value {
    const prevLocal = this.local;
    this.local = new Environment(func.closure);

    func.apply(this.local, args);

    try {
      return this.eval(func.body);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      else throw e;
    } finally {
      this.local = prevLocal;
    }
  }

  private callMethod(func: Func, inst: Obj, args: Value[]): Value {
    const prevLocal = this.local;
    const callEnv = new Environment(func.closure);

    this.local = callEnv;
    this.local.assign("self", inst);

    func.apply(callEnv, args);

    try {
      return this.eval(func.body);
    } catch (sig) {
      if (sig instanceof ReturnSignal) return sig.value;
      else throw sig;
    } finally {
      this.local = prevLocal;
    }
  }

  private callConstructor(def: ObjDef, args: Value[]): Value {
    const obj = new Obj(def);
    const initFunc = def.init();

    if (!(initFunc instanceof Func)) {
      throw new Error("ObjDef: _init must be a Func");
    }

    this.callMethod(initFunc, obj, args);
    return obj;
  }

  private evalSubscriptExpr(expr: Subscript): Value {
    const val = this.evalExpr(expr.collection);
    const index = this.evalExpr(expr.key);

    if (val instanceof Map) {
      return val.get(index) || null;
    }

    if (val instanceof Array || typeof val === "string") {
      if (typeof index !== "number") {
        throw new Error("Subscript: index must be a number");
      }

      if (index < 0 || index >= val.length) {
        throw new Error(
          `Index out of bounds: length: ${val.length}, accepts [0, ${val.length - 1}], got: ${index}`,
        );
      } else {
        return val[index];
      }
    }
    throw new Error(`Subscript: ${this._type(val)} is not subscriptable`);
  }

  // END LOGIC ==================================================================================

  // BEGIN OUTPUT ===============================================================================

  debug() {
    const out = this.global.get("_out") as Value[];
    console.log("OUT");
    out.forEach((v) => console.log(v));

    console.log("STATE");
    this.local.debug();
  }

  output(): string[] {
    const out = this.global.get("_out") as Value[];
    return out.map((v) => this._str(v) as string);
  }

  _str(value: Value): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value === null) return "null";
    if (typeof value === "object") {
      if (Array.isArray(value))
        return `[${value.map((v) => this._str(v)).join(", ")}]`;
      if (value instanceof Map) {
        return `{${[...value.entries()].map(([k, v]) => `${this._str(k)}: ${this._str(v)}`).join(", ")}}`;
      }
      if (value instanceof Func) {
        return `${value.id}(${value.args.join(", ")})`;
      }
      if (value instanceof ObjDef) {
        return value.name;
      }
      if (value instanceof Obj) {
        if (value.attrs.includes("_str")) {
          const f = value.access("_str");
          if (f instanceof Func && f.args.length === 0) {
            const res = this.callMethod(f, value, []);
            return typeof res === "string" ? res : "null";
          }
        } else {
          const lines: string[] = [];

          lines.push(value._type + ":");
          value.env.entries().forEach(([k, v]) => {
            if (typeof v === "string") {
              v = `"${v}"`;
            }

            lines.push(`${k}: ${this._str(v)}`);
          });
          lines.push("::");

          const ind = "  ";
          let d = 0;

          const s = lines
            .map((line) => {
              const sublines = line.split("\n");
              const reconstructed: string[] = [];

              for (const subline of sublines) {
                if (subline.endsWith("::")) {
                  d -= 1;
                  reconstructed.push(ind.repeat(d) + subline);
                } else if (subline.endsWith(":")) {
                  d += 1;
                  reconstructed.push(ind.repeat(d - 1) + subline);
                } else {
                  reconstructed.push(ind.repeat(d) + subline);
                }
              }

              return reconstructed.join("\n");
            })
            .join("\n");
          return s;
        }
      }
      throw new Error("Unknown object type.");
    }
    throw new Error("Unknown value type.");
  }

  _type(value: Value): string {
    switch (typeof value) {
      case "number":
        return "number";
      case "string":
        return "string";
      case "boolean":
        return "boolean";
      case "object":
        if (value === null) return "null";
        if (Array.isArray(value)) return "array";
        if (value instanceof Map) return "map";
        if (value instanceof Func) return "func";
        if (value instanceof Obj) return value._type;
        if (value instanceof ObjDef) return "objdef";
        throw new Error("Unknown object type.");
      default:
        throw new Error("Unknown value type.");
    }
  }
}

export default Interpreter;
