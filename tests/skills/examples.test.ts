/**
 * The agent guide (skills/oakscript) is checked by CI: every example script compiles and runs on synthetic bars
 * with sane outputs, and every ```js block of the guide is valid code (blocks that declare indicator() or
 * strategy() are complete scripts and run too).
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { compileScript, runScript, syntheticBars } from './harness';

const SKILL = join(__dirname, '../../skills/oakscript');
const EXAMPLES = join(SKILL, 'examples');
const BARS = syntheticBars(1500);

const read = (file: string): string => readFileSync(file, 'utf8');
const example = (name: string): string => read(join(EXAMPLES, name));

/** Every plot has values on most bars, all finite. */
function expectSanePlots(plots: Record<string, Array<{ value: number }>>, minLength: number): void {
  for (const data of Object.values(plots)) {
    expect(data.length).toBeGreaterThanOrEqual(minLength);
    expect(data.every((p) => Number.isFinite(p.value))).toBe(true);
  }
}

describe('skills/oakscript examples', () => {
  const files = readdirSync(EXAMPLES).filter((f) => f.endsWith('.js'));

  it('has the examples the guide links to', () => {
    expect(files.sort()).toEqual(['ma-cross-strategy.js', 'ma-cross.js', 'macd-oscillator.js', 'mtf-trend-filter.js']);
    const skill = read(join(SKILL, 'SKILL.md'));
    for (const f of files) expect(skill).toContain(`examples/${f}`);
  });

  it.each(files)('%s runs on zero bars (the declaration run of a host)', (file) => {
    const { run } = runScript(example(file), []);
    expect(run.metadata.title).not.toBe('Untitled');
    expect(run.plotConfig.length).toBeGreaterThan(0);
  });

  it('ma-cross.js', () => {
    const { run } = runScript(example('ma-cross.js'), BARS);
    expect(run.metadata).toMatchObject({ title: 'MA Cross', overlay: true });
    expect(run.inputConfig.map((i) => i.id)).toEqual(['source', 'fast_length', 'slow_length', 'ma_type']);
    expect(run.plotConfig).toHaveLength(2);
    expectSanePlots(run.result.plots, BARS.length - 30);
    expect(run.result.fills).toHaveLength(1);
    const markers = run.result.markers ?? [];
    expect(markers.some((m) => m.shape === 'triangleUp')).toBe(true);
    expect(markers.some((m) => m.shape === 'triangleDown')).toBe(true);
    expect(run.alertConfig).toHaveLength(2);
    // an input override changes the run
    const sma = runScript(example('ma-cross.js'), BARS, { ma_type: 'SMA', slow_length: 50 }).run;
    expect(sma.result.plots.plot1!.length).toBe(BARS.length - 49);
  });

  it('macd-oscillator.js', () => {
    const { run } = runScript(example('macd-oscillator.js'), BARS);
    expect(run.metadata).toMatchObject({ title: 'MACD Oscillator', overlay: false });
    expect(run.plotConfig.map((p) => p.title)).toEqual(['Histogram', 'MACD', 'Signal']);
    expect(run.plotConfig[0]!.style).toBe('columns');
    expect(run.hlineConfig).toHaveLength(1);
    expectSanePlots(run.result.plots, BARS.length - 40);
    const colors = new Set(run.result.plots.plot0!.map((p) => (p as { color?: string }).color));
    expect(colors).toEqual(new Set(['#26A69A', '#B2DFDB', '#FF5252', '#FFCDD2']));
    expect(run.result.bgColors?.length).toBeGreaterThan(0);
  });

  it('mtf-trend-filter.js', () => {
    const { run } = runScript(example('mtf-trend-filter.js'), BARS);
    expect(run.metadata).toMatchObject({ title: 'MTF Trend Filter', overlay: true });
    expect(run.plotConfig).toHaveLength(2);
    // the daily EMA needs 20 days of hourly bars before it has a value
    expectSanePlots(run.result.plots, BARS.length - 24 * 21);
    const markers = run.result.markers ?? [];
    expect(markers.filter((m) => m.shape === 'labelUp').length).toBeGreaterThan(0);
    expect(markers.filter((m) => m.shape === 'labelDown').length).toBeGreaterThan(0);
    expect(run.result.labels).toHaveLength(1);
    expect(run.result.labels![0]!.text).toMatch(/^(Uptrend|Downtrend) D$/);
  });

  it('ma-cross-strategy.js', () => {
    const { run, engine } = runScript(example('ma-cross-strategy.js'), BARS);
    expect(run.metadata).toMatchObject({ title: 'MA Cross Strategy', overlay: true });
    expect(run.strategyConfig).toMatchObject({
      initial_capital: 10000,
      default_qty_type: 'percent_of_equity',
      default_qty_value: 50,
      commission_value: 0.05,
    });
    expectSanePlots(run.result.plots, BARS.length - 30);
    const trades = engine!.closed;
    expect(trades.length).toBeGreaterThan(5);
    expect(trades.some((t) => t.size > 0)).toBe(true);
    expect(trades.some((t) => t.size < 0)).toBe(true);
    expect(trades.some((t) => t.exit_id === 'Long exit' || t.exit_id === 'Short exit')).toBe(true);
    expect(trades.every((t) => Number.isFinite(t.profit))).toBe(true);
    const table = run.result.tables![0]!;
    expect(table.cells.find((c) => c.column === 1 && c.row === 1)?.text).toBe(String(trades.length));
  });
});

/** The ```js blocks of the guide's markdown files. */
function codeBlocks(): Array<{ file: string; line: number; code: string }> {
  const out: Array<{ file: string; line: number; code: string }> = [];
  const files = ['SKILL.md', ...readdirSync(join(SKILL, 'reference')).map((f) => `reference/${f}`)];
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    const lines = read(join(SKILL, file)).split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.trim() !== '```js') continue;
      const start = i + 1;
      while (i + 1 < lines.length && lines[i + 1]!.trim() !== '```') i++;
      out.push({ file, line: start, code: lines.slice(start, i + 1).join('\n') });
      i++;
    }
  }
  return out;
}

describe('skills/oakscript code blocks', () => {
  const blocks = codeBlocks();

  it('the guide has code blocks', () => {
    expect(blocks.length).toBeGreaterThan(10);
  });

  it.each(blocks.map((b) => [`${b.file}:${b.line}`, b] as const))('%s', (_name, block) => {
    expect(() => compileScript(block.code)).not.toThrow();
    if (/^(indicator|strategy)\(/m.test(block.code)) {
      const { run } = runScript(block.code, BARS);
      // every plot has values: a plot that is NaN on every bar is a silent mistake
      for (const [id, data] of Object.entries(run.result.plots)) expect([id, data.length > BARS.length / 2]).toEqual([id, true]);
    }
  });
});
