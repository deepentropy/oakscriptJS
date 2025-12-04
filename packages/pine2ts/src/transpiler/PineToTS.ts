/**
 * PineScript to TypeScript Code Generator
 * 
 * Transpiles PineScript AST to TypeScript code
 */

import { PineParser, ASTNode } from './PineParser.js';
import type { TranspileOptions, TranspileResult, TranspileError, TranspileWarning, InputDefinition, TypeInfo, MethodInfo, FieldInfo, ImportInfo, LibraryInfo, PlotConfig } from './types.js';
import { InfoCollector, type CollectorContext } from './collectors/index.js';
import { sanitizeIdentifier, applyIndent, INDENT_SIZE } from './utils/index.js';
import { SemanticAnalyzer } from './semantic/index.js';
import { 
  pineTypeToTs, 
  getDefaultForPineType, 
  translateFunctionName, 
  translateIdentifier, 
  translateMemberExpression,
  colorToHex,
  getColorValue
} from './mappers/index.js';
import {
  emitHelperFunctions,
  emitPlotConfigInterface,
  emitInputConfigInterface,
  emitOHLCVSeries,
  emitCalculatedSources,
  emitTimeSeries,
  emitBarIndex,
  emitMainImport,
  emitLibraryImports,
  emitInputsInterface,
  emitSyminfoInterface,
  emitTimeframeInterface,
  generateFunctionParams,
  generateInputConfigArray,
  emitSourceInputMapping,
  getInputTsType,
  formatDefaultValue
} from './emitters/index.js';

/**
 * Transpile PineScript source code to TypeScript
 */
export function transpile(source: string, options: TranspileOptions = {}): string {
  const result = transpileWithResult(source, options);
  
  if (result.errors.length > 0) {
    const errorMsg = result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
    throw new Error(`Transpile errors:\n${errorMsg}`);
  }
  
  return result.code;
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

  // Semantic analysis phase
  const analyzer = new SemanticAnalyzer();
  const semanticResult = analyzer.analyze(ast);
  
  if (!semanticResult.valid) {
    return {
      code: '',
      errors: semanticResult.errors.map(e => ({
        message: e.message,
        line: e.line,
        column: e.column,
      })),
      warnings: semanticResult.warnings.map(w => ({
        message: w.message,
        line: w.line,
        column: w.column,
      })),
    };
  }

  const generator = new CodeGenerator(options);
  const code = generator.generate(ast);

  return {
    code,
    errors: [],
    warnings: [
      ...semanticResult.warnings.map(w => ({
        message: w.message,
        line: w.line,
        column: w.column,
      })),
      ...generator.warnings
    ],
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
  private indicatorShortTitle: string = '';
  private indicatorOverlay: boolean = false;
  private variables: Map<string, string> = new Map();
  private seriesVariables: Set<string> = new Set();  // Track which variables are Series
  private reassignedVariables: Set<string> = new Set();  // Track which variables are reassigned
  private recursiveVariables: Set<string> = new Set();  // Track which variables are recursive
  private plots: string[] = [];
  private plotConfigs: PlotConfig[] = [];
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
    this.seriesVariables.clear();
    this.reassignedVariables.clear();
    this.recursiveVariables.clear();
    this.plots = [];
    this.plotConfigs = [];
    this.inputs = [];
    this.usesSyminfo = false;
    this.usesTimeframe = false;
    this.types.clear();
    this.methods.clear();
    this.imports = [];
    this.isLibrary = false;
    this.libraryInfo = null;

    // First pass: collect information using InfoCollector
    const collectorContext: CollectorContext = {
      indicatorTitle: this.indicatorTitle,
      indicatorShortTitle: this.indicatorShortTitle,
      indicatorOverlay: this.indicatorOverlay,
      variables: this.variables,
      seriesVariables: this.seriesVariables,
      reassignedVariables: this.reassignedVariables,
      recursiveVariables: this.recursiveVariables,
      types: this.types,
      methods: this.methods,
      inputs: this.inputs,
      imports: this.imports,
      usesSyminfo: this.usesSyminfo,
      usesTimeframe: this.usesTimeframe,
      isLibrary: this.isLibrary,
      libraryInfo: this.libraryInfo,
      warnings: this.warnings,
    };
    
    const collector = new InfoCollector(collectorContext, (node) => this.generateExpression(node));
    collector.collect(ast);
    
    // Update instance variables from collector context
    this.indicatorTitle = collectorContext.indicatorTitle;
    this.indicatorShortTitle = collectorContext.indicatorShortTitle;
    this.indicatorOverlay = collectorContext.indicatorOverlay;
    this.usesSyminfo = collectorContext.usesSyminfo;
    this.usesTimeframe = collectorContext.usesTimeframe;
    this.isLibrary = collectorContext.isLibrary;
    this.libraryInfo = collectorContext.libraryInfo;

    // Generate imports
    if (this.options.includeImports !== false) {
      this.emit(emitMainImport());
      
      // Generate library imports
      const libImports = emitLibraryImports(this.imports);
      for (const line of libImports) {
        this.emit(line);
      }
      
      this.emit('');
    }

    // Generate helper functions
    for (const line of emitHelperFunctions()) {
      this.output.push(line);
    }
    
    // Generate PlotConfig interface
    for (const line of emitPlotConfigInterface()) {
      this.output.push(line);
    }
    
    // Generate InputConfig interface
    for (const line of emitInputConfigInterface()) {
      this.output.push(line);
    }

    // Generate user-defined types (interfaces and namespace objects)
    if (this.types.size > 0) {
      this.generateUserDefinedTypes();
    }

    // Generate interfaces if inputs exist
    if (this.inputs.length > 0) {
      for (const line of emitInputsInterface(this.inputs)) {
        this.output.push(line);
      }
    }

    // Generate syminfo interface if used
    if (this.usesSyminfo) {
      for (const line of emitSyminfoInterface()) {
        this.output.push(line);
      }
    }

    // Generate timeframe interface if used
    if (this.usesTimeframe) {
      for (const line of emitTimeframeInterface()) {
        this.output.push(line);
      }
    }

    // Generate function
    const funcName = sanitizeIdentifier(this.indicatorTitle);
    const params = generateFunctionParams(this.inputs.length > 0, this.usesSyminfo, this.usesTimeframe);
    this.emit(`export function ${funcName}(${params}): IndicatorResult {`);
    this.indent++;

    // Destructure inputs if any (but don't map source inputs yet)
    if (this.inputs.length > 0) {
      const inputNames = this.inputs.map(i => i.name).join(', ');
      this.emit(`const { ${inputNames} } = { ...defaultInputs, ...inputs };`);
      this.emit('');
    }

    // Generate syminfo setup if used
    if (this.usesSyminfo) {
      this.emit('const syminfo = { ...defaultSyminfo, ...syminfoParam };');
      this.emit('');
    }

    // Generate timeframe setup if used
    if (this.usesTimeframe) {
      this.emit('const timeframe = { ...defaultTimeframe, ...timeframeParam };');
      this.emit('');
    }

    // Generate OHLCV series
    for (const line of emitOHLCVSeries()) {
      this.output.push(line);
    }
    
    // Mark these as Series variables
    this.seriesVariables.add('open');
    this.seriesVariables.add('high');
    this.seriesVariables.add('low');
    this.seriesVariables.add('close');
    this.seriesVariables.add('volume');

    // Generate calculated price sources
    for (const line of emitCalculatedSources()) {
      this.output.push(line);
    }
    
    // Mark calculated sources as Series
    this.seriesVariables.add('hl2');
    this.seriesVariables.add('hlc3');
    this.seriesVariables.add('ohlc4');
    this.seriesVariables.add('hlcc4');

    // Now map source inputs to Series (after Series are created)
    if (this.inputs.length > 0) {
      for (const line of emitSourceInputMapping(this.inputs, this.variables, this.seriesVariables, sanitizeIdentifier)) {
        this.output.push(line);
      }
    }

    // Generate time series
    for (const line of emitTimeSeries()) {
      this.output.push(line);
    }

    // Generate bar_index and last_bar_index
    for (const line of emitBarIndex()) {
      this.output.push(line);
    }

    // Generate body
    this.generateStatements(ast);

    // Generate return statement
    this.emit('');
    this.emit('return {');
    this.indent++;
    this.emit(`metadata: { title: "${this.indicatorTitle}", shorttitle: "${this.indicatorShortTitle}", overlay: ${this.indicatorOverlay} },`);
    
    // Generate plots as Record<string, PlotData[]>
    if (this.plotConfigs.length > 0) {
      const plotsObject = this.plotConfigs.map((p, i) => 
        `'${p.id}': ${this.plots[i]}`
      ).join(', ');
      this.emit(`plots: { ${plotsObject} },`);
    } else {
      // Fallback for indicators without plot configs (shouldn't happen, but safe)
      this.emit(`plots: [${this.plots.join(', ')}],`);
    }
    
    this.indent--;
    this.emit('};');

    this.indent--;
    this.emit('}');
    
    // Generate additional exports for compatibility
    this.emit('');
    this.emit('// Additional exports for compatibility');
    this.emit(`export const metadata = { title: "${this.indicatorTitle}", shortTitle: "${this.indicatorShortTitle}", overlay: ${this.indicatorOverlay} };`);
    
    if (this.inputs.length > 0) {
      this.emit('export { defaultInputs };');
      this.emit(`export const inputConfig: InputConfig[] = ${generateInputConfigArray(this.inputs)};`);
    } else {
      // Export empty objects even when there are no inputs for consistency
      this.emit('export const defaultInputs = {};');
      this.emit('export const inputConfig: InputConfig[] = [];');
    }
    
    // Generate plotConfig as PlotConfig[] array
    if (this.plotConfigs.length > 0) {
      const plotConfigArray = this.plotConfigs.map(p => 
        `{ id: '${p.id}', title: '${p.title}', color: '${p.color}', lineWidth: ${p.lineWidth} }`
      ).join(', ');
      this.emit(`export const plotConfig: PlotConfig[] = [${plotConfigArray}];`);
    } else {
      // Export empty array when there are no plots
      this.emit('export const plotConfig: PlotConfig[] = [];');
    }
    
    this.emit(`export const calculate = ${funcName};`);
    
    // Export with indicator-specific name (e.g., MomentumIndicator)
    // Use the indicator title as the base name
    const indicatorBaseName = sanitizeIdentifier(this.indicatorTitle);
    const indicatorClassName = `${indicatorBaseName}Indicator`;
    this.emit(`export { ${funcName} as ${indicatorClassName} };`);
    
    // Export type alias with indicator-specific name (e.g., MomentumInputs)
    if (this.inputs.length > 0) {
      const inputsTypeName = `${indicatorBaseName}Inputs`;
      this.emit(`export type ${inputsTypeName} = IndicatorInputs;`);
    } else {
      // Export empty type for consistency
      const inputsTypeName = `${indicatorBaseName}Inputs`;
      this.emit(`export type ${inputsTypeName} = Record<string, never>;`);
    }

    return this.output.join('\n');
  }

  private generateUserDefinedTypes(): void {
    this.emit('// User-defined types');
    
    for (const [typeName, typeInfo] of this.types) {
      const exportKeyword = typeInfo.exported ? 'export ' : '';
      
      // Generate interface
      this.emit(`${exportKeyword}interface ${typeName} {`);
      this.indent++;
      for (const field of typeInfo.fields) {
        const tsType = pineTypeToTs(field.fieldType, this.types);
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
        const tsType = pineTypeToTs(f.fieldType, this.types);
        const defaultVal = f.defaultValue || getDefaultForPineType(f.fieldType, this.types);
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
      const tsType = pineTypeToTs(p.paramType, this.types);
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

  // Note: collectInfo() method has been replaced by InfoCollector class

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
    const tsName = sanitizeIdentifier(name);
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
    const tsName = sanitizeIdentifier(name);
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
      if (funcName === 'input' || funcName.startsWith('input.')) {
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
      const tsName = sanitizeIdentifier(name);
      
      let rightExpr = this.generateExpression(right);
      
      // Skip assignment if right side is empty (e.g., unsupported functions)
      if (!rightExpr || rightExpr.trim() === '') {
        // Comment it out instead
        this.emit(`// ${tsName} = <unsupported>;`);
        return;
      }
      
      // Check if the right side is a Series expression
      let rightIsSeries = this.isSeriesExpression(right);
      
      // Special case: if this variable will be reassigned and the right side is a numeric literal,
      // convert it to a Series initialized with that constant value
      if (this.reassignedVariables.has(name) && right.type === 'NumberLiteral') {
        const numValue = Number(right.value);
        rightExpr = `new Series(bars, () => ${numValue})`;
        rightIsSeries = true;
      }
      
      if (!this.variables.has(name)) {
        this.variables.set(name, tsName);
        // Use 'let' if this variable will be reassigned, otherwise use 'const'
        const declKeyword = this.reassignedVariables.has(name) ? 'let' : 'const';
        this.emit(`${declKeyword} ${tsName} = ${rightExpr};`);
        // If assigning a Series expression, mark this variable as a Series
        if (rightIsSeries) {
          this.seriesVariables.add(tsName);
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
      
      if (this.recursiveVariables.has(varName)) {
        // This is a recursive formula - generate bar-by-bar iteration
        this.generateRecursiveFormula(varName, right);
        return;
      }
    }
    
    // Non-recursive reassignment - generate normal code
    const leftExpr = this.generateExpression(left);
    const rightExpr = this.generateExpression(right);
    this.emit(`${leftExpr} = ${rightExpr};`);
  }

  /**
   * Generate bar-by-bar iteration code for recursive formulas
   * e.g., mg := na(mg[1]) ? ta.ema(source, length) : mg[1] + (source - mg[1]) / ...
   */
  private generateRecursiveFormula(varName: string, rightNode: ASTNode): void {
    const tsName = this.variables.get(varName) || varName;
    
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
  private generateRecursiveFormulaExpression(node: ASTNode, recursiveVarName: string, prevValueVar: string): string {
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
        const args = (node.children || []).map(c => this.generateExpression(c)).join(', ');
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
      const mappedName = this.variables.get(name) || name;
      
      // Check if this is a Series variable (but not the recursive variable itself)
      if (this.seriesVariables.has(mappedName) && name !== recursiveVarName) {
        // Access the value at current bar index
        return `${translateIdentifier(name, this.variables)}.get(i)`;
      }
      
      return translateIdentifier(name, this.variables);
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
    return this.generateExpression(node);
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

  private generateStatementToString(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'Comment':
        return `// ${String(node.value || '').replace(/^\/\/\s*/, '')}`;

      case 'VariableDeclaration': {
        const name = String(node.value || 'unknown');
        const tsName = sanitizeIdentifier(name);
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
          const tsName = sanitizeIdentifier(name);
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
        return `"${String(node.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

      case 'Identifier':
        return translateIdentifier(String(node.value || ''), this.variables);

      case 'MemberExpression':
        return translateMemberExpression(String(node.value || ''));

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

    const conditionNode = node.children[0]!;
    const consequentNode = node.children[1]!;
    const alternateNode = node.children[2]!;

    const condition = this.generateExpression(conditionNode);
    let consequent = this.generateExpression(consequentNode);
    let alternate = this.generateExpression(alternateNode);

    // Check if one branch is a Series and the other is a scalar
    const consequentIsSeries = this.isSeriesExpression(consequentNode);
    const alternateIsSeries = this.isSeriesExpression(alternateNode);

    // Special handling for 'na' (which becomes NaN)
    const alternateIsNa = alternateNode.type === 'Identifier' && String(alternateNode.value) === 'na';
    const consequentIsNa = consequentNode.type === 'Identifier' && String(consequentNode.value) === 'na';

    // If one branch is definitely a Series and the other is NaN or a scalar constant,
    // wrap the scalar in a Series to maintain type consistency
    if (consequentIsSeries && (alternateIsNa || (!alternateIsSeries && alternateNode.type === 'NumberLiteral'))) {
      // Wrap alternate in a Series with constant value
      alternate = `new Series(bars, () => ${alternate})`;
    } else if (alternateIsSeries && (consequentIsNa || (!consequentIsSeries && consequentNode.type === 'NumberLiteral'))) {
      // Wrap consequent in a Series with constant value
      consequent = `new Series(bars, () => ${consequent})`;
    } else if (alternateIsNa && !consequentIsNa) {
      // If we're not sure about consequent but alternate is na, assume consequent might be Series
      // This is a heuristic - if alternate is na, likely consequent is a Series
      alternate = `new Series(bars, () => ${alternate})`;
    } else if (consequentIsNa && !alternateIsNa) {
      // Similarly for consequent is na
      consequent = `new Series(bars, () => ${consequent})`;
    }

    return `(${condition} ? ${consequent} : ${alternate})`;
  }

  private generateHistoryAccess(node: ASTNode): string {
    if (!node.children || node.children.length < 2) return '';

    const base = this.generateExpression(node.children[0]!);
    const offset = this.generateExpression(node.children[1]!);

    return `${base}.offset(${offset})`;
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
    const indent = ' '.repeat(INDENT_SIZE);
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
        const plotId = `plot${this.plots.length}`;
        
        // Extract plot metadata from named arguments
        const titleArg = this.findNamedArg(node, 'title');
        const colorArg = this.findNamedArg(node, 'color');
        const lineWidthArg = this.findNamedArg(node, 'linewidth');
        
        // Determine title - use title arg if present, otherwise use series name
        let title = titleArg ? this.getStringValue(titleArg) : seriesName;
        // Clean up title: remove quotes and simplify Series expressions
        title = title.replace(/^["']|["']$/g, '');
        if (title.includes('.') || title.includes('(')) {
          // If it's a complex expression, use a simple name
          title = `Plot ${this.plots.length}`;
        }
        
        const color = colorArg ? getColorValue(colorArg) : '#2962FF';
        const lineWidth = lineWidthArg ? this.getNumberValue(lineWidthArg) : 2;
        
        // Store plot config
        this.plotConfigs.push({ id: plotId, title, color, lineWidth });
        
        // Generate plot data
        this.plots.push(`${seriesName}.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN }))`);
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
    if (name === 'input' || name.startsWith('input.')) {
      // This should not typically happen since input calls are processed at assignment level
      // But if it does, return empty string
      return '';
    }

    // Handle ta.vwma specially - it needs volume parameter
    if (name === 'ta.vwma') {
      // ta.vwma(source, length) should become ta.vwma(source, length, volume)
      return `ta.vwma(${args}, volume)`;
    }

    // Translate common function names
    const translated = translateFunctionName(name);
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
      '%': 'mod',
      '>': 'gt',
      '<': 'lt',
      '>=': 'gte',
      '<=': 'lte',
      '==': 'eq',
      '!=': 'neq',
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
    
    // For unary minus on Series, use .neg() method
    if (op === '-') {
      const operandIsSeries = this.isSeriesExpression(node.children[0]!);
      if (operandIsSeries) {
        return `${operand}.neg()`;
      }
    }
    
    return `${op}${operand}`;
  }

  private isSeriesExpression(node: ASTNode): boolean {
    if (!node) return false;
    
    if (node.type === 'Identifier') {
      const name = String(node.value || '');
      // Check if this identifier is marked as a Series variable
      // First check the mapped name (in case it was remapped)
      const mappedName = this.variables.get(name) || name;
      if (this.seriesVariables.has(mappedName)) {
        return true;
      }
      // Also check the original name for built-in series
      return ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'].includes(name);
    }
    
    if (node.type === 'FunctionCall') {
      const name = String(node.value || '');
      // ta.* and taCore.* functions always return Series
      if (name.startsWith('ta.') || name.startsWith('taCore.')) {
        return true;
      }
      // Assume user-defined functions also return Series.
      // This is a pragmatic choice for PineScript where:
      // 1. Most functions that operate on price data return Series
      // 2. The transpiler's ternary expression handler wraps scalar values in Series when needed
      // 3. Over-estimating (assuming Series when it's scalar) causes TypeScript errors that are caught at compile time
      // 4. Under-estimating (assuming scalar when it's Series) causes runtime errors that are harder to debug
      // If this causes issues, we could track function return types or use a whitelist approach
      return true;
    }
    
    if (node.type === 'HistoryAccess') {
      // History access (e.g., src[1]) returns a scalar value, not a Series
      return false;
    }
    
    if (node.type === 'BinaryExpression') {
      // Binary expressions on Series return Series
      return true;
    }
    
    if (node.type === 'TernaryExpression') {
      // Ternary expressions return a Series if either branch is a Series
      if (node.children && node.children.length >= 3) {
        const consequentNode = node.children[1]!;
        const alternateNode = node.children[2]!;
        const consequentIsSeries = this.isSeriesExpression(consequentNode);
        const alternateIsSeries = this.isSeriesExpression(alternateNode);
        
        // If either branch is definitively a Series, the whole expression is a Series
        if (consequentIsSeries || alternateIsSeries) {
          return true;
        }
        
        // Special case: if one branch is 'na' and the other is a function call,
        // assume the whole expression is a Series. This handles the common PineScript
        // pattern: `condition ? seriesFunction() : na`
        // We only apply this heuristic when there's a function call to avoid
        // incorrectly marking scalar ternaries like `condition ? 10 : na` as Series.
        const consequentIsNa = consequentNode.type === 'Identifier' && String(consequentNode.value) === 'na';
        const alternateIsNa = alternateNode.type === 'Identifier' && String(alternateNode.value) === 'na';
        const consequentIsFunc = consequentNode.type === 'FunctionCall';
        const alternateIsFunc = alternateNode.type === 'FunctionCall';
        
        if ((consequentIsNa && alternateIsFunc) || (alternateIsNa && consequentIsFunc)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if an expression contains a history access to a specific variable
   * e.g., checking if "mg[1] + ..." contains "mg[1]"
   */
  private containsHistoryAccessTo(node: ASTNode, varName: string): boolean {
    if (!node) return false;
    
    // Check if this is a history access node
    if (node.type === 'HistoryAccess') {
      // The first child is the base variable
      if (node.children && node.children.length >= 1) {
        const base = node.children[0];
        if (base?.type === 'Identifier' && String(base.value) === varName) {
          return true;
        }
      }
    }
    
    // Recursively check all children
    if (node.children) {
      for (const child of node.children) {
        if (this.containsHistoryAccessTo(child, varName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find a named argument in function call arguments
   */
  private findNamedArg(node: ASTNode, argName: string): ASTNode | null {
    if (!node.children) return null;
    
    for (const child of node.children) {
      if (child.type === 'Assignment' && child.children && child.children.length >= 2) {
        const left = child.children[0];
        if (left?.type === 'Identifier' && left.value === argName) {
          return child.children[1];
        }
      }
    }
    return null;
  }

  /**
   * Extract string value from an AST node
   */
  private getStringValue(node: ASTNode): string {
    if (node.type === 'StringLiteral') {
      return String(node.value || '');
    }
    if (node.type === 'Identifier') {
      return String(node.value || '');
    }
    return this.generateExpression(node);
  }

  /**
   * Extract number value from an AST node
   */
  private getNumberValue(node: ASTNode): number {
    if (node.type === 'NumberLiteral') {
      return Number(node.value) || 2;
    }
    return 2;
  }

  private emit(line: string): void {
    const indented = applyIndent(line, this.indent);
    this.output.push(indented);
  }
}

export { CodeGenerator };
