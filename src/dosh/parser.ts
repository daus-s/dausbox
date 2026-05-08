import type { Token } from "./token";

class Parser {
  private tokens: Token[];
  private idx: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.idx];
  }

  private advance(): Token {
    return this.tokens[this.idx++];
  }

  private check(type: string): boolean {
    return this.peek().type === type;
  }

  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: string, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }
}

export default Parser;
