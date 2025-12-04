/**
 * PineSuite Regression Tests
 * 
 * This test suite validates transpiled indicators against reference data
 * from the private deepentropy/pinesuite repository.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchPineSuiteCSV, hasPineSuiteToken } from './utils/pinesuite-fetcher.js';
import { parseCSV, getOHLCV, type OHLCVRow } from './utils/csv-parser.js';
import { compareArrays, formatComparisonResult } from './utils/comparison.js';
import indicatorMapping from './indicator-mapping.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TOLERANCE = 1e-4;
const SKIP_INITIAL_VALUES = 100;

interface IndicatorMapping {
  [indicatorName: string]: {
    dataFile: string;
  };
}

const mapping = indicatorMapping as IndicatorMapping;

describe('PineSuite Regression Tests', () => {
  // Skip all tests if PINESUITE_TOKEN is not set
  if (!hasPineSuiteToken()) {
    console.warn('\n⚠️  PINESUITE_TOKEN environment variable is not set. Skipping PineSuite regression tests.\n');
    it.skip('requires PINESUITE_TOKEN to be set', () => {});
    return;
  }

  describe('Transpiled Indicators', () => {
    for (const [indicatorFolder, config] of Object.entries(mapping)) {
      it(`${indicatorFolder} should match PineSuite reference data`, async () => {
        // Check if indicator exists
        const indicatorPath = join(__dirname, '../../../../indicators', indicatorFolder);
        
        if (!existsSync(indicatorPath)) {
          console.log(`⊘ Skipping ${indicatorFolder}: indicator not yet transpiled`);
          // Skip instead of failing for indicators not yet transpiled
          return;
        }

        // Fetch CSV data from pinesuite
        let csvContent: string;
        try {
          csvContent = await fetchPineSuiteCSV(config.dataFile);
        } catch (error) {
          throw new Error(`Failed to fetch ${config.dataFile}: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Parse CSV data
        const referenceData = parseCSV(csvContent);
        if (referenceData.length === 0) {
          throw new Error(`No data found in ${config.dataFile}`);
        }

        // Get OHLCV data
        const ohlcv = getOHLCV(referenceData);
        const bars = referenceData.map(row => ({
          time: row.time,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 0,
        }));

        // Determine output columns (everything after standard OHLCV columns)
        const standardColumns = new Set(['time', 'open', 'high', 'low', 'close', 'volume']);
        const firstRow = referenceData[0];
        const outputColumns = Object.keys(firstRow).filter(col => !standardColumns.has(col));

        if (outputColumns.length === 0) {
          throw new Error(`No output columns found in ${config.dataFile}`);
        }

        // Dynamically import the indicator
        let indicatorModule: any;
        try {
          indicatorModule = await import(`../../../../indicators/${indicatorFolder}/index.js`);
        } catch (error) {
          throw new Error(`Failed to import indicator ${indicatorFolder}: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Get the calculate function
        const calculateFn = indicatorModule.calculate || indicatorModule.default;
        if (typeof calculateFn !== 'function') {
          throw new Error(`Indicator ${indicatorFolder} does not export a calculate function`);
        }

        // Calculate indicator with default inputs
        const result = calculateFn(bars, {});
        
        if (!result || !result.plots) {
          throw new Error(`Indicator ${indicatorFolder} did not return valid result with plots`);
        }

        // Get plot outputs in order (plot0, plot1, plot2, ...)
        const plotKeys = Object.keys(result.plots).sort();
        
        if (plotKeys.length !== outputColumns.length) {
          console.warn(`  ⚠️  Plot count mismatch: ${indicatorFolder} has ${plotKeys.length} plots but CSV has ${outputColumns.length} output columns`);
        }

        // Compare each output
        const results: Record<string, any> = {};
        let allPassed = true;

        for (let i = 0; i < Math.min(plotKeys.length, outputColumns.length); i++) {
          const plotKey = plotKeys[i];
          const columnName = outputColumns[i];
          
          // Extract actual values from plot
          const plotData = result.plots[plotKey];
          const actualValues = plotData.map((p: any) => p.value);
          
          // Extract expected values from CSV
          const expectedValues = referenceData.map(row => {
            const value = row[columnName];
            return typeof value === 'number' ? value : null;
          });

          // Compare with tolerance
          const comparisonResult = compareArrays(
            actualValues,
            expectedValues,
            TOLERANCE,
            SKIP_INITIAL_VALUES
          );

          results[columnName] = comparisonResult;
          
          if (!comparisonResult.passed) {
            allPassed = false;
          }

          console.log(`  ${formatComparisonResult(`${indicatorFolder}[${columnName}]`, comparisonResult)}`);
        }

        // Report overall result
        if (!allPassed) {
          const failedOutputs = Object.entries(results)
            .filter(([, result]) => !result.passed)
            .map(([name]) => name);
          
          console.log(`\n  ❌ ${indicatorFolder}: ${failedOutputs.length} output(s) failed: ${failedOutputs.join(', ')}\n`);
          
          // Show detailed diffs for failed outputs
          for (const [name, result] of Object.entries(results)) {
            if (!result.passed) {
              console.log(formatComparisonResult(`${indicatorFolder}[${name}]`, result, true));
            }
          }
          
          expect(allPassed).toBe(true);
        } else {
          console.log(`  ✓ ${indicatorFolder}: All ${outputColumns.length} output(s) passed\n`);
        }
      });
    }
  });
});
