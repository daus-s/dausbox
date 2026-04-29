class Lexer {
  constructor() {}

  tokenize(input: string): string[] {
    return input.split(" ");
  }
}

export default Lexer;
