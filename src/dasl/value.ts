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
