/**
 * Semantic analysis module
 * 
 * Exports all semantic analysis components
 */

export { SemanticAnalyzer } from './SemanticAnalyzer.js';
export type { SemanticResult } from './SemanticAnalyzer.js';

export { SymbolTable } from './SymbolTable.js';
export type { Symbol, Scope, ScopeKind, SourceLocation } from './SymbolTable.js';

export { TypeChecker } from './TypeChecker.js';

export type { PineType, ParamType } from './PineTypes.js';
export { PineTypes, isAssignable, typeToString } from './PineTypes.js';

export type { SemanticError, SemanticWarning, SemanticErrorKind } from './SemanticError.js';
export { createSemanticError, formatSemanticError } from './SemanticError.js';

export { BUILTIN_VARIABLES, BUILTIN_FUNCTIONS } from './BuiltinSymbols.js';
