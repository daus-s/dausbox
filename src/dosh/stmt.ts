import type { Expr, Name, Assign } from "./expr";

export interface Module {
  type: "Module";
  body: Stmt[];
}

export type Stmt =
  | ExprStmt
  | AssignStmt
  | IfStmt
  | WhileStmt
  | ForStmt
  | FuncDef
  | ReturnStmt
  | BreakStmt
  | ContinueStmt;

export interface ExprStmt {
  type: "Expr";
  value: Expr;
}

export interface AssignStmt {
  type: "Assign";
  assign: Assign;
}

export interface IfStmt {
  type: "If";
  cond: Expr;
  body: Stmt[];
  orelse: Stmt[];
}

export interface WhileStmt {
  type: "While";
  cond: Expr;
  body: Stmt[];
}

export interface ForStmt {
  type: "For";
  target: Name;
  iter: Expr;
  body: Stmt[];
}

export interface FuncDef {
  type: "FuncDef";
  name: string;
  args: string[]; // parameter names
  body: Stmt[];
}

export interface ReturnStmt {
  type: "Return";
  value: Expr | null;
}

export interface BreakStmt {
  type: "Break";
}

export interface ContinueStmt {
  type: "Continue";
}
