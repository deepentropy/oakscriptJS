/**
 * str.tostring without a format rounds the digits of the JVM conversion of the double to 10 decimals (#171, #174);
 * with a format, its shortest decimal form. Each expected text is the PineScript result of the same call.
 */
import { str } from '../../src';

describe('str.tostring without a format (#171)', () => {
  it('doubles whose shortest form ends on a 5 at the 11th decimal', () => {
    // the exact values are below the half: 82325.10000000004947..., 12.34500000004999975...
    expect(str.tostring(82325.10000000005)).toBe('82325.1');
    expect(str.tostring(12.34500000005)).toBe('12.345');
    expect(str.tostring(100.25000000005)).toBe('100.25');
    expect(str.tostring(333.30000000005)).toBe('333.3');
    expect(str.tostring(-82325.10000000005)).toBe('-82325.1');
    expect(str.tostring(-12.34500000005)).toBe('-12.345');
    expect(str.tostring(5.00000000015)).toBe('5.0000000002'); // 5.00000000015000001...
    expect(str.tostring(0.30000000005)).toBe('0.3');
    expect(str.tostring(123456.70000000006)).toBe('123456.7000000001');
    expect(str.tostring(1234567.6500000001)).toBe('1234567.6500000001');
    expect(str.tostring(0.000012345000000049999)).toBe('0.000012345');
    expect(str.tostring(1.005)).toBe('1.005');
  });

  it('with a format the shortest form is rounded, also with 10 decimals', () => {
    expect(str.tostring(82325.10000000005, '#.##########')).toBe('82325.1000000001');
    expect(str.tostring(12.34500000005, '#.##########')).toBe('12.3450000001');
    expect(str.tostring(82325.10000000005, '0.0000000000')).toBe('82325.1000000001');
    expect(str.tostring(12.34500000005, '#.###########')).toBe('12.34500000005');
    expect(str.tostring(12.34500000005, '#.#########')).toBe('12.345');
    expect(str.tostring(1.005, '#.##')).toBe('1.01');
    expect(str.tostring(82325.105, '#.##')).toBe('82325.11');
    expect(str.tostring(1234567.6500000001, '#.#')).toBe('1234567.7');
  });

  it('an array gives "[a, b]", each element as a single value', () => {
    expect(str.tostring([12.34500000005, 82325.10000000005] as never)).toBe('[12.345, 82325.1]');
  });
});

describe('str.tostring without a format: digits of the JVM conversion (#174)', () => {
  it('keeps the converted digits when they have 10 decimals or fewer', () => {
    expect(str.tostring(1791662400001 / 900000)).toBe('1990736.000001111'); // exact: 1990736.00000111110...
    expect(str.tostring(5518517496.109107)).toBe('5518517496.109107');
    expect(str.tostring(60835336144.4038)).toBe('60835336144.4038');
    expect(str.tostring(-153708643068230.62)).toBe('-153708643068230.62');
    expect(str.tostring(4503599627370495.5)).toBe('4503599627370495.5');
    expect(str.tostring(1000000000000000.2)).toBe('1000000000000000.2');
    expect(str.tostring([1791662400001 / 900000, 82325.10000000005] as never)).toBe('[1990736.000001111, 82325.1]');
  });

  it('a large integer shows all the digits of the conversion, not the shortest ones', () => {
    expect(str.tostring(78195689105219552)).toBe('78195689105219552');
    expect(str.tostring(33333333333333330000)).toBe('33333333333333330000');
  });

  it('rounds half to even, a tie on the last converted digit decided by the conversion', () => {
    expect(str.tostring(69229.46608415335)).toBe('69229.4660841533');
    expect(str.tostring(-223961.36860950865)).toBe('-223961.3686095086');
    expect(str.tostring(86103.29048430405)).toBe('86103.290484304');
    expect(str.tostring(336789.38455142925)).toBe('336789.3845514292');
    expect(str.tostring(1 / 2048)).toBe('0.0004882812'); // exact tie 0.00048828125
    expect(str.tostring(3 / 2048)).toBe('0.0014648438');
    expect(str.tostring(1 + 1 / 2048)).toBe('1.0004882812');
    expect(str.tostring(5e-11)).toBe('0');
    expect(str.tostring(1.5e-10)).toBe('0.0000000001');
    expect(str.tostring(1.00000000005)).toBe('1.0000000001');
    expect(str.tostring(1 / 3)).toBe('0.3333333333');
    expect(str.tostring(0.1 + 0.2)).toBe('0.3');
  });
});
