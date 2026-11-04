/**
 * The `oakscript check` command (src/check/node.ts): file lines, time limit, files of bars / references / specs, type
 * check, text output and exit codes.
 */
import { mkdtempSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { checkFile, exitCode, main, readBars, readReference, typecheckFile, withTimeLimit } from '../../src/check/node';
import { checkScript } from '../../src/check';

const dir = mkdtempSync(join(tmpdir(), 'oakscript-check-'));
const file = (name: string, text: string) => {
  const p = join(dir, name);
  writeFileSync(p, text);
  return p;
};
const repo = resolve(__dirname, '../..');
/** The type check resolves oakscriptjs/script/globals from the built package (npm run build). */
const built = existsSync(join(repo, 'dist/cjs/script/globals.d.ts'));

describe('checkFile', () => {
  it('runtime and syntax errors come with the line and column of the file', () => {
    const ops = file('ops.js', 'indicator("Ops");\nconst len = input.int(14, "Length");\nconst body = close - open;\nplot(body, "Body");\n');
    const r = checkFile(ops, { types: false });
    expect(r.errors).toEqual([expect.objectContaining({ stage: 'declaration', line: 3, column: 20 })]);
    const first = checkFile(file('first.js', 'plot(close - open);'), { types: false });
    // the column of the `-` operator, as for line 3 (the "use strict" prefix of line 1 is taken off)
    expect(first.errors[0]).toMatchObject({ line: 1, column: 12 });
    const syn = checkFile(file('syn.js', 'indicator("S");\n\nconst a = ;\n'), { types: false });
    expect(syn.errors).toEqual([expect.objectContaining({ stage: 'syntax', line: 3 })]);
  });

  it('a run that takes too long is stopped, and the next runs work', () => {
    const loop = file('loop.js', 'indicator("L");\nwhile (true) {}\n');
    expect(checkFile(loop, { types: false, timeout: 300 }).errors).toEqual([
      { stage: 'timeout', message: 'Script execution timed out after 300ms' },
    ]);
    const swept = checkScript(
      'indicator("T");\nconst len = input.int(14, "Length");\neachBar((c) => { if (len !== 14) { while (true) {} } return c.close; });\nplot(ta.sma(close, len), "S");',
      { run: withTimeLimit(300) }
    );
    expect(swept.warnings.map((w) => w.code)).toEqual(['input-error']);
    const after = checkScript('indicator("A");\nplot(ta.sma(close, 5), "S");');
    expect(after.ok).toBe(true);
    expect(after.plots[0]!.values).toBe(1496);
  });

  (built ? it : it.skip)('type errors of the file, with their code', () => {
    const ops = file('typed.js', 'indicator("T");\nconst a = close - open;\nplot(ta.smaa(close, 5), "S");\n');
    const r = typecheckFile(ops, repo);
    expect('errors' in r && r.errors.map((e) => `${e.line}:${e.code}`)).toEqual(['2:TS2362', '2:TS2363', '3:TS2551']);
    const full = checkFile(ops, { cwd: repo });
    expect(full.errors.filter((e) => e.stage === 'types')).toHaveLength(3);
    expect(full.ok).toBe(false);
  });

  it('the type check is skipped without typescript / oakscriptjs in the folder', () => {
    const r = typecheckFile(file('x.js', 'indicator("X");'), tmpdir());
    expect(r).toEqual({ skipped: expect.stringMatching(/typescript is not installed|oakscriptjs\/script\/globals is not found/) });
  });
});

describe('files', () => {
  it('bars from CSV (seconds, milliseconds or dates) and JSON, sorted', () => {
    const csv = file('bars.csv', 'Date,Open,High,Low,Close,Volume\n2024-01-03,3,4,2,3.5,30\n2024-01-02,2,3,1,2.5,20\n');
    expect(readBars(csv)).toEqual([
      { time: 1704153600, open: 2, high: 3, low: 1, close: 2.5, volume: 20 },
      { time: 1704240000, open: 3, high: 4, low: 2, close: 3.5, volume: 30 },
    ]);
    const ms = file('ms.csv', 'time,open,high,low,close\n1704153600000,1,2,0.5,1.5\n');
    expect(readBars(ms)[0]).toMatchObject({ time: 1704153600, volume: NaN });
    const json = file('bars.json', JSON.stringify([{ time: 1704153600, open: 1, high: 2, low: 0, close: 1, volume: 5 }]));
    expect(readBars(json)).toEqual([{ time: 1704153600, open: 1, high: 2, low: 0, close: 1, volume: 5 }]);
    expect(() => readBars(file('bad.csv', 'time,close\n1,2\n'))).toThrow(/the columns time, open, high, low, close are needed/);
  });

  it('a reference CSV', () => {
    const ref = readReference(file('ref.csv', 'time,SMA,Signal\n100,1.5,na\n200,,2\n'), 1e-6);
    expect(ref).toEqual({ times: [100, 200], columns: { SMA: [1.5, null], Signal: [null, 2] }, tolerance: 1e-6 });
  });
});

describe('main', () => {
  const run = (args: string[]) => {
    let out = '';
    const code = main(args, (t) => (out += t));
    return { code, out };
  };
  const good = file('good.js', 'indicator("Good", { overlay: true });\nconst len = input.int(20, "Length");\nplot(ta.sma(close, len), "SMA");\n');

  it('a clean script: the report and exit code 0', () => {
    const { code, out } = run(['check', good, '--no-types']);
    expect(code).toBe(0);
    expect(out).toContain('indicator "Good" (overlay)');
    expect(out).toContain('length (int) = 20  "Length"');
    expect(out).toMatch(/plot {3}"SMA": 1481 values from bar 19/);
    expect(out).toMatch(/result: OK$/);
  });

  it('warnings only: exit code 2; a failed spec item: exit code 1', () => {
    const warn = file('warn.js', 'indicator("W");\nconst n = input.int(5, "Unused");\nplot(close, "C");\n');
    expect(run([warn, '--no-types']).code).toBe(2);
    const spec = file('spec.json', JSON.stringify({ overlay: false, inputs: { length: { defval: 14 } } }));
    const { code, out } = run([good, '--no-types', '--spec', spec]);
    expect(code).toBe(1);
    expect(out).toContain('spec and checks: 0 passed, 2 failed');
    expect(out).toContain('FAIL input "length" defval: expected 14, got 20');
  });

  it('a reference given in the spec, relative to the spec file', () => {
    const csv = file('daily.csv', 'time,open,high,low,close\n' + [1, 2, 3, 4].map((d) => `${d * 86400},${d},${d + 1},${d - 1},${d}`).join('\n'));
    const ref = file('expected.csv', 'time,SMA\n86400,na\n172800,1.5\n259200,2.5\n345600,3.5\n');
    const script = file('sma2.js', 'indicator("S");\nplot(ta.sma(close, 2), "SMA");\n');
    const spec = file('ref-spec.json', JSON.stringify({ reference: 'expected.csv' }));
    const { code, out } = run([script, '--no-types', '--no-sweep', '--bars', csv, '--spec', spec, '--json']);
    const report = JSON.parse(out);
    expect(report.bars).toMatchObject({ count: 4, timeframe: 'D', synthetic: false });
    expect(report.reference).toEqual([{ column: 'SMA', output: 'SMA', equal: 4, total: 4 }]);
    expect(code).toBe(0);
    expect(ref).toBeTruthy();
  });

  it('usage and argument errors', () => {
    expect(run([]).code).toBe(1);
    expect(run(['--help'])).toMatchObject({ code: 0, out: expect.stringContaining('Usage: oakscript check') });
    expect(run([good, '--nope'])).toMatchObject({ code: 1, out: expect.stringContaining('Unknown option --nope') });
    expect(run([join(dir, 'missing.js')])).toMatchObject({ code: 1, out: expect.stringContaining('No file') });
  });

  it('exitCode', () => {
    expect(exitCode({ ok: true, warnings: [] } as never)).toBe(0);
    expect(exitCode({ ok: true, warnings: [{}] } as never)).toBe(2);
    expect(exitCode({ ok: false, warnings: [] } as never)).toBe(1);
  });
});
