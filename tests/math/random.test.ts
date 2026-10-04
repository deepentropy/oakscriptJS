/**
 * math.random with a seed: PineScript's sequence (java.util.Random nextDouble), one number per call.
 */
import { math, callsite } from '../../src';

describe('math.random with a seed', () => {
  it('follows java.util.Random(seed).nextDouble()', () => {
    math.resetRandom();
    expect([0, 1, 2].map(() => math.random(0, 1, 42))).toEqual([0.7275636800328681, 0.6832234717598454, 0.30871945533265976]);
    // measured: on NASDAQ:AAPL 60, bar 0 of the loaded bars is draw 18,628 of seed 42 (0.27269755782616356)
    const gen = math.seededRandom(42);
    for (let k = 0; k < 18628; k++) gen();
    expect(gen(0, 1)).toBe(0.27269755782616356);
  });

  it('two call sites with the same seed give the same sequence (callsite.random)', () => {
    const a = callsite.random(7);
    const b = callsite.random(7);
    const xa = [a(0, 100), a(0, 100)];
    expect([b(0, 100), b(0, 100)]).toEqual(xa);
  });
});
