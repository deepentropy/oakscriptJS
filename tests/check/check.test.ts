/**
 * checkScript (oakscriptjs/check): the report of a script, its warnings for the mistakes that give no error, the spec
 * and reference checks, and the harness helpers.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  checkScript,
  compileScript,
  inferTimeframe,
  rewriteImports,
  runScript,
  syntheticBars,
  timeframeSeconds,
  formatReport,
  type CheckReport,
} from '../../src/check';

const EXAMPLES = join(__dirname, '../../skills/oakscript/examples');
const codes = (r: CheckReport) => r.warnings.map((w) => `${w.code}:${w.target ?? ''}`);

describe('the examples of the agent guide', () => {
  it.each(readdirSync(EXAMPLES).filter((f) => f.endsWith('.js')))('%s checks clean', (file) => {
    const r = checkScript(readFileSync(join(EXAMPLES, file), 'utf8'));
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.plots.every((p) => p.values > 0)).toBe(true);
  });

  it('the strategy example reports its trades', () => {
    const r = checkScript(readFileSync(join(EXAMPLES, 'ma-cross-strategy.js'), 'utf8'));
    expect(r.declaration?.kind).toBe('strategy');
    expect(r.strategy!.closedTrades).toBeGreaterThan(5);
    expect(r.strategy!.first[0]!.entryBar).toBeGreaterThan(0);
  });
});

describe('report', () => {
  const source = [
    'indicator("Report", { overlay: false });',
    'const len = input.int(14, "Length", { minval: 2 });',
    'const mode = input.string("A", "Mode", { options: ["A", "B"] });',
    'const r = ta.rsi(close, len);',
    'plot(mode === "A" ? r : r.mul(2), "RSI");',
    'plotshape(ta.crossover(r, 70), "Over");',
    'hline(70, "Upper");',
    'alertcondition(ta.crossunder(r, 30), "Under");',
  ].join('\n');
  const r = checkScript(source);

  it('declarations', () => {
    expect(r.declaration).toEqual({
      kind: 'indicator',
      title: 'Report',
      overlay: false,
      inputs: [
        { id: 'length', type: 'int', defval: 14, title: 'Length', min: 2 },
        { id: 'mode', type: 'string', defval: 'A', title: 'Mode', options: ['A', 'B'] },
      ],
      outputs: [
        { kind: 'plot', id: 'plot0', title: 'RSI' },
        { kind: 'shape', id: 'shape0', title: 'Over' },
      ],
    });
  });

  it('plots and signals', () => {
    expect(r.bars).toMatchObject({ count: 1500, timeframe: '60', synthetic: true });
    const p = r.plots[0]!;
    expect(p).toMatchObject({ id: 'plot0', title: 'RSI', firstBar: 14, values: 1486, colours: 0 });
    expect(p.min!).toBeGreaterThan(0);
    expect(p.max!).toBeLessThan(100);
    expect(p.last).toHaveLength(5);
    const over = r.signals.find((s) => s.title === 'Over')!;
    expect(over.kind).toBe('shape');
    expect(over.count).toBeGreaterThan(0);
    expect(over.share).toBeCloseTo(over.count / 1500, 12);
    expect(r.signals.find((s) => s.title === 'Under')!.kind).toBe('alertcondition');
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([]);
  });
});

describe('warnings', () => {
  it.each([
    ['empty-plot', 'indicator("W");\nplot(close.div(close.sub(close)), "Empty");', 'empty-plot:Empty'],
    ['constant-plot', 'indicator("W");\nplot(close.mul(0).add(5), "Five");', 'constant-plot:Five'],
    ['late-start', 'indicator("W");\nplot(ta.sma(close, 1000), "Slow");', 'late-start:Slow'],
    ['signal-never', 'indicator("W");\nplot(close, "C");\nplotshape(close.gt(1e9), "Never");', 'signal-never:Never'],
    ['signal-everywhere', 'indicator("W");\nplot(close, "C");\nplotshape(ta.rsi(close, 14), "Always");', 'signal-everywhere:Always'],
    ['one-colour', 'indicator("W");\nplot(close, "C", { color: color.when(close.gt(0), color.red, color.blue) });', 'one-colour:C'],
    ['unused-input', 'indicator("W");\nconst n = input.int(5, "Unused");\nplot(close, "C");', 'unused-input:Unused'],
    ['input-error', 'indicator("W");\nconst n = input.int(5, "Len", { maxval: 5 });\nplot(ta.sma(close, n - 4), "S");', 'input-error:Len'],
    ['no-output', 'indicator("W");\nconst x = ta.sma(close, 5);', 'no-output:'],
    ['no-trades', 'strategy("W");\nstrategy.eachBar(() => {});', 'no-trades:'],
  ])('%s', (_, source, code) => {
    const r = checkScript(source);
    expect(r.errors).toEqual([]);
    expect(codes(r)).toContain(code);
  });

  it('an input that is used is not reported', () => {
    const r = checkScript('indicator("W");\nconst n = input.int(5, "Len");\nconst on = input.bool(true, "Show");\nplot(on ? ta.sma(close, n) : close, "S");');
    expect(codes(r)).toEqual([]);
  });

  it('inputSweep: false skips the reruns', () => {
    expect(codes(checkScript('indicator("W");\nconst n = input.int(5, "Unused");\nplot(close, "C");', { inputSweep: false }))).toEqual([]);
  });
});

describe('errors', () => {
  it('syntax', () => {
    const r = checkScript('indicator("E");\nconst a = ;');
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([{ stage: 'syntax', message: "SyntaxError: Unexpected token ';'" }]);
    expect(r.declaration).toBeUndefined();
  });

  it('a top-level error is a declaration error, a bar-loop error a run error', () => {
    expect(checkScript('indicator("E");\nplot(close - open);').errors[0]).toMatchObject({ stage: 'declaration', message: expect.stringMatching(/^TypeError: JavaScript operators/) });
    const run = checkScript('indicator("E");\nplot(eachBar((c) => { if (c.i === 10) throw new Error("bar 10"); return c.close; }), "C");');
    expect(run.errors).toEqual([{ stage: 'run', message: 'bar 10' }]);
    expect(run.declaration?.title).toBe('E');
  });

  it('the spec is still checked on a failed run', () => {
    const r = checkScript('indicator("E");\nplot(close - open);', { spec: { title: 'E' } });
    expect(r.spec?.items).toEqual([{ check: 'title', ok: false, expected: 'E', actual: undefined }]);
  });
});

describe('spec', () => {
  const source = [
    'indicator("Spec", { overlay: true });',
    'const fast = input.int(9, "Fast length");',
    'const slow = input.int(21, "Slow length");',
    'const f = ta.ema(close, fast), s = ta.ema(close, slow);',
    'plot(f, "Fast");',
    'plot(s, "Slow");',
    'plotshape(ta.crossover(f, s), "Buy");',
    'hline(100, "Level");',
  ].join('\n');

  it('passes when the script follows it', () => {
    const r = checkScript(source, {
      spec: {
        kind: 'indicator',
        title: 'Spec',
        overlay: true,
        inputs: { fast_length: { type: 'int', defval: 9 }, 'Slow length': { defval: 21 } },
        outputs: ['Fast', { title: 'Slow', kind: 'plot' }, { title: 'Level', kind: 'hline' }, 'Buy'],
        plots: { Fast: { min: 50, max: 200, warmup: 10 } },
        signals: { Buy: { min: 1, maxShare: 0.05 } },
      },
    });
    expect(r.spec!.items.filter((i) => !i.ok)).toEqual([]);
    expect(r.spec!.passed).toBe(15);
    expect(r.ok).toBe(true);
  });

  it('lists what differs', () => {
    const r = checkScript(source, {
      spec: {
        kind: 'strategy',
        overlay: false,
        inputs: { fast_length: { defval: 12 }, signal_length: {} },
        outputs: ['Signal', { title: 'Fast', kind: 'shape' }],
        plots: { Fast: { warmup: 2 }, Histogram: {} },
        signals: { Buy: { max: 0 }, Sell: {} },
        trades: { min: 1 },
      },
    });
    expect(r.ok).toBe(false);
    expect(r.spec!.items.filter((i) => !i.ok).map((i) => i.check)).toEqual([
      'kind',
      'overlay',
      'input "fast_length" defval',
      'input "signal_length" exists',
      'output "Signal" exists',
      'output "Fast" (shape) exists',
      'plot "Fast" first value',
      'plot "Histogram" exists',
      'signal "Buy" count',
      'signal "Sell" exists',
      'trades',
    ]);
    expect(r.spec!.items.find((i) => i.check === 'input "fast_length" defval')).toMatchObject({ expected: 12, actual: 9 });
  });
});

describe('reference', () => {
  const bars = syntheticBars(300);
  const source = 'indicator("R");\nplot(ta.sma(close, 3), "SMA");';
  const sma = runScript(source, bars).run.result.plots.plot0!;
  const values = bars.map((b) => sma.find((p) => p.time === b.time)?.value ?? null);
  const times = bars.map((b) => b.time);

  it('equal values pass, by title or id', () => {
    const r = checkScript(source, { bars, reference: { times, columns: { SMA: values, plot0: values } } });
    expect(r.reference).toEqual([
      { column: 'SMA', output: 'SMA', equal: 300, total: 300 },
      { column: 'plot0', output: 'SMA', equal: 300, total: 300 },
    ]);
    expect(r.ok).toBe(true);
  });

  it('a difference fails with its first bar; an unknown column fails', () => {
    const changed = values.map((v, i) => (i === 120 && v !== null ? v * (1 + 1e-9) : v));
    const r = checkScript(source, { bars, reference: { times, columns: { SMA: changed, Other: values } } });
    expect(r.reference![0]).toMatchObject({ equal: 299, total: 300, firstMismatch: { bar: 120, expected: changed[120], actual: values[120] } });
    expect(r.reference![1]).toEqual({ column: 'Other', equal: 0, total: 300 });
    expect(r.ok).toBe(false);
    expect(checkScript(source, { bars, reference: { times, columns: { SMA: changed }, tolerance: 1e-8 } }).ok).toBe(true);
  });
});

describe('harness', () => {
  it('rewriteImports keeps the lines and only takes oakscriptjs', () => {
    const src = 'import { array, callsite as cs } from "oakscriptjs";\nimport {\n  matrix,\n} from \'oakscriptjs\';\nindicator("I");';
    const out = rewriteImports(src);
    expect(out.split('\n')).toHaveLength(src.split('\n').length);
    expect(out).toContain('const { array, callsite: cs } = __oakscriptjs;');
    expect(() => rewriteImports('import fs from "fs";\nimport { x } from "lodash";')).toThrow(/only import from "oakscriptjs" \(found "lodash"\)/);
    const r = checkScript('import { array } from "oakscriptjs";\nindicator("I");\nconst a = array.from(1, 2, 3);\nplot(close.mul(array.sum(a)), "C");');
    expect(r.errors).toEqual([]);
    expect(r.plots[0]!.values).toBe(1500);
  });

  it('a script can declare the name of a global, as in an app', () => {
    const r = checkScript('indicator("G");\nconst size = 2;\nconst color = "#FF0000";\nplot(close.mul(size), "C", { color });');
    expect(r.errors).toEqual([]);
    expect(r.plots[0]!.values).toBe(1500);
  });

  it('compileScript throws a SyntaxError', () => {
    expect(() => compileScript('const = 1;')).toThrow(SyntaxError);
  });

  it('timeframes', () => {
    expect([timeframeSeconds('1'), timeframeSeconds('60'), timeframeSeconds('D'), timeframeSeconds('1W'), timeframeSeconds('30S')]).toEqual([
      60, 3600, 86400, 604800, 30,
    ]);
    expect(timeframeSeconds('x')).toBeNaN();
    expect(inferTimeframe(syntheticBars(50))).toBe('60');
    expect(inferTimeframe(syntheticBars(50, 86400))).toBe('D');
    expect(inferTimeframe(syntheticBars(50, 300))).toBe('5');
    expect(checkScript('indicator("D");\nplot(close, "C");', { bars: syntheticBars(100, 86400) }).bars.timeframe).toBe('D');
  });

  it('a higher timeframe of real-looking daily bars is resampled from the chart bars', () => {
    const r = checkScript('indicator("H");\nplot(request.security("", "W", () => close), "W close");', { bars: syntheticBars(200, 86400) });
    expect(r.errors).toEqual([]);
    expect(r.plots[0]!.values).toBeGreaterThan(190);
  });
});

describe('checkScript: live updates (#196)', () => {
  it('a script with its state in persist() is resumed; one with a let outside its callback runs in full', () => {
    const resumed = checkScript('indicator("P");\nconst n = persist(0);\nplot(eachBar((c) => (c.close > c.open ? ++n.value : n.value)), "N");');
    expect(resumed.liveUpdates).toEqual({ resumed: true, reason: null });
    const full = checkScript('indicator("L");\nlet n = 0;\nplot(eachBar((c) => (c.close > c.open ? ++n : n)), "N");');
    expect(full.liveUpdates).toEqual({ resumed: false, reason: 'eachBar() callback changes n outside it (use persist())' });
    expect(full.warnings.length).toBe(0);
    expect(formatReport(full)).toContain('live updates: full runs');
  });
});
