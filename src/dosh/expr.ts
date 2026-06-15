export type Expr =
  | Constant
  | Name
  | Assign
  | Attr
  | BinOp
  | UnaryOp
  | Compare
  | BoolOp
  | Call
  | Subscript
  | ListLiteral
  | DictLiteral;

export interface Constant {
  type: "Constant";
  value: number | string | boolean | null;
}

export interface Name {
  type: "Name";
  id: string;
}

export interface Assign {
  type: "Assign";
  target: Expr;
  value: Expr;
}

export interface Attr {
  type: "Attr";
  target: Expr;
  attr: Name;
}

export interface BinOp {
  type: "BinOp";
  left: Expr;
  op: string; // '+', '-', '*', '/', '%', '//', '**'
  right: Expr;
}

export interface UnaryOp {
  type: "UnaryOp";
  op: string; // '-', '+'
  operand: Expr;
}

export interface Compare {
  type: "Compare";
  left: Expr;
  ops: string[]; // '==', '!=', '<', '<=', '>', '>='
  comparators: Expr[];
}

export interface BoolOp {
  type: "BoolOp";
  op: string; // 'and', 'or'
  values: Expr[];
}

export interface Call {
  type: "Call";
  func: Expr;
  args: Expr[];
}

export interface Subscript {
  type: "Subscript";
  collection: Expr;
  key: Expr;
}

export interface ListLiteral {
  type: "List";
  elts: Expr[];
}

export interface DictLiteral {
  type: "Dict";
  keys: Expr[];
  values: Expr[];
}
