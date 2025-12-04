/**
 * PineSuite Regression Tests
 * 
 * This test suite validates transpiled indicators against reference data
 * from the private deepentropy/pinesuite repository.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchPineSuiteCSV, hasPineSuiteToken } from './utils/pinesuite-fetcher.js';
import { parseCSV, type OHLCVRow } from './utils/csv-parser.js';
import { compareArrays, formatComparisonResult } from './utils/comparison.js';
import indicatorMapping from './indicator-mapping.json' with { type: 'json' };

// Static imports for all mapped indicators
import * as smaIndicator from '../../../../indicators/sma/index.js';
import * as momentumIndicator from '../../../../indicators/momentum/index.js';
import * as bopIndicator from '../../../../indicators/bop/index.js';
import * as demaIndicator from '../../../../indicators/dema/index.js';
import * as temaIndicator from '../../../../indicators/tema/index.js';
import * as rocIndicator from '../../../../indicators/roc/index.js';
import * as adrIndicator from '../../../../indicators/adr/index.js';
import * as massIndexIndicator from '../../../../indicators/mass-index/index.js';
import * as mcGinleyIndicator from '../../../../indicators/mc-ginley-dynamic/index.js';
import * as hmaIndicator from '../../../../indicators/hma/index.js';
import * as lsmaIndicator from '../../../../indicators/lsma/index.js';
import * as almaIndicator from '../../../../indicators/alma/index.js';
import * as obvIndicator from '../../../../indicators/obv/index.js';
import * as rmaIndicator from '../../../../indicators/rma/index.js';
import * as vwmaIndicator from '../../../../indicators/vwma/index.js';
import * as wmaIndicator from '../../../../indicators/wma/index.js';

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

interface IndicatorModule {
  calculate?: (bars: any[], inputs: any) => IndicatorResult;
  default?: (bars: any[], inputs: any) => IndicatorResult;
}

interface PlotData {
  time: string | number;
  value: number | null | undefined;
}

interface IndicatorResult {
  metadata?: any;
  plots: Record<string, PlotData[]>;
}

const mapping = indicatorMapping as IndicatorMapping;

// Test result tracking
interface TestResult {
  indicator: string;
  status: 'passed' | 'failed' | 'skipped';
  maxDiff?: number;
  plotCount?: number;
  csvColumns?: number;
  failedOutputs?: Array<{ name: string; reason: string }>;
}

const testResults: TestResult[] = [];

// Static indicator module map for Vitest compatibility
const indicatorModules: Record<string, IndicatorModule> = {
  'sma': smaIndicator,
  'momentum': momentumIndicator,
  'bop': bopIndicator,
  'dema': demaIndicator,
  'tema': temaIndicator,
  'roc': rocIndicator,
  'adr': adrIndicator,
  'mass-index': massIndexIndicator,
  'mc-ginley-dynamic': mcGinleyIndicator,
  'hma': hmaIndicator,
  'lsma': lsmaIndicator,
  'alma': almaIndicator,
  'obv': obvIndicator,
  'rma': rmaIndicator,
  'vwma': vwmaIndicator,
  'wma': wmaIndicator,
};

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
          testResults.push({
            indicator: indicatorFolder,
            status: 'skipped',
          });
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

        // Convert to bar format
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

        // Get indicator from static import map
        const indicatorModule = indicatorModules[indicatorFolder];
        if (!indicatorModule) {
          console.log(`⊘ Skipping ${indicatorFolder}: indicator not in import map`);
          testResults.push({
            indicator: indicatorFolder,
            status: 'skipped',
          });
          return;
        }

        // Get the calculate function
        const calculateFn = indicatorModule.calculate || indicatorModule.default;
        if (typeof calculateFn !== 'function') {
          throw new Error(`Indicator ${indicatorFolder} does not export a calculate function`);
        }

        // Calculate indicator with default inputs
        const result: IndicatorResult = calculateFn(bars, {});
        
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
        let maxDiff = 0;

        for (let i = 0; i < Math.min(plotKeys.length, outputColumns.length); i++) {
          const plotKey = plotKeys[i];
          const columnName = outputColumns[i];
          
          // Extract actual values from plot
          const plotData: PlotData[] = result.plots[plotKey];
          const actualValues = plotData.map((p) => p.value);
          
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

          // Track max diff
          if (comparisonResult.maxDiff !== undefined && comparisonResult.maxDiff > maxDiff) {
            maxDiff = comparisonResult.maxDiff;
          }

          console.log(`  ${formatComparisonResult(`${indicatorFolder}[${columnName}]`, comparisonResult)}`);
        }

        // Report overall result
        if (!allPassed) {
          const failedOutputs = Object.entries(results)
            .filter(([, result]) => !result.passed)
            .map(([name, result]) => ({
              name,
              reason: result.failureCount ? `${result.failureCount} values exceeded tolerance` : 'comparison failed'
            }));
          
          console.log(`\n  ❌ ${indicatorFolder}: ${failedOutputs.length} output(s) failed: ${failedOutputs.map(o => o.name).join(', ')}\n`);
          
          // Show detailed diffs for failed outputs
          for (const [name, result] of Object.entries(results)) {
            if (!result.passed) {
              console.log(formatComparisonResult(`${indicatorFolder}[${name}]`, result, true));
            }
          }
          
          testResults.push({
            indicator: indicatorFolder,
            status: 'failed',
            plotCount: plotKeys.length,
            csvColumns: outputColumns.length,
            failedOutputs,
          });
          
          expect(allPassed).toBe(true);
        } else {
          console.log(`  ✓ ${indicatorFolder}: All ${outputColumns.length} output(s) passed\n`);
          
          testResults.push({
            indicator: indicatorFolder,
            status: 'passed',
            maxDiff,
            plotCount: plotKeys.length,
            csvColumns: outputColumns.length,
          });
        }
      });
    }
  });

  // Test summary report
  afterAll(() => {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                  PINESUITE REGRESSION TEST SUMMARY             ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Indicators Tested: ${testResults.length}`);
    console.log(`Passed: ${testResults.filter(r => r.status === 'passed').length}`);
    console.log(`Failed: ${testResults.filter(r => r.status === 'failed').length}`);
    console.log(`Skipped: ${testResults.filter(r => r.status === 'skipped').length}`);
    console.log('───────────────────────────────────────────────────────────────');
    
    // Print each result
    for (const result of testResults) {
      const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⊘';
      const details = result.maxDiff !== undefined ? ` (max diff: ${result.maxDiff.toExponential(2)})` : '';
      const plotInfo = result.plotCount !== undefined ? ` [${result.plotCount} plots, ${result.csvColumns} CSV cols]` : '';
      console.log(`${icon} ${result.indicator.padEnd(20)} ${result.status.padEnd(8)}${details}${plotInfo}`);
      
      if (result.failedOutputs && result.failedOutputs.length > 0) {
        for (const output of result.failedOutputs) {
          console.log(`   └─ ${output.name}: ${output.reason}`);
        }
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
  });
});
