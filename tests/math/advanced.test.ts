import { math } from '../../src';

describe('math.atan2', () => {
  it('should calculate arctangent of y/x', () => {
    expect(math.atan2(1, 1)).toBeCloseTo(Math.PI / 4, 10);
    expect(math.atan2(1, 0)).toBeCloseTo(Math.PI / 2, 10);
    expect(math.atan2(0, 1)).toBe(0);
    expect(math.atan2(-1, -1)).toBeCloseTo(-3 * Math.PI / 4, 10);
  });

  it('should handle all four quadrants correctly', () => {
    // Quadrant 1: (x > 0, y > 0)
    expect(math.atan2(1, 1)).toBeGreaterThan(0);
    expect(math.atan2(1, 1)).toBeLessThan(Math.PI / 2);

    // Quadrant 2: (x < 0, y > 0)
    expect(math.atan2(1, -1)).toBeGreaterThan(Math.PI / 2);
    expect(math.atan2(1, -1)).toBeLessThan(Math.PI);

    // Quadrant 3: (x < 0, y < 0)
    expect(math.atan2(-1, -1)).toBeLessThan(0);
    expect(math.atan2(-1, -1)).toBeGreaterThan(-Math.PI);

    // Quadrant 4: (x > 0, y < 0)
    expect(math.atan2(-1, 1)).toBeLessThan(0);
    expect(math.atan2(-1, 1)).toBeGreaterThan(-Math.PI / 2);
  });

  it('should handle edge cases on axes', () => {
    // Positive x-axis
    expect(math.atan2(0, 1)).toBe(0);

    // Positive y-axis
    expect(math.atan2(1, 0)).toBeCloseTo(Math.PI / 2, 10);

    // Negative x-axis
    expect(Math.abs(math.atan2(0, -1))).toBeCloseTo(Math.PI, 10);

    // Negative y-axis
    expect(math.atan2(-1, 0)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('should handle zero coordinates', () => {
    expect(math.atan2(0, 0)).toBe(0);
  });

  it('should return value in range [-π, π]', () => {
    const testCases = [
      [1, 1], [1, -1], [-1, -1], [-1, 1],
      [2, 3], [-2, 3], [-2, -3], [2, -3]
    ];

    testCases.forEach(([y, x]) => {
      const result = math.atan2(y, x);
      expect(result).toBeGreaterThanOrEqual(-Math.PI);
      expect(result).toBeLessThanOrEqual(Math.PI);
    });
  });
});

describe('math.fact', () => {
  it('should calculate factorial for small numbers', () => {
    expect(math.fact(0)).toBe(1);
    expect(math.fact(1)).toBe(1);
    expect(math.fact(2)).toBe(2);
    expect(math.fact(3)).toBe(6);
    expect(math.fact(4)).toBe(24);
    expect(math.fact(5)).toBe(120);
  });

  it('should calculate factorial for larger numbers', () => {
    expect(math.fact(6)).toBe(720);
    expect(math.fact(7)).toBe(5040);
    expect(math.fact(10)).toBe(3628800);
  });

  it('should return NaN for negative numbers', () => {
    expect(math.fact(-1)).toBeNaN();
    expect(math.fact(-5)).toBeNaN();
  });

  it('should handle edge cases', () => {
    expect(math.fact(0)).toBe(1); // 0! = 1 by definition
    expect(math.fact(1)).toBe(1); // 1! = 1
  });

  it('should calculate known factorials', () => {
    expect(math.fact(12)).toBe(479001600);
    expect(math.fact(13)).toBe(6227020800);
  });
});

describe('math.hypot', () => {
  it('should calculate Euclidean distance for two arguments', () => {
    expect(math.hypot(3, 4)).toBe(5);
    expect(math.hypot(5, 12)).toBe(13);
    expect(math.hypot(8, 15)).toBe(17);
  });

  it('should handle single argument', () => {
    expect(math.hypot(5)).toBe(5);
    expect(math.hypot(-5)).toBe(5);
    expect(math.hypot(0)).toBe(0);
  });

  it('should calculate for multiple arguments', () => {
    expect(math.hypot(1, 1, 1)).toBeCloseTo(Math.sqrt(3), 10);
    expect(math.hypot(2, 2, 2, 2)).toBeCloseTo(4, 10);
    expect(math.hypot(3, 4, 12)).toBe(13);
  });

  it('should handle zero values', () => {
    expect(math.hypot(0, 0)).toBe(0);
    expect(math.hypot(0, 3, 4)).toBe(5);
    expect(math.hypot(3, 0, 4)).toBe(5);
  });

  it('should handle negative values', () => {
    expect(math.hypot(-3, -4)).toBe(5);
    expect(math.hypot(-1, -1)).toBeCloseTo(Math.sqrt(2), 10);
  });

  it('should match manual calculation', () => {
    const result = math.hypot(1, 2, 3, 4);
    const expected = Math.sqrt(1 + 4 + 9 + 16);
    expect(result).toBeCloseTo(expected, 10);
  });

  it('should handle common Pythagorean triples', () => {
    expect(math.hypot(3, 4)).toBe(5);
    expect(math.hypot(5, 12)).toBe(13);
    expect(math.hypot(7, 24)).toBe(25);
    expect(math.hypot(8, 15)).toBe(17);
  });
});

describe('math.nextafter', () => {
  it('should return next larger value when y > x', () => {
    const result = math.nextafter(1, 2);
    expect(result).toBeGreaterThan(1);
    expect(result).toBeLessThan(1.1);
  });

  it('should return next smaller value when y < x', () => {
    const result = math.nextafter(1, 0);
    expect(result).toBeLessThan(1);
    expect(result).toBeGreaterThan(0.9);
  });

  it('should return y when x equals y', () => {
    expect(math.nextafter(1, 1)).toBe(1);
    expect(math.nextafter(0, 0)).toBe(0);
    expect(math.nextafter(5.5, 5.5)).toBe(5.5);
  });

  it('should return NaN for NaN inputs', () => {
    expect(math.nextafter(NaN, 1)).toBeNaN();
    expect(math.nextafter(1, NaN)).toBeNaN();
    expect(math.nextafter(NaN, NaN)).toBeNaN();
  });

  it('should handle zero correctly', () => {
    const positiveNext = math.nextafter(0, 1);
    const negativeNext = math.nextafter(0, -1);

    expect(positiveNext).toBeGreaterThan(0);
    expect(negativeNext).toBeLessThan(0);
  });

  it('should step in correct direction', () => {
    const x = 100;
    const nextUp = math.nextafter(x, Infinity);
    const nextDown = math.nextafter(x, -Infinity);

    expect(nextUp).toBeGreaterThan(x);
    expect(nextDown).toBeLessThan(x);
  });

  it('should work with negative numbers', () => {
    const result1 = math.nextafter(-1, -2);
    const result2 = math.nextafter(-1, 0);

    expect(result1).toBeLessThan(-1);
    expect(result2).toBeGreaterThan(-1);
  });
});

describe('math.combinations', () => {
  it('should calculate basic combinations', () => {
    expect(math.combinations(5, 2)).toBe(10); // C(5,2) = 10
    expect(math.combinations(5, 3)).toBe(10); // C(5,3) = 10
    expect(math.combinations(6, 2)).toBe(15); // C(6,2) = 15
    expect(math.combinations(10, 3)).toBe(120); // C(10,3) = 120
  });

  it('should handle edge cases', () => {
    expect(math.combinations(5, 0)).toBe(1); // C(n,0) = 1
    expect(math.combinations(5, 5)).toBe(1); // C(n,n) = 1
    expect(math.combinations(10, 1)).toBe(10); // C(n,1) = n
  });

  it('should return 0 for invalid inputs', () => {
    expect(math.combinations(5, 6)).toBe(0); // k > n
    expect(math.combinations(5, -1)).toBe(0); // k < 0
  });

  it('should verify C(n,k) = C(n,n-k)', () => {
    expect(math.combinations(10, 3)).toBe(math.combinations(10, 7));
    expect(math.combinations(8, 2)).toBe(math.combinations(8, 6));
    expect(math.combinations(6, 1)).toBe(math.combinations(6, 5));
  });

  it('should calculate known combinations', () => {
    expect(math.combinations(7, 3)).toBe(35);
    expect(math.combinations(8, 4)).toBe(70);
    expect(math.combinations(9, 2)).toBe(36);
  });

  it('should handle larger values', () => {
    expect(math.combinations(20, 10)).toBe(184756);
    expect(math.combinations(15, 5)).toBe(3003);
  });

  it('should calculate Pascal triangle values', () => {
    // Row 4: 1, 4, 6, 4, 1
    expect(math.combinations(4, 0)).toBe(1);
    expect(math.combinations(4, 1)).toBe(4);
    expect(math.combinations(4, 2)).toBe(6);
    expect(math.combinations(4, 3)).toBe(4);
    expect(math.combinations(4, 4)).toBe(1);
  });
});

describe('math.permutations', () => {
  it('should calculate basic permutations', () => {
    expect(math.permutations(5, 2)).toBe(20); // P(5,2) = 5×4 = 20
    expect(math.permutations(5, 3)).toBe(60); // P(5,3) = 5×4×3 = 60
    expect(math.permutations(6, 2)).toBe(30); // P(6,2) = 6×5 = 30
  });

  it('should handle edge cases', () => {
    expect(math.permutations(5, 0)).toBe(1); // P(n,0) = 1
    expect(math.permutations(5, 5)).toBe(120); // P(n,n) = n!
    expect(math.permutations(10, 1)).toBe(10); // P(n,1) = n
  });

  it('should return 0 for invalid inputs', () => {
    expect(math.permutations(5, 6)).toBe(0); // k > n
    expect(math.permutations(5, -1)).toBe(0); // k < 0
  });

  it('should calculate known permutations', () => {
    expect(math.permutations(7, 3)).toBe(210); // 7×6×5
    expect(math.permutations(8, 4)).toBe(1680); // 8×7×6×5
    expect(math.permutations(10, 2)).toBe(90); // 10×9
  });

  it('should verify P(n,n) equals factorial', () => {
    expect(math.permutations(5, 5)).toBe(math.fact(5));
    expect(math.permutations(6, 6)).toBe(math.fact(6));
    expect(math.permutations(7, 7)).toBe(math.fact(7));
  });

  it('should verify permutations > combinations', () => {
    // Since order matters in permutations, P(n,k) >= C(n,k)
    expect(math.permutations(10, 3)).toBeGreaterThanOrEqual(math.combinations(10, 3));
    expect(math.permutations(8, 4)).toBeGreaterThanOrEqual(math.combinations(8, 4));
  });

  it('should calculate larger values', () => {
    expect(math.permutations(12, 4)).toBe(11880); // 12×11×10×9
    expect(math.permutations(15, 3)).toBe(2730); // 15×14×13
  });

  it('should verify relationship P(n,k) = C(n,k) × k!', () => {
    const n = 10, k = 4;
    const perm = math.permutations(n, k);
    const comb = math.combinations(n, k);
    const kfact = math.fact(k);
    expect(perm).toBeCloseTo(comb * kfact, 10);
  });
});
