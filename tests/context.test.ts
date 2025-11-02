import { createContext } from '../src/context';
import { Source } from '../src/types';

describe('createContext', () => {
  const high: Source = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const low: Source = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const close: Source = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  describe('ta.supertrend with context', () => {
    it('should work with implicit chart data', () => {
      const { ta } = createContext({
        chart: { high, low, close, open: close, volume: close }
      });

      const [supertrend, direction] = ta.supertrend(3, 5);

      expect(supertrend).toBeDefined();
      expect(direction).toBeDefined();
      expect(supertrend.length).toBe(10);
      expect(direction.length).toBe(10);
    });

    it('should throw error when chart context is missing', () => {
      const { ta } = createContext({});

      expect(() => ta.supertrend(3, 5)).toThrow('Chart context required');
    });

    it('should work with wicks parameter', () => {
      const { ta } = createContext({
        chart: { high, low, close, open: close, volume: close }
      });

      const [st1, dir1] = ta.supertrend(3, 5, false);
      const [st2, dir2] = ta.supertrend(3, 5, true);

      expect(st1).toBeDefined();
      expect(st2).toBeDefined();
      // Results may differ based on wicks parameter
    });
  });

  describe('ta.atr with context', () => {
    it('should work with implicit chart data', () => {
      const { ta } = createContext({
        chart: { high, low, close, open: close, volume: close }
      });

      const atr14 = ta.atr(5);

      expect(atr14).toBeDefined();
      expect(atr14.length).toBe(10);
      expect(atr14.every(v => typeof v === 'number')).toBe(true);
    });

    it('should throw error when chart context is missing', () => {
      const { ta } = createContext({});

      expect(() => ta.atr(14)).toThrow('Chart context required');
    });
  });

  describe('ta.tr with context', () => {
    it('should work with implicit chart data', () => {
      const { ta } = createContext({
        chart: { high, low, close, open: close, volume: close }
      });

      const trueRange = ta.tr();

      expect(trueRange).toBeDefined();
      expect(trueRange.length).toBe(10);
      expect(trueRange.every(v => typeof v === 'number')).toBe(true);
    });

    it('should throw error when chart context is missing', () => {
      const { ta } = createContext({});

      expect(() => ta.tr()).toThrow('Chart context required');
    });
  });

  describe('pass-through functions', () => {
    it('should work without chart context for sma', () => {
      const { ta } = createContext({});

      const sma5 = ta.sma(close, 5);

      expect(sma5).toBeDefined();
      expect(sma5.length).toBe(10);
    });

    it('should work without chart context for ema', () => {
      const { ta } = createContext({});

      const ema5 = ta.ema(close, 5);

      expect(ema5).toBeDefined();
      expect(ema5.length).toBe(10);
    });

    it('should work without chart context for rsi', () => {
      const { ta } = createContext({});

      const rsi14 = ta.rsi(close, 14);

      expect(rsi14).toBeDefined();
      expect(rsi14.length).toBe(10);
    });
  });

  describe('multiple contexts', () => {
    it('should support multiple independent contexts', () => {
      const high1: Source = [10, 11, 12, 13, 14];
      const low1: Source = [8, 9, 10, 11, 12];
      const close1: Source = [9, 10, 11, 12, 13];

      const high2: Source = [20, 21, 22, 23, 24];
      const low2: Source = [18, 19, 20, 21, 22];
      const close2: Source = [19, 20, 21, 22, 23];

      const ctx1 = createContext({
        chart: { high: high1, low: low1, close: close1 }
      });

      const ctx2 = createContext({
        chart: { high: high2, low: low2, close: close2 }
      });

      const [st1] = ctx1.ta.supertrend(3, 3);
      const [st2] = ctx2.ta.supertrend(3, 3);

      expect(st1).toBeDefined();
      expect(st2).toBeDefined();
      expect(st1.length).toBe(5);
      expect(st2.length).toBe(5);
      // Results should differ because data is different
      expect(st1).not.toEqual(st2);
    });
  });

  describe('other namespaces', () => {
    it('should pass through math functions unchanged', () => {
      const { math } = createContext({});

      expect(math.abs(-5)).toBe(5);
      expect(math.max(1, 2, 3)).toBe(3);
      expect(math.round(4.567, 2)).toBeCloseTo(4.57, 10);
    });

    it('should pass through str functions unchanged', () => {
      const { str } = createContext({});

      expect(str.length('hello')).toBe(5);
      expect(str.upper('hello')).toBe('HELLO');
      expect(str.contains('hello', 'ell')).toBe(true);
    });

    it('should pass through color functions unchanged', () => {
      const { color } = createContext({});

      const red = color.rgb(255, 0, 0);
      expect(red).toContain('255');
      expect(red).toContain('0');
    });
  });

  describe('destructuring usage', () => {
    it('should allow clean destructuring syntax', () => {
      // This is the recommended usage pattern
      const { ta, math, str } = createContext({
        chart: { high, low, close }
      });

      // Now use functions directly without prefix
      const [supertrend, direction] = ta.supertrend(3, 5);
      const atr14 = ta.atr(5);
      const sma20 = ta.sma(close, 5);
      const rounded = math.round(4.567, 2);
      const upper = str.upper('test');

      expect(supertrend).toBeDefined();
      expect(atr14).toBeDefined();
      expect(sma20).toBeDefined();
      expect(rounded).toBeCloseTo(4.57, 10);
      expect(upper).toBe('TEST');
    });
  });
});
