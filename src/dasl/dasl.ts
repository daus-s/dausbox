import fs from "fs";
import Lexer from "./lexer.ts";
import Parser from "./parser.ts";
import Interpreter from "./interpreter.ts";
import type { Module } from "./stmt.ts";

const lexer = new Lexer();
const parser = new Parser();
const interpreter = new Interpreter();

const exec = (code: string) => {
  const lexer = new Lexer();
  const parser = new Parser();

  const tokens = lexer.tokenize(code);
  const ast = parser.parse(tokens);

  interpreter.eval(ast);

  interpreter.output().forEach((line) => console.log(line));
};

if (process.argv.length === 3) {
  const filename = process.argv[2];

  const path: string = process.cwd() + "/" + filename;

  let content = fs.readFileSync(path, "utf-8");
  content = content.toString();

  const resolver = (src: string[]): Module => {
    const pathArr = path.split("/").slice(0, -1);

    for (const module of src) {
      if (module === "super") {
        pathArr.pop();
      } else {
        pathArr.push(module);
      }
    }

    if (!pathArr[pathArr.length - 1].endsWith(".dasl")) {
      pathArr[pathArr.length - 1] = pathArr[pathArr.length - 1] + ".dasl";
    }
    const srcFile = pathArr.join("/");

    let content = fs.readFileSync(srcFile, "utf-8");
    content = content.toString();

    const tokens = lexer.tokenize(content);
    const ast = parser.parse(tokens);
    return ast;
  };

  interpreter.setResolver(resolver);

  exec(content);
} else {
  throw new Error("interactive mode not implemented yet.");
}
