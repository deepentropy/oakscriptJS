/**
 * Info collector for first-pass AST traversal
 * Collects inputs, types, methods, and other metadata
 */

import type {ASTNode} from '../PineParser.js';
import type {
    FieldInfo,
    ImportInfo,
    InputDefinition,
    LibraryInfo,
    MethodInfo,
    TranspileWarning,
    TypeInfo
} from '../types.js';

/**
 * Context passed to InfoCollector
 */
export interface CollectorContext {
  indicatorTitle: string;
  indicatorShortTitle: string;
  indicatorOverlay: boolean;
  variables: Map<string, string>;
  seriesVariables: Set<string>;
  reassignedVariables: Set<string>;
  recursiveVariables: Set<string>;
  types: Map<string, TypeInfo>;
  methods: Map<string, MethodInfo[]>;
  inputs: InputDefinition[];
  imports: ImportInfo[];
  usesSyminfo: boolean;
  usesTimeframe: boolean;
  isLibrary: boolean;
  libraryInfo: LibraryInfo | null;
  warnings: TranspileWarning[];
    // Usage tracking for conditional code generation
    usesTimeSeries: Set<string>;  // Track: 'year', 'month', 'dayofmonth', 'dayofweek', 'hour', 'minute'
    usesBarIndex: boolean;        // Track if bar_index or last_bar_index is used
    usedImports: Set<string>;     // Track: 'ta', 'taCore', 'math', 'array', 'na', 'nz'
}

/**
 * Collects information from AST nodes during first pass
 */
export class InfoCollector {
  private context: CollectorContext;
  private generateExpressionCallback: (node: ASTNode) => string;

  constructor(context: CollectorContext, generateExpressionCallback: (node: ASTNode) => string) {
    this.context = context;
    this.generateExpressionCallback = generateExpressionCallback;
  }

  /**
   * Collect information from AST node recursively
   */
  collect(node: ASTNode): void {
    if (!node) return;

    if (node.type === 'IndicatorDeclaration') {
      this.collectIndicatorInfo(node);
    }

    if (node.type === 'LibraryDeclaration') {
      this.collectLibraryInfo(node);
    }

    if (node.type === 'ImportStatement') {
      this.collectImportInfo(node);
    }

    if (node.type === 'TypeDeclaration') {
      this.collectTypeInfo(node);
    }

    if (node.type === 'MethodDeclaration') {
      this.collectMethodInfo(node);
    }

    if (node.type === 'ExpressionStatement') {
      this.collectInputInfo(node);
    }

    if (node.type === 'Reassignment') {
      this.collectReassignmentInfo(node);
    }

      // Handle compound assignments (+=, -=, *=, /=) which are parsed as BinaryExpression
      // but semantically behave like reassignments
      if (node.type === 'BinaryExpression') {
          const op = String(node.value || '');
          if (['+=', '-=', '*=', '/='].includes(op)) {
              this.collectReassignmentInfo(node);
          }
      }

    if (node.type === 'MemberExpression') {
      this.collectMemberExpressionInfo(node);
    }

      // Track usage of time series, bar_index, and imports
      this.collectUsageInfo(node);

    if (node.children) {
      for (const child of node.children) {
        this.collect(child);
      }
    }

    if (node.params) {
      for (const param of node.params) {
        this.collect(param);
      }
    }
  }

  private collectIndicatorInfo(node: ASTNode): void {
    if (node.children && node.children.length > 0) {
      // First check for positional argument (first child might be a StringLiteral)
      const firstChild = node.children[0];
      if (firstChild?.type === 'StringLiteral') {
        this.context.indicatorTitle = String(firstChild.value || 'Indicator');
      }
      
      // Then check for named arguments (these override positional)
      for (const arg of node.children) {
        if (arg && arg.type === 'Assignment' && arg.children && arg.children.length >= 2) {
          const paramName = arg.children[0]?.type === 'Identifier' ? String(arg.children[0].value || '') : '';
          const paramValue = arg.children[1];
          
          if (paramName === 'title' && paramValue?.type === 'StringLiteral') {
            this.context.indicatorTitle = String(paramValue.value || 'Indicator');
          } else if (paramName === 'shorttitle' && paramValue?.type === 'StringLiteral') {
            this.context.indicatorShortTitle = String(paramValue.value || '');
          } else if (paramName === 'overlay' && paramValue?.type === 'Identifier') {
            this.context.indicatorOverlay = String(paramValue.value) === 'true';
          }
        }
      }
      
      // If shortTitle not provided, use the title
      if (!this.context.indicatorShortTitle) {
        this.context.indicatorShortTitle = this.context.indicatorTitle;
      }
    }
  }

  private collectLibraryInfo(node: ASTNode): void {
    this.context.isLibrary = true;
    if (node.children && node.children.length > 0) {
      const firstArg = node.children[0];
      if (firstArg && firstArg.type === 'StringLiteral' && typeof firstArg.value === 'string') {
        this.context.indicatorTitle = firstArg.value;
        this.context.libraryInfo = {
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
              if (this.context.libraryInfo) {
                this.context.libraryInfo.overlay = true;
              }
            }
          }
        }
      }
    }
  }

  private collectImportInfo(node: ASTNode): void {
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
    
    this.context.imports.push({
      publisher,
      libraryName,
      version,
      alias,
    });
  }

  private collectTypeInfo(node: ASTNode): void {
    const typeName = String(node.value || '');
    const fields: FieldInfo[] = [];
    
    if (node.children) {
      for (const fieldNode of node.children) {
        if (fieldNode.type === 'FieldDeclaration') {
          const field: FieldInfo = {
            name: String(fieldNode.value || ''),
            fieldType: String(fieldNode.fieldType || 'unknown'),
            defaultValue: fieldNode.children && fieldNode.children.length > 0 
              ? this.generateExpressionCallback(fieldNode.children[0])
              : undefined,
            isOptional: !!(fieldNode.children && fieldNode.children.length > 0),
          };
          fields.push(field);
        }
      }
    }
    
    this.context.types.set(typeName, {
      name: typeName,
      exported: node.exported || false,
      fields: fields,
    });
  }

  private collectMethodInfo(node: ASTNode): void {
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
          ? this.generateExpressionCallback(p.children[0])
          : undefined,
      })),
      bodyNode: node.children && node.children.length > 0 ? node.children[0] : undefined,
    };
    
    if (!this.context.methods.has(boundType)) {
      this.context.methods.set(boundType, []);
    }
    this.context.methods.get(boundType)!.push(methodInfo);
  }

  private collectInputInfo(node: ASTNode): void {
    if (node.children && node.children.length > 0) {
      const expr = node.children[0];
      if (expr && expr.type === 'Assignment' && expr.children && expr.children.length >= 2) {
        const left = expr.children[0];
        const right = expr.children[1];
        if (left && left.type === 'Identifier' && right && right.type === 'FunctionCall') {
          const funcName = String(right.value || '');
          if (funcName === 'input' || funcName.startsWith('input.')) {
            const varName = String(left.value || '');
            // Check if we already have this input to avoid duplicates
            if (!this.context.inputs.some(i => i.name === varName)) {
              const inputDef = this.parseInputFunction(varName, funcName, right.children || []);
              if (inputDef) {
                this.context.inputs.push(inputDef);
              }
            }
          }
        }
      }
    }
  }

  private collectReassignmentInfo(node: ASTNode): void {
    if (node.children && node.children.length >= 2) {
      const left = node.children[0];
      const right = node.children[1];
      if (left && left.type === 'Identifier') {
        const varName = String(left.value || '');
        this.context.reassignedVariables.add(varName);
        
        // Check if the right-hand side contains a history access to this variable
        if (right && this.containsHistoryAccessTo(right, varName)) {
          this.context.recursiveVariables.add(varName);
        }
      }
    }
  }

  private collectMemberExpressionInfo(node: ASTNode): void {
    const memberName = String(node.value || '');
    if (memberName.startsWith('syminfo.')) {
      this.context.usesSyminfo = true;
    }
    if (memberName.startsWith('timeframe.')) {
      this.context.usesTimeframe = true;
    }
  }

  private parseInputFunction(varName: string, funcName: string, args: ASTNode[]): InputDefinition | null {
    const inputTypeMap: Record<string, InputDefinition['inputType']> = {
      'input': 'source',  // Plain input() defaults to source
      'input.int': 'int',
      'input.float': 'float',
      'input.bool': 'bool',
      'input.string': 'string',
      'input.color': 'color',
      'input.source': 'source',
    };

    let inputType = inputTypeMap[funcName];
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
            } else if (paramValue?.type === 'UnaryExpression' && paramValue.value === '-' && paramValue.children?.[0]?.type === 'NumberLiteral') {
              input.minval = -Number(paramValue.children[0].value);
            }
            break;
          case 'maxval':
            if (paramValue?.type === 'NumberLiteral') {
              input.maxval = Number(paramValue.value);
            } else if (paramValue?.type === 'UnaryExpression' && paramValue.value === '-' && paramValue.children?.[0]?.type === 'NumberLiteral') {
              input.maxval = -Number(paramValue.children[0].value);
            }
            break;
          case 'step':
            if (paramValue?.type === 'NumberLiteral') {
              input.step = Number(paramValue.value);
            } else if (paramValue?.type === 'UnaryExpression' && paramValue.value === '-' && paramValue.children?.[0]?.type === 'NumberLiteral') {
              input.step = -Number(paramValue.children[0].value);
            }
            break;
          case 'options':
            input.options = this.parseOptionsArray(paramValue);
            break;
        }
      }
    }

    // If title not set from named arg, check second positional argument
    if (!input.title && args.length > 1 && args[1]?.type === 'StringLiteral') {
      input.title = String(args[1].value || '');
    }

    // For plain input(), infer type from defval if it's a number
    if (funcName === 'input' && typeof input.defval === 'number') {
      input.inputType = Number.isInteger(input.defval) ? 'int' : 'float';
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
     * Track usage of time series and bar_index for conditional code emission
     *
     * NOTE: Import tracking is NOT done here. It's done in ExpressionGenerator
     * during code emission, so transformations like 'na' -> 'NaN' are properly
     * handled (na as value doesn't need an import, only na() as function does).
     */
    private collectUsageInfo(node: ASTNode): void {
        const timeSeriesNames = new Set(['year', 'month', 'dayofmonth', 'dayofweek', 'hour', 'minute']);
        const barIndexNames = new Set(['bar_index', 'last_bar_index']);

        // Check identifiers for time series and bar_index usage
        if (node.type === 'Identifier') {
            const name = String(node.value || '');
            if (timeSeriesNames.has(name)) {
                this.context.usesTimeSeries.add(name);
            }
            if (barIndexNames.has(name)) {
                this.context.usesBarIndex = true;
            }
        }
    }
}
