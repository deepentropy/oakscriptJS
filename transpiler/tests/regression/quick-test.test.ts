/**
 * Quick indicator test with small sample
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, extractColumn } from './utils/csv-parser.js';
import { compareArrays, formatComparisonResult } from './utils/comparison.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Quick Indicator Test', () => {
  it('should load CSV and extract columns', () => {
    const csvPath = join(__dirname, '../../../tests/SP_SPX, 1D_649c1.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const data = parseCSV(csvContent);
    
    console.log(`Loaded ${data.length} bars`);
    expect(data.length).toBeGreaterThan(0);
    
    // Extract a column
    const closes = extractColumn(data, 'close');
    expect(closes.length).toBe(data.length);
    expect(closes[0]).toBeTypeOf('number');
  });
  
  it('should compare arrays', () => {
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];
    const result = compareArrays(arr1, arr2, 0.001);
    
    expect(result.passed).toBe(true);
    expect(result.validComparisons).toBe(5);
    expect(result.mismatches).toBe(0);
  });
});
