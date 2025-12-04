/**
 * Type mapping utilities for PineScript to TypeScript
 */

import type { TypeInfo } from '../types.js';

/**
 * Map PineScript types to TypeScript types
 */
export function pineTypeToTs(pineType: string, types: Map<string, TypeInfo>): string {
  // Map PineScript types to TypeScript types
  const typeMap: Record<string, string> = {
    'int': 'number',
    'float': 'number',
    'bool': 'boolean',
    'string': 'string',
    'color': 'string',
    'line': 'Line | null',
    'label': 'Label | null',
    'box': 'Box | null',
    'table': 'Table | null',
    'chart.point': 'ChartPoint',
  };
  
  // Handle generic array types
  if (pineType.startsWith('array<') && pineType.endsWith('>')) {
    const innerType = pineType.slice(6, -1);
    return `${pineTypeToTs(innerType, types)}[]`;
  }
  
  if (typeMap[pineType]) {
    return typeMap[pineType];
  }
  
  // Check if it's a user-defined type
  if (types.has(pineType)) {
    return pineType;
  }
  
  // Assume it's a custom type (e.g., user-defined)
  return pineType;
}

/**
 * Get default value for a PineScript type
 */
export function getDefaultForPineType(pineType: string, types: Map<string, TypeInfo>): string {
  const defaults: Record<string, string> = {
    'int': '0',
    'float': '0.0',
    'bool': 'false',
    'string': '""',
    'color': '"#000000"',
    'line': 'null',
    'label': 'null',
    'box': 'null',
    'table': 'null',
    'chart.point': 'null',
  };
  
  // Handle generic array types
  if (pineType.startsWith('array<')) {
    return '[]';
  }
  
  if (defaults[pineType]) {
    return defaults[pineType];
  }
  
  // For user-defined types, use null to avoid potential infinite recursion
  // (when a type has a field of its own type)
  // Runtime code should handle this with explicit instantiation
  if (types.has(pineType)) {
    return 'null';
  }
  
  return 'null';
}
