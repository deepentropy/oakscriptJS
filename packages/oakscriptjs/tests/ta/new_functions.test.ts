import * as ta from '../../src/ta';

describe('ta.rma', () => {
  it('should calculate relative moving average correctly', () => {
    const source = [10, 12, 11, 13, 14, 12, 15, 16];
    const rma5 = ta.rma(source, 5);

    expect(rma5.length).toBe(source.length);
    // RMA should be smoother than SMA
    expect(rma5[4]).toBeCloseTo(12.43, 1);
  });

  it('should use alpha = 1 / length', () => {
    const source = [100, 110, 105, 115, 120];
    const length = 3;
    const rma3 = ta.rma(source, length);

    // First value should be SMA
    const expectedFirst = (100 + 110 + 105) / 3;
    expect(rma3[0]).toBeCloseTo(expectedFirst, 2);
  });

  it('should handle single value', () => {
    const source = [42];
    const rma5 = ta.rma(source, 5);

    expect(rma5.length).toBe(1);
    expect(rma5[0]).toBe(42);
  });
});

describe('ta.wma', () => {
  it('should calculate weighted moving average correctly', () => {
    const source = [1, 2, 3, 4, 5];
    const wma3 = ta.wma(source, 3);

    expect(wma3.length).toBe(5);
    expect(isNaN(wma3[0])).toBe(true);
    expect(isNaN(wma3[1])).toBe(true);

    // WMA(3) at index 2: (3*3 + 2*2 + 1*1) / (3+2+1) = (9+4+1)/6 = 14/6 = 2.333
    expect(wma3[2]).toBeCloseTo(2.333, 2);
  });

  it('should give more weight to recent values', () => {
    const source = [10, 10, 10, 10, 20]; // Spike at end
    const wma3 = ta.wma(source, 3);

    // WMA should react more than SMA to recent spike
    const sma3 = ta.sma(source, 3);
    expect(wma3[4]).toBeGreaterThan(sma3[4]);
  });

  it('should handle length of 1', () => {
    const source = [5, 10, 15];
    const wma1 = ta.wma(source, 1);

    // WMA with length 1 should equal source
    expect(wma1).toEqual(source);
  });
});

describe('ta.highest', () => {
  it('should find highest value over period', () => {
    const source = [5, 12, 8, 15, 10, 20, 18];
    const highest3 = ta.highest(source, 3);

    expect(highest3[0]).toBeNaN();
    expect(highest3[1]).toBeNaN();
    expect(highest3[2]).toBe(12); // max(5, 12, 8)
    expect(highest3[3]).toBe(15); // max(12, 8, 15)
    expect(highest3[4]).toBe(15); // max(8, 15, 10)
    expect(highest3[5]).toBe(20); // max(15, 10, 20)
    expect(highest3[6]).toBe(20); // max(10, 20, 18)
  });

  it('should handle all equal values', () => {
    const source = [5, 5, 5, 5, 5];
    const highest3 = ta.highest(source, 3);

    expect(highest3[2]).toBe(5);
    expect(highest3[4]).toBe(5);
  });

  it('should ignore NaN values', () => {
    const source = [10, NaN, 15, 12];
    const highest3 = ta.highest(source, 3);

    expect(highest3[2]).toBe(15); // max(10, NaN, 15) = 15
  });
});

describe('ta.lowest', () => {
  it('should find lowest value over period', () => {
    const source = [15, 12, 8, 5, 10, 3, 18];
    const lowest3 = ta.lowest(source, 3);

    expect(lowest3[0]).toBeNaN();
    expect(lowest3[1]).toBeNaN();
    expect(lowest3[2]).toBe(8);  // min(15, 12, 8)
    expect(lowest3[3]).toBe(5);  // min(12, 8, 5)
    expect(lowest3[4]).toBe(5);  // min(8, 5, 10)
    expect(lowest3[5]).toBe(3);  // min(5, 10, 3)
    expect(lowest3[6]).toBe(3);  // min(10, 3, 18)
  });

  it('should handle negative values', () => {
    const source = [-5, -12, -8, -15];
    const lowest3 = ta.lowest(source, 3);

    expect(lowest3[2]).toBe(-12); // min(-5, -12, -8)
  });

  it('should ignore NaN values', () => {
    const source = [10, NaN, 5, 12];
    const lowest3 = ta.lowest(source, 3);

    expect(lowest3[2]).toBe(5); // min(10, NaN, 5) = 5
  });
});

describe('ta.cum', () => {
  it('should calculate cumulative sum', () => {
    const source = [1, 2, 3, 4, 5];
    const cumSum = ta.cum(source);

    expect(cumSum).toEqual([1, 3, 6, 10, 15]);
  });

  it('should handle negative values', () => {
    const source = [10, -5, 3, -2];
    const cumSum = ta.cum(source);

    expect(cumSum).toEqual([10, 5, 8, 6]);
  });

  it('should handle single value', () => {
    const source = [42];
    const cumSum = ta.cum(source);

    expect(cumSum).toEqual([42]);
  });

  it('should handle decimals', () => {
    const source = [1.5, 2.5, 3.0];
    const cumSum = ta.cum(source);

    expect(cumSum[0]).toBe(1.5);
    expect(cumSum[1]).toBe(4.0);
    expect(cumSum[2]).toBe(7.0);
  });
});

describe('ta.cross', () => {
  it('should detect upward cross', () => {
    const series1 = [1, 2, 3.1, 4, 5];
    const series2 = [5, 4, 3, 2, 1];
    const crossed = ta.cross(series1, series2);

    expect(crossed[0]).toBe(false); // No previous value
    expect(crossed[1]).toBe(false);
    expect(crossed[2]).toBe(true);  // 3.1 > 3 and 2 <= 4 (crossed up)
    expect(crossed[3]).toBe(false);
    expect(crossed[4]).toBe(false);
  });

  it('should detect downward cross', () => {
    const series1 = [5, 4, 2.9, 2, 1];
    const series2 = [1, 2, 3, 4, 5];
    const crossed = ta.cross(series1, series2);

    expect(crossed[2]).toBe(true);  // 2.9 < 3 and 4 >= 2 (crossed down)
  });

  it('should not detect when parallel', () => {
    const series1 = [1, 2, 3, 4, 5];
    const series2 = [2, 3, 4, 5, 6];
    const crossed = ta.cross(series1, series2);

    expect(crossed.every((v, i) => i === 0 ? v === false : v === false)).toBe(true);
  });
});

describe('ta.rising', () => {
  it('should detect rising values', () => {
    const source = [1, 2, 3, 4, 5];
    const rising3 = ta.rising(source, 3);

    expect(rising3[0]).toBe(false);
    expect(rising3[1]).toBe(false);
    expect(rising3[2]).toBe(false);
    expect(rising3[3]).toBe(true);  // 2->3->4 is rising
    expect(rising3[4]).toBe(true);  // 3->4->5 is rising
  });

  it('should detect when not rising', () => {
    const source = [1, 2, 3, 3, 4]; // Flat at index 3
    const rising3 = ta.rising(source, 3);

    expect(rising3[3]).toBe(false); // 2->3->3 is not rising (flat)
    expect(rising3[4]).toBe(false); // 3->3->4 is not rising (had flat)
  });

  it('should handle declining values', () => {
    const source = [5, 4, 3, 2, 1];
    const rising3 = ta.rising(source, 3);

    expect(rising3.every(v => v === false)).toBe(true);
  });
});

describe('ta.falling', () => {
  it('should detect falling values', () => {
    const source = [5, 4, 3, 2, 1];
    const falling3 = ta.falling(source, 3);

    expect(falling3[0]).toBe(false);
    expect(falling3[1]).toBe(false);
    expect(falling3[2]).toBe(false);
    expect(falling3[3]).toBe(true);  // 4->3->2 is falling
    expect(falling3[4]).toBe(true);  // 3->2->1 is falling
  });

  it('should detect when not falling', () => {
    const source = [5, 4, 3, 3, 2]; // Flat at index 3
    const falling3 = ta.falling(source, 3);

    expect(falling3[3]).toBe(false); // 4->3->3 is not falling (flat)
    expect(falling3[4]).toBe(false); // 3->3->2 is not falling (had flat)
  });

  it('should handle rising values', () => {
    const source = [1, 2, 3, 4, 5];
    const falling3 = ta.falling(source, 3);

    expect(falling3.every(v => v === false)).toBe(true);
  });
});
