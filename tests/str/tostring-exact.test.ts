/**
 * str.tostring without a format rounds the exact value of the double; with a format, its shortest decimal form
 * (#171). Each expected text is the PineScript result of the same call.
 */
import { str } from '../../src';

describe('str.tostring without a format rounds the exact value (#171)', () => {
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
