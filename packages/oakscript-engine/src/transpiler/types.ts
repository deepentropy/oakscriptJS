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

/**
 * Field information for user-defined types
 */
export interface FieldInfo {
  /** Field name */
  name: string;
  /** Field type (PineScript type) */
  fieldType: string;
  /** Default value expression (as string) */
  defaultValue?: string;
  /** Whether the field is optional (has default or is nullable) */
  isOptional: boolean;
}

/**
 * User-defined type information
 */
export interface TypeInfo {
  /** Type name */
  name: string;
  /** Whether this type is exported */
  exported: boolean;
  /** Fields in the type */
  fields: FieldInfo[];
}

/**
 * Method information for user-defined types
 */
export interface MethodInfo {
  /** Method name */
  name: string;
  /** The type this method is bound to (first parameter type) */
  boundType: string;
  /** Whether this method is exported */
  exported: boolean;
  /** Parameter list (excluding 'this' parameter) */
  parameters: MethodParameter[];
  /** Return type (if specified) */
  returnType?: string;
  /** Method body AST node */
  bodyNode?: unknown;
}

/**
 * Method parameter information
 */
export interface MethodParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  paramType: string;
  /** Default value (if any) */
  defaultValue?: string;
}
