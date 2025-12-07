/**
 * Identifier mapping utilities for PineScript to TypeScript
 */

import {sanitizeIdentifier} from '../utils/index.js';

/**
 * Translate PineScript identifiers to TypeScript equivalents
 */
export function translateIdentifier(name: string, variables: Map<string, string>): string {
  // Handle built-in identifiers
  const builtins: Record<string, string> = {
    'na': 'NaN',
    'true': 'true',
    'false': 'false',
    'bar_index': 'i',
    'this': 'self',  // Method context: 'this' becomes 'self'
  };

  if (builtins[name]) {
    return builtins[name];
  }

  // Check if variable has been mapped (e.g., source inputs mapped to Series)
  if (variables.has(name)) {
    return variables.get(name)!;
  }

  return sanitizeIdentifier(name);
}

/**
 * Translate PineScript member expressions to TypeScript equivalents
 */
export function translateMemberExpression(name: string): string {
  // Handle color constants
  if (name.startsWith('color.')) {
    return `"${name.replace('color.', '')}"`;
  }

  // Handle 'this.field' -> 'self.field' for method context
  if (name.startsWith('this.')) {
    return name.replace('this.', 'self.');
  }
  
  // Handle barstate variables
    // Note: In batch mode (processing all bars at once), barstate variables have fixed values:
    // - isfirst: false (we've processed past the first bar)
    // - islast: true (we're at the end of available data)
    // - isconfirmed: true (all historical bars are confirmed)
    // - islastconfirmedhistory: true (same as islast for historical data)
    // - isrealtime: false (we're processing historical data)
    // - isnew: false (not in a real-time streaming context)
  const barstateMap: Record<string, string> = {
      'barstate.isfirst': 'false',
      'barstate.islast': 'true',
    'barstate.isconfirmed': 'true',
      'barstate.islastconfirmedhistory': 'true',
    'barstate.isrealtime': 'false',
      'barstate.isnew': 'false',
  };
  
  if (barstateMap[name]) {
    return barstateMap[name];
  }

  // Handle syminfo variables
  if (name.startsWith('syminfo.')) {
    const prop = name.replace('syminfo.', '');
    return `syminfo.${prop}`;
  }

  // Handle timeframe variables
  if (name.startsWith('timeframe.')) {
    const prop = name.replace('timeframe.', '');
    return `timeframe.${prop}`;
  }
  
  return name;
}
