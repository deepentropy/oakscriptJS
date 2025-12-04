/**
 * Semantic error types and definitions
 */

export type SemanticErrorKind =
  | 'UNDEFINED_VARIABLE'
  | 'UNDEFINED_FUNCTION'
  | 'TYPE_MISMATCH'
  | 'INVALID_ASSIGNMENT'
  | 'CONST_REASSIGNMENT'
  | 'INVALID_HISTORY_ACCESS'
  | 'WRONG_ARGUMENT_COUNT'
  | 'WRONG_ARGUMENT_TYPE'
  | 'BREAK_OUTSIDE_LOOP'
  | 'CONTINUE_OUTSIDE_LOOP'
  | 'DUPLICATE_DECLARATION'
  | 'INVALID_OPERATOR';

export interface SemanticError {
  kind: SemanticErrorKind;
  message: string;
  line: number;
  column: number;
  context?: string;  // Code snippet for context
}

export interface SemanticWarning {
  message: string;
  line: number;
  column: number;
  context?: string;
}

/**
 * Create a semantic error
 */
export function createSemanticError(
  kind: SemanticErrorKind,
  message: string,
  line: number,
  column: number,
  context?: string
): SemanticError {
  return {
    kind,
    message,
    line,
    column,
    context,
  };
}

/**
 * Format a semantic error for display
 */
export function formatSemanticError(error: SemanticError): string {
  let output = `Semantic Error [${error.kind}] at line ${error.line}, column ${error.column}:\n`;
  output += `  ${error.message}\n`;
  
  if (error.context) {
    output += `\n    ${error.line} | ${error.context}\n`;
    output += `      | ${' '.repeat(error.column)}^\n`;
  }
  
  return output;
}
