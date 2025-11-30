/**
 * PineScript Parser
 * 
 * Parses PineScript source code into an AST
 */

export interface ASTNode {
  type: string;
  value?: string | number | boolean;
  children?: ASTNode[];
  location?: {
    line: number;
    column: number;
  };
}

export interface ParseResult {
  ast: ASTNode;
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

/**
 * PineScript Parser class
 * 
 * Parses PineScript v6 source code into an abstract syntax tree (AST)
 */
export class PineParser {
  private source: string = '';
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private errors: ParseError[] = [];

  /**
   * Parse PineScript source code
   */
  parse(source: string): ParseResult {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.errors = [];

    const ast = this.parseProgram();

    return {
      ast,
      errors: this.errors,
    };
  }

  private parseProgram(): ASTNode {
    const statements: ASTNode[] = [];

    while (this.position < this.source.length) {
      this.skipWhitespace();
      if (this.position >= this.source.length) break;
      
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: 'Program',
      children: statements,
    };
  }

  private parseStatement(): ASTNode | null {
    this.skipWhitespace();
    
    // Skip empty lines
    if (this.peek() === '\n') {
      this.advance();
      return null;
    }

    // Skip comments
    if (this.peek() === '/') {
      if (this.peekNext() === '/') {
        return this.parseLineComment();
      }
    }

    // Parse indicator declaration
    if (this.matchKeyword('indicator')) {
      return this.parseIndicatorDeclaration();
    }

    // Parse variable declarations
    if (this.matchKeyword('var') || this.matchKeyword('varip')) {
      return this.parseVariableDeclaration();
    }

    // Parse expressions/assignments
    return this.parseExpressionStatement();
  }

  private parseLineComment(): ASTNode {
    const start = this.position;
    while (this.position < this.source.length && this.peek() !== '\n') {
      this.advance();
    }
    return {
      type: 'Comment',
      value: this.source.slice(start, this.position),
    };
  }

  private parseIndicatorDeclaration(): ASTNode {
    // Skip 'indicator' keyword (already matched)
    this.skipWhitespace();
    
    // Parse arguments in parentheses
    if (this.peek() === '(') {
      this.advance(); // skip '('
      const args = this.parseArguments();
      return {
        type: 'IndicatorDeclaration',
        children: args,
      };
    }

    return {
      type: 'IndicatorDeclaration',
      children: [],
    };
  }

  private parseVariableDeclaration(): ASTNode {
    this.skipWhitespace();
    const name = this.parseIdentifier();
    this.skipWhitespace();
    
    let initializer: ASTNode | undefined;
    if (this.peek() === '=') {
      this.advance(); // skip '='
      this.skipWhitespace();
      initializer = this.parseExpression();
    }

    return {
      type: 'VariableDeclaration',
      value: name,
      children: initializer ? [initializer] : [],
    };
  }

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    return {
      type: 'ExpressionStatement',
      children: expr ? [expr] : [],
    };
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const left = this.parseBinary();
    
    this.skipWhitespace();
    if (this.peek() === '=' && this.peekNext() !== '=') {
      this.advance(); // skip '='
      this.skipWhitespace();
      const right = this.parseAssignment();
      return {
        type: 'Assignment',
        children: [left, right],
      };
    }

    return left;
  }

  private parseBinary(): ASTNode {
    let left = this.parseUnary();

    while (true) {
      this.skipWhitespace();
      const op = this.parseOperator();
      if (!op) break;

      this.skipWhitespace();
      const right = this.parseUnary();
      left = {
        type: 'BinaryExpression',
        value: op,
        children: [left, right],
      };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    this.skipWhitespace();
    
    if (this.peek() === '-' || this.peek() === '!' || this.peek() === '+') {
      const op = this.advance();
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        value: op,
        children: [operand],
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    this.skipWhitespace();

    // Number literal
    if (this.isDigit(this.peek()) || (this.peek() === '.' && this.isDigit(this.peekNext()))) {
      return this.parseNumber();
    }

    // String literal
    if (this.peek() === '"' || this.peek() === "'") {
      return this.parseString();
    }

    // Parenthesized expression
    if (this.peek() === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() === ')') {
        this.advance();
      }
      return expr;
    }

    // Identifier or function call
    if (this.isAlpha(this.peek())) {
      const name = this.parseIdentifier();
      this.skipWhitespace();
      
      // Check for function call
      if (this.peek() === '(') {
        this.advance();
        const args = this.parseArguments();
        return {
          type: 'FunctionCall',
          value: name,
          children: args,
        };
      }

      // Check for member access
      if (this.peek() === '.') {
        return this.parseMemberAccess(name);
      }

      return {
        type: 'Identifier',
        value: name,
      };
    }

    // Skip to end of line on error
    const char = this.advance();
    return {
      type: 'Unknown',
      value: char,
    };
  }

  private parseMemberAccess(object: string): ASTNode {
    const parts = [object];
    
    while (this.peek() === '.') {
      this.advance(); // skip '.'
      const member = this.parseIdentifier();
      parts.push(member);
    }

    this.skipWhitespace();
    
    // Check for function call
    if (this.peek() === '(') {
      this.advance();
      const args = this.parseArguments();
      return {
        type: 'FunctionCall',
        value: parts.join('.'),
        children: args,
      };
    }

    return {
      type: 'MemberExpression',
      value: parts.join('.'),
    };
  }

  private parseArguments(): ASTNode[] {
    const args: ASTNode[] = [];
    
    while (this.peek() !== ')' && this.position < this.source.length) {
      this.skipWhitespace();
      if (this.peek() === ')') break;
      
      const arg = this.parseExpression();
      args.push(arg);
      
      this.skipWhitespace();
      if (this.peek() === ',') {
        this.advance();
      }
    }

    if (this.peek() === ')') {
      this.advance();
    }

    return args;
  }

  private parseNumber(): ASTNode {
    let value = '';
    
    while (this.isDigit(this.peek()) || this.peek() === '.') {
      value += this.advance();
    }

    return {
      type: 'NumberLiteral',
      value: parseFloat(value),
    };
  }

  private parseString(): ASTNode {
    const quote = this.advance();
    let value = '';
    
    while (this.peek() !== quote && this.position < this.source.length) {
      if (this.peek() === '\\') {
        this.advance();
        value += this.advance();
      } else {
        value += this.advance();
      }
    }
    
    if (this.peek() === quote) {
      this.advance();
    }

    return {
      type: 'StringLiteral',
      value,
    };
  }

  private parseIdentifier(): string {
    let name = '';
    
    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      name += this.advance();
    }

    return name;
  }

  private parseOperator(): string | null {
    const twoChar = this.source.slice(this.position, this.position + 2);
    if (['==', '!=', '>=', '<=', '&&', '||', '+=', '-=', '*=', '/='].includes(twoChar)) {
      this.advance();
      this.advance();
      return twoChar;
    }

    const oneChar = this.peek();
    if (['+', '-', '*', '/', '%', '<', '>', '?', ':'].includes(oneChar)) {
      this.advance();
      return oneChar;
    }

    return null;
  }

  private matchKeyword(keyword: string): boolean {
    const remaining = this.source.slice(this.position);
    if (remaining.startsWith(keyword) && !this.isAlphaNumeric(remaining[keyword.length] || '')) {
      this.position += keyword.length;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private peek(): string {
    return this.source[this.position] || '';
  }

  private peekNext(): string {
    return this.source[this.position + 1] || '';
  }

  private advance(): string {
    const char = this.source[this.position] || '';
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
