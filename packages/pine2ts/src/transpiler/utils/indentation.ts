/**
 * Indentation utilities for code generation
 */

/** Number of spaces for each indentation level */
export const INDENT_SIZE = 2;

/**
 * Get indentation string for a single level
 */
export function getIndentString(): string {
  return ' '.repeat(INDENT_SIZE);
}

/**
 * Apply indentation to a line of code
 */
export function applyIndent(line: string, indentLevel: number): string {
  const indentation = getIndentString().repeat(indentLevel);
  return indentation + line;
}
