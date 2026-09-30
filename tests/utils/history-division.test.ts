/**
 * at(): PineScript history reference on arrays; div(): PineScript division.
 */
import { at, div, getSource } from '../../src';

describe('at', () => {
  const x = [10, 20, 30];
  it('x[offset] at bar i, na before the first bar', () => {
    expect([at(x, 2), at(x, 2, 1), at(x, 2, 2)]).toEqual([30, 20, 10]);
    expect(Number.isNaN(at(x, 1, 2))).toBe(true);
  });
  it('a negative offset throws (it would read a later bar)', () => {
    expect(() => at(x, 0, -1)).toThrow(RangeError);
  });
});

describe('div', () => {
  it('a / 0 is na', () => {
    expect(Number.isNaN(div(1, 0))).toBe(true);
    expect(Number.isNaN(div(0, 0))).toBe(true);
    expect(div(3, 2)).toBe(1.5);
  });
});

describe('getSource', () => {
  it('a price source by name, as an array', () => {
    const bars = [{ time: 1, open: 1, high: 4, low: 2, close: 3, volume: 0 }];
    expect(getSource(bars, 'hlc3')).toEqual([3]);
    expect(getSource(bars, 'hlcc4')).toEqual([3]);
  });
});
