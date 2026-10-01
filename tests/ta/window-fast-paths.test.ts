/**
 * The one-pass ta.highest / lowest / highestbars / lowestbars, the sorted-window ta.median and the
 * allocation-free ta.correlation give the same numbers, bit for bit, as a direct scan of each window.
 */
import { taCore, time } from '../../src';

/** The window scan the one-pass functions replace: stops at the first na going back. */
function scan(source: number[], length: number, i: number): Array<[number, number]> {
  const w: Array<[number, number]> = [];
  for (let j = 0; j < length && i - j >= 0; j++) {
    const x = source[i - j]!;
    if (Number.isNaN(x)) break;
    w.push([x, -j]);
  }
  return w;
}
const refHighest = (s: number[], L: number) =>
  s.map((_, i) => (i < L - 1 ? NaN : ((w) => (w.length ? Math.max(...w.map((x) => x[0])) : NaN))(scan(s, L, i))));
const refLowest = (s: number[], L: number) =>
  s.map((_, i) => (i < L - 1 ? NaN : ((w) => (w.length ? Math.min(...w.map((x) => x[0])) : NaN))(scan(s, L, i))));
const refBars = (s: number[], L: number, lowest: boolean) =>
  s.map((_, i) => {
    if (i < L - 1) return NaN;
    const w = scan(s, L, i);
    if (!w.length) return 0;
    let best = w[0]!;
    for (const item of w) if (lowest ? item[0] <= best[0] : item[0] >= best[0]) best = item; // ties: the oldest
    return best[1];
  });
const refMedian = (s: number[], length: number) => {
  const L = Math.floor(length);
  return s.map((_, i) => {
    const v: number[] = [];
    for (let j = i; j >= 0 && v.length < L; j--) if (!Number.isNaN(s[j]!)) v.push(s[j]!);
    if (!(L >= 1) || v.length !== L) return NaN;
    v.sort((a, b) => a - b);
    const mid = Math.floor(L / 2);
    return L % 2 === 0 ? (v[mid - 1]! + v[mid]!) / 2 : v[mid]!;
  });
};

/** Deterministic data with na, ties, +0 / -0 and infinities. */
function data(n: number, seed: number): number[] {
  let a = seed;
  const r = () => ((a = (a * 48271) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => {
    const x = r();
    return x < 0.1 ? NaN : x < 0.2 ? 0 : x < 0.3 ? -0 : x < 0.32 ? Infinity : x < 0.34 ? -Infinity : Math.round(r() * 8) - 4;
  });
}

const bits = (values: number[]) => values.map((v) => (Object.is(v, -0) ? '-0' : String(v)));

describe('one-pass window functions match the window scan bit for bit', () => {
  const lengths = [1, 2, 2.5, 5, 14, 0.5, 0, -2, NaN, 600];
  for (const seed of [1, 7, 42]) {
    const s = data(500, seed);
    for (const L of lengths) {
      it(`seed ${seed}, length ${L}`, () => {
        expect(bits(taCore.highest(s, L))).toEqual(bits(refHighest(s, L)));
        expect(bits(taCore.lowest(s, L))).toEqual(bits(refLowest(s, L)));
        expect(bits(taCore.highestbars(s, L))).toEqual(bits(refBars(s, L, false)));
        expect(bits(taCore.lowestbars(s, L))).toEqual(bits(refBars(s, L, true)));
        expect(bits(taCore.median(s, L))).toEqual(bits(refMedian(s, L)));
      });
    }
  }

  it('highest prefers +0 and lowest -0, as Math.max / Math.min', () => {
    expect(bits(taCore.highest([-0, 0, -0], 3))).toEqual(['NaN', 'NaN', '0']);
    expect(bits(taCore.highest([-0, -0, -0], 3))).toEqual(['NaN', 'NaN', '-0']);
    expect(bits(taCore.lowest([0, -0, 0], 3))).toEqual(['NaN', 'NaN', '-0']);
  });

  it('correlation keeps the same values with na pairs and non-integer lengths', () => {
    const a = data(300, 3).map((v) => (Number.isFinite(v) || Number.isNaN(v) ? v : 1));
    const b = a.map((v, i) => (Number.isNaN(v) ? v : v * 0.5 + Math.sin(i)));
    const ref = (L: number) =>
      a.map((_, i) => {
        if (i < L - 1) return NaN;
        const p: Array<[number, number]> = [];
        for (let j = 0; j < L; j++) if (!isNaN(a[i - j]!) && !isNaN(b[i - j]!)) p.push([a[i - j]!, b[i - j]!]);
        if (!p.length) return NaN;
        let s1 = 0, s2 = 0;
        for (const [x, y] of p) { s1 += x; s2 += y; }
        const m1 = s1 / p.length, m2 = s2 / p.length;
        let num = 0, q1 = 0, q2 = 0;
        for (const [x, y] of p) { num += (x - m1) * (y - m2); q1 += (x - m1) ** 2; q2 += (y - m2) ** 2; }
        const den = Math.sqrt(q1 * q2);
        return den === 0 ? NaN : num / den;
      });
    for (const L of [2, 2.5, 10, 0, -1]) expect(bits(taCore.correlation(a, b, L))).toEqual(bits(ref(L)));
  });
});

describe('time zone offsets (cached per UTC hour)', () => {
  it.each(['America/New_York', 'Europe/Paris', 'Australia/Lord_Howe'])('%s around the daylight saving changes', (tz) => {
    // hour of each time straight from Intl
    const format = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: 'numeric' });
    const got: number[] = [];
    const want: number[] = [];
    // every 10 minutes over 2026, which crosses both changes of each zone
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 600_000) {
      got.push(time.hour(t, tz));
      want.push(Number(format.format(t)));
    }
    expect(got).toEqual(want);
  });
});
