/**
 * Expression generation logic
 */

import type {ASTNode} from '../PineParser.js';
import type {GeneratorContext} from '../types.js';
import {
    getColorValue,
    translateFunctionName,
    translateIdentifier,
    translateMemberExpression
} from '../mappers/index.js';
import {INDENT_SIZE, sanitizeIdentifier} from '../utils/index.js';

/**
 * Generates TypeScript code for PineScript expressions
 */
export class ExpressionGenerator {
  private context: GeneratorContext;
  private currentIndent: number;

  constructor(context: GeneratorContext, currentIndent: number = 0) {
    this.context = context;
    this.currentIndent = currentIndent;
  }

  /**
   * Update indent level for nested structures
   */
  setIndent(indent: number): void {
    this.currentIndent = indent;
  }

  /**
   * Generate TypeScript code for an expression
   */
  generateExpression(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'NumberLiteral':
        return String(node.value);

      case 'StringLiteral':
        return `"${String(node.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

      case 'Identifier':
        return translateIdentifier(String(node.value || ''), this.context.variables);

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
    
    return lines.join('\n' + indent.repeat(this.currentIndent));
  }

  private generateArrayLiteral(node: ASTNode): string {
    const elements = (node.children || []).map(c => this.generateExpression(c)).join(', ');
    return `[${elements}]`;
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
    if (objectType && this.context.types.has(objectType)) {
      // Verify the method exists on this type before using TypeName.method pattern
      const typeMethods = this.context.methods.get(objectType) || [];
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

  inferObjectType(node: ASTNode): string | null {
    if (!node) return null;
    
    // If it's a type instantiation, we know the type
    if (node.type === 'TypeInstantiation') {
      return String(node.value || '');
    }
    
    // If it's an identifier, check if we've seen it assigned a type
    // For now, return null and let the method call use fallback
    return null;
  }

  isSeriesExpression(node: ASTNode): boolean {
    if (!node) return false;
    
    if (node.type === 'Identifier') {
      const name = String(node.value || '');
      // Check if this identifier is marked as a Series variable
      // First check the mapped name (in case it was remapped)
      const mappedName = this.context.variables.get(name) || name;
      if (this.context.seriesVariables.has(mappedName)) {
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

  findNamedArg(node: ASTNode, argName: string): ASTNode | null {
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

  getStringValue(node: ASTNode): string {
    if (node.type === 'StringLiteral') {
      return String(node.value || '');
    }
    if (node.type === 'Identifier') {
      return String(node.value || '');
    }
    return this.generateExpression(node);
  }

  getNumberValue(node: ASTNode): number {
    if (node.type === 'NumberLiteral') {
      return Number(node.value) || 2;
    }
    return 2;
  }

  private generateFunctionCall(node: ASTNode): string {
    const name = String(node.value || '');
    const args = (node.children || []).map(c => this.generateExpression(c)).join(', ');

    // Handle plot function specially
    if (name === 'plot') {
      const seriesArg = node.children?.[0];
      if (seriesArg) {
        const seriesName = this.generateExpression(seriesArg);
        const plotId = `plot${this.context.plots.length}`;

        // Extract plot metadata from named arguments
        const titleArg = this.findNamedArg(node, 'title');
        const colorArg = this.findNamedArg(node, 'color');
        const lineWidthArg = this.findNamedArg(node, 'linewidth');
          const displayArg = this.findNamedArg(node, 'display');
          const offsetArg = this.findNamedArg(node, 'offset');

        // Determine title - use title arg if present, otherwise use series name
        let title = titleArg ? this.getStringValue(titleArg) : seriesName;
        // Clean up title: remove quotes and simplify Series expressions
        title = title.replace(/^["']|["']$/g, '');
        if (title.includes('.') || title.includes('(')) {
          // If it's a complex expression, use a simple name
          title = `Plot ${this.context.plots.length}`;
        }

        const color = colorArg ? getColorValue(colorArg) : '#2962FF';
        const lineWidth = lineWidthArg ? this.getNumberValue(lineWidthArg) : 2;

          // Extract display parameter (controls visibility)
          // PineScript: display = enableMA ? display.all : display.none
          let display: 'all' | 'none' | 'data_window' | 'status_line' | 'pane' | undefined;
          let visible: boolean | string | undefined;
          if (displayArg) {
              const displayExpr = this.generateExpression(displayArg);
              // Check for ternary expressions first (condition ? display.all : display.none)
              // The expression may be wrapped in parentheses: (enableMA ? display.all : display.none)
              const ternaryMatch = displayExpr.match(/^\(?([^?]+)\s*\?\s*display\.all\s*:\s*display\.none\)?$/);
              if (ternaryMatch) {
                  visible = ternaryMatch[1].trim();
                  display = 'all'; // Base display is 'all', visibility controls it
              } else if (displayExpr === 'display.all') {
                  display = 'all';
              } else if (displayExpr === 'display.none') {
                  display = 'none';
              } else if (displayExpr === 'display.data_window') {
                  display = 'data_window';
              } else if (displayExpr === 'display.status_line') {
                  display = 'status_line';
              } else if (displayExpr === 'display.pane') {
                  display = 'pane';
              } else if (displayExpr.includes('?')) {
                  // Complex ternary - store the expression as visible condition
                  visible = displayExpr.replace(/display\.(all|none)/g, (_, v) => v === 'all' ? 'true' : 'false');
                  display = 'all';
              } else if (displayExpr.includes('display.all')) {
                  display = 'all';
              } else if (displayExpr.includes('display.none')) {
                  display = 'none';
              }
          }

          // Extract offset parameter
          let offset: number | undefined;
          if (offsetArg) {
              if (offsetArg.type === 'NumberLiteral') {
                  offset = Number(offsetArg.value) || 0;
              } else if (offsetArg.type === 'Identifier') {
                  // If it's a variable reference, try to get its value
                  // For now, we'll store the variable name - but this would need runtime resolution
                  const offsetVarName = String(offsetArg.value || '');
                  // We can't resolve variable values at transpile time, so we'll skip for now
                  // In the future, we could add offset as string and handle it at runtime
              }
          }

          // Store plot config with new fields
          const plotConfig: any = {id: plotId, title, color, lineWidth};
          if (display) plotConfig.display = display;
          if (visible !== undefined) plotConfig.visible = visible;
          if (offset !== undefined && offset !== 0) plotConfig.offset = offset;
          this.context.plotConfigs.push(plotConfig);

          // Generate plot data (offset would be applied at runtime by the chart library)
        this.context.plots.push(`${seriesName}.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN }))`);
      }
      return '';
    }

    // Handle unsupported display functions - skip them
      // Handle fill() function - creates a fill between two plots
      if (name === 'fill') {
          const plot1Arg = node.children?.[0];
          const plot2Arg = node.children?.[1];
          const colorArg = this.findNamedArg(node, 'color');
          const titleArg = this.findNamedArg(node, 'title');
          const displayArg = this.findNamedArg(node, 'display');

          if (plot1Arg && plot2Arg) {
              const plot1Name = plot1Arg.type === 'Identifier' ? String(plot1Arg.value || '') : '';
              const plot2Name = plot2Arg.type === 'Identifier' ? String(plot2Arg.value || '') : '';

              // Look up the plot IDs from the variable names
              const plot1Id = this.context.plotVariables.get(sanitizeIdentifier(plot1Name)) || plot1Name;
              const plot2Id = this.context.plotVariables.get(sanitizeIdentifier(plot2Name)) || plot2Name;

              // Extract color (handle ternary expressions like: isBB ? color.new(color.green, 90) : na)
              let color = '#00FF00'; // Default green
              let visible: boolean | string | undefined;
              if (colorArg) {
                  const colorExpr = this.generateExpression(colorArg);
                  // Check for ternary with na (conditional color = conditional visibility)
                  const ternaryNaMatch = colorExpr.match(/^\(?([^?]+)\s*\?\s*(.+)\s*:\s*na\)?$/);
                  if (ternaryNaMatch) {
                      visible = ternaryNaMatch[1].trim();
                      // Try to extract color from the true branch
                      const trueExpr = ternaryNaMatch[2].trim();
                      const extractedColor = getColorValue({type: 'StringLiteral', value: trueExpr});
                      color = extractedColor || '#00FF00';
                  } else {
                      color = getColorValue(colorArg) || '#00FF00';
                  }
              }

              // Also check display parameter for visibility
              if (displayArg && visible === undefined) {
                  const displayExpr = this.generateExpression(displayArg);
                  const ternaryMatch = displayExpr.match(/^\(?([^?]+)\s*\?\s*display\.all\s*:\s*display\.none\)?$/);
                  if (ternaryMatch) {
                      visible = ternaryMatch[1].trim();
                  }
              }

              const title = titleArg ? this.getStringValue(titleArg).replace(/^["']|["']$/g, '') : undefined;

              const fillId = `fill${this.context.fillConfigs.length}`;
              const fillConfig: any = {
                  id: fillId,
                  plot1: plot1Id,
                  plot2: plot2Id,
                  color,
              };
              if (title) fillConfig.title = title;
              if (visible !== undefined) fillConfig.visible = visible;

              this.context.fillConfigs.push(fillConfig);
          }
          return '';
      }

      const unsupportedDisplayFunctions = ['hline', 'bgcolor', 'barcolor', 'plotshape', 'plotchar', 'plotarrow', 'plotcandle', 'plotbar'];
    if (unsupportedDisplayFunctions.includes(name)) {
      // Add a warning comment
      this.context.warnings.push({
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
        this.context.importTracker.trackNamespace('ta');
      return `ta.vwma(${args}, volume)`;
    }

      // Handle runtime.error - throw an error with the given message
      if (name === 'runtime.error') {
          return `(() => { throw new Error(${args}); })()`;
      }

      // Handle nz() function call - needs to be imported
      if (name === 'nz') {
          this.context.importTracker.trackFunction('nz');
          return `nz(${args})`;
      }

      // Handle na() as function call (checks if value is na)
      // Note: 'na' as identifier (value) is transformed to NaN by translateIdentifier
      // and should NOT be tracked since it doesn't need an import
      if (name === 'na') {
          this.context.importTracker.trackFunction('na');
          return `na(${args})`;
      }

    // Translate common function names
    const translated = translateFunctionName(name);

      // Track namespace imports based on the translated function name
      // If translated starts with 'ta.', 'math.', 'array.', etc., track that namespace
      this.context.importTracker.trackNamespace(translated);

    return `${translated}(${args})`;
  }
}
