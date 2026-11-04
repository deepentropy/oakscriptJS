/**
 * PineScript constant namespaces of the script API (shape.*, location.*, size.*, xloc.*, yloc.*, extend.*, display.*,
 * format.*, font.*, scale.*, order.*, currency.*, adjustment.*, label.style_*, line.style_*, dayofweek.*): the values
 * the functions take, usable where PineScript uses them.
 */
import {
  adjustment, box, close, currency, dayofweek, display, eachBar, executeScript, extend, font, format, high, indicator,
  label, line, location, order, plot, plotshape, scale, shape, size, str, table, xloc, yloc, position,
} from '../../src/script';
import { array } from '../../src';
import { syntheticBars, testChart } from '../../src/check/harness';

const BARS = syntheticBars(120);
const run = (body: () => void) => executeScript(body, BARS, {}, testChart(BARS));

describe('constant values', () => {
  it('are the strings of the functions', () => {
    expect(shape).toMatchObject({ triangleup: 'triangleup', labeldown: 'labeldown', xcross: 'xcross', diamond: 'diamond' });
    expect(Object.keys(shape)).toHaveLength(12);
    expect(location).toEqual({ abovebar: 'abovebar', belowbar: 'belowbar', top: 'top', bottom: 'bottom', absolute: 'absolute' });
    expect(Object.values(size)).toEqual(['auto', 'tiny', 'small', 'normal', 'large', 'huge']);
    expect(xloc).toEqual({ bar_index: 'bar_index', bar_time: 'bar_time' });
    expect(yloc).toEqual({ price: 'price', abovebar: 'abovebar', belowbar: 'belowbar' });
    expect(extend).toEqual({ none: 'none', left: 'left', right: 'right', both: 'both' });
    expect(display).toMatchObject({ none: 'none', all: 'all', data_window: 'data_window', status_line: 'status_line', pane: 'pane' });
    expect(format).toEqual({ inherit: 'inherit', price: 'price', volume: 'volume', percent: 'percent', mintick: 'mintick' });
    expect(font).toEqual({ family_default: 'default', family_monospace: 'monospace' });
    expect(scale).toEqual({ right: 'right', left: 'left', none: 'none' });
    expect(order).toEqual({ ascending: 'ascending', descending: 'descending' });
    expect(adjustment).toEqual({ none: 'none', splits: 'splits', dividends: 'dividends' });
    expect([currency.USD, currency.EUR, currency.BTC, currency.USDT, currency.NONE]).toEqual(['USD', 'EUR', 'BTC', 'USDT', 'NONE']);
    expect([label.style_label_down, label.style_none, label.style_text_outline]).toEqual(['label_down', 'none', 'text_outline']);
    expect([line.style_dashed, line.style_arrow_both]).toEqual(['dashed', 'arrow_both']);
    expect([dayofweek.sunday, dayofweek.monday, dayofweek.saturday]).toEqual([1, 2, 7]);
  });
});

describe('where PineScript uses them', () => {
  it('plotshape style / location / size', () => {
    const out = run(() => {
      indicator('S', { overlay: true });
      plotshape(close.gt(0), 'Up', { style: shape.triangleup, location: location.belowbar, size: size.small });
    });
    expect(out.shapeConfig[0]).toMatchObject({ style: 'triangleup', location: 'belowbar', size: 'small' });
  });

  it('label, line, box and table constants', () => {
    const out = run(() => {
      indicator('D', { overlay: true, scale: scale.left });
      eachBar((c) => {
        if (c.i !== c.n - 1) return;
        label.new(c.i, c.high, 'L', xloc.bar_index, yloc.abovebar, undefined, label.style_label_down, undefined, size.large);
        line.new(c.i - 10, c.close, c.i, c.close, xloc.bar_index, extend.right, undefined, line.style_dashed);
        box.new(c.i - 5, c.high, c.i, c.low, undefined, undefined, line.style_dotted);
        const t = table.new(position.top_right, 1, 1);
        table.cell(t, 0, 0, 'T', undefined, undefined, undefined, undefined, undefined, size.small, undefined, undefined, font.family_monospace);
      });
    });
    const r = out.result;
    expect(r.labels![0]).toMatchObject({ style: 'label_down', yloc: 'abovebar', size: 'large' });
    expect(r.lines![0]).toMatchObject({ extend: 'right', style: 'dashed' });
    expect(r.boxes![0]).toMatchObject({ borderStyle: 'dotted' });
    expect(out.metadata.scale).toBe('left');
  });

  it('dayofweek, order and format', () => {
    const monday = Date.UTC(2024, 0, 1);
    expect(dayofweek(monday, 'Etc/UTC')).toBe(dayofweek.monday);
    const a = array.from(3, 1, 2);
    array.sort(a, order.descending);
    expect([...a]).toEqual([3, 2, 1]);
    run(() => {
      indicator('F', { format: format.percent });
      expect(str.tostring(0.5, format.percent)).toBe(str.tostring(0.5, 'percent'));
      plot(high, 'H', { display: display.data_window });
    });
  });
});
