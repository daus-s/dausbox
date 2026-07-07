import Func from "./func.ts";
import { Obj, ObjDef } from "./object.ts";

export type Value =
  | number
  | string
  | boolean
  | null
  | Value[]
  | Map<Value, Value>
  | Func
  | ObjDef
  | Obj;

export function typeOf(value: Value): string {
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
      if (value instanceof Obj) return "obj";
      if (value instanceof ObjDef) return "objdef";
      throw new Error("Unknown object type.");
    default:
      throw new Error("Unknown value type.");
  }
}
