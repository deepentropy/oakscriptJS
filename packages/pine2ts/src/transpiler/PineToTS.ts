/**
 * PineScript to TypeScript Code Generator
 * 
 * Transpiles PineScript AST to TypeScript code
 */

import { PineParser, ASTNode } from './PineParser.js';
import type { TranspileOptions, TranspileResult, TranspileError, TranspileWarning, InputDefinition, TypeInfo, MethodInfo, FieldInfo, ImportInfo, LibraryInfo, PlotConfig, GeneratorContext } from './types.js';
import { InfoCollector, type CollectorContext } from './collectors/index.js';
import { sanitizeIdentifier, applyIndent } from './utils/index.js';
import { SemanticAnalyzer } from './semantic/index.js';
import {
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
} from './emitters/index.js';
import { ExpressionGenerator, StatementGenerator, FunctionGenerator } from './generators/index.js';
import {ImportTracker} from './services/index.js';

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
    private usesTimeSeries: Set<string> = new Set();
    private usesBarIndex: boolean = false;
    private usedImports: Set<string> = new Set();
    private importTracker: ImportTracker = new ImportTracker();
    private plotVariables: Map<string, string> = new Map();
    private fillConfigs: import('./types.js').FillConfig[] = [];

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
      this.usesTimeSeries.clear();
      this.usesBarIndex = false;
      this.usedImports.clear();
      this.importTracker.clear();
      this.plotVariables.clear();
      this.fillConfigs = [];

    // Create generator context
    const generatorContext: GeneratorContext = {
      options: this.options,
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
      plots: this.plots,
      plotConfigs: this.plotConfigs,
      usesSyminfo: this.usesSyminfo,
      usesTimeframe: this.usesTimeframe,
      isLibrary: this.isLibrary,
      libraryInfo: this.libraryInfo,
      warnings: this.warnings,
        usesTimeSeries: this.usesTimeSeries,
        usesBarIndex: this.usesBarIndex,
        usedImports: this.usedImports,
        importTracker: this.importTracker,
        plotVariables: this.plotVariables,
        fillConfigs: this.fillConfigs,
    };

    // First pass: collect information using InfoCollector
    // Create a temporary expression generator for the collector
    const tempExpressionGen = new ExpressionGenerator(generatorContext, 0);
    const collector = new InfoCollector(generatorContext, (node) => tempExpressionGen.generateExpression(node));
    collector.collect(ast);
    
    // Update instance variables from generator context
    this.indicatorTitle = generatorContext.indicatorTitle;
    this.indicatorShortTitle = generatorContext.indicatorShortTitle;
    this.indicatorOverlay = generatorContext.indicatorOverlay;
    this.usesSyminfo = generatorContext.usesSyminfo;
    this.usesTimeframe = generatorContext.usesTimeframe;
    this.isLibrary = generatorContext.isLibrary;
    this.libraryInfo = generatorContext.libraryInfo;
      this.usesTimeSeries = generatorContext.usesTimeSeries;
      this.usesBarIndex = generatorContext.usesBarIndex;
      this.usedImports = generatorContext.usedImports;
      this.fillConfigs = generatorContext.fillConfigs;

      // Generate imports - use placeholder, will be replaced at end after body is generated
      // This ensures importTracker is populated with actual imports used in the code
      let importLineIndex = -1;
    if (this.options.includeImports !== false) {
        importLineIndex = this.output.length;
        this.emit('__IMPORT_PLACEHOLDER__');

      // Generate library imports
      const libImports = emitLibraryImports(this.imports);
      for (const line of libImports) {
        this.emit(line);
      }

      this.emit('');
    }

    // Generate user-defined types (interfaces and namespace objects)
    if (this.types.size > 0) {
      const functionGen = new FunctionGenerator(generatorContext, this.output, this.indent);
      const statementGen = new StatementGenerator(generatorContext, this.output, this.indent);
      functionGen.generateUserDefinedTypes((node) => {
        statementGen.setIndent(this.indent);
        statementGen.generateStatement(node);
      });
      // Update indent in case it changed
      this.indent = 0;
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

      // Generate time series only if used
      if (this.usesTimeSeries.size > 0) {
          for (const line of emitTimeSeries(this.usesTimeSeries)) {
              this.output.push(line);
          }
    }

      // Generate bar_index and last_bar_index only if used
      if (this.usesBarIndex) {
          for (const line of emitBarIndex()) {
              this.output.push(line);
          }
    }

    // Generate body using StatementGenerator
    const statementGen = new StatementGenerator(generatorContext, this.output, this.indent);
    const functionGen = new FunctionGenerator(generatorContext, this.output, this.indent);
    
    this.generateStatementsWithGenerators(ast, statementGen, functionGen);

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
        const plotConfigArray = this.plotConfigs.map(p => {
            const parts = [
                `id: '${p.id}'`,
                `title: '${p.title}'`,
                `color: '${p.color}'`,
                `lineWidth: ${p.lineWidth}`,
            ];
            // Add optional fields if present
            if (p.display) parts.push(`display: '${p.display}'`);
            if (p.visible !== undefined) {
                // visible can be boolean or expression string
                if (typeof p.visible === 'boolean') {
                    parts.push(`visible: ${p.visible}`);
                } else {
                    parts.push(`visible: '${p.visible}'`);
                }
            }
            if (p.offset !== undefined && p.offset !== 0) parts.push(`offset: ${p.offset}`);
            return `{ ${parts.join(', ')} }`;
        }).join(', ');
      this.emit(`export const plotConfig: PlotConfig[] = [${plotConfigArray}];`);
    } else {
      // Export empty array when there are no plots
      this.emit('export const plotConfig: PlotConfig[] = [];');
    }

      // Generate fillConfig as array
      if (this.fillConfigs.length > 0) {
          const fillConfigArray = this.fillConfigs.map(f => {
              const parts = [
                  `id: '${f.id}'`,
                  `plot1: '${f.plot1}'`,
                  `plot2: '${f.plot2}'`,
                  `color: '${f.color}'`,
              ];
              if (f.title) parts.push(`title: '${f.title}'`);
              if (f.visible !== undefined) {
                  if (typeof f.visible === 'boolean') {
                      parts.push(`visible: ${f.visible}`);
                  } else {
                      parts.push(`visible: '${f.visible}'`);
                  }
              }
              return `{ ${parts.join(', ')} }`;
          }).join(', ');
          this.emit(`export const fillConfig = [${fillConfigArray}];`);
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

      // Replace import placeholder with actual imports from importTracker
      // This is done AFTER the body is generated so importTracker has all imports
      if (importLineIndex >= 0 && importLineIndex < this.output.length) {
          this.output[importLineIndex] = emitMainImport(this.importTracker.getImports());
      }

    return this.output.join('\n');
  }

  /**
   * Helper method to generate statements using the generators
   */
  private generateStatementsWithGenerators(
    node: ASTNode,
    statementGen: StatementGenerator,
    functionGen: FunctionGenerator
  ): void {
    if (!node || !node.children) return;

    for (const child of node.children) {
      // Update generator indent levels
      statementGen.setIndent(this.indent);
      functionGen.setIndent(this.indent);
      
      // Handle function declarations specially
      if (child.type === 'FunctionDeclaration') {
        functionGen.generateFunctionDeclaration(child, (stmt) => {
          statementGen.setIndent(this.indent);
          statementGen.generateStatement(stmt);
        });
      } else {
        statementGen.generateStatement(child);
      }
    }
  }

  private emit(line: string): void {
    const indented = applyIndent(line, this.indent);
    this.output.push(indented);
  }
}

export { CodeGenerator };
