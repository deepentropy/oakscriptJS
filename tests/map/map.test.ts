import { map } from '../../src';

// Each case follows the PineScript map behaviour.

describe('map', () => {
  it('put returns the previous value or na; get returns na for a missing key', () => {
    const m = map.new_map<string, number>();
    expect(map.put(m, 'a', 1)).toBeUndefined();
    expect(map.put(m, 'a', 2)).toBe(1);
    expect(map.get(m, 'a')).toBe(2);
    expect(map.get(m, 'x')).toBeUndefined();
  });

  it('remove returns the removed value or na', () => {
    const m = map.new_map<string, number>();
    map.put(m, 'a', 1);
    expect(map.remove(m, 'a')).toBe(1);
    expect(map.remove(m, 'a')).toBeUndefined();
    expect(map.size(m)).toBe(0);
  });

  it('keeps insertion order: a re-put key keeps its place, a removed and re-added key moves to the end', () => {
    const m = map.new_map<string, number>();
    map.put(m, 'a', 1);
    map.put(m, 'b', 2);
    map.put(m, 'c', 3);
    map.put(m, 'a', 10);
    expect([map.keys(m), map.values(m)]).toEqual([['a', 'b', 'c'], [10, 2, 3]]);

    map.remove(m, 'a');
    map.put(m, 'a', 4);
    expect([map.keys(m), map.values(m)]).toEqual([['b', 'c', 'a'], [2, 3, 4]]);
  });

  it('keeps insertion order for number and bool keys (no sorting)', () => {
    const m = map.new_map<number, string>();
    map.put(m, 3, 'x');
    map.put(m, 1, 'y');
    map.put(m, 2, 'z');
    expect(map.keys(m)).toEqual([3, 1, 2]);

    const b = map.new_map<boolean, number>();
    map.put(b, true, 1);
    map.put(b, false, 0);
    map.put(b, true, 2);
    expect([map.keys(b), map.values(b)]).toEqual([[true, false], [2, 0]]);
  });

  it('put_all overwrites existing keys in place and appends new ones', () => {
    const m1 = map.new_map<string, number>();
    map.put(m1, 'a', 1);
    map.put(m1, 'b', 2);
    const m2 = map.new_map<string, number>();
    map.put(m2, 'c', 30);
    map.put(m2, 'b', 20);
    map.put_all(m1, m2);
    expect([map.keys(m1), map.values(m1), map.size(m2)]).toEqual([['a', 'b', 'c'], [1, 20, 30], 2]);
  });

  it('copy is independent of the original', () => {
    const m = map.new_map<string, number>();
    map.put(m, 'a', 1);
    const c = map.copy(m);
    map.put(c, 'b', 2);
    map.put(m, 'a', 5);
    expect([map.keys(m), map.keys(c), map.get(c, 'a')]).toEqual([['a'], ['a', 'b'], 1]);
  });

  it('clear, contains (also for an na value, case-sensitive string keys)', () => {
    const m = map.new_map<string, number>();
    map.put(m, 'a', NaN);
    expect(map.contains(m, 'a')).toBe(true);
    expect(map.contains(m, 'A')).toBe(false);
    expect(map.get(m, 'a')).toBeNaN();
    map.clear(m);
    expect([map.size(m), map.contains(m, 'a')]).toEqual([0, false]);
  });

  it('compares float keys exactly', () => {
    const m = map.new_map<number, number>();
    map.put(m, 1.0, 1);
    map.put(m, 1.0 + 1e-12, 2);
    map.put(m, 1.0 + 1e-6, 3);
    expect(map.size(m)).toBe(3);
    expect(map.contains(m, 1.0 + 1e-10)).toBe(false);
  });

  it('holds at most 50,000 pairs', () => {
    const m = map.new_map<number, number>();
    for (let i = 0; i < 50000; i++) map.put(m, i, i);
    expect(map.size(m)).toBe(50000);
    expect(map.put(m, 0, -1)).toBe(0); // an existing key is still accepted
    expect(() => map.put(m, 50000, 50000)).toThrow(RangeError);

    const extra = map.new_map<number, number>();
    map.put(extra, 50000, 1);
    expect(() => map.put_all(m, extra)).toThrow(RangeError);
    expect(map.size(m)).toBe(50000);
  });
});
