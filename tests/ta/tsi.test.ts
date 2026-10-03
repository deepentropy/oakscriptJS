/**
 * ta.tsi as PineScript (#141): a value in [-1, 1], na on a zero denominator.
 * Expected values are PineScript outputs (full precision) for the same inputs.
 */
import { taCore } from '../../src';

// Daily BTCUSD closes, first 32 bars
const BTC_CLOSE = [
  10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92, 4.9,
  5.66, 5.66, 5.72, 5.72, 5.68, 6.05, 4.8, 4.92, 4.82, 4.82, 4.87,
];

describe('ta.tsi (#141)', () => {
  it('is in [-1, 1], not scaled by 100', () => {
    const tsi = taCore.tsi(BTC_CLOSE, 5, 24);
    expect(tsi.slice(0, 28).every(Number.isNaN)).toBe(true);
    expect(tsi.slice(28)).toEqual([-0.4469059325889009, -0.4538505248850615, -0.4583507557017383, -0.4566890248068452]);
  });

  it('is na when the denominator is 0 (constant source)', () => {
    expect(taCore.tsi(new Array<number>(40).fill(5), 5, 24).every(Number.isNaN)).toBe(true);
  });
});
