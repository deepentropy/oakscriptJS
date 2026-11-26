/**
 * #212: options on int and float inputs, enums (defineEnum) and input.enum.
 */
import { defineEnum, executeScript, input, str } from '../../src/script';
import type { Bar } from '../../src/types';

const bars: Bar[] = [{ time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 }];

describe('options on int and float inputs', () => {
  it('are declared and the value stays a number', () => {
    let n = 0;
    let f = 0;
    const r = executeScript(() => {
      n = input.int(20, 'Length', { options: [10, 20, 50] });
      f = input.float(1.5, 'Mult', { options: [1, 1.5, 2] });
    }, bars, { length: 50 });
    expect(n).toBe(50);
    expect(f).toBe(1.5);
    expect(r.inputConfig.map((c) => [c.type, c.options])).toEqual([['int', [10, 20, 50]], ['float', [1, 1.5, 2]]]);
  });
});

describe('enums and input.enum', () => {
  const MaType = defineEnum({ sma: 'Simple', ema: 'Exponential', wma: '' });

  it('fields have a name and a title (the name when the title is empty), String() is the title', () => {
    expect(MaType.sma.name).toBe('sma');
    expect(MaType.sma.title).toBe('Simple');
    expect(MaType.wma.title).toBe('wma');
    expect(String(MaType.ema)).toBe('Exponential');
    expect(str.tostring(MaType.ema)).toBe('Exponential');
    expect(Object.isFrozen(MaType)).toBe(true);
  });

  it('declares the field names and titles, returns the chosen field', () => {
    let t: unknown;
    const r = executeScript(() => { t = input.enum(MaType.sma, 'Average'); }, bars);
    expect(t).toBe(MaType.sma);
    expect(r.inputConfig[0]).toMatchObject({
      id: 'average',
      type: 'enum',
      defval: 'sma',
      options: ['sma', 'ema', 'wma'],
      optionsTitles: { sma: 'Simple', ema: 'Exponential', wma: 'wma' },
    });
    executeScript(() => { t = input.enum(MaType.sma, 'Average'); }, bars, { average: 'ema' });
    expect(t).toBe(MaType.ema);
    // a value that is not one of the options: the default
    executeScript(() => { t = input.enum(MaType.sma, 'Average', { options: [MaType.sma, MaType.ema] }); }, bars, { average: 'wma' });
    expect(t).toBe(MaType.sma);
  });

  it('takes named arguments and the common options', () => {
    const r = executeScript(() => { input.enum({ defval: MaType.ema, title: 'Type', group: 'MA', options: [MaType.ema, MaType.sma] }); }, bars);
    expect(r.inputConfig[0]).toMatchObject({ defval: 'ema', options: ['ema', 'sma'], group: 'MA' });
  });

  it('throws on a default that is not an enum field, or options of another enum', () => {
    const Other = defineEnum({ a: 'A' });
    expect(() => executeScript(() => { input.enum('sma' as never, 'X'); }, bars)).toThrow(/defineEnum/);
    expect(() => executeScript(() => { input.enum(MaType.sma, 'X', { options: [Other.a] }); }, bars)).toThrow(/fields of the enum of the default/);
    expect(() => executeScript(() => { input.enum(MaType.sma, 'X', { options: [MaType.ema] }); }, bars)).toThrow(/one of the options/);
    expect(() => defineEnum({} as never)).toThrow(/names and titles/);
  });
});
