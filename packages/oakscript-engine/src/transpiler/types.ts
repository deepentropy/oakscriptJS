/**
 * PineScript to TypeScript transpiler types
 */

export interface TranspileOptions {
  /** Source filename for error messages */
  filename?: string;
  /** Generate sourcemap */
  sourcemap?: boolean;
  /** Target format: 'function' or 'class' */
  format?: 'function' | 'class';
  /** Include imports in output */
  includeImports?: boolean;
}

export interface TranspileResult {
  code: string;
  sourcemap?: string;
  errors: TranspileError[];
  warnings: TranspileWarning[];
}

export interface TranspileError {
  message: string;
  line?: number;
  column?: number;
}

export interface TranspileWarning {
  message: string;
  line?: number;
  column?: number;
}
