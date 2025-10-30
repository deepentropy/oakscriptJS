/**
 * Utility functions for OakScriptJS
 * These are internal helpers and not part of the PineScript API
 */

import { series_float, int, float, Source } from '../types';

/**
 * Validates that a series has sufficient data for a given length
 */
export function validateSeriesLength(source: Source, length: int, functionName: string): void {
  if (source.length < length) {
    console.warn(`${functionName}: Source length (${source.length}) is less than required length (${length})`);
  }
}

/**
 * Creates a series filled with NaN values
 */
export function createNaNSeries(length: int): series_float {
  return new Array(length).fill(NaN);
}

/**
 * Checks if a value is NaN or null
 */
export function isNA(value: any): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

/**
 * Returns the value or a default if it's NA
 */
export function nz(value: any, defaultValue: any = 0): any {
  return isNA(value) ? defaultValue : value;
}

/**
 * Ensures a value is within bounds
 */
export function clamp(value: float, min: float, max: float): float {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: float, end: float, t: float): float {
  return start + (end - start) * t;
}

/**
 * Normalize a value from one range to another
 */
export function normalize(value: float, min: float, max: float, newMin: float = 0, newMax: float = 1): float {
  return newMin + ((value - min) * (newMax - newMin)) / (max - min);
}
