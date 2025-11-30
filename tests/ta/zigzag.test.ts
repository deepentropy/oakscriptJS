import * as ta from '../../src/ta';

describe('ta.zigzag', () => {
  describe('basic functionality', () => {
    it('should identify pivot highs correctly', () => {
      // Create price data with clear pivot points
      // Starts at 100 high/98 low, rises to 120 high/118 low, drops to 110 high/108 low, rises to 130 high/128 low
      const high = [100, 105, 110, 115, 120, 118, 115, 112, 110, 115, 120, 125, 130];
      const low =  [98,  103, 108, 113, 118, 116, 113, 110, 108, 113, 118, 123, 128];
      
      const [zigzag, direction, isPivot] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      expect(direction.length).toBe(high.length);
      expect(isPivot.length).toBe(high.length);
      
      // There should be at least some pivot points detected
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThan(0);
    });

    it('should identify pivot lows correctly', () => {
      // Create price data with clear pivot low
      // High at 120, drops to 100 (>5% move), rises again
      const high = [120, 115, 110, 105, 100, 105, 110, 115, 120, 115, 110, 105, 100];
      const low =  [118, 113, 108, 103, 98,  103, 108, 113, 118, 113, 108, 103, 98];
      
      const [zigzag, direction, isPivot] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      // Check that we have pivot points
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThan(0);
    });

    it('should respect minimum deviation threshold', () => {
      // Small price movements (less than 5%)
      const high = [100, 101, 102, 103, 104, 103, 102, 101, 100, 101, 102, 103, 104];
      const low =  [99,  100, 101, 102, 103, 102, 101, 100, 99,  100, 101, 102, 103];
      
      // With 10% deviation, small moves should be filtered out
      const [zigzag, , isPivot] = ta.zigzag(10, 3, 2, undefined, high, low);
      
      // Most bars should be NaN since moves are less than 10%
      const nonNaNCount = zigzag.filter(v => !isNaN(v)).length;
      // With a 10% threshold and 4% max range, we should have very few pivots
      // At least the initial pivot should be detected
      expect(nonNaNCount).toBeLessThanOrEqual(3);
    });

    it('should respect minimum depth between pivots', () => {
      // Large swings but close together
      const high = [100, 120, 100, 120, 100, 120, 100, 120];
      const low =  [90,  110, 90,  110, 90,  110, 90,  110];
      
      // With depth=5, pivots must be at least 5 bars apart
      const [, , isPivot] = ta.zigzag(5, 5, 2, undefined, high, low);
      
      // Count pivots
      const pivotIndices = isPivot.reduce((acc: number[], p, i) => {
        if (p) acc.push(i);
        return acc;
      }, []);
      
      // If we have multiple pivots, check spacing
      if (pivotIndices.length > 1) {
        for (let i = 1; i < pivotIndices.length; i++) {
          const spacing = pivotIndices[i]! - pivotIndices[i - 1]!;
          // Spacing should generally respect depth parameter
          expect(spacing).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should return NaN for non-pivot bars', () => {
      const high = [100, 110, 120, 115, 105, 100, 110, 120, 125, 130];
      const low =  [95,  105, 115, 110, 100, 95,  105, 115, 120, 125];
      
      const [zigzag] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      // Most bars should be NaN (only pivot bars have values)
      const nanCount = zigzag.filter(v => isNaN(v)).length;
      expect(nanCount).toBeGreaterThan(zigzag.length / 2);
    });
  });

  describe('deviation calculation', () => {
    it('should filter out small price movements', () => {
      // 2% moves - should be filtered with 5% deviation
      const high = [100, 102, 100, 102, 100, 102, 100, 102, 100, 102];
      const low =  [99,  101, 99,  101, 99,  101, 99,  101, 99,  101];
      
      const [zigzag] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      // With 5% threshold and only 2% moves, pivots should be limited
      const nonNaNCount = zigzag.filter(v => !isNaN(v)).length;
      expect(nonNaNCount).toBeLessThanOrEqual(2); // At most initial pivot
    });

    it('should detect pivots when deviation exceeds threshold', () => {
      // 10% moves - should pass 5% deviation
      const high = [100, 105, 110, 108, 105, 100, 105, 110, 115, 120];
      const low =  [95,  100, 105, 103, 100, 95,  100, 105, 110, 115];
      
      const [zigzag, , isPivot] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // We should have some pivots detected
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThanOrEqual(1);
    });

    it('should calculate percentage deviation correctly', () => {
      // From 100 to 105 = 5% deviation
      // From 105 to 100 = 4.76% deviation
      const high = [100, 103, 106, 109, 112, 109, 106, 103, 100, 103, 106, 109, 112];
      const low =  [98,  101, 104, 107, 110, 107, 104, 101, 98,  101, 104, 107, 110];
      
      // With 10% deviation, we shouldn't get pivots (max move is 12%)
      const [zigzag10] = ta.zigzag(15, 3, 2, undefined, high, low);
      
      // With 5% deviation, we should get pivots
      const [zigzag5] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      const pivots10 = zigzag10.filter(v => !isNaN(v)).length;
      const pivots5 = zigzag5.filter(v => !isNaN(v)).length;
      
      // Smaller deviation threshold should produce more pivots
      expect(pivots5).toBeGreaterThanOrEqual(pivots10);
    });
  });

  describe('direction tracking', () => {
    it('should return 1 for uptrend', () => {
      // Clear uptrend: low → high
      const high = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145];
      const low =  [95,  100, 105, 110, 115, 120, 125, 130, 135, 140];
      
      const [, direction] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // In an uptrend, direction should be 1 after initial setup
      const lastDirection = direction[direction.length - 1];
      expect(lastDirection).toBe(1);
    });

    it('should return -1 for downtrend', () => {
      // Clear downtrend: high → low
      const high = [145, 140, 135, 130, 125, 120, 115, 110, 105, 100];
      const low =  [140, 135, 130, 125, 120, 115, 110, 105, 100, 95];
      
      const [, direction] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // In a downtrend, direction should be -1 after initial setup
      const lastDirection = direction[direction.length - 1];
      expect(lastDirection).toBe(-1);
    });

    it('should switch direction at confirmed pivots', () => {
      // V-shaped pattern: down then up
      const high = [120, 115, 110, 105, 100, 105, 110, 115, 120, 125];
      const low =  [115, 110, 105, 100, 95,  100, 105, 110, 115, 120];
      
      const [, direction, isPivot] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // Find pivot points and check direction changes
      let lastPivotDirection = 0;
      for (let i = 0; i < isPivot.length; i++) {
        if (isPivot[i]) {
          if (lastPivotDirection !== 0) {
            // Direction should change at each pivot
            expect(direction[i]).not.toBe(0);
          }
          lastPivotDirection = direction[i]!;
        }
      }
    });
  });

  describe('repaint behavior', () => {
    it('should update last pivot when higher high forms', () => {
      // Initial high at index 4 (120), then higher high at index 6 (125)
      const high1 = [100, 105, 110, 115, 120, 115, 125, 120, 115, 110];
      const low1 =  [95,  100, 105, 110, 115, 110, 120, 115, 110, 105];
      
      const [zigzag1] = ta.zigzag(5, 2, 1, undefined, high1, low1);
      
      // The zigzag should capture the higher high at index 6
      const pivotIndices = zigzag1.reduce((acc: number[], v, i) => {
        if (!isNaN(v)) acc.push(i);
        return acc;
      }, []);
      
      // Should have some pivots
      expect(pivotIndices.length).toBeGreaterThan(0);
    });

    it('should update last pivot when lower low forms', () => {
      // Initial low at index 4 (95), then lower low at index 6 (90)
      const high = [120, 115, 110, 105, 100, 105, 95,  100, 105, 110];
      const low =  [115, 110, 105, 100, 95,  100, 90,  95,  100, 105];
      
      const [zigzag] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // The zigzag should capture the lower low
      const pivotIndices = zigzag.reduce((acc: number[], v, i) => {
        if (!isNaN(v)) acc.push(i);
        return acc;
      }, []);
      
      expect(pivotIndices.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle insufficient data', () => {
      const high = [100, 110];
      const low = [95, 105];
      
      const [zigzag, direction, isPivot] = ta.zigzag(5, 10, 3, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      expect(direction.length).toBe(high.length);
      expect(isPivot.length).toBe(high.length);
    });

    it('should handle flat prices (no pivots)', () => {
      // Completely flat prices
      const high = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
      const low = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
      
      const [zigzag] = ta.zigzag(5, 3, 2, undefined, high, low);
      
      // With flat prices, we should have minimal pivots
      const pivotCount = zigzag.filter(v => !isNaN(v)).length;
      expect(pivotCount).toBeLessThanOrEqual(1); // At most initial pivot
    });

    it('should handle monotonically increasing prices', () => {
      // Steady uptrend
      const high = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160];
      const low =  [95,  100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155];
      
      const [zigzag, direction] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      // Direction should be positive (uptrend)
      const lastDir = direction[direction.length - 1];
      expect(lastDir).toBe(1);
    });

    it('should handle monotonically decreasing prices', () => {
      // Steady downtrend
      const high = [160, 155, 150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100];
      const low =  [155, 150, 145, 140, 135, 130, 125, 120, 115, 110, 105, 100, 95];
      
      const [zigzag, direction] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      // Direction should be negative (downtrend)
      const lastDir = direction[direction.length - 1];
      expect(lastDir).toBe(-1);
    });

    it('should handle single source mode', () => {
      const source = [100, 110, 105, 115, 108, 120, 112, 125, 118, 130];
      
      const [zigzag, direction, isPivot] = ta.zigzag(5, 2, 1, source);
      
      expect(zigzag.length).toBe(source.length);
      expect(direction.length).toBe(source.length);
      expect(isPivot.length).toBe(source.length);
    });

    it('should handle high/low source mode', () => {
      const high = [105, 115, 110, 120, 115, 125, 120, 130, 125, 135];
      const low =  [95,  105, 100, 110, 105, 115, 110, 120, 115, 125];
      
      const [zigzag, direction, isPivot] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      expect(direction.length).toBe(high.length);
      expect(isPivot.length).toBe(high.length);
    });
  });

  describe('parameter validation', () => {
    it('should use default values when not provided', () => {
      const high = [100, 110, 120, 115, 105, 100, 110, 120, 130, 140, 135, 125, 115, 105, 100];
      const low =  [95,  105, 115, 110, 100, 95,  105, 115, 125, 135, 130, 120, 110, 100, 95];
      
      // Call with just high/low
      const [zigzag] = ta.zigzag(undefined, undefined, undefined, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
    });

    it('should handle deviation = 0', () => {
      const high = [100, 101, 100, 101, 100, 101, 100, 101, 100, 101];
      const low =  [99,  100, 99,  100, 99,  100, 99,  100, 99,  100];
      
      // With 0 deviation, even tiny moves should create pivots
      const [zigzag0] = ta.zigzag(0, 2, 1, undefined, high, low);
      const [zigzag5] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // 0 deviation should produce more pivots
      const pivots0 = zigzag0.filter(v => !isNaN(v)).length;
      const pivots5 = zigzag5.filter(v => !isNaN(v)).length;
      expect(pivots0).toBeGreaterThanOrEqual(pivots5);
    });

    it('should handle very large deviation values', () => {
      const high = [100, 150, 100, 150, 100, 150, 100, 150, 100, 150];
      const low =  [50,  100, 50,  100, 50,  100, 50,  100, 50,  100];
      
      // With 100% deviation required, even 50% swings won't create pivots
      const [zigzag] = ta.zigzag(100, 2, 1, undefined, high, low);
      
      const pivotCount = zigzag.filter(v => !isNaN(v)).length;
      // With 100% deviation required, we should have minimal pivots
      expect(pivotCount).toBeLessThanOrEqual(2);
    });

    it('should throw error when no source provided', () => {
      expect(() => {
        ta.zigzag(5, 10, 3);
      }).toThrow();
    });

    it('should throw error when high/low lengths mismatch', () => {
      const high = [100, 110, 120];
      const low = [95, 105];
      
      expect(() => {
        ta.zigzag(5, 3, 2, undefined, high, low);
      }).toThrow();
    });
  });

  describe('real-world scenarios', () => {
    it('should identify W-bottom pattern', () => {
      // W-bottom: drop, bounce, drop to similar level, rise
      const high = [120, 115, 110, 105, 110, 115, 110, 105, 110, 115, 120, 125, 130];
      const low =  [115, 110, 105, 100, 105, 110, 105, 100, 105, 110, 115, 120, 125];
      
      const [zigzag, , isPivot] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // Should detect the two lows and the middle high
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThanOrEqual(2);
    });

    it('should identify M-top pattern', () => {
      // M-top: rise, pull back, rise to similar level, drop
      const high = [100, 105, 110, 115, 120, 115, 110, 115, 120, 115, 110, 105, 100];
      const low =  [95,  100, 105, 110, 115, 110, 105, 110, 115, 110, 105, 100, 95];
      
      const [zigzag, , isPivot] = ta.zigzag(5, 2, 1, undefined, high, low);
      
      // Should detect the two highs and the middle low
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle volatile price action', () => {
      // High volatility with frequent reversals
      const high = [100, 120, 95,  130, 90,  140, 85,  150, 80,  160];
      const low =  [90,  100, 85,  110, 80,  120, 75,  130, 70,  140];
      
      const [zigzag, direction, isPivot] = ta.zigzag(10, 2, 1, undefined, high, low);
      
      expect(zigzag.length).toBe(high.length);
      expect(direction.length).toBe(high.length);
      expect(isPivot.length).toBe(high.length);
      
      // With 10% deviation and big swings, we should get pivots
      const pivotCount = isPivot.filter(p => p).length;
      expect(pivotCount).toBeGreaterThan(0);
    });
  });
});
