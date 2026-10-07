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
    // PineScript: '#' digits are optional, '0' digits are required
    expect(str.tostring(123, '#.##')).toBe('123');
    expect(str.tostring(123, '0.00')).toBe('123.00');
    expect(str.tostring(1.005, '#.##')).toBe('1.01');
    expect(str.tostring(0.5, '#.00')).toBe('.50');
    expect(str.tostring(0.5, '#.##')).toBe('0.5');
    expect(str.tostring(-0.004, '#.##')).toBe('0');
    expect(str.tostring(12345.678, '#,###.##')).toBe('12,345.68');
    expect(str.tostring(0.125, '#.##%')).toBe('12.5%');
    expect(str.tostring(12345.678, 'volume')).toBe('12.346K');
    expect(str.tostring(0.5, 'percent')).toBe('0.50%');
    expect(str.tostring(1 / 3)).toBe('0.3333333333');
    expect(() => str.tostring(1, 'mintick')).toThrow('syminfo.mintick');
  });

  it('format.mintick rounds to the tick and shows its decimals (PineScript)', () => {
    expect(str.tostring(1234.5678, 'mintick', 0.01)).toBe('1234.57');
    expect(str.tostring(10.1, 'mintick', 0.25)).toBe('10.00');
    expect(str.tostring(0.123456789, 'mintick', 1e-8)).toBe('0.12345679');
    expect(str.tostring(1234.5678, 'mintick', 1)).toBe('1235');
  });

  it('format.mintick keeps the trailing zeros of the tick decimals (#155)', () => {
    expect(str.tostring(1.0044630000000001, 'mintick', 0.01)).toBe('1.00');
    expect(str.tostring(0.401785, 'mintick', 0.01)).toBe('0.40');
    expect(str.tostring(280.9, 'mintick', 0.01)).toBe('280.90');
    expect(str.tostring(-13.2, 'mintick', 0.01)).toBe('-13.20');
  });

  it('format.mintick rounds the double quotient x / mintick half away from zero (#155)', () => {
    // 140.355 / 0.01 = 14035.499999999998: down, where math.round_to_mintick rounds the exact decimal up
    expect(str.tostring(140.355, 'mintick', 0.01)).toBe('140.35');
    expect(str.tostring(33.635, 'mintick', 0.01)).toBe('33.63'); // 33.635 * 100 is 3363.5, 33.635 / 0.01 is not
    expect(str.tostring(30.955, 'mintick', 0.01)).toBe('30.95');
    expect(str.tostring(280.905, 'mintick', 0.01)).toBe('280.90');
    expect(str.tostring(-2.9849999999999994, 'mintick', 0.01)).toBe('-2.98');
    expect(str.tostring(1.125, 'mintick', 0.01)).toBe('1.13'); // exact .5 quotient: away from zero
    expect(str.tostring(-1.125, 'mintick', 0.01)).toBe('-1.13');
    expect(str.tostring(6.5, 'mintick', 1)).toBe('7');
    expect(str.tostring(41967.5, 'mintick', 1)).toBe('41968');
  });

  it('format.mintick with a tick step above 1: to 1 / pricescale half away, then to the tick, a half up (#155)', () => {
    // tick 0.02 (minmove 2, pricescale 100)
    expect(str.tostring(0.005, 'mintick', 0.02)).toBe('0.02'); // 0.5 -> 1 unit -> 0.5 tick -> 1 tick
    expect(str.tostring(0.01, 'mintick', 0.02)).toBe('0.02');
    expect(str.tostring(-0.01, 'mintick', 0.02)).toBe('0.00');
    expect(str.tostring(-0.03, 'mintick', 0.02)).toBe('-0.02');
    expect(str.tostring(0.025, 'mintick', 0.02)).toBe('0.04');
    expect(str.tostring(0.145, 'mintick', 0.02)).toBe('0.14'); // 0.145 / 0.01 = 14.499999999999998
    // tick 0.05, 0.00005, 0.25, 0.5
    expect(str.tostring(0.075, 'mintick', 0.05)).toBe('0.10');
    expect(str.tostring(-0.075, 'mintick', 0.05)).toBe('-0.10');
    expect(str.tostring(0.000225, 'mintick', 0.00005)).toBe('0.00020');
    expect(str.tostring(0.125, 'mintick', 0.25)).toBe('0.25');
    expect(str.tostring(-0.125, 'mintick', 0.25)).toBe('-0.25');
    expect(str.tostring(0.25, 'mintick', 0.5)).toBe('0.5');
  });

  it('format.mintick with other decimal ticks and values around zero (#155)', () => {
    expect(str.tostring(1.000005, 'mintick', 0.00001)).toBe('1.00001');
    expect(str.tostring(0.5e-8, 'mintick', 1e-8)).toBe('0.00000001');
    expect(str.tostring(12.25, 'mintick', 0.1)).toBe('12.3');
    expect(str.tostring(-0.004, 'mintick', 0.01)).toBe('0.00');
    expect(str.tostring(-0.005, 'mintick', 0.01)).toBe('-0.01');
    expect(str.tostring(0, 'mintick', 0.01)).toBe('0.00');
  });

  it('format.mintick with a pricescale that is no power of 10: floor(log10(pricescale)) decimals, half even (#155)', () => {
    // 1/32 (minmove 1, pricescale 32): one decimal
    expect(str.tostring(0.046875, 'mintick', 0.03125, 32)).toBe('0.1'); // 1.5 ticks -> 2 ticks = 0.0625
    expect(str.tostring(0.0390625, 'mintick', 0.03125, 32)).toBe('0.0');
    expect(str.tostring(25.25, 'mintick', 0.03125, 32)).toBe('25.2'); // half even
    expect(str.tostring(25.265625, 'mintick', 0.03125, 32)).toBe('25.3');
    expect(str.tostring(-0.015625, 'mintick', 0.03125, 32)).toBe('-0.0'); // -1 tick prints as zero, sign kept
    expect(str.tostring(-0.0078125, 'mintick', 0.03125, 32)).toBe('0.0');
    expect(str.tostring(16, 'mintick', 0.03125, 32)).toBe('16.0');
    // 1/64: one decimal; 2/8: none
    expect(str.tostring(0.0234375, 'mintick', 0.015625, 64)).toBe('0.0');
    expect(str.tostring(0.375, 'mintick', 0.25, 8)).toBe('0');
    expect(str.tostring(0.375, 'mintick', 0.25)).toBe('0.50'); // 25 / 100 by default
    // a decimal pricescale given explicitly is the default
    expect(str.tostring(140.355, 'mintick', 0.01, 100)).toBe('140.35');
  });

  it('a negative subpattern after ";" (PineScript)', () => {
    expect(str.tostring(-3.5, '#.##;(#.##)')).toBe('(3.5)');
    expect(str.tostring(3.5, '#.##;(#.##)')).toBe('3.5');
    expect(str.tostring(-0.001, '#.##;(#.##)')).toBe('0');
  });

  it('16 decimals at most from 1e-3 up (PineScript)', () => {
    expect(str.tostring(0.0012345678901234567, '#.####################')).toBe('0.0012345678901235');
    expect(str.tostring(0.1, '#.####################')).toBe('0.1');
    expect(str.tostring(1e-17, '#.####################')).toBe('0.00000000000000001');
  });

  it('keeps the measured PineScript outputs', () => {
    expect(str.tostring(-0.001, '#.##')).toBe('0');
    expect(str.tostring(0.25, 'percent')).toBe('0.25%');
    expect(str.tostring(1234567, 'volume')).toBe('1.235M');
    expect(str.tostring(1e21)).toBe('1E21');
    expect(str.tostring(1234567, '#,###')).toBe('1,234,567');
  });

  it('should handle already string values', () => {
    expect(str.tostring('hello')).toBe('hello');
    expect(str.tostring('')).toBe('');
  });

  it('should handle special numeric values (PineScript: NaN for an infinity, NaN% for na percent)', () => {
    expect(str.tostring(NaN)).toBe('NaN');
    expect(str.tostring(NaN, 'percent')).toBe('NaN%');
    expect(str.tostring(Infinity)).toBe('NaN');
    expect(str.tostring(-Infinity)).toBe('NaN');
    expect(str.tostring(Infinity, '#.##')).toBe('NaN');
    expect(str.tostring(Infinity, 'percent')).toBe('NaN%');
    expect(str.tostring(Infinity, 'volume')).toBe('NaNT');
    expect(str.tostring(-Infinity, 'mintick')).toBe('-Infinity');
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
    expect(str.tonumber('12abc')).toBeNull(); // PineScript: the whole text must be a number
    expect(str.tonumber('1.2.3')).toBeNull();
    expect(str.tonumber('abc123')).toBeNull();
  });

  it('should handle empty string', () => {
    expect(str.tonumber('')).toBeNull();
  });

  it('NaN, Infinity and other number forms are na (PineScript, #152)', () => {
    for (const text of ['NaN', 'Infinity', '-Infinity', '+Infinity', 'Inf', '0x10', '0x1p3', '1d', '1f', '1L',
      '1_000', '1,000', '1 000', '--5', '+ 5', '.', '+', '-', ' ']) {
      expect(str.tonumber(text)).toBeNull();
    }
  });

  it('scientific notation is na (PineScript, #152)', () => {
    for (const text of ['1e3', '1E3', '2.5e2', '1e-3', '1.5E+2', '0.1e1', '+.5e1', '1e400', '1e-400', '5e', 'e5']) {
      expect(str.tonumber(text)).toBeNull();
    }
  });

  it('only U+0000..U+0020 around the number are ignored (PineScript, #152)', () => {
    expect(str.tonumber('\t5')).toBe(5);
    expect(str.tonumber('5\n')).toBe(5);
    expect(str.tonumber('\u001f5')).toBe(5);
    expect(str.tonumber('  -12.25  ')).toBe(-12.25);
    for (const space of [' ', ' ', '　', '﻿']) {
      expect(str.tonumber(space + '5')).toBeNull();
    }
  });

  it('should handle decimal numbers', () => {
    expect(str.tonumber('0.5')).toBe(0.5);
    expect(str.tonumber('.5')).toBe(0.5);
    expect(str.tonumber('-.5')).toBe(-0.5);
    expect(str.tonumber('5.')).toBe(5);
    expect(str.tonumber('-5.')).toBe(-5);
    expect(str.tonumber('+5')).toBe(5);
    expect(str.tonumber('00012')).toBe(12);
    expect(str.tonumber('123456789012345678901234567890')).toBe(1.2345678901234568e29);
  });
});
