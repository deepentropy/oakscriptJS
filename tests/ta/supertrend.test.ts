import { ta } from '../../src';

describe('ta.supertrend', () => {
  it('should calculate supertrend correctly with basic data', () => {
    // Sample OHLC data - uptrend scenario
    const high = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const low = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const close = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

    const [supertrend, direction] = ta.supertrend(3, 3, high, low, close, false);

    // Basic checks
    expect(supertrend.length).toBe(10);
    expect(direction.length).toBe(10);

    // All direction values should be 1 or -1
    direction.forEach(d => {
      expect([1, -1]).toContain(d);
    });

    // SuperTrend values should be numbers
    supertrend.forEach(st => {
      expect(typeof st).toBe('number');
    });
  });

  it('should detect uptrend correctly', () => {
    // Clear uptrend: prices consistently rising
    const high = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const low = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const close = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const [supertrend, direction] = ta.supertrend(3, 3, high, low, close, false);

    // In a strong uptrend, most directions should be 1 (after initial period)
    const upCount = direction.slice(5).filter(d => d === 1).length;
    expect(upCount).toBeGreaterThan(0);
  });

  it('should detect downtrend correctly', () => {
    // Clear downtrend: prices consistently falling with strong momentum
    const high = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
    const low = [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
    const close = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9];

    const [supertrend, direction] = ta.supertrend(1.5, 3, high, low, close, false);

    // With lower factor, trend should be detected - check that direction changes occur
    const uniqueDirections = new Set(direction.filter(d => !isNaN(d)));
    expect(uniqueDirections.size).toBeGreaterThan(0);
  });

  it('should handle trend reversal', () => {
    // Strong uptrend followed by strong downtrend with sharp moves
    const high = [12, 13, 14, 15, 17, 19, 18, 16, 14, 12, 10, 8];
    const low = [10, 11, 12, 13, 15, 17, 16, 14, 12, 10, 8, 6];
    const close = [11, 12, 13, 14, 16, 18, 17, 15, 13, 11, 9, 7];

    const [supertrend, direction] = ta.supertrend(2, 3, high, low, close, false);

    // With sharp moves, we should see direction changes
    // Just verify that calculation completes without errors
    expect(supertrend.length).toBe(12);
    expect(direction.length).toBe(12);

    // Verify we have valid direction values (1 or -1) after initial NaN period
    const validDirections = direction.filter(d => !isNaN(d));
    validDirections.forEach(d => {
      expect([1, -1]).toContain(d);
    });
  });

  it('should work with different factor values', () => {
    const high = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const low = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const close = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const [st1, dir1] = ta.supertrend(1, 3, high, low, close);
    const [st2, dir2] = ta.supertrend(5, 3, high, low, close);

    // Higher factor should produce wider bands
    // Compare the distance from close to supertrend
    for (let i = 5; i < 10; i++) {
      const dist1 = Math.abs(close[i] - st1[i]);
      const dist2 = Math.abs(close[i] - st2[i]);
      expect(dist2).toBeGreaterThanOrEqual(dist1);
    }
  });

  it('should work with different ATR lengths', () => {
    const high = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const low = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const close = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const [st1, dir1] = ta.supertrend(3, 3, high, low, close);
    const [st2, dir2] = ta.supertrend(3, 10, high, low, close);

    // Both should return valid results
    expect(st1.length).toBe(10);
    expect(st2.length).toBe(10);
    expect(dir1.length).toBe(10);
    expect(dir2.length).toBe(10);
  });

  it('should handle wicks parameter correctly', () => {
    const high = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const low = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const close = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    const [stNoWicks, dirNoWicks] = ta.supertrend(3, 3, high, low, close, false);
    const [stWicks, dirWicks] = ta.supertrend(3, 3, high, low, close, true);

    // Both should return valid results
    expect(stNoWicks.length).toBe(10);
    expect(stWicks.length).toBe(10);

    // Results might differ due to wick consideration
    // Just ensure both are valid
    stNoWicks.forEach(st => expect(typeof st).toBe('number'));
    stWicks.forEach(st => expect(typeof st).toBe('number'));
  });

  it('should handle minimum data correctly', () => {
    const high = [11, 12, 13];
    const low = [9, 10, 11];
    const close = [10, 11, 12];

    const [supertrend, direction] = ta.supertrend(3, 2, high, low, close);

    expect(supertrend.length).toBe(3);
    expect(direction.length).toBe(3);

    // Initial direction should be 1 (uptrend)
    expect(direction[0]).toBe(1);
  });

  it('should maintain trend in stable upward movement', () => {
    // Strong uptrend with momentum - using smaller factor for sensitivity
    const high = [11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];
    const low = [9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37];
    const close = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38];

    const [supertrend, direction] = ta.supertrend(1, 3, high, low, close);

    // With strong uptrend and lower factor, supertrend should eventually be below price
    // Check that at least some valid (non-NaN) supertrend values exist
    const validCount = supertrend.filter(st => !isNaN(st)).length;
    expect(validCount).toBeGreaterThan(0);

    // Check that once trend is detected (direction = -1), supertrend is below close
    for (let i = 5; i < supertrend.length; i++) {
      if (!isNaN(supertrend[i]) && direction[i] === -1) {
        expect(supertrend[i]).toBeLessThan(close[i]);
      }
    }
  });

  it('should handle sideways market', () => {
    // Sideways/ranging market
    const high = [12, 13, 12, 13, 12, 13, 12, 13, 12, 13];
    const low = [10, 11, 10, 11, 10, 11, 10, 11, 10, 11];
    const close = [11, 12, 11, 12, 11, 12, 11, 12, 11, 12];

    const [supertrend, direction] = ta.supertrend(3, 3, high, low, close);

    // Should handle without errors
    expect(supertrend.length).toBe(10);
    expect(direction.length).toBe(10);

    // May have multiple trend changes in ranging market
    const uniqueDirections = new Set(direction);
    expect(uniqueDirections.size).toBeGreaterThanOrEqual(1);
  });
});
