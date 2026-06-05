import Func from "./func.ts";

export type Value =
  | number
  | string
  | boolean
  | null
  | Value[]
  | Map<Value, Value>
  | Func;

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
      return "object";
    default:
      return "unknown";
  }
}
