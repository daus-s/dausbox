import type { Token, TokenType } from "./types";

class Lexer {
  private source: string = "";

  private tokens: Token[] = [];

  private idx: number = 0;
  private line: number = 1;
  private col: number = 0;

  private indentStack: number[] = [0]; // track indentation levels
  private atLineStart = true;

  constructor() {}

  tokenize(source: string): Token[] {
    this.source = source;
    this.tokens = [];
    this.idx = 0;
    this.line = 1;
    this.col = 0;
    this.indentStack = [0];
    this.atLineStart = true;

    while (!this.atEnd()) {
      const char = this.curr();

      if (char === "#") {
        while (this.curr() !== "\n" && !this.atEnd()) {
          this.step();
        }
        continue;
      }

      if (char === "\n") {
        this.pushToken("", "NEWLINE");
        this.step();
        ++this.line;
        this.col = 0;
        this.atLineStart = true;
        continue;
      }

      //ignore whitespace
      if (/\s/.test(char)) {
        this.step();
        continue;
      }

      this.step();
    }
    return this.tokens;
  }

  private step(): void {
    this.idx++;
    this.col++;
  }

  private curr(): string {
    return this.source[this.idx];
  }

  private next(): string {
    return this.source[this.idx + 1];
  }

  private pushToken(value: string = "", type: TokenType): void {
    this.tokens.push({ type, value, line: this.line, col: this.col });
  }

  private atEnd(): boolean {
    return this.idx >= this.source.length;
  }
}

export default Lexer;
