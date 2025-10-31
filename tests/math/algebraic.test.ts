import { math } from '../../src';

describe('math.sqrt', () => {
  it('should calculate square root of perfect squares', () => {
    expect(math.sqrt(4)).toBe(2);
    expect(math.sqrt(9)).toBe(3);
    expect(math.sqrt(16)).toBe(4);
    expect(math.sqrt(25)).toBe(5);
  });

  it('should calculate square root of non-perfect squares', () => {
    expect(math.sqrt(2)).toBeCloseTo(1.414213, 5);
    expect(math.sqrt(3)).toBeCloseTo(1.732050, 5);
    expect(math.sqrt(5)).toBeCloseTo(2.236067, 5);
  });

  it('should handle zero and one', () => {
    expect(math.sqrt(0)).toBe(0);
    expect(math.sqrt(1)).toBe(1);
  });

  it('should handle decimal numbers', () => {
    expect(math.sqrt(0.25)).toBe(0.5);
    expect(math.sqrt(0.01)).toBe(0.1);
  });

  it('should return NaN for negative numbers', () => {
    expect(math.sqrt(-1)).toBeNaN();
    expect(math.sqrt(-4)).toBeNaN();
  });

  it('should verify sqrt(x) * sqrt(x) = x', () => {
    const x = 7;
    expect(math.sqrt(x) * math.sqrt(x)).toBeCloseTo(x, 10);
  });
});

describe('math.pow', () => {
  it('should calculate integer powers', () => {
    expect(math.pow(2, 3)).toBe(8);
    expect(math.pow(3, 2)).toBe(9);
    expect(math.pow(10, 2)).toBe(100);
    expect(math.pow(5, 3)).toBe(125);
  });

  it('should handle power of 0', () => {
    expect(math.pow(5, 0)).toBe(1);
    expect(math.pow(100, 0)).toBe(1);
    expect(math.pow(-5, 0)).toBe(1);
  });

  it('should handle power of 1', () => {
    expect(math.pow(5, 1)).toBe(5);
    expect(math.pow(100, 1)).toBe(100);
  });

  it('should handle negative exponents', () => {
    expect(math.pow(2, -1)).toBe(0.5);
    expect(math.pow(10, -2)).toBe(0.01);
    expect(math.pow(5, -1)).toBe(0.2);
  });

  it('should handle fractional exponents', () => {
    expect(math.pow(4, 0.5)).toBe(2); // Square root
    expect(math.pow(8, 1/3)).toBeCloseTo(2, 10); // Cube root
    expect(math.pow(27, 1/3)).toBeCloseTo(3, 10);
  });

  it('should handle base of 0', () => {
    expect(math.pow(0, 1)).toBe(0);
    expect(math.pow(0, 5)).toBe(0);
  });

  it('should handle base of 1', () => {
    expect(math.pow(1, 100)).toBe(1);
    expect(math.pow(1, -100)).toBe(1);
  });
});

describe('math.exp', () => {
  it('should calculate e^x for small integers', () => {
    expect(math.exp(0)).toBe(1);
    expect(math.exp(1)).toBeCloseTo(Math.E, 10);
    expect(math.exp(2)).toBeCloseTo(7.389056, 5);
  });

  it('should handle negative exponents', () => {
    expect(math.exp(-1)).toBeCloseTo(0.367879, 5);
    expect(math.exp(-2)).toBeCloseTo(0.135335, 5);
  });

  it('should verify exp and log are inverses', () => {
    const x = 5;
    expect(math.exp(math.log(x))).toBeCloseTo(x, 10);
  });

  it('should handle decimal exponents', () => {
    expect(math.exp(0.5)).toBeCloseTo(1.648721, 5);
    expect(math.exp(1.5)).toBeCloseTo(4.481689, 5);
  });
});

describe('math.log', () => {
  it('should calculate natural logarithm', () => {
    expect(math.log(1)).toBe(0);
    expect(math.log(Math.E)).toBeCloseTo(1, 10);
    expect(math.log(10)).toBeCloseTo(2.302585, 5);
  });

  it('should handle common values', () => {
    expect(math.log(2)).toBeCloseTo(0.693147, 5);
    expect(math.log(100)).toBeCloseTo(4.605170, 5);
  });

  it('should verify log and exp are inverses', () => {
    const x = 10;
    expect(math.log(math.exp(x))).toBeCloseTo(x, 10);
  });

  it('should return NaN for negative numbers', () => {
    expect(math.log(-1)).toBeNaN();
    expect(math.log(-10)).toBeNaN();
  });

  it('should return -Infinity for zero', () => {
    expect(math.log(0)).toBe(-Infinity);
  });

  it('should handle decimal inputs', () => {
    expect(math.log(0.5)).toBeCloseTo(-0.693147, 5);
    expect(math.log(0.1)).toBeCloseTo(-2.302585, 5);
  });
});

describe('math.log10', () => {
  it('should calculate base-10 logarithm', () => {
    expect(math.log10(1)).toBe(0);
    expect(math.log10(10)).toBe(1);
    expect(math.log10(100)).toBe(2);
    expect(math.log10(1000)).toBe(3);
  });

  it('should handle non-powers of 10', () => {
    expect(math.log10(2)).toBeCloseTo(0.301029, 5);
    expect(math.log10(5)).toBeCloseTo(0.698970, 5);
  });

  it('should handle decimal inputs', () => {
    expect(math.log10(0.1)).toBe(-1);
    expect(math.log10(0.01)).toBe(-2);
  });

  it('should return NaN for negative numbers', () => {
    expect(math.log10(-1)).toBeNaN();
    expect(math.log10(-10)).toBeNaN();
  });

  it('should return -Infinity for zero', () => {
    expect(math.log10(0)).toBe(-Infinity);
  });

  it('should verify relationship with natural log', () => {
    const x = 50;
    expect(math.log10(x)).toBeCloseTo(math.log(x) / math.log(10), 10);
  });
});
