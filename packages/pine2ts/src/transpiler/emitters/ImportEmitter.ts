/**
 * Import statement emitters
 */

import type { ImportInfo } from '../types.js';

/**
 * Emits the main import statement for oakscriptjs
 */
export function emitMainImport(): string {
    return "import { Series, ta, taCore, math, array, type IndicatorResult } from 'oakscriptjs';";
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
