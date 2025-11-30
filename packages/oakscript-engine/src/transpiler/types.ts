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

/**
 * Input definition collected from input.* function calls
 */
export interface InputDefinition {
  /** Input variable name */
  name: string;
  /** Input type: int, float, bool, string, color, source */
  inputType: 'int' | 'float' | 'bool' | 'string' | 'color' | 'source';
  /** Default value */
  defval: unknown;
  /** Display title */
  title?: string;
  /** Minimum value (for int/float) */
  minval?: number;
  /** Maximum value (for int/float) */
  maxval?: number;
  /** Step value (for float) */
  step?: number;
  /** Options array (for string) */
  options?: string[];
}

/**
 * Source type options for input.source()
 */
export type SourceType = 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';

/**
 * Symbol info interface
 */
export interface SymbolInfo {
  ticker: string;
  tickerid: string;
  currency: string;
  mintick: number;
  pointvalue: number;
  type: string;
}

/**
 * Timeframe info interface
 */
export interface TimeframeInfo {
  period: string;
  multiplier: number;
  isintraday: boolean;
  isdaily: boolean;
  isweekly: boolean;
  ismonthly: boolean;
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
