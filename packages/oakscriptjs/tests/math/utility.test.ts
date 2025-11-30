import { math } from '../../src';

describe('math.toradians', () => {
  it('should convert common degree values to radians', () => {
    expect(math.toradians(0)).toBe(0);
    expect(math.toradians(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(math.toradians(180)).toBeCloseTo(Math.PI, 10);
    expect(math.toradians(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it('should convert special degree values', () => {
    expect(math.toradians(45)).toBeCloseTo(Math.PI / 4, 10);
    expect(math.toradians(30)).toBeCloseTo(Math.PI / 6, 10);
    expect(math.toradians(60)).toBeCloseTo(Math.PI / 3, 10);
  });

  it('should handle negative degrees', () => {
    expect(math.toradians(-90)).toBeCloseTo(-Math.PI / 2, 10);
    expect(math.toradians(-180)).toBeCloseTo(-Math.PI, 10);
  });

  it('should handle decimal degrees', () => {
    expect(math.toradians(22.5)).toBeCloseTo(Math.PI / 8, 10);
    expect(math.toradians(135)).toBeCloseTo(3 * Math.PI / 4, 10);
  });

  it('should convert and back verify with todegrees', () => {
    const degrees = 72;
    expect(math.todegrees(math.toradians(degrees))).toBeCloseTo(degrees, 10);
  });

  it('should handle large degree values', () => {
    expect(math.toradians(720)).toBeCloseTo(4 * Math.PI, 10);
    expect(math.toradians(1080)).toBeCloseTo(6 * Math.PI, 10);
  });
});

describe('math.todegrees', () => {
  it('should convert common radian values to degrees', () => {
    expect(math.todegrees(0)).toBe(0);
    expect(math.todegrees(Math.PI / 2)).toBeCloseTo(90, 10);
    expect(math.todegrees(Math.PI)).toBeCloseTo(180, 10);
    expect(math.todegrees(2 * Math.PI)).toBeCloseTo(360, 10);
  });

  it('should convert special radian values', () => {
    expect(math.todegrees(Math.PI / 4)).toBeCloseTo(45, 10);
    expect(math.todegrees(Math.PI / 6)).toBeCloseTo(30, 10);
    expect(math.todegrees(Math.PI / 3)).toBeCloseTo(60, 10);
  });

  it('should handle negative radians', () => {
    expect(math.todegrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
    expect(math.todegrees(-Math.PI)).toBeCloseTo(-180, 10);
  });

  it('should handle decimal radians', () => {
    expect(math.todegrees(1)).toBeCloseTo(57.29577, 4);
    expect(math.todegrees(2)).toBeCloseTo(114.59155, 4);
  });

  it('should convert and back verify with toradians', () => {
    const radians = 1.5;
    expect(math.toradians(math.todegrees(radians))).toBeCloseTo(radians, 10);
  });

  it('should handle large radian values', () => {
    expect(math.todegrees(4 * Math.PI)).toBeCloseTo(720, 10);
    expect(math.todegrees(6 * Math.PI)).toBeCloseTo(1080, 10);
  });
});

describe('math.random', () => {
  it('should return value between 0 and 1 with no arguments', () => {
    for (let i = 0; i < 10; i++) {
      const result = math.random();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    }
  });

  it('should return value in specified range', () => {
    for (let i = 0; i < 10; i++) {
      const result = math.random(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    }
  });

  it('should handle negative ranges', () => {
    for (let i = 0; i < 10; i++) {
      const result = math.random(-10, -5);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThan(-5);
    }
  });

  it('should handle mixed positive/negative ranges', () => {
    for (let i = 0; i < 10; i++) {
      const result = math.random(-5, 5);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThan(5);
    }
  });

  it('should handle decimal ranges', () => {
    for (let i = 0; i < 10; i++) {
      const result = math.random(1.5, 2.5);
      expect(result).toBeGreaterThanOrEqual(1.5);
      expect(result).toBeLessThan(2.5);
    }
  });

  it('should produce different values on repeated calls', () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(math.random());
    }
    // Should have many unique values (probability of collision is very low)
    expect(results.size).toBeGreaterThan(90);
  });

  it('should handle zero-width range edge case', () => {
    const result = math.random(5, 5);
    expect(result).toBe(5);
  });
});

describe('math.sign', () => {
  it('should return 1 for positive numbers', () => {
    expect(math.sign(5)).toBe(1);
    expect(math.sign(100)).toBe(1);
    expect(math.sign(0.1)).toBe(1);
    expect(math.sign(0.001)).toBe(1);
  });

  it('should return -1 for negative numbers', () => {
    expect(math.sign(-5)).toBe(-1);
    expect(math.sign(-100)).toBe(-1);
    expect(math.sign(-0.1)).toBe(-1);
    expect(math.sign(-0.001)).toBe(-1);
  });

  it('should return 0 for zero', () => {
    expect(math.sign(0)).toBe(0);
    expect(math.sign(-0)).toBe(0);
  });

  it('should handle very large numbers', () => {
    expect(math.sign(1e10)).toBe(1);
    expect(math.sign(-1e10)).toBe(-1);
  });

  it('should handle very small numbers', () => {
    expect(math.sign(1e-10)).toBe(1);
    expect(math.sign(-1e-10)).toBe(-1);
  });

  it('should be useful for direction determination', () => {
    const change = 5 - 10; // -5
    expect(math.sign(change)).toBe(-1); // Downward direction

    const increase = 10 - 5; // 5
    expect(math.sign(increase)).toBe(1); // Upward direction
  });

  it('should satisfy sign(x) * abs(x) = x for non-zero x', () => {
    const values = [5, -3, 10, -100, 0.5, -0.5];
    values.forEach(x => {
      if (x !== 0) {
        expect(math.sign(x) * math.abs(x)).toBeCloseTo(x, 10);
      }
    });
  });
});
