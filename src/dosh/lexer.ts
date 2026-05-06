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
      if (this.atLineStart) {
        this.atLineStart = false;
        this.getIndentation();
      }

      const char = this.curr();

      if (char === "#") {
        while (this.curr() !== "\n" && !this.atEnd()) {
          this.step();
        }
      } else if (char === "\n") {
        this.pushToken("", "NEWLINE");
        this.step();
        ++this.line;
        this.col = 0;
        this.atLineStart = true;
      } else if (/\s/.test(char)) {
        //ignore whitespace
        this.step();
      } else if (char === "'" || char === '"') {
        this.tokenizeLiteral();
      } else if (/\d/.test(char)) {
        this.tokenizeNumber();
      } else if (/[a-zA-Z_]/.test(char)) {
        this.tokenizeIdentifier();
      } else {
        this.tokenizeOperator();
      }
    }
    while (this.indentStack.length > 1) {
      this.pushToken("", "DEDENT");
      this.indentStack.pop();
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

  private next(): string | null {
    return this.idx + 1 < this.source.length ? this.source[this.idx + 1] : null;
  }

  private pushToken(value: string = "", type: TokenType): void {
    this.tokens.push({ type, value, line: this.line, col: this.col });
  }

  private atEnd(): boolean {
    return this.idx >= this.source.length;
  }

  private getIndentation(): void {
    if (this.atEnd() || this.curr() === "\n") {
      return;
    }

    let spaces = 0;
    while (!this.atEnd() && this.curr() === " ") {
      ++spaces;
      this.step();
    }

    if (this.curr() === "\n" || this.curr() === "#") {
      return;
    }

    const blockIndent = this.indentStack[0];

    if (spaces > blockIndent) {
      this.indentStack.unshift(spaces);
      this.pushToken("", "INDENT");
    } else if (spaces < blockIndent) {
      while (this.indentStack.length > 1 && spaces < this.indentStack[0]) {
        this.indentStack.shift();
        this.pushToken("", "DEDENT");
      }

      if (spaces !== this.indentStack[0]) {
        throw new Error(
          `Indentation error: expected ${this.indentStack[0]} spaces, got ${spaces} at line ${this.line}`,
        );
      }
    }
  }

  private tokenizeLiteral(): void {
    const quote = this.curr();
    this.step();

    let value = "";
    while (!this.atEnd() && this.curr() !== quote) {
      if (this.curr() === "\\") {
        this.step();
        switch (this.curr()) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "b":
            value += "\b";
            break;
          case "f":
            value += "\f";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            throw new Error(
              `Invalid escape sequence \\${this.curr()} at line ${this.line}`,
            );
        }
        this.step();
      } else {
        value += this.curr();
        this.step();
      }
    }

    if (this.atEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }

    this.step();
    this.pushToken(value, "STRING");
  }

  private tokenizeIdentifier(): void {
    let value = "";

    while (!this.atEnd() && /[a-zA-Z0-9_]/.test(this.curr())) {
      value += this.curr();
      this.step();
    }

    const keywords: Record<string, TokenType> = {
      if: "IF",
      elif: "ELIF",
      else: "ELSE",
      while: "WHILE",
      for: "FOR",
      in: "IN",
      def: "DEF",
      return: "RETURN",
      break: "BREAK",
      continue: "CONTINUE",
      and: "AND",
      or: "OR",
      not: "NOT",
      True: "TRUE",
      False: "FALSE",
      None: "NONE",
    };

    if (value in keywords) {
      this.pushToken(value, keywords[value]);
      return;
    }
    this.pushToken(value, "NAME");
  }

  private tokenizeNumber(): void {
    let value = "";

    while (!this.atEnd() && /\d/.test(this.curr())) {
      value += this.curr();
      this.step();
    }

    if (!this.atEnd() && this.curr() == ".") {
      value += ".";
      this.step();
      while (!this.atEnd() && /\d/.test(this.curr())) {
        value += this.curr();
        this.step();
      }
    }
    this.pushToken(value, "NUMBER");
  }

  private tokenizeOperator(): void {
    const char1 = this.curr();
    const char2 = this.next();

    if (char1 === "=" && char2 === "=") {
      this.step();
      this.step();
      this.pushToken("==", "EQUAL_EQUAL");
      return;
    } else if (char1 === "!" && char2 === "=") {
      this.step();
      this.step();
      this.pushToken("!=", "BANG_EQUAL");
      return;
    } else if (char1 == "<" && char2 == "=") {
      this.step();
      this.step();
      this.pushToken("<=", "LESS_EQUAL");
      return;
    } else if (char1 == ">" && char2 == "=") {
      this.step();
      this.step();
      this.pushToken(">=", "GREATER_EQUAL");
      return;
    } else if (char1 == "*" && char2 == "*") {
      this.step();
      this.step();
      this.pushToken("**", "POWER");
      return;
    } else if (char1 == "/" && char2 == "/") {
      this.step();
      this.step();
      this.pushToken("//", "SLASH_SLASH");
      return;
    } else if (char1 == "-" && char2 == ">") {
      this.step();
      this.step();
      this.pushToken("->", "ARROW");
      return;
    }

    const operatorMap: Record<string, TokenType> = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "%": "PERCENT",
      "=": "EQUAL",
      "<": "LESS",
      ">": "GREATER",
      "(": "LEFT_PAREN",
      ")": "RIGHT_PAREN",
      "[": "LEFT_BRACKET",
      "]": "RIGHT_BRACKET",
      "{": "LEFT_BRACE",
      "}": "RIGHT_BRACE",
      ":": "COLON",
      ",": "COMMA",
      ".": "DOT",
    };

    if (char1 in operatorMap) {
      this.pushToken(char1, operatorMap[char1]);
      this.step();
      return;
    }

    this.step();
  }
}

export default Lexer;
