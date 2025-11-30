/**
 * PineScript Parser
 * 
 * Parses PineScript source code into an AST
 */

export interface ASTNode {
  type: string;
  value?: string | number | boolean;
  children?: ASTNode[];
  /** Variable name for for loops, for-in loops, and tuple destructuring */
  name?: string;
  /** Operator symbol (e.g., ':=' for reassignment) */
  operator?: string;
  /** Step value expression for for loops with 'by' clause */
  step?: ASTNode;
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

    // Parse if statement
    if (this.matchKeyword('if')) {
      return this.parseIfStatement();
    }

    // Parse for loop
    if (this.matchKeyword('for')) {
      return this.parseForLoop();
    }

    // Parse while loop
    if (this.matchKeyword('while')) {
      return this.parseWhileLoop();
    }

    // Parse break statement
    if (this.matchKeyword('break')) {
      return { type: 'BreakStatement' };
    }

    // Parse continue statement
    if (this.matchKeyword('continue')) {
      return { type: 'ContinueStatement' };
    }

    // Parse tuple destructuring: [a, b, c] = ...
    if (this.peek() === '[') {
      const tuple = this.parseTupleDestructuring();
      if (tuple) {
        return tuple;
      }
      // parseTupleDestructuring restores position internally if parsing fails
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

  private parseIfStatement(): ASTNode {
    // 'if' keyword already matched
    this.skipWhitespace();
    const condition = this.parseExpression();
    
    // Skip to end of line
    this.skipToEndOfLine();
    
    // Parse if body
    const body = this.parseIndentedBlock();
    
    // Check for else if / else
    this.skipWhitespace();
    let alternate: ASTNode | undefined;
    
    if (this.matchKeyword('else')) {
      this.skipWhitespace();
      if (this.matchKeyword('if')) {
        // else if - recursively parse another if statement
        alternate = this.parseIfStatement();
      } else {
        // else block
        this.skipToEndOfLine();
        const elseBody = this.parseIndentedBlock();
        alternate = {
          type: 'Block',
          children: elseBody,
        };
      }
    }

    return {
      type: 'IfStatement',
      children: [
        condition,
        { type: 'Block', children: body },
        ...(alternate ? [alternate] : []),
      ],
    };
  }

  private parseForLoop(): ASTNode {
    // 'for' keyword already matched
    this.skipWhitespace();
    
    // Check for for-in loop: for item in array OR for [index, item] in array
    if (this.peek() === '[') {
      return this.parseForInLoopWithDestructuring();
    }
    
    const varName = this.parseIdentifier();
    this.skipWhitespace();
    
    // Check if it's a for-in loop
    if (this.matchKeyword('in')) {
      return this.parseForInLoopContinued(varName);
    }
    
    // Standard for loop: for i = start to end [by step]
    if (this.peek() !== '=') {
      this.errors.push({
        message: 'Expected "=" or "in" in for loop',
        line: this.line,
        column: this.column,
      });
    }
    this.advance(); // skip '='
    this.skipWhitespace();
    
    const start = this.parseExpression();
    this.skipWhitespace();
    
    if (!this.matchKeyword('to')) {
      this.errors.push({
        message: 'Expected "to" in for loop',
        line: this.line,
        column: this.column,
      });
    }
    this.skipWhitespace();
    
    const end = this.parseExpression();
    this.skipWhitespace();
    
    // Check for optional 'by' step
    let step: ASTNode | undefined;
    if (this.matchKeyword('by')) {
      this.skipWhitespace();
      step = this.parseExpression();
    }
    
    this.skipToEndOfLine();
    const body = this.parseIndentedBlock();

    return {
      type: 'ForLoop',
      name: varName,  // loop variable name
      step: step,
      children: [
        start,  // children[0] = start
        end,    // children[1] = end
        { type: 'Block', children: body },  // children[2] = body
      ],
    };
  }

  private parseForInLoopWithDestructuring(): ASTNode {
    // Parse [index, item] destructuring
    this.advance(); // skip '['
    const vars: string[] = [];
    while (this.peek() !== ']' && this.position < this.source.length) {
      this.skipWhitespace();
      const varName = this.parseIdentifier();
      if (varName) vars.push(varName);
      this.skipWhitespace();
      if (this.peek() === ',') {
        this.advance();
      }
    }
    if (this.peek() === ']') {
      this.advance();
    }
    this.skipWhitespace();
    
    if (!this.matchKeyword('in')) {
      this.errors.push({
        message: 'Expected "in" in for loop',
        line: this.line,
        column: this.column,
      });
    }
    this.skipWhitespace();
    
    const iterable = this.parseExpression();
    this.skipToEndOfLine();
    const body = this.parseIndentedBlock();

    return {
      type: 'ForInLoop',
      name: vars.join(','),  // comma-separated variable names
      children: [
        iterable,
        { type: 'Block', children: body },
      ],
    };
  }

  private parseForInLoopContinued(varName: string): ASTNode {
    // 'in' keyword already matched
    this.skipWhitespace();
    const iterable = this.parseExpression();
    this.skipToEndOfLine();
    const body = this.parseIndentedBlock();

    return {
      type: 'ForInLoop',
      name: varName,
      children: [
        iterable,
        { type: 'Block', children: body },
      ],
    };
  }

  private parseWhileLoop(): ASTNode {
    // 'while' keyword already matched
    this.skipWhitespace();
    const condition = this.parseExpression();
    this.skipToEndOfLine();
    const body = this.parseIndentedBlock();

    return {
      type: 'WhileLoop',
      children: [
        condition,
        { type: 'Block', children: body },
      ],
    };
  }

  private parseSwitchExpression(): ASTNode {
    // 'switch' keyword already consumed by parseIdentifier
    this.skipWhitespace();
    
    // Optional switch expression (might be empty for condition-based switch)
    let switchExpr: ASTNode | undefined;
    if (this.peek() !== '\n' && this.position < this.source.length) {
      // Use parseTernary to avoid treating => as assignment
      switchExpr = this.parseTernary();
    }
    
    // Skip to end of current line
    this.skipToEndOfLine();
    
    // Parse switch cases
    const cases: ASTNode[] = [];
    
    while (this.position < this.source.length) {
      // Get the indentation at the start of the current line
      const currentIndent = this.getLineIndent();
      
      // If no indent or empty line, check if we should continue
      if (currentIndent === -1) {
        this.skipLine();
        continue;
      }
      
      // Switch cases should be indented; if not, we're done with the switch
      if (currentIndent === 0) {
        break;
      }
      
      // Skip indentation whitespace
      this.consumeIndent();
      
      // Check for default case: => result
      if (this.peek() === '=' && this.peekNext() === '>') {
        this.advance(); // skip '='
        this.advance(); // skip '>'
        this.skipWhitespace();
        const result = this.parseExpression();
        cases.push({
          type: 'SwitchDefault',
          children: [result],
        });
        this.skipToEndOfLine();
        continue;
      }
      
      // Parse case value - use parseTernary to avoid consuming =>
      const caseValue = this.parseTernary();
      this.skipWhitespace();
      
      // Expect '=>'
      if (this.peek() === '=' && this.peekNext() === '>') {
        this.advance();
        this.advance();
      } else {
        // Not a valid case line, stop parsing
        break;
      }
      this.skipWhitespace();
      
      // Parse result expression
      const result = this.parseExpression();
      cases.push({
        type: 'SwitchCase',
        children: [caseValue, result],
      });
      this.skipToEndOfLine();
    }

    return {
      type: 'SwitchExpression',
      children: [
        ...(switchExpr ? [switchExpr] : []),
        ...cases,
      ],
    };
  }

  private parseTupleDestructuring(): ASTNode | null {
    // '[' already checked, save position before '[' for potential backtrack
    const savedPosition = this.position;
    this.advance(); // skip '['
    const vars: string[] = [];
    
    while (this.peek() !== ']' && this.position < this.source.length) {
      this.skipWhitespace();
      if (!this.isAlpha(this.peek())) {
        // Not an identifier, restore and return null
        this.position = savedPosition;
        return null;
      }
      const varName = this.parseIdentifier();
      if (varName) vars.push(varName);
      this.skipWhitespace();
      if (this.peek() === ',') {
        this.advance();
      }
    }
    
    if (this.peek() !== ']') {
      this.position = savedPosition;
      return null;
    }
    this.advance(); // skip ']'
    this.skipWhitespace();
    
    // Must have '=' after tuple
    if (this.peek() !== '=') {
      this.position = savedPosition;
      return null;
    }
    this.advance(); // skip '='
    this.skipWhitespace();
    
    const initializer = this.parseExpression();

    return {
      type: 'TupleDestructuring',
      name: vars.join(','),
      children: [initializer],
    };
  }

  private parseIndentedBlock(): ASTNode[] {
    const statements: ASTNode[] = [];
    
    // If we're at end of source, return empty
    if (this.position >= this.source.length) {
      return statements;
    }
    
    // Calculate the expected indentation for block content
    // After a newline, the block content should be indented
    const blockIndent = this.getLineIndent();
    
    // Block content should be indented (>0) 
    if (blockIndent <= 0) {
      return statements;
    }
    
    while (this.position < this.source.length) {
      // Check the indentation of the current position
      const currentIndent = this.getLineIndent();
      
      // Block ends when indentation decreases below block indent level
      if (currentIndent < blockIndent && currentIndent !== -1) {
        break;
      }
      
      // Skip lines that are less indented (shouldn't happen) or empty (-1)
      if (currentIndent === -1) {
        this.skipLine();
        continue;
      }
      
      // Consume the indentation whitespace
      this.consumeIndent();
      
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
      
      // If we've consumed to end of line or there's a newline, advance past it
      this.skipLineRemainder();
    }
    
    return statements;
  }

  private getLineIndent(): number {
    // Save position
    let pos = this.position;
    
    // If we're not at the start of a line, find where the line starts
    // (we may have already consumed the newline)
    
    // Count leading whitespace from current position 
    let indent = 0;
    while (pos < this.source.length) {
      const char = this.source[pos];
      if (char === ' ') {
        indent++;
        pos++;
      } else if (char === '\t') {
        indent += 4;
        pos++;
      } else if (char === '\n' || char === '\r') {
        // Empty line - return -1 to indicate skip
        return -1;
      } else {
        break;
      }
    }
    
    if (pos >= this.source.length) {
      return -1;
    }
    
    return indent;
  }

  private consumeIndent(): void {
    while (this.position < this.source.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipLine(): void {
    while (this.position < this.source.length && this.peek() !== '\n') {
      this.advance();
    }
    if (this.peek() === '\n') {
      this.advance();
    }
  }

  private skipLineRemainder(): void {
    // Skip whitespace and potential newline at end
    while (this.position < this.source.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        break;
      } else {
        break;
      }
    }
  }

  private skipToEndOfLine(): void {
    while (this.position < this.source.length && this.peek() !== '\n') {
      this.advance();
    }
    if (this.peek() === '\n') {
      this.advance();
    }
  }

  private skipWhitespaceAndNewlines(): void {
    while (this.position < this.source.length) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private measureIndent(): number {
    // Find the start of the current line
    let lineStart = this.position;
    while (lineStart > 0 && this.source[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    // Count spaces/tabs from line start
    let indent = 0;
    let pos = lineStart;
    while (pos < this.source.length) {
      const char = this.source[pos];
      if (char === ' ') {
        indent++;
        pos++;
      } else if (char === '\t') {
        indent += 4; // Treat tabs as 4 spaces
        pos++;
      } else {
        break;
      }
    }
    
    // Return -1 if the line is empty or only whitespace
    if (pos >= this.source.length || this.source[pos] === '\n') {
      return -1;
    }
    
    return indent;
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const left = this.parseTernary();
    
    this.skipWhitespace();
    
    // Handle ':=' reassignment operator
    if (this.peek() === ':' && this.peekNext() === '=') {
      this.advance(); // skip ':'
      this.advance(); // skip '='
      this.skipWhitespace();
      const right = this.parseAssignment();
      return {
        type: 'Reassignment',
        operator: ':=',
        children: [left, right],
      };
    }
    
    // Handle '=' assignment
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

  private parseTernary(): ASTNode {
    const condition = this.parseBinary();
    
    this.skipWhitespace();
    if (this.peek() === '?') {
      this.advance(); // skip '?'
      this.skipWhitespace();
      const consequent = this.parseAssignment();
      this.skipWhitespace();
      if (this.peek() === ':') {
        this.advance(); // skip ':'
        this.skipWhitespace();
        const alternate = this.parseAssignment();
        return {
          type: 'TernaryExpression',
          children: [condition, consequent, alternate],
        };
      }
    }
    
    return condition;
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
      return this.maybeParseHistoryAccess(expr);
    }

    // Identifier or function call
    if (this.isAlpha(this.peek())) {
      // Save position for potential keyword lookahead
      const startPos = this.position;
      const name = this.parseIdentifier();
      
      // Check if this is the 'switch' keyword
      if (name === 'switch') {
        return this.parseSwitchExpression();
      }
      
      this.skipWhitespace();
      
      // Check for function call
      if (this.peek() === '(') {
        this.advance();
        const args = this.parseArguments();
        const callNode: ASTNode = {
          type: 'FunctionCall',
          value: name,
          children: args,
        };
        return this.maybeParseHistoryAccess(callNode);
      }

      // Check for member access
      if (this.peek() === '.') {
        const memberExpr = this.parseMemberAccess(name);
        return this.maybeParseHistoryAccess(memberExpr);
      }

      // Check for history access on simple identifier
      const identNode: ASTNode = {
        type: 'Identifier',
        value: name,
      };
      return this.maybeParseHistoryAccess(identNode);
    }

    // Skip to end of line on error
    const char = this.advance();
    return {
      type: 'Unknown',
      value: char,
    };
  }

  private maybeParseHistoryAccess(base: ASTNode): ASTNode {
    this.skipWhitespace();
    if (this.peek() === '[') {
      this.advance(); // skip '['
      this.skipWhitespace();
      const offset = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() === ']') {
        this.advance(); // skip ']'
      }
      const historyNode: ASTNode = {
        type: 'HistoryAccess',
        children: [base, offset],
      };
      // Check for chained history access (e.g., close[1][2] - unlikely but handle it)
      return this.maybeParseHistoryAccess(historyNode);
    }
    return base;
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
      const callNode: ASTNode = {
        type: 'FunctionCall',
        value: parts.join('.'),
        children: args,
      };
      return this.maybeParseHistoryAccess(callNode);
    }

    const memberNode: ASTNode = {
      type: 'MemberExpression',
      value: parts.join('.'),
    };
    return this.maybeParseHistoryAccess(memberNode);
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
    // Note: '?' and ':' are handled by ternary expression parsing, not here
    if (['+', '-', '*', '/', '%', '<', '>'].includes(oneChar)) {
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
