/**
 * Statement generation logic
 */

import type {ASTNode} from '../PineParser.js';
import type {GeneratorContext} from '../types.js';
import {ExpressionGenerator} from './ExpressionGenerator.js';
import {applyIndent, INDENT_SIZE, sanitizeIdentifier} from '../utils/index.js';
import {translateFunctionName, translateIdentifier} from '../mappers/index.js';

/**
 * Generates TypeScript code for PineScript statements
 */
export class StatementGenerator {
  private context: GeneratorContext;
  private expressionGen: ExpressionGenerator;
  private output: string[];
  private indent: number;

  constructor(context: GeneratorContext, output: string[], indent: number) {
    this.context = context;
    this.output = output;
    this.indent = indent;
    this.expressionGen = new ExpressionGenerator(context, indent);
  }

  /**
   * Update indent level for nested structures
   */
  setIndent(indent: number): void {
    this.indent = indent;
    this.expressionGen.setIndent(indent);
  }

  /**
   * Generate TypeScript code for multiple statements
   */
  generateStatements(node: ASTNode): void {
    if (!node || !node.children) return;

    for (const child of node.children) {
      this.generateStatement(child);
    }
  }

  /**
   * Generate TypeScript code for a single statement
   */
  generateStatement(node: ASTNode): void {
    if (!node) return;

    switch (node.type) {
      case 'Comment':
        this.emit(`// ${String(node.value || '').replace(/^\/\/\s*/, '')}`);
        break;

      case 'IndicatorDeclaration':
        // Already processed in collectInfo
        break;

      case 'LibraryDeclaration':
        // Already processed in collectInfo
        break;

      case 'ImportStatement':
        // Already processed in collectInfo
        break;

      case 'TypeDeclaration':
        // Already processed in collectInfo and generateUserDefinedTypes
        break;

      case 'MethodDeclaration':
        // Already processed in collectInfo and generateUserDefinedTypes
        break;

      case 'FunctionDeclaration':
        // Handled by FunctionGenerator
        break;

      case 'VariableDeclaration':
        this.generateVariableDeclaration(node);
        break;

      case 'ExpressionStatement':
        if (node.children && node.children.length > 0) {
          const child = node.children[0]!;
          // Check if this is an assignment with input.* function
          if (child.type === 'Assignment' && child.children && child.children.length >= 2) {
            const right = child.children[1];
            if (right && right.type === 'FunctionCall') {
              const funcName = String(right.value || '');
              if (funcName === 'input' || funcName.startsWith('input.')) {
                // Skip - handled as function parameter
                return;
              }
            }
            // Handle other assignments by calling generateAssignment
            this.generateAssignment(child);
            return;
          }
          // Handle reassignment
          if (child.type === 'Reassignment') {
            this.generateReassignment(child);
            return;
          }
          const expr = this.expressionGen.generateExpression(child);
          if (expr) {
            this.emit(`${expr};`);
          }
        }
        break;

      case 'Assignment':
        this.generateAssignment(node);
        break;

      case 'Reassignment':
        this.generateReassignment(node);
        break;

      case 'IfStatement':
        this.generateIfStatement(node);
        break;

      case 'ForLoop':
        this.generateForLoop(node);
        break;

      case 'ForInLoop':
        this.generateForInLoop(node);
        break;

      case 'WhileLoop':
        this.generateWhileLoop(node);
        break;

      case 'TupleDestructuring':
        this.generateTupleDestructuring(node);
        break;

      case 'BreakStatement':
        this.emit('break;');
        break;

      case 'ContinueStatement':
        this.emit('continue;');
        break;

      default:
        const expr = this.expressionGen.generateExpression(node);
        if (expr) {
          this.emit(`${expr};`);
        }
    }
  }

  private generateVariableDeclaration(node: ASTNode): void {
    const name = String(node.value || 'unknown');
    const tsName = sanitizeIdentifier(name);
    this.context.variables.set(name, tsName);

      // Use 'let' if this variable will be reassigned (including compound assignments like +=)
      const declKeyword = this.context.reassignedVariables.has(name) ? 'let' : 'const';

    if (node.children && node.children.length > 0) {
      const init = this.expressionGen.generateExpression(node.children[0]!);
        this.emit(`${declKeyword} ${tsName} = ${init};`);
    } else {
      this.emit(`let ${tsName};`);
    }
  }

  private generateAssignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const left = node.children[0]!;
    const right = node.children[1]!;

    // Skip input.* function assignments - they're handled as function parameters
    if (right.type === 'FunctionCall') {
      const funcName = String(right.value || '');
      if (funcName === 'input' || funcName.startsWith('input.')) {
        // Mark this variable as defined (it's a function parameter)
        if (left.type === 'Identifier') {
          const name = String(left.value || 'unknown');
          this.context.variables.set(name, name);
        }
        return;
      }
    }

    if (left.type === 'Identifier') {
      const name = String(left.value || 'unknown');
      const tsName = sanitizeIdentifier(name);
      
      let rightExpr = this.expressionGen.generateExpression(right);
      
      // Skip assignment if right side is empty (e.g., unsupported functions)
      if (!rightExpr || rightExpr.trim() === '') {
        // Comment it out instead
        this.emit(`// ${tsName} = <unsupported>;`);
        return;
      }
      
      // Check if the right side is a Series expression
      let rightIsSeries = this.expressionGen.isSeriesExpression(right);
      
      // Special case: if this variable will be reassigned and the right side is a numeric literal,
      // convert it to a Series initialized with that constant value
      if (this.context.reassignedVariables.has(name) && right.type === 'NumberLiteral') {
        const numValue = Number(right.value);
        rightExpr = `new Series(bars, () => ${numValue})`;
        rightIsSeries = true;
      }
      
      if (!this.context.variables.has(name)) {
        this.context.variables.set(name, tsName);
        // Use 'let' if this variable will be reassigned, otherwise use 'const'
        const declKeyword = this.context.reassignedVariables.has(name) ? 'let' : 'const';
        this.emit(`${declKeyword} ${tsName} = ${rightExpr};`);
        // If assigning a Series expression, mark this variable as a Series
        if (rightIsSeries) {
          this.context.seriesVariables.add(tsName);
        }
      } else {
        this.emit(`${tsName} = ${rightExpr};`);
      }
    }
  }

  private generateReassignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const left = node.children[0]!;
    const right = node.children[1]!;
    
    // Check if this is a recursive formula
    if (left.type === 'Identifier') {
      const varName = String(left.value || '');
      
      if (this.context.recursiveVariables.has(varName)) {
        // This is a recursive formula - generate bar-by-bar iteration
        this.generateRecursiveFormula(varName, right);
        return;
      }
    }
    
    // Non-recursive reassignment - generate normal code
    const leftExpr = this.expressionGen.generateExpression(left);
    const rightExpr = this.expressionGen.generateExpression(right);
    this.emit(`${leftExpr} = ${rightExpr};`);
  }

  /**
   * Generate bar-by-bar iteration code for recursive formulas
   * e.g., mg := na(mg[1]) ? ta.ema(source, length) : mg[1] + (source - mg[1]) / ...
   */
  generateRecursiveFormula(varName: string, rightNode: ASTNode): void {
    const tsName = this.context.variables.get(varName) || varName;
    
    // We need to generate code that:
    // 1. Creates an array to store computed values
    // 2. Iterates bar by bar
    // 3. Computes each value based on the previous one
    
    this.emit(`// Recursive formula for ${varName}`);
    this.emit(`const ${tsName}Values: number[] = new Array(bars.length).fill(NaN);`);
    
    // Generate the for loop
    this.emit(`for (let i = 0; i < bars.length; i++) {`);
    this.indent++;
    
    // Generate code to get the previous value
    this.emit(`const ${tsName}Prev = i > 0 ? ${tsName}Values[i - 1] : NaN;`);
    
    // Generate the formula - we need to translate it specially
    // Replace history access mg[1] with mgPrev
    const formulaCode = this.generateRecursiveFormulaExpression(rightNode, varName, `${tsName}Prev`);
    this.emit(`${tsName}Values[i] = ${formulaCode};`);
    
    this.indent--;
    this.emit(`}`);
    
    // Convert the array back to a Series
    this.emit(`${tsName} = Series.fromArray(bars, ${tsName}Values);`);
  }

  /**
   * Generate expression code for recursive formulas
   * Replaces history access to the recursive variable with the previous value variable
   */
  generateRecursiveFormulaExpression(node: ASTNode, recursiveVarName: string, prevValueVar: string): string {
    if (!node) return '';
    
    // Special handling for history access to the recursive variable
    if (node.type === 'HistoryAccess') {
      if (node.children && node.children.length >= 1) {
        const base = node.children[0];
        if (base?.type === 'Identifier' && String(base.value) === recursiveVarName) {
          // This is accessing the recursive variable's history - use the previous value
          return prevValueVar;
        }
      }
    }
    
    // For ternary expressions and other complex nodes, we need special handling
    if (node.type === 'TernaryExpression') {
      if (!node.children || node.children.length < 3) return '';
      
      const conditionNode = node.children[0]!;
      const consequentNode = node.children[1]!;
      const alternateNode = node.children[2]!;
      
      const condition = this.generateRecursiveFormulaExpression(conditionNode, recursiveVarName, prevValueVar);
      const consequent = this.generateRecursiveFormulaExpression(consequentNode, recursiveVarName, prevValueVar);
      const alternate = this.generateRecursiveFormulaExpression(alternateNode, recursiveVarName, prevValueVar);
      
      return `(${condition} ? ${consequent} : ${alternate})`;
    }
    
    // For binary expressions
    if (node.type === 'BinaryExpression') {
      if (!node.children || node.children.length < 2) return '';
      
      const left = this.generateRecursiveFormulaExpression(node.children[0]!, recursiveVarName, prevValueVar);
      const right = this.generateRecursiveFormulaExpression(node.children[1]!, recursiveVarName, prevValueVar);
      const op = String(node.value || '+');
      
      return `(${left} ${op} ${right})`;
    }
    
    // For unary expressions
    if (node.type === 'UnaryExpression') {
      if (!node.children || node.children.length < 1) return '';
      
      const operand = this.generateRecursiveFormulaExpression(node.children[0]!, recursiveVarName, prevValueVar);
      const op = String(node.value || '');
      
      return `${op}${operand}`;
    }
    
    // For function calls, we need to convert Series arguments to point values
    if (node.type === 'FunctionCall') {
      const funcName = String(node.value || '');
      
      // For ta.* functions that operate on Series, we need special handling
      // For now, we'll need to extract values at current bar
      if (funcName.startsWith('ta.')) {
        // This is complex - ta functions need the whole series
        // For simplicity in recursive formulas, we'll compute the ta function result once
        // and access it by index
        const args = (node.children || []).map(c => this.expressionGen.generateExpression(c)).join(', ');
        const tempVarName = `_${funcName.replace('.', '_')}_temp`;
        
        // Note: This is a simplification. We should generate this temp variable outside the loop
        // For now, we'll just call the function and get the value at index i
        return `${translateFunctionName(funcName)}(${args}).get(i)`;
      }
      
      // For math.* functions, generate normally but with recursive substitutions
      const args = (node.children || []).map(c => 
        this.generateRecursiveFormulaExpression(c, recursiveVarName, prevValueVar)
      ).join(', ');
      return `${translateFunctionName(funcName)}(${args})`;
    }
    
    // For identifiers, check if it's a Series variable
    if (node.type === 'Identifier') {
      const name = String(node.value || '');
      const mappedName = this.context.variables.get(name) || name;
      
      // Check if this is a Series variable (but not the recursive variable itself)
      if (this.context.seriesVariables.has(mappedName) && name !== recursiveVarName) {
        // Access the value at current bar index
        return `${translateIdentifier(name, this.context.variables)}.get(i)`;
      }
      
      return translateIdentifier(name, this.context.variables);
    }
    
    // For literals and other simple nodes, generate normally
    if (node.type === 'NumberLiteral') {
      return String(node.value);
    }
    
    if (node.type === 'StringLiteral') {
      return `"${String(node.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    
    // Default: try to generate the expression normally
    // This might not work correctly for all cases, but it's a fallback
    return this.expressionGen.generateExpression(node);
  }

  private generateIfStatement(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const condition = node.children[0]!;
    const body = node.children[1]!;
    const alternate = node.children[2];

    const condExpr = this.expressionGen.generateExpression(condition);
    this.emit(`if (${condExpr}) {`);
    this.indent++;
    
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        this.generateStatement(stmt);
      }
    }
    
    this.indent--;

    if (alternate) {
      if (alternate.type === 'IfStatement') {
        // else if - inline the else if
        this.emit('} else ' + this.generateIfStatementInline(alternate));
      } else {
        this.emit('} else {');
        this.indent++;
        if (alternate.type === 'Block' && alternate.children) {
          for (const stmt of alternate.children) {
            this.generateStatement(stmt);
          }
        }
        this.indent--;
        this.emit('}');
      }
    } else {
      this.emit('}');
    }
  }

  generateIfStatementInline(node: ASTNode): string {
    if (!node.children || node.children.length < 2) return '';

    const condition = node.children[0]!;
    const body = node.children[1]!;
    const alternate = node.children[2];

    const condExpr = this.expressionGen.generateExpression(condition);
    const lines: string[] = [];
    const indent = ' '.repeat(INDENT_SIZE);
    lines.push(`if (${condExpr}) {`);
    
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        const stmtCode = this.generateStatementToString(stmt);
        if (stmtCode) {
          lines.push(indent + stmtCode);
        }
      }
    }

    if (alternate) {
      if (alternate.type === 'IfStatement') {
        lines.push('} else ' + this.generateIfStatementInline(alternate));
      } else {
        lines.push('} else {');
        if (alternate.type === 'Block' && alternate.children) {
          for (const stmt of alternate.children) {
            const stmtCode = this.generateStatementToString(stmt);
            if (stmtCode) {
              lines.push(indent + stmtCode);
            }
          }
        }
        lines.push('}');
      }
    } else {
      lines.push('}');
    }
    
    return lines.join('\n' + indent.repeat(this.indent));
  }

  generateStatementToString(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'Comment':
        return `// ${String(node.value || '').replace(/^\/\/\s*/, '')}`;

      case 'VariableDeclaration': {
        const name = String(node.value || 'unknown');
        const tsName = sanitizeIdentifier(name);
        this.context.variables.set(name, tsName);
        if (node.children && node.children.length > 0) {
          const init = this.expressionGen.generateExpression(node.children[0]!);
          return `const ${tsName} = ${init};`;
        } else {
          return `let ${tsName};`;
        }
      }

      case 'ExpressionStatement':
        if (node.children && node.children.length > 0) {
          const expr = this.expressionGen.generateExpression(node.children[0]!);
          if (expr) {
            return `${expr};`;
          }
        }
        return '';

      case 'Assignment': {
        if (!node.children || node.children.length < 2) return '';
        const left = node.children[0]!;
        const right = node.children[1]!;
        if (left.type === 'Identifier') {
          const name = String(left.value || 'unknown');
          const tsName = sanitizeIdentifier(name);
          if (!this.context.variables.has(name)) {
            this.context.variables.set(name, tsName);
            return `const ${tsName} = ${this.expressionGen.generateExpression(right)};`;
          } else {
            return `${tsName} = ${this.expressionGen.generateExpression(right)};`;
          }
        }
        return '';
      }

      case 'Reassignment': {
        if (!node.children || node.children.length < 2) return '';
        const leftExpr = this.expressionGen.generateExpression(node.children[0]!);
        const rightExpr = this.expressionGen.generateExpression(node.children[1]!);
        return `${leftExpr} = ${rightExpr};`;
      }

      case 'BreakStatement':
        return 'break;';

      case 'ContinueStatement':
        return 'continue;';

      default:
        const expr = this.expressionGen.generateExpression(node);
        if (expr) {
          return `${expr};`;
        }
        return '';
    }
  }

  private generateForLoop(node: ASTNode): void {
    if (!node.children || node.children.length < 3) return;

    const varName = node.name || 'i';
    const start = node.children[0]!;
    const end = node.children[1]!;
    const body = node.children[2]!;
    const step = node.step;

    const startExpr = this.expressionGen.generateExpression(start);
    const endExpr = this.expressionGen.generateExpression(end);
    const stepExpr = step ? this.expressionGen.generateExpression(step) : '1';

    this.emit(`for (let ${varName} = ${startExpr}; ${varName} <= ${endExpr}; ${varName} += ${stepExpr}) {`);
    this.indent++;
    
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        this.generateStatement(stmt);
      }
    }
    
    this.indent--;
    this.emit('}');
  }

  private generateForInLoop(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const varName = node.name || 'item';
    const iterable = node.children[0]!;
    const body = node.children[1]!;

    const iterableExpr = this.expressionGen.generateExpression(iterable);
    
    // Check if we have destructured variables (e.g., [index, item])
    if (varName.includes(',')) {
      const vars = varName.split(',');
      this.emit(`for (const [${vars.join(', ')}] of ${iterableExpr}.entries()) {`);
    } else {
      this.emit(`for (const ${varName} of ${iterableExpr}) {`);
    }
    
    this.indent++;
    
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        this.generateStatement(stmt);
      }
    }
    
    this.indent--;
    this.emit('}');
  }

  private generateWhileLoop(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const condition = node.children[0]!;
    const body = node.children[1]!;

    const condExpr = this.expressionGen.generateExpression(condition);
    this.emit(`while (${condExpr}) {`);
    this.indent++;
    
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        this.generateStatement(stmt);
      }
    }
    
    this.indent--;
    this.emit('}');
  }

  private generateTupleDestructuring(node: ASTNode): void {
    if (!node.children || node.children.length < 1) return;

    const varNames = node.name || '';
    const initializer = node.children[0]!;
    const initExpr = this.expressionGen.generateExpression(initializer);

    this.emit(`const [${varNames}] = ${initExpr};`);
  }

  private emit(line: string): void {
    const indented = applyIndent(line, this.indent);
    this.output.push(indented);
  }
}
