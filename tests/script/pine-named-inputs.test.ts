/**
 * PineScript named arguments of input.* and request.security / request.security_lower_tf: the options object in the
 * title's place, every argument by name, and unknown names that throw with the closest names (both seen from agents
 * writing scripts: `input.int(9, { title, min })` and `request.security(..., { lookahead })`).
 */
import { barmerge, close, executeScript, high, indicator, input, low, plot, request } from '../../src/script';
import { syntheticBars, testChart } from '../../src/check/harness';

const BARS = syntheticBars(400);
const run = (body: () => void, inputs: Record<string, unknown> = {}) => executeScript(body, BARS, inputs, testChart(BARS));
const configs = (body: () => void) => run(() => { indicator('I'); body(); }).inputConfig;

describe('input named arguments', () => {
  it('(defval, title, options), (defval, { title, ...options }) and every argument by name are the same input', () => {
    const want = { id: 'fast_length', type: 'int', defval: 9, title: 'Fast length', min: 1, max: 50 };
    expect(configs(() => input.int(9, 'Fast length', { minval: 1, maxval: 50 }))[0]).toMatchObject(want);
    expect(configs(() => input.int(9, { title: 'Fast length', minval: 1, maxval: 50 }))[0]).toMatchObject(want);
    expect(configs(() => input.int({ defval: 9, title: 'Fast length', minval: 1, maxval: 50 }))[0]).toMatchObject(want);
  });

  it('every input kind', () => {
    const c = configs(() => {
      input.float(2.5, { title: 'Mult', step: 0.1 });
      input.bool({ defval: true, title: 'Show' });
      input.string('EMA', { title: 'Type', options: ['SMA', 'EMA'] });
      input.color('#FF0000', { title: 'Colour', group: 'Style' });
      input.source(close, { title: 'Source' });
      input.timeframe('D', { title: 'TF' });
      input.price({ defval: 100, title: 'Level' });
    });
    expect(c.map((x) => [x.id, x.type, x.defval])).toEqual([
      ['mult', 'float', 2.5],
      ['show', 'bool', true],
      ['type', 'string', 'EMA'],
      ['colour', 'color', '#FF0000'],
      ['source', 'source', 'close'],
      ['tf', 'timeframe', 'D'],
      ['level', 'float', 100],
    ]);
    expect(c[2]!.options).toEqual(['SMA', 'EMA']);
    expect(c[3]!.group).toBe('Style');
  });

  it('the value of a named input comes from the host by id', () => {
    const out = run(() => {
      indicator('V');
      plot(close.mul(input.int(9, { title: 'Factor' })), 'P');
    }, { factor: 2 });
    expect(out.result.plots.plot0![0]!.value).toBe(BARS[0]!.close * 2);
  });

  it('an unknown name throws with the Pine name (the agent wrote min for minval)', () => {
    expect(() => configs(() => input.int(9, { title: 'Fast', min: 1 } as never))).toThrow(
      /input\.int\(\): unknown argument "min"\. Did you mean minval\b/
    );
    expect(() => configs(() => input.string('A', 'T', { choices: ['A'] } as never))).toThrow(/unknown argument "choices"/);
    expect(() => configs(() => input.int(9, 5 as never))).toThrow(/input\.int\(\): the title is a string, got number/);
  });
});

describe('request.security named arguments', () => {
  it('{ lookahead } is the 5th argument, as in Pine (it was ignored)', () => {
    run(() => {
      indicator('S', { overlay: true });
      const positional = request.security('', 'W', () => high.offset(1), barmerge.gaps_off, barmerge.lookahead_on);
      const named = request.security('', 'W', () => high.offset(1), { lookahead: barmerge.lookahead_on });
      const all = request.security({ symbol: '', timeframe: 'W', expression: () => high.offset(1), lookahead: barmerge.lookahead_on });
      const off = request.security('', 'W', () => high.offset(1));
      expect(named.toArray()).toEqual(positional.toArray());
      expect(all.toArray()).toEqual(positional.toArray());
      expect(named.toArray()).not.toEqual(off.toArray());
    });
  });

  it('tuples, gaps, and errors for unknown or unsupported arguments', () => {
    run(() => {
      indicator('S');
      const [h, l] = request.security('', 'D', () => [high, low], { gaps: barmerge.gaps_on });
      expect(h.toArray().filter((v) => !Number.isNaN(v)).length).toBeLessThan(BARS.length);
      expect(l.toArray()).toHaveLength(BARS.length);
      expect(() => request.security('', 'D', () => close, { lookahed: barmerge.lookahead_on } as never)).toThrow(
        /request\.security\(\): unknown argument "lookahed"\. Did you mean lookahead\b/
      );
      expect(() => request.security('', 'D', () => close, barmerge.gaps_off, { lookahead: barmerge.lookahead_on } as never)).not.toThrow();
      expect(() => request.security('', 'D', () => close, { currency: 'EUR' })).toThrow(/currency argument .* is not supported/);
      expect(() => request.security('', 'D', () => close, { calc_bars_count: 100 })).toThrow(/calc_bars_count argument is not supported/);
      expect(() => request.security('', 'D', () => close, barmerge.gaps_off, barmerge.lookahead_on, { gaps: barmerge.gaps_on } as never)).toThrow(
        /"gaps" is given twice/
      );
    });
  });

  it('request.security_lower_tf takes its named arguments', () => {
    const lower = syntheticBars(400 * 4, 900);
    const out = executeScript(
      () => {
        indicator('L');
        const a = request.security_lower_tf('', '15', () => close, { ignore_invalid_symbol: true });
        const b = request.security_lower_tf('', '15', () => close);
        expect(a).toEqual(b);
        expect(() => request.security_lower_tf('', '15', () => close, { ignore_invalid_timeframe: true })).toThrow(/not supported/);
      },
      BARS,
      {},
      { ...testChart(BARS), bars: (_s, tf) => (tf === '15' ? lower : []) }
    );
    expect(out.metadata.title).toBe('L');
  });
});
