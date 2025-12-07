/**
 * Comparison utilities for indicator validation
 */

export interface ComparisonResult {
  passed: boolean;
  totalValues: number;
  validComparisons: number;
  mismatches: number;
  maxDifference: number;
  avgDifference: number;
  failedIndices?: number[];
}

/**
 * Normalize an array by subtracting its first valid value
 * Used for cumulative indicators like OBV where absolute values depend on history
 */
function normalizeArray(arr: (number | null | undefined)[]): (number | null | undefined)[] {
    // Find first valid value
    let firstValid: number | null = null;
    for (const val of arr) {
        if (val != null && !Number.isNaN(val)) {
            firstValid = val;
            break;
        }
    }

    if (firstValid === null) return arr;

    return arr.map(val => {
        if (val == null || Number.isNaN(val)) return val;
        return val - firstValid;
    });
}

/**
 * Compare two arrays of values with a tolerance
 * Handles null/undefined values gracefully
 * When normalize=true, both arrays are normalized by subtracting their first valid value
 * (useful for cumulative indicators like OBV)
 */
export function compareArrays(
  actual: (number | null | undefined)[],
  expected: (number | null | undefined)[],
  tolerance: number = 1e-4,
  skipInitialValues: number = 0,
  normalize: boolean = false
): ComparisonResult {
    // Normalize arrays if requested (for cumulative indicators)
    const actualValues = normalize ? normalizeArray(actual) : actual;
    const expectedValues = normalize ? normalizeArray(expected) : expected;
    const totalValues = Math.min(actualValues.length, expectedValues.length);
  let validComparisons = 0;
  let mismatches = 0;
  let sumDifference = 0;
  let maxDifference = 0;
  const failedIndices: number[] = [];

  for (let i = skipInitialValues; i < totalValues; i++) {
      const actualVal = actualValues[i];
      const expectedVal = expectedValues[i];

    // Skip if either value is null/undefined
    if (actualVal == null || expectedVal == null) {
      continue;
    }

    validComparisons++;
    const difference = Math.abs(actualVal - expectedVal);
    sumDifference += difference;
    maxDifference = Math.max(maxDifference, difference);

    if (difference > tolerance) {
      mismatches++;
      failedIndices.push(i);
    }
  }

  const avgDifference = validComparisons > 0 ? sumDifference / validComparisons : 0;
  const passed = mismatches === 0;

  return {
    passed,
    totalValues,
    validComparisons,
    mismatches,
    maxDifference,
    avgDifference,
    failedIndices: passed ? undefined : failedIndices,
  };
}

/**
 * Format a comparison result as a readable string
 */
export function formatComparisonResult(
  indicatorName: string,
  result: ComparisonResult,
  showDetails: boolean = false
): string {
  const status = result.passed ? '✓' : '✗';
  let message = `${status} ${indicatorName}: ${result.validComparisons} comparisons, `;
  
  if (result.passed) {
    message += `all passed (max diff: ${result.maxDifference.toExponential(2)})`;
  } else {
    message += `${result.mismatches} mismatches (max diff: ${result.maxDifference.toExponential(2)}, avg: ${result.avgDifference.toExponential(2)})`;
    
    if (showDetails && result.failedIndices && result.failedIndices.length > 0) {
      const sampleIndices = result.failedIndices.slice(0, 5);
      message += `\n  Failed at indices: ${sampleIndices.join(', ')}${result.failedIndices.length > 5 ? '...' : ''}`;
    }
  }
  
  return message;
}

/**
 * Calculate relative tolerance based on value magnitude
 * Useful for indicators with widely varying scales
 */
export function getRelativeTolerance(value: number, relativePercent: number = 0.01): number {
  return Math.abs(value) * relativePercent;
}
