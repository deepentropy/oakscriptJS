/**
 * ta.stoch as PineScript (#145): an na input or a zero range keeps the previous result.
 * Expected values are PineScript outputs (full precision) for the same inputs.
 */
import { taCore } from '../../src';

const na = NaN;
const toNum = (a: Array<number | null>): number[] => a.map((v) => (v === null ? NaN : v));
// Daily BTCUSD, first 12 bars
const CLOSE = [10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8];
const HIGH = [10.9, 11.85, 11.7, 11.7, 11.7, 11.5, 10, 8, 8.31, 8.88, 8.89, 8];
const LOW = [10.9, 11.15, 11.7, 11.7, 11.7, 10.5, 10, 8, 5.25, 8, 8.89, 8];

describe('ta.stoch (#145)', () => {
  it('a zero range gives the previous result; na before a first value', () => {
    const v = [5, 5, 5, 5, 5, 11, 12, 13, 7, 7, 7, 7];
    expect(taCore.stoch(v, v, v, 3)).toEqual([na, na, na, na, na, 100, 100, 100, 0, 0, 0, 0]);
  });

  it('an na source gives the previous result', () => {
    const source = CLOSE.map((c, i) => (i % 7 === 3 ? NaN : c));
    expect(taCore.stoch(source, HIGH, LOW, 3)).toEqual(toNum([
      null, null, 84.21052631578942, 84.21052631578942, 84.21052631578942, 0, 0, 0, 62.5263157894737, 100, 100, 0,
    ]));
  });

  it('an na highest (na high in the window) gives the previous result', () => {
    const high = HIGH.map((h, i) => (i % 11 === 5 ? NaN : h));
    expect(taCore.stoch(CLOSE, high, LOW, 3)).toEqual(toNum([
      null, null, 84.21052631578942, 78.5714285714285, 78.5714285714285, 78.5714285714285, 78.5714285714285, 0,
      62.5263157894737, 100, 100, 0,
    ]));
  });
});
