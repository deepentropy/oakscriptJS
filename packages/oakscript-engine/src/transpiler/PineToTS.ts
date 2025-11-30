/**
 * PineScript to TypeScript Code Generator
 * 
 * Transpiles PineScript AST to TypeScript code
 */

import { PineParser, ASTNode } from './PineParser.js';
import type { TranspileOptions, TranspileResult, TranspileError, TranspileWarning, InputDefinition } from './types.js';

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
  /** Number of spaces for each indentation level */
  private static readonly INDENT_SIZE = 2;
  
  private options: TranspileOptions;
  private output: string[] = [];
  private indent: number = 0;
  private indicatorTitle: string = 'Indicator';
  private indicatorOverlay: boolean = false;
  private variables: Map<string, string> = new Map();
  private plots: string[] = [];
  private inputs: InputDefinition[] = [];
  private usesSyminfo: boolean = false;
  private usesTimeframe: boolean = false;
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
    this.inputs = [];
    this.usesSyminfo = false;
    this.usesTimeframe = false;

    // First pass: collect information
    this.collectInfo(ast);

    // Generate imports
    if (this.options.includeImports !== false) {
      this.emit("import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';");
      this.emit('');
    }

    // Generate helper functions
    this.generateHelperFunctions();

    // Generate interfaces if inputs exist
    if (this.inputs.length > 0) {
      this.generateInputsInterface();
    }

    // Generate syminfo interface if used
    if (this.usesSyminfo) {
      this.generateSyminfoInterface();
    }

    // Generate timeframe interface if used
    if (this.usesTimeframe) {
      this.generateTimeframeInterface();
    }

    // Generate function
    const funcName = this.sanitizeIdentifier(this.indicatorTitle);
    const params = this.generateFunctionParams();
    this.emit(`export function ${funcName}(${params}): IndicatorResult {`);
    this.indent++;

    // Destructure inputs if any
    if (this.inputs.length > 0) {
      this.generateInputsDestructuring();
    }

    // Generate syminfo setup if used
    if (this.usesSyminfo) {
      this.generateSyminfoSetup();
    }

    // Generate timeframe setup if used
    if (this.usesTimeframe) {
      this.generateTimeframeSetup();
    }

    // Generate OHLCV series
    this.emit('// OHLCV Series');
    this.emit("const open = new Series(bars, (bar) => bar.open);");
    this.emit("const high = new Series(bars, (bar) => bar.high);");
    this.emit("const low = new Series(bars, (bar) => bar.low);");
    this.emit("const close = new Series(bars, (bar) => bar.close);");
    this.emit("const volume = new Series(bars, (bar) => bar.volume);");
    this.emit('');

    // Generate calculated price sources
    this.emit('// Calculated price sources');
    this.emit('const hl2 = high.add(low).div(2);');
    this.emit('const hlc3 = high.add(low).add(close).div(3);');
    this.emit('const ohlc4 = open.add(high).add(low).add(close).div(4);');
    this.emit('const hlcc4 = high.add(low).add(close).add(close).div(4);');
    this.emit('');

    // Generate time series
    this.emit('// Time series');
    this.emit('const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());');
    this.emit('const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);');
    this.emit('const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());');
    this.emit('const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);');
    this.emit('const hour = new Series(bars, (bar) => new Date(bar.time).getHours());');
    this.emit('const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());');
    this.emit('');

    // Generate bar_index and last_bar_index
    this.emit('// Bar index');
    this.emit('const last_bar_index = bars.length - 1;');
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

  private generateHelperFunctions(): void {
    this.emit('// Helper functions');
    this.emit('function na(value: number | null | undefined): boolean {');
    this.indent++;
    this.emit('return value === null || value === undefined || Number.isNaN(value);');
    this.indent--;
    this.emit('}');
    this.emit('');
    this.emit('function nz(value: number | null | undefined, replacement: number = 0): number {');
    this.indent++;
    this.emit('return na(value) ? replacement : value as number;');
    this.indent--;
    this.emit('}');
    this.emit('');
  }

  private generateInputsInterface(): void {
    this.emit('export interface IndicatorInputs {');
    this.indent++;
    for (const input of this.inputs) {
      const tsType = this.getInputTsType(input);
      this.emit(`${input.name}: ${tsType};`);
    }
    this.indent--;
    this.emit('}');
    this.emit('');

    // Generate default inputs
    this.emit('const defaultInputs: IndicatorInputs = {');
    this.indent++;
    for (const input of this.inputs) {
      const defaultValue = this.formatDefaultValue(input);
      this.emit(`${input.name}: ${defaultValue},`);
    }
    this.indent--;
    this.emit('};');
    this.emit('');
  }

  private generateSyminfoInterface(): void {
    this.emit('export interface SymbolInfo {');
    this.indent++;
    this.emit('ticker: string;');
    this.emit('tickerid: string;');
    this.emit('currency: string;');
    this.emit('mintick: number;');
    this.emit('pointvalue: number;');
    this.emit('type: string;');
    this.indent--;
    this.emit('}');
    this.emit('');

    this.emit('const defaultSyminfo: SymbolInfo = {');
    this.indent++;
    this.emit('ticker: "UNKNOWN",');
    this.emit('tickerid: "UNKNOWN",');
    this.emit('currency: "USD",');
    this.emit('mintick: 0.01,');
    this.emit('pointvalue: 1,');
    this.emit('type: "stock",');
    this.indent--;
    this.emit('};');
    this.emit('');
  }

  private generateTimeframeInterface(): void {
    this.emit('export interface TimeframeInfo {');
    this.indent++;
    this.emit('period: string;');
    this.emit('multiplier: number;');
    this.emit('isintraday: boolean;');
    this.emit('isdaily: boolean;');
    this.emit('isweekly: boolean;');
    this.emit('ismonthly: boolean;');
    this.indent--;
    this.emit('}');
    this.emit('');

    this.emit('const defaultTimeframe: TimeframeInfo = {');
    this.indent++;
    this.emit('period: "D",');
    this.emit('multiplier: 1,');
    this.emit('isintraday: false,');
    this.emit('isdaily: true,');
    this.emit('isweekly: false,');
    this.emit('ismonthly: false,');
    this.indent--;
    this.emit('};');
    this.emit('');
  }

  private generateFunctionParams(): string {
    const params: string[] = ['bars: any[]'];
    
    if (this.inputs.length > 0) {
      params.push('inputs: Partial<IndicatorInputs> = {}');
    }
    
    if (this.usesSyminfo) {
      params.push('syminfoParam?: Partial<SymbolInfo>');
    }
    
    if (this.usesTimeframe) {
      params.push('timeframeParam?: Partial<TimeframeInfo>');
    }
    
    return params.join(', ');
  }

  private generateInputsDestructuring(): void {
    const inputNames = this.inputs.map(i => i.name).join(', ');
    this.emit(`const { ${inputNames} } = { ...defaultInputs, ...inputs };`);
    this.emit('');
  }

  private generateSyminfoSetup(): void {
    this.emit('const syminfo = { ...defaultSyminfo, ...syminfoParam };');
    this.emit('');
  }

  private generateTimeframeSetup(): void {
    this.emit('const timeframe = { ...defaultTimeframe, ...timeframeParam };');
    this.emit('');
  }

  private getInputTsType(input: InputDefinition): string {
    switch (input.inputType) {
      case 'int':
      case 'float':
        return 'number';
      case 'bool':
        return 'boolean';
      case 'string':
        if (input.options && input.options.length > 0) {
          return input.options.map(o => `"${o}"`).join(' | ');
        }
        return 'string';
      case 'color':
        return 'string';
      case 'source':
        return '"open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4"';
      default:
        return 'unknown';
    }
  }

  private formatDefaultValue(input: InputDefinition): string {
    switch (input.inputType) {
      case 'int':
      case 'float':
        return String(input.defval ?? 0);
      case 'bool':
        return String(input.defval ?? false);
      case 'string':
        return `"${input.defval ?? ''}"`;
      case 'color':
        return `"${this.colorToHex(input.defval as string) || '#000000'}"`;
      case 'source':
        return `"${input.defval ?? 'close'}"`;
      default:
        return 'undefined';
    }
  }

  private colorToHex(color: string | undefined): string {
    if (!color) return '#000000';
    
    // Handle color.* constants
    const colorMap: Record<string, string> = {
      'color.green': '#00FF00',
      'color.red': '#FF0000',
      'color.blue': '#0000FF',
      'color.white': '#FFFFFF',
      'color.black': '#000000',
      'color.yellow': '#FFFF00',
      'color.orange': '#FFA500',
      'color.purple': '#800080',
      'color.gray': '#808080',
      'color.silver': '#C0C0C0',
      'color.aqua': '#00FFFF',
      'color.lime': '#00FF00',
      'color.maroon': '#800000',
      'color.navy': '#000080',
      'color.olive': '#808000',
      'color.teal': '#008080',
      'color.fuchsia': '#FF00FF',
    };
    
    return colorMap[color] || color;
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

    // Collect input definitions from ExpressionStatement containing Assignment
    // This is the main path - we only check at ExpressionStatement level to avoid duplicates
    if (node.type === 'ExpressionStatement' && node.children && node.children.length > 0) {
      const expr = node.children[0];
      if (expr && expr.type === 'Assignment' && expr.children && expr.children.length >= 2) {
        const left = expr.children[0];
        const right = expr.children[1];
        if (left && left.type === 'Identifier' && right && right.type === 'FunctionCall') {
          const funcName = String(right.value || '');
          if (funcName.startsWith('input.')) {
            const varName = String(left.value || '');
            // Check if we already have this input to avoid duplicates
            if (!this.inputs.some(i => i.name === varName)) {
              const inputDef = this.parseInputFunction(varName, funcName, right.children || []);
              if (inputDef) {
                this.inputs.push(inputDef);
              }
            }
          }
        }
      }
    }

    // Detect syminfo usage
    if (node.type === 'MemberExpression') {
      const memberName = String(node.value || '');
      if (memberName.startsWith('syminfo.')) {
        this.usesSyminfo = true;
      }
      if (memberName.startsWith('timeframe.')) {
        this.usesTimeframe = true;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.collectInfo(child);
      }
    }
  }

  private parseInputFunction(varName: string, funcName: string, args: ASTNode[]): InputDefinition | null {
    const inputTypeMap: Record<string, InputDefinition['inputType']> = {
      'input.int': 'int',
      'input.float': 'float',
      'input.bool': 'bool',
      'input.string': 'string',
      'input.color': 'color',
      'input.source': 'source',
    };

    const inputType = inputTypeMap[funcName];
    if (!inputType) return null;

    const input: InputDefinition = {
      name: varName,
      inputType,
      defval: this.getDefaultValueFromArgs(args, inputType),
    };

    // Parse named arguments
    for (const arg of args) {
      if (arg && arg.type === 'Assignment' && arg.children && arg.children.length >= 2) {
        const paramName = arg.children[0]?.type === 'Identifier' ? String(arg.children[0].value || '') : '';
        const paramValue = arg.children[1];

        switch (paramName) {
          case 'title':
            if (paramValue?.type === 'StringLiteral') {
              input.title = String(paramValue.value || '');
            }
            break;
          case 'defval':
            input.defval = this.extractValue(paramValue, inputType);
            break;
          case 'minval':
            if (paramValue?.type === 'NumberLiteral') {
              input.minval = Number(paramValue.value);
            }
            break;
          case 'maxval':
            if (paramValue?.type === 'NumberLiteral') {
              input.maxval = Number(paramValue.value);
            }
            break;
          case 'step':
            if (paramValue?.type === 'NumberLiteral') {
              input.step = Number(paramValue.value);
            }
            break;
          case 'options':
            // Handle options array - it's parsed as FunctionCall with array syntax
            input.options = this.parseOptionsArray(paramValue);
            break;
        }
      }
    }

    // If title not set from named arg, check second positional argument
    if (!input.title && args.length > 1 && args[1]?.type === 'StringLiteral') {
      input.title = String(args[1].value || '');
    }

    return input;
  }

  private getDefaultValueFromArgs(args: ASTNode[], inputType: InputDefinition['inputType']): unknown {
    // First positional argument is typically the default value
    if (args.length === 0) return this.getDefaultForType(inputType);
    
    const firstArg = args[0];
    if (!firstArg) return this.getDefaultForType(inputType);

    // Skip if first arg is a named argument
    if (firstArg.type === 'Assignment') {
      // Check if it's defval=...
      if (firstArg.children && firstArg.children[0]?.type === 'Identifier') {
        const paramName = String(firstArg.children[0].value || '');
        if (paramName === 'defval' && firstArg.children[1]) {
          return this.extractValue(firstArg.children[1], inputType);
        }
      }
      return this.getDefaultForType(inputType);
    }

    return this.extractValue(firstArg, inputType);
  }

  private extractValue(node: ASTNode | undefined, inputType: InputDefinition['inputType']): unknown {
    if (!node) return this.getDefaultForType(inputType);

    switch (node.type) {
      case 'NumberLiteral':
        return Number(node.value);
      case 'StringLiteral':
        return String(node.value || '');
      case 'Identifier':
        const val = String(node.value || '');
        // Handle boolean values
        if (val === 'true') return true;
        if (val === 'false') return false;
        // Handle source values
        if (['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'].includes(val)) {
          return val;
        }
        return val;
      case 'MemberExpression':
        // Handle color.green, etc.
        return String(node.value || '');
      default:
        return this.getDefaultForType(inputType);
    }
  }

  private getDefaultForType(inputType: InputDefinition['inputType']): unknown {
    switch (inputType) {
      case 'int': return 0;
      case 'float': return 0.0;
      case 'bool': return false;
      case 'string': return '';
      case 'color': return '#000000';
      case 'source': return 'close';
      default: return null;
    }
  }

  private parseOptionsArray(node: ASTNode | undefined): string[] | undefined {
    if (!node) return undefined;
    
    // Handle ArrayLiteral type from the parser
    if (node.type === 'ArrayLiteral' && node.children && node.children.length > 0) {
      const options: string[] = [];
      for (const child of node.children) {
        if (child?.type === 'StringLiteral') {
          options.push(String(child.value || ''));
        }
      }
      if (options.length > 0) return options;
    }
    
    // Fallback: Options might be parsed as other node types with children
    if (node.children && node.children.length > 0) {
      const options: string[] = [];
      for (const child of node.children) {
        if (child?.type === 'StringLiteral') {
          options.push(String(child.value || ''));
        }
      }
      if (options.length > 0) return options;
    }
    
    return undefined;
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
          const child = node.children[0]!;
          // Check if this is an assignment with input.* function
          if (child.type === 'Assignment' && child.children && child.children.length >= 2) {
            const right = child.children[1];
            if (right && right.type === 'FunctionCall') {
              const funcName = String(right.value || '');
              if (funcName.startsWith('input.')) {
                // Skip - handled as function parameter
                return;
              }
            }
          }
          const expr = this.generateExpression(child);
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

    // Skip input.* function assignments - they're handled as function parameters
    if (right.type === 'FunctionCall') {
      const funcName = String(right.value || '');
      if (funcName.startsWith('input.')) {
        // Mark this variable as defined (it's a function parameter)
        if (left.type === 'Identifier') {
          const name = String(left.value || 'unknown');
          this.variables.set(name, name);
        }
        return;
      }
    }

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

  private generateReassignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const left = node.children[0]!;
    const right = node.children[1]!;
    const leftExpr = this.generateExpression(left);
    const rightExpr = this.generateExpression(right);
    
    this.emit(`${leftExpr} = ${rightExpr};`);
  }

  private generateIfStatement(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;

    const condition = node.children[0]!;
    const body = node.children[1]!;
    const alternate = node.children[2];

    const condExpr = this.generateExpression(condition);
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

  private generateIfStatementInline(node: ASTNode): string {
    if (!node.children || node.children.length < 2) return '';

    const condition = node.children[0]!;
    const body = node.children[1]!;
    const alternate = node.children[2];

    const condExpr = this.generateExpression(condition);
    const lines: string[] = [];
    const indent = this.getIndentString();
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

  private generateStatementToString(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'Comment':
        return `// ${String(node.value || '').replace(/^\/\/\s*/, '')}`;

      case 'VariableDeclaration': {
        const name = String(node.value || 'unknown');
        const tsName = this.sanitizeIdentifier(name);
        this.variables.set(name, tsName);
        if (node.children && node.children.length > 0) {
          const init = this.generateExpression(node.children[0]!);
          return `const ${tsName} = ${init};`;
        } else {
          return `let ${tsName};`;
        }
      }

      case 'ExpressionStatement':
        if (node.children && node.children.length > 0) {
          const expr = this.generateExpression(node.children[0]!);
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
          const tsName = this.sanitizeIdentifier(name);
          if (!this.variables.has(name)) {
            this.variables.set(name, tsName);
            return `const ${tsName} = ${this.generateExpression(right)};`;
          } else {
            return `${tsName} = ${this.generateExpression(right)};`;
          }
        }
        return '';
      }

      case 'Reassignment': {
        if (!node.children || node.children.length < 2) return '';
        const leftExpr = this.generateExpression(node.children[0]!);
        const rightExpr = this.generateExpression(node.children[1]!);
        return `${leftExpr} = ${rightExpr};`;
      }

      case 'BreakStatement':
        return 'break;';

      case 'ContinueStatement':
        return 'continue;';

      default:
        const expr = this.generateExpression(node);
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

    const startExpr = this.generateExpression(start);
    const endExpr = this.generateExpression(end);
    const stepExpr = step ? this.generateExpression(step) : '1';

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

    const iterableExpr = this.generateExpression(iterable);
    
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

    const condExpr = this.generateExpression(condition);
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
    const initExpr = this.generateExpression(initializer);

    this.emit(`const [${varNames}] = ${initExpr};`);
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

      case 'Reassignment':
        if (node.children && node.children.length >= 2) {
          const left = this.generateExpression(node.children[0]!);
          const right = this.generateExpression(node.children[1]!);
          return `${left} = ${right}`;
        }
        return '';

      case 'TernaryExpression':
        return this.generateTernaryExpression(node);

      case 'HistoryAccess':
        return this.generateHistoryAccess(node);

      case 'SwitchExpression':
        return this.generateSwitchExpression(node);

      default:
        return '';
    }
  }

  private generateTernaryExpression(node: ASTNode): string {
    if (!node.children || node.children.length < 3) return '';

    const condition = this.generateExpression(node.children[0]!);
    const consequent = this.generateExpression(node.children[1]!);
    const alternate = this.generateExpression(node.children[2]!);

    return `(${condition} ? ${consequent} : ${alternate})`;
  }

  private generateHistoryAccess(node: ASTNode): string {
    if (!node.children || node.children.length < 2) return '';

    const base = this.generateExpression(node.children[0]!);
    const offset = this.generateExpression(node.children[1]!);

    return `${base}.get(${offset})`;
  }

  private generateSwitchExpression(node: ASTNode): string {
    if (!node.children || node.children.length === 0) return '';

    // Separate the switch expression from cases
    const children = node.children;
    let switchExpr: ASTNode | undefined;
    let cases: ASTNode[] = [];

    // First child might be the switch expression or a case
    if (children[0] && children[0].type !== 'SwitchCase' && children[0].type !== 'SwitchDefault') {
      switchExpr = children[0];
      cases = children.slice(1);
    } else {
      cases = children;
    }

    // Generate IIFE-wrapped switch
    const lines: string[] = [];
    const indent = this.getIndentString();
    lines.push('(() => {');
    
    if (switchExpr) {
      const switchValue = this.generateExpression(switchExpr);
      lines.push(`${indent}switch (${switchValue}) {`);
      
      for (const caseNode of cases) {
        if (caseNode.type === 'SwitchCase' && caseNode.children && caseNode.children.length >= 2) {
          const caseValue = this.generateExpression(caseNode.children[0]!);
          const result = this.generateExpression(caseNode.children[1]!);
          lines.push(`${indent}${indent}case ${caseValue}: return ${result};`);
        } else if (caseNode.type === 'SwitchDefault' && caseNode.children && caseNode.children.length >= 1) {
          const result = this.generateExpression(caseNode.children[0]!);
          lines.push(`${indent}${indent}default: return ${result};`);
        }
      }
      
      lines.push(`${indent}}`);
    } else {
      // Condition-based switch (like if-else chain)
      let isFirst = true;
      for (const caseNode of cases) {
        if (caseNode.type === 'SwitchCase' && caseNode.children && caseNode.children.length >= 2) {
          const condition = this.generateExpression(caseNode.children[0]!);
          const result = this.generateExpression(caseNode.children[1]!);
          if (isFirst) {
            lines.push(`${indent}if (${condition}) return ${result};`);
            isFirst = false;
          } else {
            lines.push(`${indent}else if (${condition}) return ${result};`);
          }
        } else if (caseNode.type === 'SwitchDefault' && caseNode.children && caseNode.children.length >= 1) {
          const result = this.generateExpression(caseNode.children[0]!);
          lines.push(`${indent}else return ${result};`);
        }
      }
    }
    
    lines.push('})()');
    
    return lines.join('\n' + indent.repeat(this.indent));
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

    // Handle bgcolor function specially
    if (name === 'bgcolor') {
      return '';
    }

    // Handle input.* functions - return variable name since already extracted
    if (name.startsWith('input.')) {
      // This should not typically happen since input calls are processed at assignment level
      // But if it does, return empty string
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
      // Include OHLCV and calculated price sources
      return ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'].includes(name);
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
      'bar_index': 'i',
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
    
    // Handle barstate variables
    const barstateMap: Record<string, string> = {
      'barstate.isfirst': '(i === 0)',
      'barstate.islast': '(i === bars.length - 1)',
      'barstate.isconfirmed': 'true',
      'barstate.islastconfirmedhistory': '(i === bars.length - 1)',
      'barstate.isrealtime': 'false',
      'barstate.isnew': 'true',
    };
    
    if (barstateMap[name]) {
      return barstateMap[name];
    }

    // Handle syminfo variables
    if (name.startsWith('syminfo.')) {
      const prop = name.replace('syminfo.', '');
      return `syminfo.${prop}`;
    }

    // Handle timeframe variables
    if (name.startsWith('timeframe.')) {
      const prop = name.replace('timeframe.', '');
      return `timeframe.${prop}`;
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

  private getIndentString(): string {
    return ' '.repeat(CodeGenerator.INDENT_SIZE);
  }

  private emit(line: string): void {
    const indentation = this.getIndentString().repeat(this.indent);
    this.output.push(indentation + line);
  }
}

export { CodeGenerator };
