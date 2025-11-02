import { math } from '../../src';

describe('math.sin', () => {
  it('should calculate sine for common angles', () => {
    expect(math.sin(0)).toBe(0);
    expect(math.sin(Math.PI / 2)).toBeCloseTo(1, 10);
    expect(math.sin(Math.PI)).toBeCloseTo(0, 10);
    expect(math.sin(3 * Math.PI / 2)).toBeCloseTo(-1, 10);
  });

  it('should calculate sine for special angles', () => {
    expect(math.sin(Math.PI / 6)).toBeCloseTo(0.5, 10); // 30 degrees
    expect(math.sin(Math.PI / 4)).toBeCloseTo(Math.sqrt(2) / 2, 10); // 45 degrees
    expect(math.sin(Math.PI / 3)).toBeCloseTo(Math.sqrt(3) / 2, 10); // 60 degrees
  });

  it('should handle negative angles', () => {
    expect(math.sin(-Math.PI / 2)).toBeCloseTo(-1, 10);
    expect(math.sin(-Math.PI / 6)).toBeCloseTo(-0.5, 10);
  });

  it('should be periodic with period 2π', () => {
    const angle = Math.PI / 4;
    expect(math.sin(angle)).toBeCloseTo(math.sin(angle + 2 * Math.PI), 10);
    expect(math.sin(angle)).toBeCloseTo(math.sin(angle + 4 * Math.PI), 10);
  });

  it('should satisfy sin²(x) + cos²(x) = 1', () => {
    const x = 0.7;
    const sinX = math.sin(x);
    const cosX = math.cos(x);
    expect(sinX * sinX + cosX * cosX).toBeCloseTo(1, 10);
  });
});

describe('math.cos', () => {
  it('should calculate cosine for common angles', () => {
    expect(math.cos(0)).toBe(1);
    expect(math.cos(Math.PI / 2)).toBeCloseTo(0, 10);
    expect(math.cos(Math.PI)).toBeCloseTo(-1, 10);
    expect(math.cos(2 * Math.PI)).toBeCloseTo(1, 10);
  });

  it('should calculate cosine for special angles', () => {
    expect(math.cos(Math.PI / 3)).toBeCloseTo(0.5, 10); // 60 degrees
    expect(math.cos(Math.PI / 4)).toBeCloseTo(Math.sqrt(2) / 2, 10); // 45 degrees
    expect(math.cos(Math.PI / 6)).toBeCloseTo(Math.sqrt(3) / 2, 10); // 30 degrees
  });

  it('should handle negative angles', () => {
    expect(math.cos(-Math.PI)).toBeCloseTo(-1, 10);
    expect(math.cos(-Math.PI / 3)).toBeCloseTo(0.5, 10);
  });

  it('should be periodic with period 2π', () => {
    const angle = Math.PI / 3;
    expect(math.cos(angle)).toBeCloseTo(math.cos(angle + 2 * Math.PI), 10);
    expect(math.cos(angle)).toBeCloseTo(math.cos(angle + 4 * Math.PI), 10);
  });

  it('should be even function: cos(-x) = cos(x)', () => {
    const x = 1.5;
    expect(math.cos(x)).toBeCloseTo(math.cos(-x), 10);
  });
});

describe('math.tan', () => {
  it('should calculate tangent for common angles', () => {
    expect(math.tan(0)).toBeCloseTo(0, 10);
    expect(math.tan(Math.PI / 4)).toBeCloseTo(1, 10);
    expect(math.tan(Math.PI)).toBeCloseTo(0, 10);
  });

  it('should calculate tangent for special angles', () => {
    expect(math.tan(Math.PI / 6)).toBeCloseTo(1 / Math.sqrt(3), 10); // 30 degrees
    expect(math.tan(Math.PI / 3)).toBeCloseTo(Math.sqrt(3), 10); // 60 degrees
  });

  it('should verify tan(x) = sin(x) / cos(x)', () => {
    const x = 0.8;
    expect(math.tan(x)).toBeCloseTo(math.sin(x) / math.cos(x), 10);
  });

  it('should handle negative angles', () => {
    expect(math.tan(-Math.PI / 4)).toBeCloseTo(-1, 10);
  });

  it('should be periodic with period π', () => {
    const angle = Math.PI / 6;
    expect(math.tan(angle)).toBeCloseTo(math.tan(angle + Math.PI), 10);
  });
});

describe('math.asin', () => {
  it('should calculate arcsine for common values', () => {
    expect(math.asin(0)).toBe(0);
    expect(math.asin(1)).toBeCloseTo(Math.PI / 2, 10);
    expect(math.asin(-1)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('should calculate arcsine for special values', () => {
    expect(math.asin(0.5)).toBeCloseTo(Math.PI / 6, 10); // 30 degrees
    expect(math.asin(Math.sqrt(2) / 2)).toBeCloseTo(Math.PI / 4, 10); // 45 degrees
    expect(math.asin(Math.sqrt(3) / 2)).toBeCloseTo(Math.PI / 3, 10); // 60 degrees
  });

  it('should be inverse of sin in range [-π/2, π/2]', () => {
    const x = 0.7;
    expect(math.asin(math.sin(x))).toBeCloseTo(x, 10);
  });

  it('should return NaN for out-of-range values', () => {
    expect(math.asin(1.5)).toBeNaN();
    expect(math.asin(-1.5)).toBeNaN();
    expect(math.asin(2)).toBeNaN();
  });

  it('should return values in range [-π/2, π/2]', () => {
    const testValues = [0, 0.5, -0.5, 1, -1];
    testValues.forEach(val => {
      const result = math.asin(val);
      expect(result).toBeGreaterThanOrEqual(-Math.PI / 2);
      expect(result).toBeLessThanOrEqual(Math.PI / 2);
    });
  });
});

describe('math.acos', () => {
  it('should calculate arccosine for common values', () => {
    expect(math.acos(1)).toBe(0);
    expect(math.acos(0)).toBeCloseTo(Math.PI / 2, 10);
    expect(math.acos(-1)).toBeCloseTo(Math.PI, 10);
  });

  it('should calculate arccosine for special values', () => {
    expect(math.acos(0.5)).toBeCloseTo(Math.PI / 3, 10); // 60 degrees
    expect(math.acos(Math.sqrt(2) / 2)).toBeCloseTo(Math.PI / 4, 10); // 45 degrees
    expect(math.acos(Math.sqrt(3) / 2)).toBeCloseTo(Math.PI / 6, 10); // 30 degrees
  });

  it('should be inverse of cos in range [0, π]', () => {
    const x = 2.5;
    expect(math.acos(math.cos(x))).toBeCloseTo(x, 10);
  });

  it('should return NaN for out-of-range values', () => {
    expect(math.acos(1.5)).toBeNaN();
    expect(math.acos(-1.5)).toBeNaN();
    expect(math.acos(2)).toBeNaN();
  });

  it('should return values in range [0, π]', () => {
    const testValues = [0, 0.5, -0.5, 1, -1];
    testValues.forEach(val => {
      const result = math.acos(val);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(Math.PI);
    });
  });
});

describe('math.atan', () => {
  it('should calculate arctangent for common values', () => {
    expect(math.atan(0)).toBe(0);
    expect(math.atan(1)).toBeCloseTo(Math.PI / 4, 10);
    expect(math.atan(-1)).toBeCloseTo(-Math.PI / 4, 10);
  });

  it('should calculate arctangent for special values', () => {
    expect(math.atan(Math.sqrt(3))).toBeCloseTo(Math.PI / 3, 10);
    expect(math.atan(1 / Math.sqrt(3))).toBeCloseTo(Math.PI / 6, 10);
  });

  it('should be inverse of tan in range [-π/2, π/2]', () => {
    const x = 0.5;
    expect(math.atan(math.tan(x))).toBeCloseTo(x, 10);
  });

  it('should handle infinity', () => {
    expect(math.atan(Infinity)).toBeCloseTo(Math.PI / 2, 10);
    expect(math.atan(-Infinity)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('should return values in range [-π/2, π/2]', () => {
    const testValues = [0, 1, -1, 10, -10, 100];
    testValues.forEach(val => {
      const result = math.atan(val);
      expect(result).toBeGreaterThanOrEqual(-Math.PI / 2);
      expect(result).toBeLessThanOrEqual(Math.PI / 2);
    });
  });

  it('should handle very large and small values', () => {
    expect(math.atan(1e10)).toBeCloseTo(Math.PI / 2, 5);
    expect(math.atan(-1e10)).toBeCloseTo(-Math.PI / 2, 5);
    expect(math.atan(1e-10)).toBeCloseTo(0, 5);
  });
});
