/**
 * PineScript to TypeScript Code Generator
 * 
 * Transpiles PineScript AST to TypeScript code
 */

import { PineParser, ASTNode } from './PineParser.js';
import type { TranspileOptions, TranspileResult, TranspileError, TranspileWarning, InputDefinition, TypeInfo, MethodInfo, FieldInfo, ImportInfo, LibraryInfo } from './types.js';

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
  private types: Map<string, TypeInfo> = new Map();
  private methods: Map<string, MethodInfo[]> = new Map();
  private imports: ImportInfo[] = [];
  private isLibrary: boolean = false;
  private libraryInfo: LibraryInfo | null = null;
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
    this.types.clear();
    this.methods.clear();
    this.imports = [];
    this.isLibrary = false;
    this.libraryInfo = null;

    // First pass: collect information
    this.collectInfo(ast);

    // Generate imports
    if (this.options.includeImports !== false) {
      this.emit("import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';");
      
      // Generate library imports
      for (const imp of this.imports) {
        const moduleName = `${imp.publisher}_${imp.libraryName}_v${imp.version}`;
        this.emit(`import * as ${imp.alias} from './libs/${moduleName}';`);
      }
      
      this.emit('');
    }

    // Generate helper functions
    this.generateHelperFunctions();

    // Generate user-defined types (interfaces and namespace objects)
    if (this.types.size > 0) {
      this.generateUserDefinedTypes();
    }

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

  private generateUserDefinedTypes(): void {
    this.emit('// User-defined types');
    
    for (const [typeName, typeInfo] of this.types) {
      const exportKeyword = typeInfo.exported ? 'export ' : '';
      
      // Generate interface
      this.emit(`${exportKeyword}interface ${typeName} {`);
      this.indent++;
      for (const field of typeInfo.fields) {
        const tsType = this.pineTypeToTs(field.fieldType);
        this.emit(`${field.name}: ${tsType};`);
      }
      this.indent--;
      this.emit('}');
      this.emit('');
      
      // Generate namespace object with new() factory and methods
      this.emit(`${exportKeyword}const ${typeName} = {`);
      this.indent++;
      
      // Generate new() factory function
      const params = typeInfo.fields.map(f => {
        const tsType = this.pineTypeToTs(f.fieldType);
        const defaultVal = f.defaultValue || this.getDefaultForPineType(f.fieldType);
        return `${f.name}: ${tsType} = ${defaultVal}`;
      }).join(', ');
      
      const fieldNames = typeInfo.fields.map(f => f.name).join(', ');
      
      this.emit(`new: (${params}): ${typeName} => ({`);
      this.indent++;
      this.emit(`${fieldNames},`);
      this.indent--;
      this.emit('}),');
      
      // Generate methods bound to this type
      const typeMethods = this.methods.get(typeName) || [];
      for (const method of typeMethods) {
        this.generateMethodInNamespace(method, typeName);
      }
      
      this.indent--;
      this.emit('};');
      this.emit('');
    }
  }

  private generateMethodInNamespace(method: MethodInfo, typeName: string): void {
    const selfType = typeName;
    const otherParams = method.parameters.map(p => {
      const tsType = this.pineTypeToTs(p.paramType);
      const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
      return `${p.name}: ${tsType}${defaultVal}`;
    }).join(', ');
    
    const allParams = otherParams ? `self: ${selfType}, ${otherParams}` : `self: ${selfType}`;
    
    // Determine return type - for now, use void or any
    const returnType = 'void';
    
    this.emit(`${method.name}: (${allParams}): ${returnType} => {`);
    this.indent++;
    
    // Generate method body
    if (method.bodyNode) {
      const bodyNode = method.bodyNode as ASTNode;
      if (bodyNode.type === 'Block' && bodyNode.children) {
        for (const stmt of bodyNode.children) {
          this.generateStatement(stmt);
        }
      } else {
        // Single expression body
        const expr = this.generateExpression(bodyNode);
        this.emit(`return ${expr};`);
      }
    }
    
    this.indent--;
    this.emit('},');
  }

  private pineTypeToTs(pineType: string): string {
    // Map PineScript types to TypeScript types
    const typeMap: Record<string, string> = {
      'int': 'number',
      'float': 'number',
      'bool': 'boolean',
      'string': 'string',
      'color': 'string',
      'line': 'Line | null',
      'label': 'Label | null',
      'box': 'Box | null',
      'table': 'Table | null',
      'chart.point': 'ChartPoint',
    };
    
    // Handle generic array types
    if (pineType.startsWith('array<') && pineType.endsWith('>')) {
      const innerType = pineType.slice(6, -1);
      return `${this.pineTypeToTs(innerType)}[]`;
    }
    
    if (typeMap[pineType]) {
      return typeMap[pineType];
    }
    
    // Check if it's a user-defined type
    if (this.types.has(pineType)) {
      return pineType;
    }
    
    // Assume it's a custom type (e.g., user-defined)
    return pineType;
  }

  private getDefaultForPineType(pineType: string): string {
    const defaults: Record<string, string> = {
      'int': '0',
      'float': '0.0',
      'bool': 'false',
      'string': '""',
      'color': '"#000000"',
      'line': 'null',
      'label': 'null',
      'box': 'null',
      'table': 'null',
      'chart.point': 'null',
    };
    
    // Handle generic array types
    if (pineType.startsWith('array<')) {
      return '[]';
    }
    
    if (defaults[pineType]) {
      return defaults[pineType];
    }
    
    // For user-defined types, use null to avoid potential infinite recursion
    // (when a type has a field of its own type)
    // Runtime code should handle this with explicit instantiation
    if (this.types.has(pineType)) {
      return 'null';
    }
    
    return 'null';
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

    // Collect library declaration
    if (node.type === 'LibraryDeclaration') {
      this.isLibrary = true;
      if (node.children && node.children.length > 0) {
        const firstArg = node.children[0];
        if (firstArg && firstArg.type === 'StringLiteral' && typeof firstArg.value === 'string') {
          this.indicatorTitle = firstArg.value;
          this.libraryInfo = {
            name: firstArg.value,
            overlay: false,
          };
        }
        // Check for overlay argument
        for (const arg of node.children) {
          if (arg && arg.type === 'Assignment' && arg.children && arg.children.length >= 2) {
            const paramName = arg.children[0]?.type === 'Identifier' ? String(arg.children[0].value || '') : '';
            if (paramName === 'overlay' && arg.children[1]) {
              const paramValue = arg.children[1];
              if (paramValue.type === 'Identifier' && paramValue.value === 'true') {
                if (this.libraryInfo) {
                  this.libraryInfo.overlay = true;
                }
              }
            }
          }
        }
      }
    }

    // Collect import statements
    if (node.type === 'ImportStatement') {
      const alias = String(node.value || '');
      let publisher = '';
      let libraryName = '';
      let version = 0;
      
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'Publisher') {
            publisher = String(child.value || '');
          } else if (child.type === 'LibraryName') {
            libraryName = String(child.value || '');
          } else if (child.type === 'Version') {
            version = typeof child.value === 'number' ? child.value : 0;
          }
        }
      }
      
      this.imports.push({
        publisher,
        libraryName,
        version,
        alias,
      });
    }

    // Collect type definitions
    if (node.type === 'TypeDeclaration') {
      const typeName = String(node.value || '');
      const fields: FieldInfo[] = [];
      
      if (node.children) {
        for (const fieldNode of node.children) {
          if (fieldNode.type === 'FieldDeclaration') {
            const field: FieldInfo = {
              name: String(fieldNode.value || ''),
              fieldType: String(fieldNode.fieldType || 'unknown'),
              defaultValue: fieldNode.children && fieldNode.children.length > 0 
                ? this.generateExpression(fieldNode.children[0])
                : undefined,
              isOptional: !!(fieldNode.children && fieldNode.children.length > 0),
            };
            fields.push(field);
          }
        }
      }
      
      this.types.set(typeName, {
        name: typeName,
        exported: node.exported || false,
        fields: fields,
      });
    }

    // Collect method definitions
    if (node.type === 'MethodDeclaration') {
      const methodName = String(node.value || '');
      const boundType = String(node.boundType || '');
      
      const methodInfo: MethodInfo = {
        name: methodName,
        boundType: boundType,
        exported: node.exported || false,
        parameters: (node.params || []).map(p => ({
          name: String(p.value || ''),
          paramType: String(p.fieldType || 'unknown'),
          defaultValue: p.children && p.children.length > 0 
            ? this.generateExpression(p.children[0])
            : undefined,
        })),
        bodyNode: node.children && node.children.length > 0 ? node.children[0] : undefined,
      };
      
      if (!this.methods.has(boundType)) {
        this.methods.set(boundType, []);
      }
      this.methods.get(boundType)!.push(methodInfo);
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
    
    // Also check params for method declarations
    if (node.params) {
      for (const param of node.params) {
        this.collectInfo(param);
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
        this.generateFunctionDeclaration(node);
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

  private generateFunctionDeclaration(node: ASTNode): void {
    const name = String(node.value || 'unknown');
    const tsName = this.sanitizeIdentifier(name);
    const paramsStr = String(node.name || '');
    const params = paramsStr ? paramsStr.split(',').map(p => `${p.trim()}: any`).join(', ') : '';
    
    // Mark function as defined
    this.variables.set(name, tsName);

    // Generate function signature
    this.emit(`function ${tsName}(${params}): any {`);
    this.indent++;

    // Generate function body
    if (node.children && node.children.length > 0) {
      const body = node.children[0]!;
      if (body.type === 'Block' && body.children) {
        // Check if this is a single expression block (like a switch expression)
        if (body.children.length === 1) {
          const singleChild = body.children[0]!;
          // If it's an expression statement containing a switch or other expression, return it
          if (singleChild.type === 'ExpressionStatement' && singleChild.children && singleChild.children.length > 0) {
            const expr = this.generateExpression(singleChild.children[0]!);
            this.emit(`return ${expr};`);
          } else {
            // Generate as a statement
            this.generateStatement(singleChild);
          }
        } else {
          // Multiple statements
          for (const stmt of body.children) {
            this.generateStatement(stmt);
          }
        }
      } else {
        // Single expression body - return it
        const expr = this.generateExpression(body);
        this.emit(`return ${expr};`);
      }
    }

    this.indent--;
    this.emit('}');
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
      
      const rightExpr = this.generateExpression(right);
      
      // Skip assignment if right side is empty (e.g., unsupported functions)
      if (!rightExpr || rightExpr.trim() === '') {
        // Comment it out instead
        this.emit(`// ${tsName} = <unsupported>;`);
        return;
      }
      
      if (!this.variables.has(name)) {
        this.variables.set(name, tsName);
        this.emit(`const ${tsName} = ${rightExpr};`);
      } else {
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

      case 'TypeInstantiation':
        return this.generateTypeInstantiation(node);

      case 'MethodCall':
        return this.generateMethodCall(node);

      case 'FieldAccess':
        return this.generateFieldAccess(node);

      case 'GenericFunctionCall':
        return this.generateGenericFunctionCall(node);

      case 'BinaryExpression':
        return this.generateBinaryExpression(node);

      case 'UnaryExpression':
        return this.generateUnaryExpression(node);

      case 'Assignment':
        if (node.children && node.children.length >= 2) {
          const left = this.generateExpression(node.children[0]!);
          const right = this.generateExpression(node.children[1]!);
          // If right is empty (unsupported function), return empty to skip the whole statement
          if (!right || right.trim() === '') {
            return '';
          }
          return `${left} = ${right}`;
        }
        return '';

      case 'Reassignment':
        if (node.children && node.children.length >= 2) {
          const left = this.generateExpression(node.children[0]!);
          const right = this.generateExpression(node.children[1]!);
          // If right is empty (unsupported function), return empty to skip the whole statement
          if (!right || right.trim() === '') {
            return '';
          }
          return `${left} = ${right}`;
        }
        return '';

      case 'TernaryExpression':
        return this.generateTernaryExpression(node);

      case 'HistoryAccess':
        return this.generateHistoryAccess(node);

      case 'SwitchExpression':
        return this.generateSwitchExpression(node);

      case 'ArrayLiteral':
        return this.generateArrayLiteral(node);

      default:
        return '';
    }
  }

  private generateTypeInstantiation(node: ASTNode): string {
    const typeName = String(node.value || '');
    const args = (node.children || []).map(c => this.generateExpression(c)).join(', ');
    return `${typeName}.new(${args})`;
  }

  private generateMethodCall(node: ASTNode): string {
    const methodName = String(node.value || '');
    if (!node.children || node.children.length < 1) return '';
    
    const objectNode = node.children[0];
    const args = node.children.slice(1).map(c => this.generateExpression(c)).join(', ');
    const objectExpr = this.generateExpression(objectNode);
    
    // Try to determine the type of the object to generate TypeName.method(object, args)
    // For now, if it's a simple identifier and we know its type from context, use that
    // Otherwise, generate object.method(args) style (JS compatible)
    
    // Check if object is a type instantiation or we have type info
    const objectType = this.inferObjectType(objectNode);
    if (objectType && this.types.has(objectType)) {
      // Verify the method exists on this type before using TypeName.method pattern
      const typeMethods = this.methods.get(objectType) || [];
      if (typeMethods.some(m => m.name === methodName)) {
        const allArgs = args ? `${objectExpr}, ${args}` : objectExpr;
        return `${objectType}.${methodName}(${allArgs})`;
      }
    }
    
    // Fall back to object.method(args) style for built-in methods and unknown types
    return args ? `${objectExpr}.${methodName}(${args})` : `${objectExpr}.${methodName}()`;
  }

  private generateFieldAccess(node: ASTNode): string {
    const fieldName = String(node.value || '');
    if (!node.children || node.children.length < 1) return fieldName;
    
    const objectExpr = this.generateExpression(node.children[0]);
    return `${objectExpr}.${fieldName}`;
  }

  private generateGenericFunctionCall(node: ASTNode): string {
    const funcName = String(node.value || '');
    const genericType = String(node.name || '');
    const args = (node.children || []).map(c => this.generateExpression(c)).join(', ');
    
    // Handle array.new<Type>() -> []
    if (funcName === 'array.new') {
      if (args) {
        // array.new<Type>(size) -> new Array(size).fill(null)
        // array.new<Type>(size, default) -> new Array(size).fill(default)
        const argList = (node.children || []);
        if (argList.length === 1) {
          const sizeExpr = this.generateExpression(argList[0]);
          return `new Array(${sizeExpr}).fill(null)`;
        } else if (argList.length >= 2) {
          const sizeExpr = this.generateExpression(argList[0]);
          const defaultExpr = this.generateExpression(argList[1]);
          return `new Array(${sizeExpr}).fill(${defaultExpr})`;
        }
      }
      return '[]';
    }
    
    // For other generic functions, pass through
    return `${funcName}(${args})`;
  }

  private generateArrayLiteral(node: ASTNode): string {
    const elements = (node.children || []).map(c => this.generateExpression(c)).join(', ');
    return `[${elements}]`;
  }

  private inferObjectType(node: ASTNode): string | null {
    if (!node) return null;
    
    // If it's a type instantiation, we know the type
    if (node.type === 'TypeInstantiation') {
      return String(node.value || '');
    }
    
    // If it's an identifier, check if we've seen it assigned a type
    // For now, return null and let the method call use fallback
    return null;
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

    // Handle unsupported display functions - skip them
    const unsupportedDisplayFunctions = ['hline', 'bgcolor', 'fill', 'barcolor', 'plotshape', 'plotchar', 'plotarrow', 'plotcandle', 'plotbar'];
    if (unsupportedDisplayFunctions.includes(name)) {
      // Add a warning comment
      this.warnings.push({
        message: `Unsupported display function '${name}()' was skipped`,
        line: 0,
      });
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
    const leftIsSeries = this.isSeriesExpression(node.children[0]!);
    const rightIsSeries = this.isSeriesExpression(node.children[1]!);
    
    if (leftIsSeries || rightIsSeries) {
      const method = seriesOps[op];
      if (method) {
        // Ensure the Series is on the left side of the method call
        // For commutative operations (+ and *), we can swap if needed
        // For non-commutative operations (-, /), we must keep the order
        if (!leftIsSeries && rightIsSeries) {
          // Only swap for commutative operations
          if (op === '+' || op === '*') {
            return `${right}.${method}(${left})`;
          }
          // For non-commutative operations with literal on left and series on right,
          // we cannot simply swap. Fall through to use regular operators.
          // This shouldn't happen in typical PineScript, but if it does,
          // use standard JS operators
        } else {
          return `${left}.${method}(${right})`;
        }
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
      'this': 'self',  // Method context: 'this' becomes 'self'
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

    // Handle 'this.field' -> 'self.field' for method context
    if (name.startsWith('this.')) {
      return name.replace('this.', 'self.');
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
