import { str } from '../../src';

describe('str.length', () => {
  it('should return the length of a string', () => {
    expect(str.length('hello')).toBe(5);
    expect(str.length('world')).toBe(5);
    expect(str.length('test')).toBe(4);
  });

  it('should handle empty string', () => {
    expect(str.length('')).toBe(0);
  });

  it('should handle strings with special characters', () => {
    expect(str.length('hello!')).toBe(6);
    expect(str.length('test@123')).toBe(8);
    expect(str.length('a b c')).toBe(5);
  });

  it('should handle unicode characters', () => {
    expect(str.length('hello 👋')).toBe(8); // emoji counts as 2 characters in JS
    expect(str.length('café')).toBe(4);
  });
});

describe('str.tostring', () => {
  it('should convert numbers to strings', () => {
    expect(str.tostring(123)).toBe('123');
    expect(str.tostring(45.67)).toBe('45.67');
    expect(str.tostring(-89)).toBe('-89');
    expect(str.tostring(0)).toBe('0');
  });

  it('should convert boolean to strings', () => {
    expect(str.tostring(true)).toBe('true');
    expect(str.tostring(false)).toBe('false');
  });

  it('should handle null and undefined', () => {
    expect(str.tostring(null)).toBe('null');
    expect(str.tostring(undefined)).toBe('undefined');
  });

  it('should format numbers with format string', () => {
    expect(str.tostring(123.456, '#.##')).toBe('123.46');
    expect(str.tostring(123.456, '#.#')).toBe('123.5');
    expect(str.tostring(123.456, '#')).toBe('123');
    expect(str.tostring(123, '#.##')).toBe('123.00');
  });

  it('should handle already string values', () => {
    expect(str.tostring('hello')).toBe('hello');
    expect(str.tostring('')).toBe('');
  });

  it('should handle special numeric values', () => {
    expect(str.tostring(NaN)).toBe('NaN');
    expect(str.tostring(Infinity)).toBe('Infinity');
    expect(str.tostring(-Infinity)).toBe('-Infinity');
  });
});

describe('str.tonumber', () => {
  it('should convert valid number strings to numbers', () => {
    expect(str.tonumber('123')).toBe(123);
    expect(str.tonumber('45.67')).toBe(45.67);
    expect(str.tonumber('-89')).toBe(-89);
    expect(str.tonumber('0')).toBe(0);
  });

  it('should handle strings with whitespace', () => {
    expect(str.tonumber('  123  ')).toBe(123);
    expect(str.tonumber('45.67\n')).toBe(45.67);
  });

  it('should return null for invalid strings', () => {
    expect(str.tonumber('abc')).toBeNull();
    expect(str.tonumber('hello')).toBeNull();
    expect(str.tonumber('12abc')).toBe(12); // parseFloat parses what it can
    expect(str.tonumber('abc123')).toBeNull();
  });

  it('should handle empty string', () => {
    expect(str.tonumber('')).toBeNull();
  });

  it('should handle special numeric strings', () => {
    // parseFloat('NaN') returns NaN, but tonumber returns null for NaN values
    expect(str.tonumber('NaN')).toBeNull();
    expect(str.tonumber('Infinity')).toBe(Infinity);
    expect(str.tonumber('-Infinity')).toBe(-Infinity);
  });

  it('should handle scientific notation', () => {
    expect(str.tonumber('1e3')).toBe(1000);
    expect(str.tonumber('1.5e2')).toBe(150);
    expect(str.tonumber('1e-3')).toBe(0.001);
  });

  it('should handle decimal numbers', () => {
    expect(str.tonumber('0.5')).toBe(0.5);
    expect(str.tonumber('.5')).toBe(0.5);
    expect(str.tonumber('-.5')).toBe(-0.5);
  });
});
