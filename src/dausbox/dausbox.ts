import Interpreter from "../dasl/interpreter";
import Lexer from "../dasl/lexer";
import type { Obj } from "../dasl/object";
import Parser from "../dasl/parser";
import type { Module } from "../dasl/stmt";

import { type Value } from "../dasl/value";

import { History } from "./history";

class DausBox {
  private lexer: Lexer;
  private parser: Parser;
  private interpreter: Interpreter;

  private quiet: boolean = true;
  private hideInput: boolean = false;
  private msgs: number = 0;

  history: History;

  private fileCache: Map<string, string> = new Map();
  private moduleCache: Map<string, Module> = new Map();

  constructor() {
    this.lexer = new Lexer();
    this.parser = new Parser();
    this.interpreter = new Interpreter();
    this.history = new History();
  }

  static async create(): Promise<DausBox> {
    const box = new DausBox();

    const resolver = (src: string[]): Module => {
      if (src.length == 2 && src[0] === "_std") {
        if (!box.moduleCache.has(src[1]))
          throw new Error(`DausBox.useResolver: unknown module: ${src[1]}`);
        return box.moduleCache.get(src[1])!;
      } else if (src.length == 1) {
        if (!box.moduleCache.has(src[0]))
          throw new Error(`DausBox.useResolver: unknown module: ${src[0]}`);
        return box.moduleCache.get(src[0])!;
      } else {
        throw new Error(
          `DausBox.useResolver takes a single string or _std module path.\nunknown module: ${src}`,
        );
      }
    };

    box.interpreter.setResolver(resolver);

    box.registerBrowserBuiltins();

    const mods = [
      "projects",
      "math",
      "str",
      "warheads",
      "betties" /*"tictactoe", conway*/,
      "dauslang",
      "desmos",
      "optics",
    ]; //todo: add io, time,

    for (const mod of mods) {
      const res = await fetch(`/dasl/${mod}.dasl`);
      if (!res.ok) throw new Error(`Failed to fetch ${mod}: ${res.status}`);
      const text = await res.text();

      const ast = new Parser().parse(new Lexer().tokenize(text));

      box.moduleCache.set(mod, ast);
    }

    const files = [
      "warheads.md",
      "bio.txt",
      "welcome.txt",
      "logo.txt",
      "man.txt",
      "strman.txt",
      "mathman.txt",
      "attributions.txt",
    ];

    for (const file of files) {
      const res = await fetch(`/${file}`);
      if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
      const text = await res.text();

      box.fileCache.set(file, text);
    }

    //load dausbox kernel
    const kernelFile = await fetch("/dasl/kernel.dasl");
    if (!kernelFile.ok)
      throw new Error(`Failed to fetch kernel.dasl: ${kernelFile.status}`);
    const kernel = await kernelFile.text();
    box.execute(kernel);

    box.quiet = false;
    return box;
  }

  welcome(): void {
    this.hideInput = true;
    this.execute("welcome");
    this.hideInput = false;
  }

  execute(input: string): void {
    if (!this.quiet && !this.hideInput) this.history.record({ input });
    let err: string | null = "lex";
    try {
      const tokens = this.lexer.tokenize(input);
      err = "par";
      const ast = this.parser.parse(tokens);
      err = "int";
      const res = this.interpreter.eval(ast);
      err = null;

      this.recordNewMessages();

      if (res !== null)
        this.history.record({ output: this.interpreter._str(res) });
    } catch (e) {
      if (err === "lex") {
        this.history.record({ error: "lexer:" + (e as Error).message });
      } else if (err === "par") {
        this.history.record({ error: "parser:" + (e as Error).message });
      } else if (err === "int") {
        this.recordNewMessages();

        this.history.record({
          error: "interpreter: " + (e as Error).message,
        });
      }
    }
  }

  get_history(): History {
    return this.history;
  }

  commandCount(): number {
    const entries = this.history.entries();
    let count = 0;
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!("input" in entry)) continue;
      const lines = entry.input.split("\n");
      if (lines.length > 1) count += lines.length;
      count += 1;
    }
    return count;
  }

  getNthPrevCommand(n: number): string {
    const entries = this.history.entries();
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!("input" in entry)) continue;

      const lines = entry.input.split("\n");
      if (lines.length > 1) {
        for (let j = lines.length - 1; j >= 0; j--) {
          n--;
          if (n === 0) return lines[j].trim();
        }
      }
      n--;
      if (n === 0) return entry.input;
    }
    return "";
  }

  private async registerBrowserBuiltins() {
    this.interpreter.register("read", ["src"], (args: Value[]): Value => {
      if (args.length !== 1 || !(typeof args[0] === "string"))
        throw new Error("read requires a single source file path to read");

      if (!this.fileCache.has(args[0] as string))
        throw new Error("read: no such file: " + args[0]);

      return this.fileCache.get(args[0] as string)!;
    });

    this.interpreter.register("open", ["proj"], (args: Value[]): Value => {
      if (args.length !== 1)
        throw new Error(`open: requires 1 argument, got ${args.length}`);

      const type = this.interpreter._type(args[0]);
      if (type !== "Project" && type !== "string")
        throw new Error(`open: requires a Project or url, got ${type}`);

      let url: string;
      if (type === "Project") {
        const access = (args[0] as Obj).access("url");
        if (access === null)
          throw new Error(`open: project must have a valid url`);
        url = access as string;
      } else {
        url = args[0] as string;
      }

      window.open(url, "_blank", "noopener,noreferrer")?.focus();
      return null;
    });

    this.interpreter.register("github", ["proj"], (args: Value[]): Value => {
      if (args.length !== 1)
        throw new Error(`github: requires 1 argument, got ${args.length}`);
      if (this.interpreter._type(args[0]) !== "Project")
        throw new Error(
          `github: requires a Project, got ${this.interpreter._type(args[0])}`,
        );

      const proj = args[0] as Obj;

      if (proj.access("git") === null)
        throw new Error(`github: project must have a valid url`);

      const url = proj.access("git") as string;

      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) {
        newWindow.focus();
      }

      return null;
    });

    this.interpreter.register("okigetit", [], (args: Value[]) => {
      if (args.length !== 0)
        throw new Error("okigetit: takes 0 arguments, recived" + args.length);

      localStorage.setItem("doWelcome", "no");

      this.hideInput = true;
      this.execute(
        'print "welcome message will no longer be displayed.\nif you would like to see the welcome message enter command `greetme`"',
      );
      this.hideInput = false;

      return null;
    });

    this.interpreter.register("greetme", [], (args: Value[]) => {
      if (args.length !== 0)
        throw new Error("greetme: takes 0 arguments, recived" + args.length);

      localStorage.removeItem("doWelcome");

      this.hideInput = true;
      this.execute(
        'print "welcome message will be displayed next time you visit dausbox.dev.\nif you would like to hide the welcome message enter command `okigetit`"',
      );
      this.hideInput = false;

      return null;
    });

    this.interpreter.register("man", ["module"], (args: Value[]) => {
      if (args.length === 0) {
        this.hideInput = true;
        this.execute('print_man "man.txt"');
        this.hideInput = false;
      } else if (args.length === 1) {
        console.log(args[0]);
        const modules: Record<string, string> = {
          str: "strman.txt",
          math: "mathman.txt",
        };
        const moduleName = (() => {
          if (this.interpreter._type(args[0]) === "module") {
            const module = args[0] as Obj;
            return module.access("_name") as string;
          }
          return null;
        })();

        if (moduleName && moduleName in modules) {
          this.hideInput = true;
          this.execute(`print_man "${modules[moduleName]}"`);
          this.hideInput = false;
        } else {
          throw new Error(`man: no associated man page for "${moduleName}"`);
        }
      } else {
        throw new Error(`man: takes 1 argument, received ${args.length}`);
      }
      return null;
    });

    this.interpreter.register("markdown", ["content"], (args: Value[]) => {
      if (args.length !== 1)
        throw new Error(`markdown: requires 1 argument, got ${args.length}`);
      const _type = this.interpreter._type(args[0]);
      if (_type !== "string")
        throw new Error(
          `markdown: can only render a string as markdown, got ${_type}`,
        );

      this.history.record({ markdown: true, output: args[0] as string });

      return null;
    });
  }

  setWidth(width: number) {
    this.interpreter.eval({
      type: "Module",
      body: [
        {
          type: "Assign",
          assign: {
            type: "Assign",
            target: { type: "Name", id: "_width" },
            value: { type: "Constant", value: width },
          },
        },
      ],
    });
  }

  recordNewMessages() {
    const newMsgs = this.interpreter.output().slice(this.msgs);

    this.msgs += newMsgs.length;

    if (this.quiet) return;

    for (const msg of newMsgs) {
      this.history.record({ output: msg });
    }
  }
}

export default DausBox;
