/**
 * Spec validation and JSON Schema, behaviour checks, scenarios, chart exports and assertCheck (oakscriptjs/check).
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { assertCheck, checkScript, specJsonSchema, syntheticBars, validateSpec } from '../../src/check';
import { main, readChecks, readReference } from '../../src/check/node';

const RSI = [
  'indicator("RSI", { overlay: false });',
  'const len = input.int(14, "Length");',
  'const r = ta.rsi(close, len);',
  'plot(r, "RSI");',
  'plotshape(ta.crossunder(r, 30), "Buy", { style: shape.triangleup, location: location.bottom });',
].join('\n');

const dir = mkdtempSync(join(tmpdir(), 'oakscript-spec-'));
const file = (name: string, text: string) => {
  const p = join(dir, name);
  writeFileSync(p, text);
  return p;
};

describe('spec validation', () => {
  it('unknown keys and wrong values are errors, with the closest key', () => {
    expect(validateSpec({ overlay: false, signal: { Buy: { max: 0 } }, inputs: { length: { default: 21 } }, plots: { RSI: { minimum: 50 } } })).toEqual([
      'spec: unknown key "signal" (did you mean "signals"?); the keys are kind, title, overlay, inputs, outputs, plots, signals, trades',
      'spec.inputs.length: unknown key "default" (did you mean "defval"?); the keys are type, defval, title, min, max, options',
      'spec.plots.RSI: unknown key "minimum" (did you mean "min"?); the keys are min, max, warmup',
    ]);
    expect(validateSpec({ kind: 'study', overlay: 'yes', outputs: [{ kind: 'plot' }, 3], trades: { min: 'one' } })).toEqual([
      'spec.kind: expected one of indicator, strategy, got "study"',
      'spec.overlay: expected a boolean, got "yes"',
      'spec.outputs[0]: "title" is required',
      'spec.outputs[1]: expected an object',
      'spec.trades.min: expected a number, got "one"',
    ]);
    expect(validateSpec({ reference: 'x.csv' })).toHaveLength(1);
    expect(validateSpec({ $schema: 's', reference: 'x.csv', export: 'e.csv', tolerance: 1e-6, checks: 'c.js', scenarios: true }, { file: true })).toEqual([]);
  });

  it('a misspelt spec fails the check instead of passing without checking', () => {
    const r = checkScript(RSI, { spec: { overlay: false, signal: { Buy: { max: 0 } } } as never });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.stage)).toEqual(['spec']);
    expect(r.errors[0]!.message).toMatch(/unknown key "signal" \(did you mean "signals"\?\)/);
  });

  it('the shipped JSON Schema is the schema of the validator', () => {
    const shipped = JSON.parse(readFileSync(join(__dirname, '../../skills/oakscript/spec.schema.json'), 'utf8'));
    expect(shipped).toEqual(specJsonSchema());
  });
});

describe('behaviour checks', () => {
  it('t.plot, t.signal, t.expect, t.everyBar', () => {
    const r = checkScript(RSI, {
      checks: (t) => {
        const rsi = t.plot('RSI');
        t.everyBar('RSI between 0 and 100', (i) => rsi.at(i) === null || (rsi.at(i)! >= 0 && rsi.at(i)! <= 100));
        t.expect('Buy only when the RSI is below 30', t.signal('Buy').bars.every((i) => rsi.at(i)! < 30));
        t.expect('Buy right after the RSI was at or above 30', t.signal('Buy').bars.every((i) => rsi.at(i - 1)! >= 30));
        t.expect('the length is 14', t.input('Length') === 14, t.input('Length'));
        t.everyBar('RSI above 50 (wrong on purpose)', (i) => rsi.at(i) === null || rsi.at(i)! > 50, { from: 14 });
      },
    });
    expect(r.spec!.items).toEqual([
      { check: 'RSI between 0 and 100', ok: true },
      { check: 'Buy only when the RSI is below 30', ok: true },
      { check: 'Buy right after the RSI was at or above 30', ok: true },
      { check: 'the length is 14', ok: true },
      { check: 'RSI above 50 (wrong on purpose)', ok: false, expected: 'true on every bar', actual: expect.stringMatching(/^false on bar \d+$/) },
    ]);
    expect(r.ok).toBe(false);
  });

  it('an unknown output or an exception is a failed item, and the spec items come first', () => {
    const r = checkScript(RSI, {
      spec: { overlay: false },
      checks: (t) => {
        t.plot('MACD');
      },
    });
    expect(r.spec!.items).toEqual([
      { check: 'overlay', ok: true, expected: false, actual: false },
      { check: 'checks (stopped)', ok: false, actual: 't.plot("MACD"): no plot with this id or title (plots: "RSI")' },
    ]);
  });

  it('a strategy: t.trades', () => {
    const src = readFileSync(join(__dirname, '../../skills/oakscript/examples/ma-cross-strategy.js'), 'utf8');
    const r = checkScript(src, {
      checks: (t) => {
        t.expect('some trades', t.trades.length > 5, t.trades.length);
        t.expect('entries at a bar open', t.trades.every((x) => x.entry_price === t.bars[x.entry_bar_index]!.open));
      },
    });
    expect(r.spec!.failed).toBe(0);
  });

  it('the checks example of the guide (reference/check.md) passes on the RSI script', () => {
    const md = readFileSync(join(__dirname, '../../skills/oakscript/reference/check.md'), 'utf8');
    const block = /```js\r?\n([\s\S]*?t\.plot\([\s\S]*?)```/.exec(md)![1]!;
    const r = checkScript(RSI, { checks: readChecks(file('guide-checks.js', block)) });
    expect(r.spec!.items.map((i) => [i.check, i.ok])).toEqual([
      ['RSI between 0 and 100', true],
      ['Buy only when the RSI is below 30', true],
      ['Buy right after the RSI was at or above 30', true],
    ]);
  });

  it('a checks file: the body of a function of t, errors with their line', () => {
    const ok = file('checks.js', 'const rsi = t.plot("RSI");\nt.everyBar("RSI <= 100", (i) => rsi.at(i) === null || rsi.at(i) <= 100);\n');
    expect(checkScript(RSI, { checks: readChecks(ok) }).spec!.items).toEqual([{ check: 'RSI <= 100', ok: true }]);
    const bad = file('bad-checks.js', '\nconst x = t.plot("RSI");\nx.nope();\n');
    const item = checkScript(RSI, { checks: readChecks(bad) }).spec!.items[0]!;
    expect(item.ok).toBe(false);
    expect(String(item.actual)).toMatch(/x\.nope is not a function \(.*bad-checks\.js:3:3\)/);
  });
});

describe('scenarios', () => {
  it('runs on the edge-case bars; their errors fail, their new warnings are listed', () => {
    const src = 'indicator("E");\nplot(ta.sma(close, 50), "SMA");\nplot(close.sub(low).div(high.sub(low)), "Pos");\n' +
      'eachBar((c) => { if (c.close === c.open && c.high === c.low && c.i === 100) throw new Error("flat bar"); });';
    const r = checkScript(src, { scenarios: true });
    expect(r.scenarios!.map((s) => s.name)).toEqual(['short', 'daily', 'minute', 'flat', 'no-volume', 'gap']);
    const short = r.scenarios!.find((s) => s.name === 'short')!;
    expect(short.warnings.map((w) => `${w.code}:${w.target}`)).toEqual(['empty-plot:SMA']);
    const flat = r.scenarios!.find((s) => s.name === 'flat')!;
    expect(flat.errors).toEqual([{ stage: 'run', message: 'flat bar' }]);
    expect(r.errors).toEqual([{ stage: 'scenario', message: '[flat: 200 bars with the same price and no volume (zero ranges)] flat bar' }]);
    expect(r.ok).toBe(false);
  });

  it('the examples pass every scenario', () => {
    for (const f of ['ma-cross.js', 'macd-oscillator.js', 'mtf-trend-filter.js', 'ma-cross-strategy.js']) {
      const r = checkScript(readFileSync(join(__dirname, '../../skills/oakscript/examples', f), 'utf8'), { scenarios: true, inputSweep: false });
      expect({ f, errors: r.errors }).toEqual({ f, errors: [] });
    }
  });
});

describe('chart export', () => {
  const bars = syntheticBars(40, 86400);
  const sma = (i: number) => (i < 1 ? null : (bars[i]!.close + bars[i - 1]!.close) / 2);
  const csv =
    'time,open,high,low,close,Volume,SMA,Other indicator\n' +
    bars.map((b, i) => `${b.time},${b.open},${b.high},${b.low},${b.close},${b.volume},${sma(i) ?? 'NaN'},1`).join('\n');
  const exportFile = file('export.csv', csv);
  const script = file('sma.js', 'indicator("S", { overlay: true });\nplot(ta.sma(close, 2), "SMA");\n');

  it('the bar columns are not expected values', () => {
    expect(Object.keys(readReference(exportFile).columns)).toEqual(['SMA', 'Other indicator']);
  });

  it('--export: the bars and the expected values of one file; other columns are ignored', () => {
    let out = '';
    const code = main([script, '--no-types', '--no-sweep', '--export', exportFile, '--json'], (t) => (out += t));
    const report = JSON.parse(out);
    expect(report.bars).toMatchObject({ count: 40, timeframe: 'D', synthetic: false });
    expect(report.reference).toEqual([
      { column: 'SMA', output: 'SMA', equal: 40, total: 40 },
      { column: 'Other indicator', ignored: true, equal: 0, total: 0 },
    ]);
    expect(code).toBe(0);
  });
});

describe('spec files', () => {
  it('keys of the file (checks, scenarios) are read; an unknown key fails with the file name', () => {
    const script = file('rsi.js', RSI);
    file('rsi-checks.js', 't.expect("a Buy", t.signal("Buy").bars.length > 0);\n');
    const spec = file('rsi-spec.json', JSON.stringify({ $schema: '../spec.schema.json', overlay: false, checks: 'rsi-checks.js', scenarios: true }));
    let out = '';
    const code = main([script, '--no-types', '--no-sweep', '--spec', spec], (t) => (out += t));
    expect(out).toContain('spec and checks: 2 passed, 0 failed');
    expect(out).toContain('scenarios:');
    expect(code).toBe(0);
    const bad = file('bad-spec.json', JSON.stringify({ overlay: false, scenario: true }));
    out = '';
    expect(main([script, '--no-types', '--no-sweep', '--spec', bad], (t) => (out += t))).toBe(1);
    expect(out).toMatch(/\[spec\] .*bad-spec\.json: spec: unknown key "scenario" \(did you mean "scenarios"\?\)/);
  });
});

describe('assertCheck', () => {
  it('throws the report when the check fails, passes otherwise', () => {
    expect(() => assertCheck(checkScript(RSI, { spec: { overlay: false } }))).not.toThrow();
    expect(() => assertCheck(checkScript(RSI, { spec: { overlay: true } }))).toThrow(/FAIL overlay: expected true, got false/);
    const warn = checkScript('indicator("W");\nconst n = input.int(5, "Unused");\nplot(close, "C");');
    expect(() => assertCheck(warn)).not.toThrow();
    expect(() => assertCheck(warn, { warnings: false })).toThrow(/\[unused-input\]/);
  });
});
