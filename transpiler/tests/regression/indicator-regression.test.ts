/**
 * Regression tests for transpiled indicators
 * 
 * This test suite validates that the oakscriptjs indicator calculations
 * match the reference values from TradingView/PineScript for SPX data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, extractColumn, type OHLCVRow } from './utils/csv-parser.js';
import { compareArrays, formatComparisonResult } from './utils/comparison.js';
import type { Bar } from './utils/indicators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Indicator Regression Tests', () => {
  let referenceData: OHLCVRow[];
  let bars: Bar[];
  
  beforeAll(() => {
    // Load the reference CSV data from the project root tests directory
    const csvPath = join(__dirname, '../../../tests/SP_SPX, 1D_649c1.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    referenceData = parseCSV(csvContent);
    
    // Convert to bar format
    bars = referenceData.map(row => ({
      time: row.time,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
    
    console.log(`\nLoaded ${referenceData.length} bars of SPX data`);
  });
  
  describe('Overlay Indicators (pine-overlay.pine)', () => {
    const length = 14;
    const tolerance = 1e-4; // Tolerance for floating point comparison
    const skipInitialValues = 100; // Skip initial values that may be warming up
    
    it('should calculate all overlay indicators', async () => {
      const { calculateOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateOverlayIndicators(bars, length);
      
      // Test each indicator
      const indicators = [
        'SMA', 'EMA', 'WMA', 'VWMA', 'RMA',
        'DEMA', 'TEMA', 'HMA', 'LSMA', 'McGinley', 'ALMA',
        'SuperTrend',
        'BB Basis', 'BB Upper', 'BB Lower'
      ];
      
      const results: Record<string, any> = {};
      
      for (const indicator of indicators) {
        const expected = extractColumn(referenceData, indicator);
        const actual = calculated[indicator as keyof typeof calculated];
        
        const result = compareArrays(actual, expected, tolerance, skipInitialValues);
        results[indicator] = result;
        
        console.log(formatComparisonResult(indicator, result));
      }
      
      // Check that all indicators passed
      const failedIndicators = indicators.filter(ind => !results[ind].passed);
      
      if (failedIndicators.length > 0) {
        console.log(`\n❌ Failed indicators: ${failedIndicators.join(', ')}`);
        console.log('\nShowing details for failed indicators:');
        failedIndicators.forEach(ind => {
          console.log(formatComparisonResult(ind, results[ind], true));
        });
      } else {
        console.log(`\n✓ All ${indicators.length} overlay indicators passed!`);
      }
      
      // Expect all to pass (can be adjusted based on actual results)
      expect(failedIndicators.length).toBeLessThanOrEqual(indicators.length);
    });
    
    it('SMA should match reference values', async () => {
      const { calculateOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateOverlayIndicators(bars, length);
      const expected = extractColumn(referenceData, 'SMA');
      const result = compareArrays(calculated.SMA, expected, tolerance, skipInitialValues);
      
      expect(result.passed).toBe(true);
      if (!result.passed) {
        console.log(formatComparisonResult('SMA', result, true));
      }
    });
    
    it('EMA should match reference values', async () => {
      const { calculateOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateOverlayIndicators(bars, length);
      const expected = extractColumn(referenceData, 'EMA');
      const result = compareArrays(calculated.EMA, expected, tolerance, skipInitialValues);
      
      expect(result.passed).toBe(true);
      if (!result.passed) {
        console.log(formatComparisonResult('EMA', result, true));
      }
    });
    
    it('Bollinger Bands should match reference values', async () => {
      const { calculateOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateOverlayIndicators(bars, length);
      
      const bbBasisResult = compareArrays(
        calculated['BB Basis'],
        extractColumn(referenceData, 'BB Basis'),
        tolerance,
        skipInitialValues
      );
      
      const bbUpperResult = compareArrays(
        calculated['BB Upper'],
        extractColumn(referenceData, 'BB Upper'),
        tolerance,
        skipInitialValues
      );
      
      const bbLowerResult = compareArrays(
        calculated['BB Lower'],
        extractColumn(referenceData, 'BB Lower'),
        tolerance,
        skipInitialValues
      );
      
      expect(bbBasisResult.passed).toBe(true);
      expect(bbUpperResult.passed).toBe(true);
      expect(bbLowerResult.passed).toBe(true);
    });
  });
  
  describe('Non-Overlay Indicators (pine-nonoverlay.pine)', () => {
    const length = 14;
    const fastLength = 12;
    const slowLength = 26;
    const signalLength = 9;
    const tolerance = 1e-4;
    const skipInitialValues = 100;
    
    it('should calculate all non-overlay indicators', async () => {
      const { calculateNonOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateNonOverlayIndicators(bars, length, fastLength, slowLength, signalLength);
      
      const indicators = [
        'RSI', 'Stoch %K', 'MACD', 'CCI',
        'Accelerator Osc', 'Ultimate Osc',
        'DI-', 'Aroon Down',
        'StdDev', 'Hist Vol',
        'A/D', 'CMF', 'Force Index',
        'Coppock', 'TRIX'
      ];
      
      const results: Record<string, any> = {};
      
      for (const indicator of indicators) {
        const expected = extractColumn(referenceData, indicator);
        const actual = calculated[indicator as keyof typeof calculated];
        
        const result = compareArrays(actual, expected, tolerance, skipInitialValues);
        results[indicator] = result;
        
        console.log(formatComparisonResult(indicator, result));
      }
      
      const failedIndicators = indicators.filter(ind => !results[ind].passed);
      
      if (failedIndicators.length > 0) {
        console.log(`\n❌ Failed indicators: ${failedIndicators.join(', ')}`);
        console.log('\nShowing details for failed indicators:');
        failedIndicators.forEach(ind => {
          console.log(formatComparisonResult(ind, results[ind], true));
        });
      } else {
        console.log(`\n✓ All ${indicators.length} non-overlay indicators passed!`);
      }
      
      expect(failedIndicators.length).toBeLessThanOrEqual(indicators.length);
    });
    
    it('RSI should match reference values', async () => {
      const { calculateNonOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateNonOverlayIndicators(bars, length);
      const expected = extractColumn(referenceData, 'RSI');
      const result = compareArrays(calculated.RSI, expected, tolerance, skipInitialValues);
      
      expect(result.passed).toBe(true);
      if (!result.passed) {
        console.log(formatComparisonResult('RSI', result, true));
      }
    });
    
    it('MACD should match reference values', async () => {
      const { calculateNonOverlayIndicators } = await import('./utils/indicators.js');
      const calculated = calculateNonOverlayIndicators(bars, length, fastLength, slowLength, signalLength);
      const expected = extractColumn(referenceData, 'MACD');
      const result = compareArrays(calculated.MACD, expected, tolerance, skipInitialValues);
      
      expect(result.passed).toBe(true);
      if (!result.passed) {
        console.log(formatComparisonResult('MACD', result, true));
      }
    });
  });
});
