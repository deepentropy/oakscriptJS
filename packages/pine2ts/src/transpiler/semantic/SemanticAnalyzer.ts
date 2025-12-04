/**
 * Semantic analyzer for PineScript
 * 
 * Performs semantic analysis on the AST to detect errors before code generation
 */

import type { ASTNode } from '../PineParser.js';
import { SymbolTable } from './SymbolTable.js';
import { TypeChecker } from './TypeChecker.js';
import { PineTypes } from './PineTypes.js';
import type { SemanticError, SemanticWarning } from './SemanticError.js';
import { createSemanticError } from './SemanticError.js';
import { BUILTIN_VARIABLES, BUILTIN_FUNCTIONS } from './BuiltinSymbols.js';

export interface SemanticResult {
  valid: boolean;
  errors: SemanticError[];
  warnings: SemanticWarning[];
  symbolTable: SymbolTable;
}

export class SemanticAnalyzer {
  private symbolTable: SymbolTable;
  private typeChecker: TypeChecker;
  private errors: SemanticError[];
  private warnings: SemanticWarning[];
  private userDefinedFunctions: Set<string> = new Set();
  
  constructor() {
    this.symbolTable = new SymbolTable();
    this.typeChecker = new TypeChecker();
    this.errors = [];
    this.warnings = [];
  }
  
  /**
   * Analyze an AST and return the result
   */
  analyze(ast: ASTNode): SemanticResult {
    // Reset state
    this.errors = [];
    this.warnings = [];
    this.userDefinedFunctions.clear();
    
    // Populate built-in symbols
    this.populateBuiltins();
    
    // Analyze the program
    if (ast.type === 'Program' && ast.children) {
      for (const child of ast.children) {
        this.visitStatement(child);
      }
    }
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      symbolTable: this.symbolTable,
    };
  }
  
  /**
   * Populate the symbol table with built-in symbols
   */
  private populateBuiltins(): void {
    const globalScope = this.symbolTable.currentScope();
    if (!globalScope) return;
    
    // Add built-in variables
    for (const builtin of BUILTIN_VARIABLES) {
      this.symbolTable.declareSymbol({
        ...builtin,
        declaredAt: { line: 0, column: 0 },
      });
    }
    
    // Add built-in functions
    for (const builtin of BUILTIN_FUNCTIONS) {
      this.symbolTable.declareSymbol({
        ...builtin,
        declaredAt: { line: 0, column: 0 },
      });
    }
  }
  
  /**
   * Visit a statement node
   */
  private visitStatement(node: ASTNode): void {
    if (!node) return;
    
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    switch (node.type) {
      case 'Comment':
        // Skip comments
        break;
      
      case 'IndicatorDeclaration':
      case 'LibraryDeclaration':
        // These are declarations, not executable statements
        // We skip argument validation for these as they have complex named parameter handling
        break;
      
      case 'TypeDeclaration':
      case 'MethodDeclaration':
        // User-defined types and methods are handled by the code generator
        // For Phase 1, we skip semantic analysis of these
        // Phase 2 will add full type checking
        break;
      
      case 'FunctionDeclaration':
        this.visitFunctionDeclaration(node);
        break;
      
      case 'VariableDeclaration':
        this.visitVariableDeclaration(node);
        break;
      
      case 'Assignment':
        this.visitAssignment(node);
        break;
      
      case 'Reassignment':
        this.visitReassignment(node);
        break;
      
      case 'ExpressionStatement':
        if (node.children && node.children.length > 0) {
          const child = node.children[0]!;
          // Handle assignments specially
          if (child.type === 'Assignment') {
            this.visitAssignment(child);
          } else if (child.type === 'Reassignment') {
            this.visitReassignment(child);
          } else {
            this.visitExpression(child);
          }
        }
        break;
      
      case 'IfStatement':
        this.visitIfStatement(node);
        break;
      
      case 'ForLoop':
      case 'ForInLoop':
      case 'WhileLoop':
        this.visitLoop(node);
        break;
      
      case 'TupleDestructuring':
        this.visitTupleDestructuring(node);
        break;
      
      case 'BreakStatement':
        if (!this.symbolTable.isInsideLoop()) {
          this.errors.push(createSemanticError(
            'BREAK_OUTSIDE_LOOP',
            'break statement must be inside a loop',
            line,
            column
          ));
        }
        break;
      
      case 'ContinueStatement':
        if (!this.symbolTable.isInsideLoop()) {
          this.errors.push(createSemanticError(
            'CONTINUE_OUTSIDE_LOOP',
            'continue statement must be inside a loop',
            line,
            column
          ));
        }
        break;
      
      default:
        // Try to process as expression
        this.visitExpression(node);
    }
  }
  
  /**
   * Visit a function declaration
   */
  private visitFunctionDeclaration(node: ASTNode): void {
    const name = String(node.value || 'unknown');
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    // Check for duplicate declaration
    if (this.symbolTable.isInCurrentScope(name)) {
      this.errors.push(createSemanticError(
        'DUPLICATE_DECLARATION',
        `Function '${name}' is already declared in this scope`,
        line,
        column
      ));
      return;
    }
    
    // Parse parameters from node.name (e.g., "x, y" or "x")
    const params = node.name ? String(node.name).split(',').map(p => p.trim()).filter(Boolean) : [];
    
    // Declare the function
    this.symbolTable.declareSymbol({
      name,
      kind: 'function',
      type: PineTypes.function(
        params.map(p => ({ type: PineTypes.unknown() })),
        PineTypes.unknown()
      ),
      isConst: true,
      isSeries: false,
      isReassignable: false,
      declaredAt: { line, column },
    });
    
    // Track user-defined functions
    this.userDefinedFunctions.add(name);
    
    // Enter function scope
    this.symbolTable.enterScope('function');
    
    // Declare parameters in function scope
    for (const param of params) {
      this.symbolTable.declareSymbol({
        name: param,
        kind: 'parameter',
        type: PineTypes.unknown(),
        isConst: false,
        isSeries: false,
        isReassignable: true,
        declaredAt: { line, column },
      });
    }
    
    // Visit function body
    if (node.children && node.children.length > 0) {
      const body = node.children[0]!;
      if (body.type === 'Block' && body.children) {
        for (const stmt of body.children) {
          this.visitStatement(stmt);
        }
      } else {
        this.visitExpression(body);
      }
    }
    
    // Exit function scope
    this.symbolTable.exitScope();
  }
  
  /**
   * Visit a variable declaration
   */
  private visitVariableDeclaration(node: ASTNode): void {
    const name = String(node.value || 'unknown');
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    // Check for duplicate declaration
    if (this.symbolTable.isInCurrentScope(name)) {
      this.errors.push(createSemanticError(
        'DUPLICATE_DECLARATION',
        `Variable '${name}' is already declared in this scope`,
        line,
        column
      ));
      return;
    }
    
    // Infer type from initializer if present
    let varType = PineTypes.unknown();
    if (node.children && node.children.length > 0) {
      varType = this.typeChecker.inferType(node.children[0]!, this.symbolTable);
    }
    
    // Declare the variable
    this.symbolTable.declareSymbol({
      name,
      kind: 'variable',
      type: varType,
      isConst: true,  // var keyword not used
      isSeries: varType.kind === 'series',
      isReassignable: false,
      declaredAt: { line, column },
    });
  }
  
  /**
   * Visit an assignment (=)
   */
  private visitAssignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;
    
    const left = node.children[0]!;
    const right = node.children[1]!;
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    // Check if this is a simple variable assignment
    if (left.type === 'Identifier') {
      const name = String(left.value || '');
      
      // Check for duplicate declaration
      if (this.symbolTable.isInCurrentScope(name)) {
        this.errors.push(createSemanticError(
          'DUPLICATE_DECLARATION',
          `Variable '${name}' is already declared in this scope`,
          line,
          column
        ));
        return;
      }
      
      // Check if right side is an input.* function (these are handled specially)
      if (right.type === 'FunctionCall') {
        const funcName = String(right.value || '');
        if (funcName === 'input' || funcName.startsWith('input.')) {
          // Input variables - declare them as parameters
          this.symbolTable.declareSymbol({
            name,
            kind: 'parameter',
            type: PineTypes.unknown(),  // Type depends on input type
            isConst: true,
            isSeries: false,
            isReassignable: false,
            declaredAt: { line, column },
          });
          return;
        }
      }
      
      // Infer type from right side
      const rightType = this.typeChecker.inferType(right, this.symbolTable);
      
      // Declare the variable
      this.symbolTable.declareSymbol({
        name,
        kind: 'variable',
        type: rightType,
        isConst: true,  // = creates const
        isSeries: rightType.kind === 'series',
        isReassignable: false,
        declaredAt: { line, column },
      });
    }
    
    // Visit the right side to check for undefined variables
    this.visitExpression(right);
  }
  
  /**
   * Visit a reassignment (:=)
   */
  private visitReassignment(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;
    
    const left = node.children[0]!;
    const right = node.children[1]!;
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    if (left.type === 'Identifier') {
      const name = String(left.value || '');
      const symbol = this.symbolTable.lookupSymbol(name);
      
      // Check if variable is defined
      if (!symbol) {
        this.errors.push(createSemanticError(
          'UNDEFINED_VARIABLE',
          `Variable '${name}' is not defined`,
          line,
          column
        ));
        return;
      }
      
      // NOTE: In Phase 1, we're being lenient about const reassignment.
      // PineScript allows reassigning variables declared with `=` using `:=`,
      // which is a common pattern. Full const checking would require data flow
      // analysis and is deferred to Phase 2.
      // 
      // For now, we only error if trying to reassign critical built-in constants
      // (OHLCV data, time variables, etc.)
      const protectedBuiltins = new Set([
        'open', 'high', 'low', 'close', 'volume',
        'hl2', 'hlc3', 'ohlc4', 'hlcc4',
        'bar_index', 'time', 'year', 'month', 'weekofyear',
        'dayofmonth', 'dayofweek', 'hour', 'minute', 'second',
        'na', 'true', 'false'
      ]);
      
      if (protectedBuiltins.has(name)) {
        this.errors.push(createSemanticError(
          'CONST_REASSIGNMENT',
          `Cannot reassign built-in constant '${name}'`,
          line,
          column
        ));
        return;
      }
    }
    
    // Visit both sides
    this.visitExpression(left);
    this.visitExpression(right);
  }
  
  /**
   * Visit an if statement
   */
  private visitIfStatement(node: ASTNode): void {
    if (!node.children || node.children.length < 2) return;
    
    const condition = node.children[0]!;
    const body = node.children[1]!;
    const alternate = node.children[2];
    
    // Visit condition
    this.visitExpression(condition);
    
    // Visit body in a new scope
    this.symbolTable.enterScope('block');
    if (body.type === 'Block' && body.children) {
      for (const stmt of body.children) {
        this.visitStatement(stmt);
      }
    } else {
      this.visitStatement(body);
    }
    this.symbolTable.exitScope();
    
    // Visit alternate if present
    if (alternate) {
      if (alternate.type === 'IfStatement') {
        this.visitIfStatement(alternate);
      } else {
        this.symbolTable.enterScope('block');
        if (alternate.type === 'Block' && alternate.children) {
          for (const stmt of alternate.children) {
            this.visitStatement(stmt);
          }
        } else {
          this.visitStatement(alternate);
        }
        this.symbolTable.exitScope();
      }
    }
  }
  
  /**
   * Visit a loop statement
   */
  private visitLoop(node: ASTNode): void {
    // Enter loop scope
    this.symbolTable.enterScope('loop');
    
    if (node.type === 'ForLoop') {
      // for i = start to end
      if (node.children && node.children.length >= 3) {
        const varName = node.name || 'i';
        const start = node.children[0]!;
        const end = node.children[1]!;
        const body = node.children[2]!;
        
        // Declare loop variable
        this.symbolTable.declareSymbol({
          name: varName,
          kind: 'variable',
          type: PineTypes.int(),
          isConst: false,
          isSeries: false,
          isReassignable: true,
          declaredAt: { line: node.location?.line || 0, column: node.location?.column || 0 },
        });
        
        // Visit start and end expressions
        this.visitExpression(start);
        this.visitExpression(end);
        
        // Visit body
        if (body.type === 'Block' && body.children) {
          for (const stmt of body.children) {
            this.visitStatement(stmt);
          }
        } else {
          this.visitStatement(body);
        }
      }
    } else if (node.type === 'ForInLoop') {
      // for item in array or for [index, item] in array
      if (node.children && node.children.length >= 2) {
        const varName = node.name || 'item';
        const iterable = node.children[0]!;
        const body = node.children[1]!;
        
        // Visit iterable
        this.visitExpression(iterable);
        
        // Declare loop variable(s)
        // If varName contains comma, it's a destructured pattern like "index,item"
        const varNames = varName.split(',').map(n => n.trim()).filter(Boolean);
        for (const name of varNames) {
          this.symbolTable.declareSymbol({
            name,
            kind: 'variable',
            type: PineTypes.unknown(),
            isConst: false,
            isSeries: false,
            isReassignable: true,
            declaredAt: { line: node.location?.line || 0, column: node.location?.column || 0 },
          });
        }
        
        // Visit body
        if (body.type === 'Block' && body.children) {
          for (const stmt of body.children) {
            this.visitStatement(stmt);
          }
        } else {
          this.visitStatement(body);
        }
      }
    } else if (node.type === 'WhileLoop') {
      // while condition
      if (node.children && node.children.length >= 2) {
        const condition = node.children[0]!;
        const body = node.children[1]!;
        
        // Visit condition
        this.visitExpression(condition);
        
        // Visit body
        if (body.type === 'Block' && body.children) {
          for (const stmt of body.children) {
            this.visitStatement(stmt);
          }
        } else {
          this.visitStatement(body);
        }
      }
    }
    
    // Exit loop scope
    this.symbolTable.exitScope();
  }
  
  /**
   * Visit a tuple destructuring statement
   */
  private visitTupleDestructuring(node: ASTNode): void {
    if (!node.children || node.children.length < 1) return;
    
    const varNames = node.name || '';
    const initializer = node.children[0]!;
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    // Visit the initializer expression
    this.visitExpression(initializer);
    
    // Declare the variables
    const names = varNames.split(',').map(n => n.trim()).filter(Boolean);
    for (const name of names) {
      // Check for duplicate declaration
      if (this.symbolTable.isInCurrentScope(name)) {
        this.errors.push(createSemanticError(
          'DUPLICATE_DECLARATION',
          `Variable '${name}' is already declared in this scope`,
          line,
          column
        ));
        continue;
      }
      
      // Declare the variable (type unknown for now)
      this.symbolTable.declareSymbol({
        name,
        kind: 'variable',
        type: PineTypes.unknown(),
        isConst: true,
        isSeries: false,
        isReassignable: false,
        declaredAt: { line, column },
      });
    }
  }
  
  /**
   * Visit an expression
   */
  private visitExpression(node: ASTNode): void {
    if (!node) return;
    
    const line = node.location?.line || 0;
    const column = node.location?.column || 0;
    
    switch (node.type) {
      case 'Identifier': {
        // Skip 'na' - it's a built-in constant
        if (node.value === 'na') {
          break;
        }
        
        const name = String(node.value || '');
        const symbol = this.symbolTable.lookupSymbol(name);
        
        if (!symbol) {
          this.errors.push(createSemanticError(
            'UNDEFINED_VARIABLE',
            `Variable '${name}' is not defined`,
            line,
            column
          ));
        }
        break;
      }
      
      case 'FunctionCall':
      case 'GenericFunctionCall': {
        const funcName = String(node.value || '');
        
        // Skip input.* functions - they're handled specially
        if (funcName === 'input' || funcName.startsWith('input.')) {
          break;
        }
        
        // Check if function is defined
        const symbol = this.symbolTable.lookupSymbol(funcName);
        
        if (!symbol && !this.userDefinedFunctions.has(funcName)) {
          // Unknown function - could be a user-defined function or a built-in we don't know about
          // For now, we'll be lenient and not error (just a warning would be too noisy)
          // In the future, we could maintain a more complete list of built-ins
        }
        
        // Check argument count if we know the function signature
        // Skip for GenericFunctionCall as they have complex type parameters
        if (node.type === 'FunctionCall' && symbol && symbol.type.kind === 'function') {
          const expectedParams = symbol.type.params;
          const actualArgs = node.children || [];
          
          // Count required parameters (non-optional)
          const requiredCount = expectedParams.filter(p => !p.optional).length;
          const totalCount = expectedParams.length;
          
          if (actualArgs.length < requiredCount) {
            this.errors.push(createSemanticError(
              'WRONG_ARGUMENT_COUNT',
              `Function '${funcName}' expects at least ${requiredCount} argument(s), but got ${actualArgs.length}`,
              line,
              column
            ));
          } else if (actualArgs.length > totalCount) {
            this.errors.push(createSemanticError(
              'WRONG_ARGUMENT_COUNT',
              `Function '${funcName}' expects at most ${totalCount} argument(s), but got ${actualArgs.length}`,
              line,
              column
            ));
          }
        }
        
        // Visit arguments
        if (node.children) {
          for (const arg of node.children) {
            this.visitExpression(arg);
          }
        }
        break;
      }
      
      case 'BinaryExpression':
      case 'UnaryExpression':
      case 'TernaryExpression':
        // Visit all children
        if (node.children) {
          for (const child of node.children) {
            this.visitExpression(child);
          }
        }
        break;
      
      case 'HistoryAccess':
        // Visit base and offset
        if (node.children) {
          for (const child of node.children) {
            this.visitExpression(child);
          }
        }
        break;
      
      default:
        // Visit children if any
        if (node.children) {
          for (const child of node.children) {
            this.visitExpression(child);
          }
        }
    }
  }
}
