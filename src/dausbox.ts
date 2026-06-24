import Interpreter from "./dasl/interpreter";
import Lexer from "./dasl/lexer";
import Parser from "./dasl/parser";
import type { Module } from "./dasl/stmt";

import { stringify } from "./dasl/value";

import { History } from "./history";

class DausBox {
  private lexer: Lexer;
  private parser: Parser;
  private interpreter: Interpreter;

  private quiet: boolean = true;
  private msgs: number = 0;

  history: History;

  constructor() {
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.interpreter = new Interpreter();
    this.history = new History();
  }

  static async create(): Promise<DausBox> {
    const box = new DausBox();
    const cache = new Map<string, Module>();

    //load dasl _std.lib manifest
    const manifest = await fetch("/dasl/_std/manifest.txt");
    if (!manifest.ok)
      throw new Error(`Failed to fetch dasl manifest: ${manifest.status}`);

    const mods = (await manifest.text()).split("\n");
    //prefetch known modules
    for (const mod of mods) {
      if (mod.trim() === "") continue;
      const res = await fetch(`/dasl/_std/${mod}.dasl`);
      if (!res.ok) throw new Error(`Failed to fetch ${mod}: ${res.status}`);
      const text = await res.text();

      const ast = new Parser().parse(new Lexer().tokenize(text));

      cache.set(mod, ast);
    }

    //load dausbox kernel
    const kernelFile = await fetch("/dasl/kernel.dasl");
    if (!kernelFile.ok)
      throw new Error(`Failed to fetch kernel.dasl: ${kernelFile.status}`);
    const kernel = await kernelFile.text();
    box.execute(kernel);

    const resolver = (src: string[]): Module => {
      if (src.length == 2 && src[0] === "_std") {
        if (!cache.has(src[1]))
          throw new Error(
            `DausBox.useResolver: unknown _std module: ${src[1]}`,
          );
        return cache.get(src[1])!;
      } else if (src.length == 1) {
        if (!cache.has(src[0]))
          throw new Error(`DausBox.useResolver: unknown module: ${src[0]}`);
        return cache.get(src[0])!;
      } else {
        throw new Error(
          `DausBox.useResolver takes a single string or _std module path.\nunknown module: ${src}`,
        );
      }
    };

    box.interpreter.setResolver(resolver);

    //todo: run aliasing file

    box.quiet = false;
    return box;
  }

  execute(input: string): void {
    let err: string | null = "lex";
    try {
      console.log("DausBox: executing:", input);

      const tokens = this.lexer.tokenize(input);

      err = "par";
      const ast = this.parser.parse(tokens);

      // TODO: handle multi line stmts

      err = "int";
      const res = this.interpreter.eval(ast);

      err = null;

      // handle multi line stmts???

      const newMsgs = this.interpreter.output().slice(this.msgs);

      this.msgs += newMsgs.length;

      if (this.quiet) return;

      let output = "";

      for (const msg of newMsgs) {
        output += msg + "\n";
      }

      const rs = res != null ? "**" + stringify(res) + "**" : "";

      output += rs + "\n";

      if (output) {
        this.history.record(input, { output });
      } else {
        this.history.record(input, { output });
      }
    } catch (e) {
      if (err === "lex") {
        this.history.record(input, { error: "Lexer:" + (e as Error).message });
      } else if (err === "par") {
        this.history.record(input, { error: "Parser:" + (e as Error).message });
      } else if (err === "int") {
        this.history.record(input, {
          error: "Interpreter: " + (e as Error).message,
        });
      }
    }
  }

  get_history(): History {
    return this.history;
  }
}

export default DausBox;
