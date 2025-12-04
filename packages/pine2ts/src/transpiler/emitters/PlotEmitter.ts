/**
 * Plot and input configuration emitters
 */

import type { InputDefinition, PlotConfig } from '../types.js';
import { colorToHex } from '../mappers/index.js';

/**
 * Get TypeScript type for an input
 */
export function getInputTsType(input: InputDefinition): string {
  switch (input.inputType) {
    case 'int':
    case 'float':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'string':
    case 'color':
    case 'source':
      return 'string';
    default:
      return 'any';
  }
}

/**
 * Format default value for an input
 */
export function formatDefaultValue(input: InputDefinition): string {
  if (input.inputType === 'string' || input.inputType === 'source') {
    return `"${input.defval}"`;
  }
  if (input.inputType === 'color') {
    return `"${colorToHex(String(input.defval))}"`;
  }
  return String(input.defval);
}

/**
 * Emits inputs interface and default values
 */
export function emitInputsInterface(inputs: InputDefinition[]): string[] {
  const lines: string[] = [];
  
  lines.push('export interface IndicatorInputs {');
  for (const input of inputs) {
    const tsType = getInputTsType(input);
    lines.push(`  ${input.name}: ${tsType};`);
  }
  lines.push('}');
  lines.push('');
  
  lines.push('const defaultInputs: IndicatorInputs = {');
  for (const input of inputs) {
    const defaultValue = formatDefaultValue(input);
    lines.push(`  ${input.name}: ${defaultValue},`);
  }
  lines.push('};');
  lines.push('');
  
  return lines;
}

/**
 * Emits syminfo interface
 */
export function emitSyminfoInterface(): string[] {
  const lines: string[] = [];
  
  lines.push('export interface SymbolInfo {');
  lines.push('  ticker: string;');
  lines.push('  tickerid: string;');
  lines.push('  currency: string;');
  lines.push('  mintick: number;');
  lines.push('  pointvalue: number;');
  lines.push('  type: string;');
  lines.push('}');
  lines.push('');
  
  lines.push('const defaultSyminfo: SymbolInfo = {');
  lines.push('  ticker: "UNKNOWN",');
  lines.push('  tickerid: "UNKNOWN",');
  lines.push('  currency: "USD",');
  lines.push('  mintick: 0.01,');
  lines.push('  pointvalue: 1,');
  lines.push('  type: "stock",');
  lines.push('};');
  lines.push('');
  
  return lines;
}

/**
 * Emits timeframe interface
 */
export function emitTimeframeInterface(): string[] {
  const lines: string[] = [];
  
  lines.push('export interface TimeframeInfo {');
  lines.push('  period: string;');
  lines.push('  multiplier: number;');
  lines.push('  isintraday: boolean;');
  lines.push('  isdaily: boolean;');
  lines.push('  isweekly: boolean;');
  lines.push('  ismonthly: boolean;');
  lines.push('}');
  lines.push('');
  
  lines.push('const defaultTimeframe: TimeframeInfo = {');
  lines.push('  period: "D",');
  lines.push('  multiplier: 1,');
  lines.push('  isintraday: false,');
  lines.push('  isdaily: true,');
  lines.push('  isweekly: false,');
  lines.push('  ismonthly: false,');
  lines.push('};');
  lines.push('');
  
  return lines;
}

/**
 * Generate function parameters
 */
export function generateFunctionParams(
  hasInputs: boolean,
  usesSyminfo: boolean,
  usesTimeframe: boolean
): string {
  const params: string[] = ['bars: any[]'];
  
  if (hasInputs) {
    params.push('inputs: Partial<IndicatorInputs> = {}');
  }
  
  if (usesSyminfo) {
    params.push('syminfoParam?: Partial<SymbolInfo>');
  }
  
  if (usesTimeframe) {
    params.push('timeframeParam?: Partial<TimeframeInfo>');
  }
  
  return params.join(', ');
}

/**
 * Generate input config array
 */
export function generateInputConfigArray(inputs: InputDefinition[]): string {
  const configs = inputs.map(input => {
    const parts: string[] = [
      `id: '${input.name}'`,
      `type: '${input.inputType}'`,
      `title: '${input.title || input.name}'`,
      `defval: ${formatDefaultValue(input)}`,
    ];
    
    if (input.minval !== undefined) {
      parts.push(`min: ${input.minval}`);
    }
    if (input.maxval !== undefined) {
      parts.push(`max: ${input.maxval}`);
    }
    if (input.step !== undefined) {
      parts.push(`step: ${input.step}`);
    }
    if (input.options && input.options.length > 0) {
      const optionsStr = input.options.map(opt => `'${opt}'`).join(', ');
      parts.push(`options: [${optionsStr}]`);
    }
    
    return `{ ${parts.join(', ')} }`;
  });
  
  return `[${configs.join(', ')}]`;
}

/**
 * Emit source input mapping
 */
export function emitSourceInputMapping(
  inputs: InputDefinition[],
  variables: Map<string, string>,
  seriesVariables: Set<string>,
  sanitizeIdentifier: (name: string) => string
): string[] {
  const lines: string[] = [];
  const sourceInputs = inputs.filter(i => i.inputType === 'source');
  
  if (sourceInputs.length > 0) {
    lines.push('// Map source inputs to Series');
    for (const input of sourceInputs) {
      const varName = sanitizeIdentifier(input.name);
      const seriesVarName = `${varName}Series`;
      lines.push(`const ${seriesVarName} = (() => {`);
      lines.push(`  switch (${varName}) {`);
      lines.push(`    case "open": return open;`);
      lines.push(`    case "high": return high;`);
      lines.push(`    case "low": return low;`);
      lines.push(`    case "close": return close;`);
      lines.push(`    case "hl2": return hl2;`);
      lines.push(`    case "hlc3": return hlc3;`);
      lines.push(`    case "ohlc4": return ohlc4;`);
      lines.push(`    case "hlcc4": return hlcc4;`);
      lines.push(`    default: return close;`);
      lines.push(`  }`);
      lines.push(`})();`);
      // Update the variable mapping
      variables.set(input.name, seriesVarName);
      seriesVariables.add(seriesVarName);
    }
    lines.push('');
  }
  
  return lines;
}
