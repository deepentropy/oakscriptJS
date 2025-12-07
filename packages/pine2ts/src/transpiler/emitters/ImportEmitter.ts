/**
 * Import statement emitters
 */

import type { ImportInfo } from '../types.js';

/**
 * Emits the main import statement for oakscriptjs
 * Only imports what's actually used in the indicator
 */
export function emitMainImport(usedImports?: Set<string>): string {
    const imports: string[] = [];

    // Series is always needed for OHLCV data
    imports.push('Series');

    // Add used imports - check what namespaces/functions are actually used
    if (usedImports) {
        if (usedImports.has('ta')) imports.push('ta');
        if (usedImports.has('taCore')) imports.push('taCore');
        if (usedImports.has('math')) imports.push('math');
        if (usedImports.has('array')) imports.push('array');
        if (usedImports.has('na')) imports.push('na');
        if (usedImports.has('nz')) imports.push('nz');
    }

    // Type imports are always needed for the function signature
    const typeImports = ['type IndicatorResult', 'type InputConfig', 'type PlotConfig'];

    return `import { ${imports.join(', ')}, ${typeImports.join(', ')} } from 'oakscriptjs';`;
}

/**
 * Emits library imports
 */
export function emitLibraryImports(imports: ImportInfo[]): string[] {
  const lines: string[] = [];
  
  for (const imp of imports) {
    const moduleName = `${imp.publisher}_${imp.libraryName}_v${imp.version}`;
    lines.push(`import * as ${imp.alias} from './libs/${moduleName}';`);
  }
  
  return lines;
}
