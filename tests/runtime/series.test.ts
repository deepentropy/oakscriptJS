/**
 * Tests for Series class improvements:
 * - Automatic cache invalidation via BarData versioning
 * - Memory management via materialize()
 */

import { Series, BarData } from '../../src/runtime/series';
import type { Bar } from '../../src/types';

describe('Series with BarData cache invalidation', () => {
  let bars: Bar[];
  let barData: BarData;

  beforeEach(() => {
    bars = [
      { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
      { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
    ];
    barData = new BarData(bars);
  });

  describe('BarData class', () => {
    it('should initialize with bars and version 0', () => {
      expect(barData.length).toBe(3);
      expect(barData.version).toBe(0);
      expect(barData.bars).toEqual(bars);
    });

    it('should increment version on push', () => {
      const initialVersion = barData.version;
      const newBar: Bar = { time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 };
      
      barData.push(newBar);
      
      expect(barData.length).toBe(4);
      expect(barData.version).toBe(initialVersion + 1);
      expect(barData.at(3)).toEqual(newBar);
    });

    it('should increment version on pop', () => {
      const testBarData = new BarData([...bars]); // Use a copy
      const initialVersion = testBarData.version;
      const expectedPopped = testBarData.bars[2];
      
      const popped = testBarData.pop();
      
      expect(popped).toEqual(expectedPopped);
      expect(testBarData.length).toBe(2);
      expect(testBarData.version).toBe(initialVersion + 1);
    });

    it('should not increment version on pop from empty array', () => {
      const emptyBarData = new BarData([]);
      const initialVersion = emptyBarData.version;
      
      const popped = emptyBarData.pop();
      
      expect(popped).toBeUndefined();
      expect(emptyBarData.version).toBe(initialVersion);
    });

    it('should increment version on set', () => {
      const initialVersion = barData.version;
      const updatedBar: Bar = { time: 2, open: 106, high: 116, low: 96, close: 111, volume: 1150 };
      
      barData.set(1, updatedBar);
      
      expect(barData.at(1)).toEqual(updatedBar);
      expect(barData.version).toBe(initialVersion + 1);
    });

    it('should not increment version on invalid set index', () => {
      const initialVersion = barData.version;
      const updatedBar: Bar = { time: 10, open: 106, high: 116, low: 96, close: 111, volume: 1150 };
      
      barData.set(10, updatedBar);
      barData.set(-1, updatedBar);
      
      expect(barData.version).toBe(initialVersion);
    });

    it('should increment version on updateLast', () => {
      const initialVersion = barData.version;
      const updatedBar: Bar = { time: 3, open: 111, high: 121, low: 101, close: 116, volume: 1250 };
      
      barData.updateLast(updatedBar);
      
      expect(barData.at(2)).toEqual(updatedBar);
      expect(barData.version).toBe(initialVersion + 1);
    });

    it('should not increment version on updateLast for empty array', () => {
      const emptyBarData = new BarData([]);
      const initialVersion = emptyBarData.version;
      const updatedBar: Bar = { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 };
      
      emptyBarData.updateLast(updatedBar);
      
      expect(emptyBarData.version).toBe(initialVersion);
    });

    it('should increment version on setAll', () => {
      const initialVersion = barData.version;
      const newBars: Bar[] = [
        { time: 10, open: 200, high: 210, low: 190, close: 205, volume: 2000 },
      ];
      
      barData.setAll(newBars);
      
      expect(barData.length).toBe(1);
      expect(barData.bars).toEqual(newBars);
      expect(barData.version).toBe(initialVersion + 1);
    });

    it('should increment version on manual invalidate', () => {
      const initialVersion = barData.version;
      
      barData.invalidate();
      
      expect(barData.version).toBe(initialVersion + 1);
    });

    it('should support creating from existing array', () => {
      const created = BarData.from(bars);
      
      expect(created.length).toBe(3);
      expect(created.bars).toEqual(bars);
      expect(created.version).toBe(0);
    });
  });

  describe('Series automatic cache invalidation', () => {
    it('should cache values on first toArray() call', () => {
      const close = Series.fromBars(barData, 'close');
      
      const values1 = close.toArray();
      const values2 = close.toArray(); // Should return cached
      
      expect(values1).toEqual([105, 110, 115]);
      expect(values2).toBe(values1); // Same reference = cached
    });

    it('should invalidate cache when new bar is pushed', () => {
      const close = Series.fromBars(barData, 'close');
      
      const values1 = close.toArray();
      expect(values1).toEqual([105, 110, 115]);
      
      // Add new bar
      barData.push({ time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 });
      
      const values2 = close.toArray();
      expect(values2).toEqual([105, 110, 115, 120]);
      expect(values2).not.toBe(values1); // Different reference = recomputed
    });

    it('should invalidate cache when bar is updated', () => {
      const close = Series.fromBars(barData, 'close');
      
      const values1 = close.toArray();
      expect(values1[1]).toBe(110);
      
      // Update a bar
      barData.set(1, { time: 2, open: 105, high: 115, low: 95, close: 112, volume: 1100 });
      
      const values2 = close.toArray();
      expect(values2[1]).toBe(112);
      expect(values2).not.toBe(values1); // Recomputed
    });

    it('should invalidate cache when last bar is updated (streaming use case)', () => {
      const close = Series.fromBars(barData, 'close');
      
      const values1 = close.toArray();
      expect(values1[2]).toBe(115);
      
      // Update last bar (simulating real-time update)
      barData.updateLast({ time: 3, open: 110, high: 120, low: 100, close: 118, volume: 1250 });
      
      const values2 = close.toArray();
      expect(values2[2]).toBe(118);
      expect(values2).not.toBe(values1);
    });

    it('should invalidate derived series when underlying data changes', () => {
      const close = Series.fromBars(barData, 'close');
      const open = Series.fromBars(barData, 'open');
      const range = close.sub(open);
      
      const values1 = range.toArray();
      expect(values1).toEqual([5, 5, 5]); // 105-100, 110-105, 115-110
      
      // Update data
      barData.push({ time: 4, open: 115, high: 125, low: 105, close: 125, volume: 1300 });
      
      const values2 = range.toArray();
      expect(values2).toEqual([5, 5, 5, 10]); // New: 125-115
    });

    it('should work with manual invalidation for backward compatibility', () => {
      const close = Series.fromBars(barData, 'close');
      
      const values1 = close.toArray();
      expect(values1).toEqual([105, 110, 115]);
      
      // Manually invalidate (old API)
      close._invalidate();
      
      // Even though data hasn't changed, cache should be cleared
      const values2 = close.toArray();
      expect(values2).toEqual([105, 110, 115]);
      expect(values2).not.toBe(values1); // Recomputed
    });
  });

  describe('Series backward compatibility with Bar[]', () => {
    it('should work with Bar[] array (no BarData)', () => {
      const close = Series.fromBars(bars, 'close');
      
      const values = close.toArray();
      expect(values).toEqual([105, 110, 115]);
    });

    it('should automatically wrap Bar[] in BarData', () => {
      const close = Series.fromBars(bars, 'close');
      
      expect(close.barData).toBeInstanceOf(BarData);
      expect(close.barData.bars).toEqual(bars);
    });

    it('should cache when using Bar[] directly', () => {
      const close = Series.fromBars(bars, 'close');
      
      const values1 = close.toArray();
      const values2 = close.toArray();
      
      expect(values2).toBe(values1); // Cached
    });

    it('should work with Series operations using Bar[]', () => {
      const close = Series.fromBars(bars, 'close');
      const open = Series.fromBars(bars, 'open');
      const range = close.sub(open);
      
      const values = range.toArray();
      expect(values).toEqual([5, 5, 5]);
    });
  });
});

describe('Series materialize() for memory management', () => {
  let bars: Bar[];

  beforeEach(() => {
    bars = [
      { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
      { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
      { time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 },
      { time: 5, open: 120, high: 130, low: 110, close: 125, volume: 1400 },
    ];
  });

  it('should compute and return correct values', () => {
    const close = Series.fromBars(bars, 'close');
    const doubled = close.mul(2);
    
    const materialized = doubled.materialize();
    
    expect(materialized.toArray()).toEqual([210, 220, 230, 240, 250]);
  });

  it('should create a new Series instance', () => {
    const close = Series.fromBars(bars, 'close');
    const doubled = close.mul(2);
    
    const materialized = doubled.materialize();
    
    expect(materialized).toBeInstanceOf(Series);
    expect(materialized).not.toBe(doubled);
  });

  it('should allow further operations on materialized Series', () => {
    const close = Series.fromBars(bars, 'close');
    const complex = close.add(10).mul(2);
    
    const materialized = complex.materialize();
    const result = materialized.sub(20);
    
    expect(result.toArray()).toEqual([210, 220, 230, 240, 250]);
    // (105+10)*2 - 20 = 210, etc.
  });

  it('should work with long operation chains', () => {
    const a = Series.fromBars(bars, 'close');
    const b = Series.fromBars(bars, 'open');
    const c = Series.constant(bars, 10);
    
    // Long chain: (close - open + 10) * 2 / 5
    const complex = a.sub(b).add(c).mul(2).div(5);
    const materialized = complex.materialize();
    
    // close - open = [5, 5, 5, 5, 5]
    // + 10 = [15, 15, 15, 15, 15]
    // * 2 = [30, 30, 30, 30, 30]
    // / 5 = [6, 6, 6, 6, 6]
    expect(materialized.toArray()).toEqual([6, 6, 6, 6, 6]);
  });

  it('should cache materialized values', () => {
    const close = Series.fromBars(bars, 'close');
    const materialized = close.mul(2).materialize();
    
    const values1 = materialized.toArray();
    const values2 = materialized.toArray();
    
    expect(values2).toBe(values1); // Same reference = cached
  });

  it('should respect BarData versioning after materialization', () => {
    const barData = new BarData(bars);
    const close = Series.fromBars(barData, 'close');
    const doubled = close.mul(2);
    
    const values1 = doubled.toArray();
    expect(values1).toEqual([210, 220, 230, 240, 250]);
    
    // Add new bar - this will affect the original close series and any derived series
    barData.push({ time: 6, open: 125, high: 135, low: 115, close: 130, volume: 1500 });
    
    const values2 = doubled.toArray();
    expect(values2).toEqual([210, 220, 230, 240, 250, 260]);
    
    // Materialize after the data change
    const materialized = doubled.materialize();
    expect(materialized.toArray()).toEqual([210, 220, 230, 240, 250, 260]);
  });

  it('should handle NaN values correctly', () => {
    const values = Series.fromArray(bars, [1, NaN, 3, 4, 5]);
    const materialized = values.mul(2).materialize();
    
    const result = materialized.toArray();
    expect(result[0]).toBe(2);
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(6);
    expect(result[3]).toBe(8);
    expect(result[4]).toBe(10);
  });

  it('should work with all arithmetic operations', () => {
    const a = Series.fromArray(bars, [10, 20, 30, 40, 50]);
    const b = Series.fromArray(bars, [2, 4, 6, 8, 10]);
    
    const add = a.add(b).materialize();
    expect(add.toArray()).toEqual([12, 24, 36, 48, 60]);
    
    const sub = a.sub(b).materialize();
    expect(sub.toArray()).toEqual([8, 16, 24, 32, 40]);
    
    const mul = a.mul(b).materialize();
    expect(mul.toArray()).toEqual([20, 80, 180, 320, 500]);
    
    const div = a.div(b).materialize();
    expect(div.toArray()).toEqual([5, 5, 5, 5, 5]);
  });

  it('should work with comparison operations', () => {
    const a = Series.fromArray(bars, [10, 20, 30, 40, 50]);
    const b = Series.fromArray(bars, [15, 15, 30, 45, 40]);
    
    const gt = a.gt(b).materialize();
    expect(gt.toArray()).toEqual([0, 1, 0, 0, 1]);
    
    const lt = a.lt(b).materialize();
    expect(lt.toArray()).toEqual([1, 0, 0, 1, 0]);
    
    const eq = a.eq(b).materialize();
    expect(eq.toArray()).toEqual([0, 0, 1, 0, 0]);
  });

  it('should work with offset operations', () => {
    const close = Series.fromBars(bars, 'close');
    const prev = close.offset(1);
    
    const materialized = prev.materialize();
    const values = materialized.toArray();
    
    expect(values[0]).toBeNaN(); // No previous value
    expect(values[1]).toBe(105);
    expect(values[2]).toBe(110);
    expect(values[3]).toBe(115);
    expect(values[4]).toBe(120);
  });
});

describe('Series integration tests', () => {
  it('should handle complex real-world scenario: moving average calculation', () => {
    const barData = new BarData([
      { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
      { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
      { time: 4, open: 115, high: 125, low: 105, close: 120, volume: 1300 },
      { time: 5, open: 120, high: 130, low: 110, close: 125, volume: 1400 },
    ]);

    const close = Series.fromBars(barData, 'close');
    
    // Simulate adding new bar (streaming)
    const values1 = close.toArray();
    expect(values1).toEqual([105, 110, 115, 120, 125]);
    
    barData.push({ time: 6, open: 125, high: 135, low: 115, close: 130, volume: 1500 });
    
    const values2 = close.toArray();
    expect(values2).toEqual([105, 110, 115, 120, 125, 130]);
    
    // Simulate updating last bar (real-time tick)
    barData.updateLast({ time: 6, open: 125, high: 135, low: 115, close: 132, volume: 1550 });
    
    const values3 = close.toArray();
    expect(values3).toEqual([105, 110, 115, 120, 125, 132]);
  });

  it('should handle memory-efficient complex indicator chain', () => {
    const bars: Bar[] = [
      { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      { time: 2, open: 105, high: 115, low: 95, close: 110, volume: 1100 },
      { time: 3, open: 110, high: 120, low: 100, close: 115, volume: 1200 },
    ];

    const close = Series.fromBars(bars, 'close');
    const open = Series.fromBars(bars, 'open');
    const high = Series.fromBars(bars, 'high');
    const low = Series.fromBars(bars, 'low');
    
    // Complex calculation: typical price = (high + low + close) / 3
    const typicalPrice = high.add(low).add(close).div(3);
    
    // Materialize to break closure chain before further operations
    const materialized = typicalPrice.materialize();
    
    // Further calculations
    const range = high.sub(low);
    const result = materialized.mul(range);
    
    const values = result.toArray();
    // typical[0] = (110 + 90 + 105) / 3 = 101.6666..., range[0] = 20
    // result[0] = 101.6666... * 20 = 2033.333...
    expect(values[0]).toBeCloseTo(2033.33, 1);
  });
});
