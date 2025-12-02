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
 * Compare two arrays of values with a tolerance
 * Handles null/undefined values gracefully
 */
export function compareArrays(
  actual: (number | null | undefined)[],
  expected: (number | null | undefined)[],
  tolerance: number = 1e-4,
  skipInitialValues: number = 0
): ComparisonResult {
  const totalValues = Math.min(actual.length, expected.length);
  let validComparisons = 0;
  let mismatches = 0;
  let sumDifference = 0;
  let maxDifference = 0;
  const failedIndices: number[] = [];

  for (let i = skipInitialValues; i < totalValues; i++) {
    const actualVal = actual[i];
    const expectedVal = expected[i];

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
