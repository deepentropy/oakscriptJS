/**
 * PineScript to TypeScript Code Generator
 * 
 * Transpiles PineScript AST to TypeScript code
 */

import { PineParser, ASTNode } from './PineParser.js';
import type { TranspileOptions, TranspileResult, TranspileError, TranspileWarning } from './types.js';

/**
 * Transpile PineScript source code to TypeScript
 */
export function transpile(source: string, options: TranspileOptions = {}): string {
  const parser = new PineParser();
  const { ast, errors: parseErrors } = parser.parse(source);

  if (parseErrors.length > 0) {
    const errorMsg = parseErrors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
    throw new Error(`Parse errors:\n${errorMsg}`);
  }

  const generator = new CodeGenerator(options);
  return generator.generate(ast);
}

/**
 * Transpile PineScript source code to TypeScript with detailed result
 */
export function transpileWithResult(source: string, options: TranspileOptions = {}): TranspileResult {
  const parser = new PineParser();
  const { ast, errors: parseErrors } = parser.parse(source);

  const errors: TranspileError[] = parseErrors.map(e => ({
    message: e.message,
    line: e.line,
    column: e.column,
  }));

  if (errors.length > 0) {
    return {
      code: '',
      errors,
      warnings: [],
    };
  }

  const generator = new CodeGenerator(options);
  const code = generator.generate(ast);

  return {
    code,
    errors: [],
    warnings: generator.warnings,
  };
}

/**
 * TypeScript code generator
 */
class CodeGenerator {
  private options: TranspileOptions;
  private output: string[] = [];
  private indent: number = 0;
  private indicatorTitle: string = 'Indicator';
  private indicatorOverlay: boolean = false;
  private variables: Map<string, string> = new Map();
  private plots: string[] = [];
  public warnings: TranspileWarning[] = [];

  constructor(options: TranspileOptions) {
    this.options = {
      format: 'function',
      includeImports: true,
      ...options,
    };
  }

  generate(ast: ASTNode): string {
    this.output = [];
    this.variables.clear();
    this.plots = [];

    // First pass: collect information
    this.collectInfo(ast);

    // Generate imports
    if (this.options.includeImports !== false) {
      this.emit("import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';");
      this.emit('');
    }

    // Generate function
    const funcName = this.sanitizeIdentifier(this.indicatorTitle);
    this.emit(`export function ${funcName}(bars: any[]): IndicatorResult {`);
    this.indent++;

    // Generate OHLCV series
    this.emit('// OHLCV Series');
    this.emit("const open = new Series(bars, (bar) => bar.open);");
    this.emit("const high = new Series(bars, (bar) => bar.high);");
    this.emit("const low = new Series(bars, (bar) => bar.low);");
    this.emit("const close = new Series(bars, (bar) => bar.close);");
    this.emit("const volume = new Series(bars, (bar) => bar.volume);");
    this.emit('');

    // Generate body
    this.generateStatements(ast);

    // Generate return statement
    this.emit('');
    this.emit('return {');
    this.indent++;
    this.emit(`metadata: { title: "${this.indicatorTitle}", overlay: ${this.indicatorOverlay} },`);
    this.emit(`plots: [${this.plots.join(', ')}],`);
    this.indent--;
    this.emit('};');

    this.indent--;
    this.emit('}');

    return this.output.join('\n');
  }

  private collectInfo(node: ASTNode): void {
    if (!node) return;

    if (node.type === 'IndicatorDeclaration') {
      // Extract indicator title from first string argument
      if (node.children && node.children.length > 0) {
        const firstArg = node.children[0];
        if (firstArg && firstArg.type === 'StringLiteral' && typeof firstArg.value === 'string') {
          this.indicatorTitle = firstArg.value;
        }
        // Check for overlay argument
        for (const arg of node.children) {
          if (arg && arg.type === 'Assignment') {
            // Handle overlay=true
          }
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.collectInfo(child);
      }
    }
  }

  private generateStatements(node: ASTNode): void {
    if (!node || !node.children) return;

    for (const child of node.children) {
      this.generateStatement(child);
    }
  }

  private generateStatement(node: ASTNode): void {
    if (!node) return;

    switch (node.type) {
      case 'Comment':
        this.emit(`// ${String(node.value || '').replace(/^\/\/\s*/, '')}`);
        break;

      case 'IndicatorDeclaration':
        // Already processed in collectInfo
        break;

      case 'VariableDeclaration':
        this.generateVariableDeclaration(node);
        break;

      case 'ExpressionStatement':
        if (node.children && node.children.length > 0) {
          const expr = this.generateExpression(node.children[0]!);
          if (expr) {
            this.emit(`${expr};`);
          }
        }
        break;

      case 'Assignment':
        this.generateAssignment(node);
        break;

      default:
        const expr = this.generateExpression(node);
        if (expr) {
          this.emit(`${expr};`);
        }
    }
  }

  private generateVariableDeclaration(node: ASTNode): void {
    const name = String(node.value || 'unknown');
    const tsName = this.sanitizeIdentifier(name);
    this.variables.set(name, tsName);

    if (node.children && node.children.length > 0) {
      const init = this.generateExpression(node.children[0]!);
      this.emit(`const ${tsName} = ${init};`);
    } else {
      this.emit(`let ${tsName};`);
    }
  }

  private generateAssignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const left = node.children[0]!;
    const right = node.children[1]!;

    if (left.type === 'Identifier') {
      const name = String(left.value || 'unknown');
      const tsName = this.sanitizeIdentifier(name);
      
      if (!this.variables.has(name)) {
        this.variables.set(name, tsName);
        const rightExpr = this.generateExpression(right);
        this.emit(`const ${tsName} = ${rightExpr};`);
      } else {
        const rightExpr = this.generateExpression(right);
        this.emit(`${tsName} = ${rightExpr};`);
      }
    }
  }

  private generateExpression(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'NumberLiteral':
        return String(node.value);

      case 'StringLiteral':
        return `"${String(node.value).replace(/"/g, '\\"')}"`;

      case 'Identifier':
        return this.translateIdentifier(String(node.value || ''));

      case 'MemberExpression':
        return this.translateMemberExpression(String(node.value || ''));

      case 'FunctionCall':
        return this.generateFunctionCall(node);

      case 'BinaryExpression':
        return this.generateBinaryExpression(node);

      case 'UnaryExpression':
        return this.generateUnaryExpression(node);

      case 'Assignment':
        if (node.children && node.children.length >= 2) {
          const left = this.generateExpression(node.children[0]!);
          const right = this.generateExpression(node.children[1]!);
          return `${left} = ${right}`;
        }
        return '';

      default:
        return '';
    }
  }

  private generateFunctionCall(node: ASTNode): string {
    const name = String(node.value || '');
    const args = (node.children || []).map(c => this.generateExpression(c)).join(', ');

    // Handle plot function specially
    if (name === 'plot') {
      const seriesArg = node.children?.[0];
      if (seriesArg) {
        const seriesName = this.generateExpression(seriesArg);
        this.plots.push(`{ data: ${seriesName}.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }`);
      }
      return '';
    }

    // Translate common function names
    const translated = this.translateFunctionName(name);
    return `${translated}(${args})`;
  }

  private generateBinaryExpression(node: ASTNode): string {
    if (!node.children || node.children.length < 2) return '';

    const left = this.generateExpression(node.children[0]!);
    const right = this.generateExpression(node.children[1]!);
    const op = String(node.value || '+');

    // For Series operations, use method calls
    const seriesOps: Record<string, string> = {
      '+': 'add',
      '-': 'sub',
      '*': 'mul',
      '/': 'div',
      '>': 'gt',
      '<': 'lt',
      '>=': 'gte',
      '<=': 'lte',
      '==': 'eq',
      '!=': 'ne',
      '&&': 'and',
      '||': 'or',
    };

    // Check if this is a Series operation
    if (this.isSeriesExpression(node.children[0]!) || this.isSeriesExpression(node.children[1]!)) {
      const method = seriesOps[op];
      if (method) {
        return `${left}.${method}(${right})`;
      }
    }

    return `(${left} ${op} ${right})`;
  }

  private generateUnaryExpression(node: ASTNode): string {
    if (!node.children || node.children.length < 1) return '';
    
    const operand = this.generateExpression(node.children[0]!);
    const op = String(node.value || '');
    
    return `${op}${operand}`;
  }

  private isSeriesExpression(node: ASTNode): boolean {
    if (!node) return false;
    
    if (node.type === 'Identifier') {
      const name = String(node.value || '');
      return ['open', 'high', 'low', 'close', 'volume'].includes(name);
    }
    
    if (node.type === 'FunctionCall') {
      const name = String(node.value || '');
      return name.startsWith('ta.') || name.startsWith('taCore.');
    }
    
    return false;
  }

  private translateIdentifier(name: string): string {
    // Handle built-in identifiers
    const builtins: Record<string, string> = {
      'na': 'NaN',
      'true': 'true',
      'false': 'false',
    };

    if (builtins[name]) {
      return builtins[name];
    }

    return this.sanitizeIdentifier(name);
  }

  private translateMemberExpression(name: string): string {
    // Handle color constants
    if (name.startsWith('color.')) {
      return `"${name.replace('color.', '')}"`;
    }
    
    return name;
  }

  private translateFunctionName(name: string): string {
    // PineScript namespace mapping
    const mappings: Record<string, string> = {
      'sma': 'ta.sma',
      'ema': 'ta.ema',
      'rsi': 'ta.rsi',
      'macd': 'ta.macd',
      'bb': 'ta.bb',
      'atr': 'ta.atr',
      'stoch': 'ta.stoch',
      'wma': 'ta.wma',
      'vwma': 'ta.vwma',
      'crossover': 'ta.crossover',
      'crossunder': 'ta.crossunder',
      'highest': 'ta.highest',
      'lowest': 'ta.lowest',
      'sum': 'math.sum',
      'abs': 'math.abs',
      'round': 'math.round',
      'ceil': 'math.ceil',
      'floor': 'math.floor',
      'max': 'math.max',
      'min': 'math.min',
      'sqrt': 'math.sqrt',
      'pow': 'math.pow',
      'log': 'math.log',
      'exp': 'math.exp',
    };

    if (mappings[name]) {
      return mappings[name];
    }

    return name;
  }

  private sanitizeIdentifier(name: string): string {
    // Convert to camelCase and remove invalid characters
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1')
      .replace(/__+/g, '_')
      .replace(/^_|_$/g, '') || 'unnamed';
  }

  private emit(line: string): void {
    const indentation = '  '.repeat(this.indent);
    this.output.push(indentation + line);
  }
}

export { CodeGenerator };
