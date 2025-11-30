import { math } from '../../src';

describe('math.abs', () => {
  it('should return absolute value of positive numbers', () => {
    expect(math.abs(5)).toBe(5);
    expect(math.abs(100)).toBe(100);
    expect(math.abs(0.5)).toBe(0.5);
  });

  it('should return absolute value of negative numbers', () => {
    expect(math.abs(-5)).toBe(5);
    expect(math.abs(-100)).toBe(100);
    expect(math.abs(-0.5)).toBe(0.5);
  });

  it('should handle zero', () => {
    expect(math.abs(0)).toBe(0);
    expect(math.abs(-0)).toBe(0);
  });

  it('should handle very large numbers', () => {
    expect(math.abs(-1000000)).toBe(1000000);
    expect(math.abs(1000000)).toBe(1000000);
  });
});

describe('math.ceil', () => {
  it('should round up positive decimals', () => {
    expect(math.ceil(4.2)).toBe(5);
    expect(math.ceil(4.8)).toBe(5);
    expect(math.ceil(0.1)).toBe(1);
  });

  it('should round up negative decimals towards zero', () => {
    expect(math.ceil(-4.2)).toBe(-4);
    expect(math.ceil(-4.8)).toBe(-4);
    expect(math.ceil(-0.1)).toBe(-0); // Math.ceil returns -0 for negative values close to 0
  });

  it('should return same value for integers', () => {
    expect(math.ceil(5)).toBe(5);
    expect(math.ceil(-5)).toBe(-5);
    expect(math.ceil(0)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(math.ceil(4.999999)).toBe(5);
    expect(math.ceil(5.000001)).toBe(6);
  });
});

describe('math.floor', () => {
  it('should round down positive decimals', () => {
    expect(math.floor(4.2)).toBe(4);
    expect(math.floor(4.8)).toBe(4);
    expect(math.floor(0.9)).toBe(0);
  });

  it('should round down negative decimals away from zero', () => {
    expect(math.floor(-4.2)).toBe(-5);
    expect(math.floor(-4.8)).toBe(-5);
    expect(math.floor(-0.1)).toBe(-1);
  });

  it('should return same value for integers', () => {
    expect(math.floor(5)).toBe(5);
    expect(math.floor(-5)).toBe(-5);
    expect(math.floor(0)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(math.floor(4.000001)).toBe(4);
    expect(math.floor(4.999999)).toBe(4);
  });
});

describe('math.round', () => {
  it('should round to nearest integer by default', () => {
    expect(math.round(4.2)).toBe(4);
    expect(math.round(4.5)).toBe(5);
    expect(math.round(4.8)).toBe(5);
  });

  it('should round negative numbers', () => {
    expect(math.round(-4.2)).toBe(-4);
    expect(math.round(-4.5)).toBe(-4);
    expect(math.round(-4.8)).toBe(-5);
  });

  it('should round to specified precision', () => {
    expect(math.round(4.567, 2)).toBeCloseTo(4.57, 10);
    expect(math.round(4.567, 1)).toBeCloseTo(4.6, 10);
    expect(math.round(4.567, 0)).toBe(5);
  });

  it('should handle zero precision', () => {
    expect(math.round(4.5, 0)).toBe(5);
    expect(math.round(3.14159, 0)).toBe(3);
  });

  it('should handle negative precision edge cases', () => {
    expect(math.round(123.456, 2)).toBeCloseTo(123.46, 10);
    expect(math.round(0.005, 2)).toBeCloseTo(0.01, 10);
  });
});

describe('math.max', () => {
  it('should return maximum of two numbers', () => {
    expect(math.max(1, 2)).toBe(2);
    expect(math.max(5, 3)).toBe(5);
    expect(math.max(-1, -5)).toBe(-1);
  });

  it('should return maximum of multiple numbers', () => {
    expect(math.max(1, 2, 3)).toBe(3);
    expect(math.max(5, 10, 3, 8)).toBe(10);
    expect(math.max(-1, -5, -2, -10)).toBe(-1);
  });

  it('should handle single argument', () => {
    expect(math.max(10)).toBe(10);
    expect(math.max(-5)).toBe(-5);
  });

  it('should handle mixed positive and negative', () => {
    expect(math.max(-5, 0, 5)).toBe(5);
    expect(math.max(-10, -20, -5)).toBe(-5);
  });

  it('should handle decimal numbers', () => {
    expect(math.max(1.5, 2.3, 1.9)).toBe(2.3);
    expect(math.max(0.1, 0.2, 0.15)).toBe(0.2);
  });
});

describe('math.min', () => {
  it('should return minimum of two numbers', () => {
    expect(math.min(1, 2)).toBe(1);
    expect(math.min(5, 3)).toBe(3);
    expect(math.min(-1, -5)).toBe(-5);
  });

  it('should return minimum of multiple numbers', () => {
    expect(math.min(1, 2, 3)).toBe(1);
    expect(math.min(5, 10, 3, 8)).toBe(3);
    expect(math.min(-1, -5, -2, -10)).toBe(-10);
  });

  it('should handle single argument', () => {
    expect(math.min(10)).toBe(10);
    expect(math.min(-5)).toBe(-5);
  });

  it('should handle mixed positive and negative', () => {
    expect(math.min(-5, 0, 5)).toBe(-5);
    expect(math.min(10, 20, 5)).toBe(5);
  });

  it('should handle decimal numbers', () => {
    expect(math.min(1.5, 2.3, 1.9)).toBe(1.5);
    expect(math.min(0.1, 0.2, 0.15)).toBe(0.1);
  });
});

describe('math.avg', () => {
  it('should calculate average of two numbers', () => {
    expect(math.avg(1, 2)).toBe(1.5);
    expect(math.avg(10, 20)).toBe(15);
  });

  it('should calculate average of multiple numbers', () => {
    expect(math.avg(1, 2, 3)).toBe(2);
    expect(math.avg(1, 2, 3, 4, 5)).toBe(3);
    expect(math.avg(10, 20, 30)).toBe(20);
  });

  it('should handle single number', () => {
    expect(math.avg(5)).toBe(5);
    expect(math.avg(100)).toBe(100);
  });

  it('should handle negative numbers', () => {
    expect(math.avg(-1, -2, -3)).toBe(-2);
    expect(math.avg(-5, 5)).toBe(0);
  });

  it('should handle decimal results', () => {
    expect(math.avg(1, 2)).toBe(1.5);
    expect(math.avg(1, 2, 3, 4)).toBe(2.5);
  });
});

describe('math.sum', () => {
  it('should calculate rolling sum over window', () => {
    const result = math.sum([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(6); // 1+2+3
    expect(result[3]).toBe(9); // 2+3+4
    expect(result[4]).toBe(12); // 3+4+5
  });

  it('should handle window size of 1', () => {
    const result = math.sum([1, 2, 3], 1);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
  });

  it('should handle window size equal to array length', () => {
    const result = math.sum([1, 2, 3, 4], 4);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeNaN();
    expect(result[3]).toBe(10); // 1+2+3+4
  });

  it('should handle window size of 2', () => {
    const result = math.sum([5, 10, 15, 20], 2);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBe(15); // 5+10
    expect(result[2]).toBe(25); // 10+15
    expect(result[3]).toBe(35); // 15+20
  });

  it('should handle negative numbers', () => {
    const result = math.sum([-1, -2, -3], 2);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBe(-3); // -1+-2
    expect(result[2]).toBe(-5); // -2+-3
  });

  it('should handle decimal numbers', () => {
    const result = math.sum([1.5, 2.5, 3.5], 2);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBe(4);
    expect(result[2]).toBe(6);
  });
});
