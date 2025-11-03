/**
 * Core types for OakScriptJS
 * These types mirror the PineScript type system
 */

// Basic types
export type int = number;
export type float = number;
export type bool = boolean;
//export type string = string;
export type color = string | number;

// Series types - In PineScript, series are time-series arrays
export type series<T> = T[];
export type series_int = series<int>;
export type series_float = series<float>;
export type series_bool = series<bool>;
export type series_string = series<string>;
export type series_color = series<color>;

// Simple types (non-series)
export type simple_int = int;
export type simple_float = float;
export type simple_bool = bool;
export type simple_string = string;
export type simple_color = color;

// Input types
export type input_int = int;
export type input_float = float;
export type input_bool = bool;
export type input_string = string;
export type input_color = color;

// Source types for indicators
export type Source = series_float;

// Array types
export interface PineArray<T> extends Array<T> {
  // PineScript arrays have specific methods
}

// Matrix types
export interface PineMatrix<T> {
  rows: int;
  columns: int;
  data: T[][];
}

// Excluded types (Line, Label, Box, Table) - not used in calculation-only library
// Excluded types (StrategyEntry, StrategyExit) - not used in calculation-only library

// Bar data
export interface Bar {
  time: int;
  open: float;
  high: float;
  low: float;
  close: float;
  volume?: float;
}

// OHLC data type
export interface OHLC {
  open: series_float;
  high: series_float;
  low: series_float;
  close: series_float;
}

// Constants
export const na = null;
export type na = null;
