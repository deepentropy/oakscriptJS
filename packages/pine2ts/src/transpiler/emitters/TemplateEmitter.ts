/**
 * Template and helper function emitters
 */

/**
 * Emits helper functions needed by the generated code
 */
export function emitHelperFunctions(): string[] {
  const lines: string[] = [];
  
  lines.push('// Helper functions');
  lines.push('function na(value: number | null | undefined): boolean {');
  lines.push('  return value === null || value === undefined || Number.isNaN(value);');
  lines.push('}');
  lines.push('');
  lines.push('function nz(value: number | null | undefined, replacement: number = 0): number {');
  lines.push('  return na(value) ? replacement : value as number;');
  lines.push('}');
  lines.push('');
  
  return lines;
}

/**
 * Emits PlotConfig interface
 */
export function emitPlotConfigInterface(): string[] {
  const lines: string[] = [];
  
  lines.push('// Plot configuration interface');
  lines.push('interface PlotConfig {');
  lines.push('  id: string;');
  lines.push('  title: string;');
  lines.push('  color: string;');
  lines.push('  lineWidth?: number;');
  lines.push('}');
  lines.push('');
  
  return lines;
}

/**
 * Emits InputConfig interface
 */
export function emitInputConfigInterface(): string[] {
  const lines: string[] = [];
  
  lines.push('// Input configuration interface');
  lines.push('export interface InputConfig {');
  lines.push('  id: string;');
  lines.push("  type: 'int' | 'float' | 'bool' | 'source' | 'string';");
  lines.push('  title: string;');
  lines.push('  defval: number | string | boolean;');
  lines.push('  min?: number;');
  lines.push('  max?: number;');
  lines.push('  step?: number;');
  lines.push('  options?: string[];');
  lines.push('}');
  lines.push('');
  
  return lines;
}

/**
 * Emits OHLCV series definitions
 */
export function emitOHLCVSeries(): string[] {
  const lines: string[] = [];
  
  lines.push('// OHLCV Series');
  lines.push("const open = new Series(bars, (bar) => bar.open);");
  lines.push("const high = new Series(bars, (bar) => bar.high);");
  lines.push("const low = new Series(bars, (bar) => bar.low);");
  lines.push("const close = new Series(bars, (bar) => bar.close);");
  lines.push("const volume = new Series(bars, (bar) => bar.volume ?? 0);");
  lines.push('');
  
  return lines;
}

/**
 * Emits calculated price sources
 */
export function emitCalculatedSources(): string[] {
  const lines: string[] = [];
  
  lines.push('// Calculated price sources');
  lines.push('const hl2 = high.add(low).div(2);');
  lines.push('const hlc3 = high.add(low).add(close).div(3);');
  lines.push('const ohlc4 = open.add(high).add(low).add(close).div(4);');
  lines.push('const hlcc4 = high.add(low).add(close).add(close).div(4);');
  lines.push('');
  
  return lines;
}

/**
 * Emits time series - only those that are actually used
 */
export function emitTimeSeries(usedSeries?: Set<string>): string[] {
  const lines: string[] = [];

    // If no filter provided or empty, return empty (nothing used)
    if (!usedSeries || usedSeries.size === 0) {
        return lines;
    }

    const allSeries: Record<string, string> = {
        year: 'const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());',
        month: 'const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);',
        dayofmonth: 'const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());',
        dayofweek: 'const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);',
        hour: 'const hour = new Series(bars, (bar) => new Date(bar.time).getHours());',
        minute: 'const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());',
    };

  lines.push('// Time series');
    for (const [name, code] of Object.entries(allSeries)) {
        if (usedSeries.has(name)) {
            lines.push(code);
        }
    }
  lines.push('');

    return lines;
}

/**
 * Emits bar index
 */
export function emitBarIndex(): string[] {
  const lines: string[] = [];
  
  lines.push('// Bar index');
  lines.push('const last_bar_index = bars.length - 1;');
  lines.push('');
  
  return lines;
}
