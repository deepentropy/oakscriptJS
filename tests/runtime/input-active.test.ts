/**
 * InputConfig.active (PineScript `active`) and isInputActive().
 */
import { isInputActive, executeScript, indicator, input, plot, close } from '../../src/script';
import type { InputConfig } from '../../src';
import { isInputActive as rootIsInputActive } from '../../src';

const cfg = (active?: InputConfig['active']): InputConfig => ({ id: 'x', type: 'int', defval: 1, active });

describe('isInputActive', () => {
  it('no active, or a boolean', () => {
    expect(isInputActive(cfg())).toBe(true);
    expect(isInputActive(cfg(true), {})).toBe(true);
    expect(isInputActive(cfg(false), { x: 5 })).toBe(false);
    expect(rootIsInputActive).toBe(isInputActive);
  });

  it('an input id: active when that bool input is true', () => {
    expect(isInputActive(cfg('showMa1'), { showMa1: true })).toBe(true);
    expect(isInputActive(cfg('showMa1'), { showMa1: false })).toBe(false);
    expect(isInputActive(cfg('showMa1'), { showMa1: 'true' })).toBe(false);
    expect(isInputActive(cfg('showMa1'), {})).toBe(false);
  });

  it('a missing value takes the default of the input configs', () => {
    const configs: InputConfig[] = [
      { id: 'showMa1', type: 'bool', defval: true },
      { id: 'maType', type: 'string', defval: 'None' },
    ];
    expect(isInputActive(cfg('showMa1'), {}, configs)).toBe(true);
    expect(isInputActive(cfg('showMa1'), { showMa1: false }, configs)).toBe(false);
    expect(isInputActive(cfg({ input: 'maType', ne: 'None' }), {}, configs)).toBe(false);
    expect(isInputActive(cfg({ input: 'maType', ne: 'None' }), { maType: 'SMA' }, configs)).toBe(true);
  });

  it('eq / ne compare the value of an input', () => {
    const bb = cfg({ input: 'maType', eq: 'SMA + Bollinger Bands' });
    expect(isInputActive(bb, { maType: 'SMA + Bollinger Bands' })).toBe(true);
    expect(isInputActive(bb, { maType: 'SMA' })).toBe(false);
    expect(isInputActive(cfg({ input: 'maType', ne: 'None' }), { maType: 'None' })).toBe(false);
    expect(isInputActive(cfg({ input: 'n', eq: 2 }), { n: 2 })).toBe(true);
    expect(isInputActive(cfg({ input: 'n', eq: 2 }), { n: '2' })).toBe(false);
    expect(isInputActive(cfg({ input: 'show' }), { show: true })).toBe(true);
    expect(isInputActive(cfg({ input: 'show' }), { show: false })).toBe(false);
  });

  it('not, any (or), all (and), nested', () => {
    expect(isInputActive(cfg({ not: 'autoTf' }), { autoTf: false })).toBe(true);
    expect(isInputActive(cfg({ not: 'autoTf' }), { autoTf: true })).toBe(false);
    const any = cfg({ any: ['showLabels', 'showPrices'] });
    expect(isInputActive(any, { showLabels: false, showPrices: true })).toBe(true);
    expect(isInputActive(any, { showLabels: false, showPrices: false })).toBe(false);
    const all = cfg({ all: ['show', { not: { input: 'maType', eq: 'None' } }] });
    expect(isInputActive(all, { show: true, maType: 'EMA' })).toBe(true);
    expect(isInputActive(all, { show: true, maType: 'None' })).toBe(false);
    expect(isInputActive(all, { show: false, maType: 'EMA' })).toBe(false);
    expect(isInputActive(cfg({ any: [] }))).toBe(false);
    expect(isInputActive(cfg({ all: [] }))).toBe(true);
  });
});

describe('input.*(..., { active })', () => {
  const BARS = [1, 2, 3].map((c, i) => ({ time: 86400 * (i + 1), open: c, high: c, low: c, close: c, volume: 1 }));
  const script = () => {
    indicator('ribbon');
    const show = input.bool(true, 'MA 1', { inline: 'MA 1' });
    const type = input.string('SMA', 'Type', { inline: 'MA 1', active: show, options: ['SMA', 'EMA'] });
    const length = input.int(20, 'Length', { inline: 'MA 1', active: 'ma_1' });
    input.float(2, 'Mult', { active: { input: 'type', eq: 'EMA' } });
    plot(close, `${type}${length}`);
    return length;
  };

  it('a boolean is the value for the current inputs; a condition is kept as data', () => {
    const run = executeScript(script, BARS);
    const byId = Object.fromEntries(run.inputConfig.map((c) => [c.id, c]));
    expect(Object.keys(byId)).toEqual(['ma_1', 'type', 'length', 'mult']);
    expect('active' in byId.ma_1).toBe(false);
    expect(byId.type.active).toBe(true);
    expect(byId.length.active).toBe('ma_1');
    expect(byId.mult.active).toEqual({ input: 'type', eq: 'EMA' });
    const inputs = run.defaultInputs;
    expect(run.inputConfig.map((c) => isInputActive(c, inputs))).toEqual([true, true, true, false]);
  });

  it('an inactive input keeps its value', () => {
    const run = executeScript(script, BARS, { ma_1: false, length: 50, type: 'EMA' });
    const byId = Object.fromEntries(run.inputConfig.map((c) => [c.id, c]));
    expect(byId.type.active).toBe(false);
    expect(run.inputConfig.map((c) => isInputActive(c, { ma_1: false, type: 'EMA' }, run.inputConfig))).toEqual([true, false, false, true]);
    expect(run.plotConfig[0].title).toBe('EMA50');
  });
});
