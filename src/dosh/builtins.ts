import Func from "./func.ts";
import Environment from "./environment.ts";

export function builtins(_output: string[]): Func[] {
  const range = new Func(
    "range",
    ["start", "stop", "step"],
    {
      type: "Module",
      body: [{ type: "Return", value: { type: "List", elts: [] } }],
    },
    new Environment(),
  );

  const print = new Func(
    "print",
    ["value"],
    {
      type: "Module",
      body: [{ type: "Return", value: { type: "List", elts: [] } }],
    },
    new Environment(),
  );

  const len = new Func(
    "len",
    ["value"],
    {
      type: "Module",
      body: [{ type: "Return", value: { type: "Int", value: 0 } }],
    },
    new Environment(),
  );
  return [range, print, len];
}
