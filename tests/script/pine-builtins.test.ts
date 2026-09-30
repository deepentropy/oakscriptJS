/**
 * Script API: barstate.*, plotarrow(), input options, ta.mfi with the chart volume, color results in drawing options
 * (PineScript rules).
 */
import {
  executeScript,
  indicator,
  input,
  plot,
  fill,
  plotshape,
  plotarrow,
  barcolor,
  barstate,
  ta,
  color,
  close,
  open,
  hlc3,
  volume,
} from '../../src/script';
import * as taSeries from '../../src/ta-series';
import type { Bar } from '../../src/types';

const BARS: Bar[] = [100, 102, 101, 103, 105, 104].map((c, i) => ({
  time: 1_700_000_000 + i * 86_400,
  open: c - 1,
  high: c + 1,
  low: c - 2,
  close: c,
  volume: 1000 + i * 10,
}));

describe('barstate', () => {
  const flags = (chart = {}) => {
    const out: Record<string, number[]> = {};
    executeScript(() => {
      indicator('barstate');
      for (const k of ['isfirst', 'islast', 'ishistory', 'isrealtime', 'isnew', 'isconfirmed', 'islastconfirmedhistory'] as const) {
        out[k] = barstate[k].toArray();
      }
    }, BARS, {}, chart);
    return out;
  };

  it('calculation on history: the last bar is a history bar, not confirmed (PineScript)', () => {
    const f = flags();
    expect(f.isfirst).toEqual([1, 0, 0, 0, 0, 0]);
    expect(f.islast).toEqual([0, 0, 0, 0, 0, 1]);
    expect(f.ishistory).toEqual([1, 1, 1, 1, 1, 1]);
    expect(f.isrealtime).toEqual([0, 0, 0, 0, 0, 0]);
    expect(f.isnew).toEqual([1, 1, 1, 1, 1, 1]);
    expect(f.isconfirmed).toEqual([1, 1, 1, 1, 1, 0]);
    expect(f.islastconfirmedhistory).toEqual([0, 0, 0, 0, 1, 0]);
  });

  it('last bar confirmed by the host', () => {
    const f = flags({ lastBarConfirmed: true });
    expect(f.isconfirmed).toEqual([1, 1, 1, 1, 1, 1]);
    expect(f.islastconfirmedhistory).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it('realtime last bar (live updates), not the first update of the bar', () => {
    const f = flags({ realtime: true, lastBarNew: false });
    expect(f.isrealtime).toEqual([0, 0, 0, 0, 0, 1]);
    expect(f.ishistory).toEqual([1, 1, 1, 1, 1, 0]);
    expect(f.isnew).toEqual([1, 1, 1, 1, 1, 0]);
    expect(f.isconfirmed).toEqual([1, 1, 1, 1, 1, 0]);
    expect(f.islastconfirmedhistory).toEqual([0, 0, 0, 0, 1, 0]);
  });
});

describe('plotarrow', () => {
  it('up arrow for a positive value, down arrow for a negative value, nothing for 0 / na; PineScript defaults', () => {
    const run = executeScript(() => {
      indicator('arrows');
      plotarrow(close.sub(open).mul(close.gt(102)), 'Arrow');
      plotarrow(open.sub(close), 'Down', { colorup: '#2962FF', colordown: '#FF9800', minheight: 15, maxheight: 15 });
    }, BARS);
    expect(run.arrowConfig[0]).toEqual({
      id: 'arrow0', title: 'Arrow', colorup: '#00FF00', colordown: '#FF0000', minheight: 5, maxheight: 100,
      offset: undefined, display: undefined,
    });
    expect(run.arrowConfig[1]).toMatchObject({ colorup: '#2962FF', colordown: '#FF9800', minheight: 15, maxheight: 15 });
    const arrows = run.result.arrows!;
    // close - open = 1 on every bar; close > 102 on bars 3, 4, 5
    expect(arrows.filter((a) => a.id === 'arrow0')).toEqual(
      [3, 4, 5].map((i) => ({ time: BARS[i]!.time, id: 'arrow0', value: 1, color: '#00FF00' }))
    );
    expect(arrows.filter((a) => a.id === 'arrow1').map((a) => [a.value, a.color])).toEqual(
      BARS.map(() => [-1, '#FF9800'])
    );
  });
});

describe('input options', () => {
  it('group, inline, tooltip, confirm and display go to the input config', () => {
    const run = executeScript(() => {
      indicator('inputs');
      input.float(1, 'A', { minval: 0.1, step: 0.1, group: 'Config', inline: 'row1', tooltip: 'tip A', confirm: true, display: 'none' });
      input.int(2, 'B', { group: 'Config', inline: 'row1' });
      input.bool(true, 'C', { group: 'Other', tooltip: 'tip C', display: 'data_window' });
      input.string('x', 'D', { options: ['x', 'y'], group: 'Other' });
      input.source('close', 'E', { group: 'Other', inline: 'r2' });
      input.color('#F23645', 'F', { group: 'Other', inline: 'r2' });
      input.time(0, 'G', { group: 'Range' });
    }, BARS);
    expect(run.inputConfig.map(({ id, defval, ...rest }) => rest)).toEqual([
      { type: 'float', title: 'A', min: 0.1, max: undefined, step: 0.1, group: 'Config', inline: 'row1', tooltip: 'tip A', confirm: true, display: 'none' },
      { type: 'int', title: 'B', min: undefined, max: undefined, step: undefined, group: 'Config', inline: 'row1' },
      { type: 'bool', title: 'C', group: 'Other', tooltip: 'tip C', display: 'data_window' },
      { type: 'string', title: 'D', options: ['x', 'y'], group: 'Other' },
      { type: 'source', title: 'E', group: 'Other', inline: 'r2' },
      { type: 'color', title: 'F', group: 'Other', inline: 'r2' },
      { type: 'time', title: 'G', group: 'Range' },
    ]);
  });
});

describe('ta.mfi', () => {
  it('ta.mfi(source, length) uses the chart volume', () => {
    let mine: number[] = [];
    let explicit: number[] = [];
    executeScript(() => {
      indicator('mfi');
      mine = ta.mfi(hlc3, 3).toArray();
      explicit = taSeries.mfi(hlc3, 3, volume).toArray();
    }, BARS);
    expect(mine).toEqual(explicit);
    expect(mine.some((v) => !Number.isNaN(v))).toBe(true);
  });
});

describe('color results in drawing options', () => {
  it('color.new / color.rgb / color.from_gradient results are accepted as colors (type check)', () => {
    const run = executeScript(() => {
      indicator('colors');
      const p1 = plot(close, 'Close', { color: color.new(color.green, 70) });
      const p2 = plot(open, 'Open', { color: color.rgb(10, 20, 30) });
      fill(p1, p2, color.new(color.red, 90));
      plotshape(close.gt(open), 'Up', { color: color.new(color.blue, 0) });
      barcolor(color.from_gradient(1, 0, 2, color.red, color.green));
      input.color(color.new(color.red, 50), 'C');
    }, BARS);
    expect(run.plotConfig[0]!.color).toBe('rgba(76, 175, 80, 0.30000000000000004)');
  });
});
