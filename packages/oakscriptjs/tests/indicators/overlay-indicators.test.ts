/**
 * Integration test for overlay indicators (SMA, DEMA, etc.) to verify they return plot data
 */

import * as sma from '../../../../indicators/sma/sma';
import * as dema from '../../../../indicators/dema/dema';
import * as momentum from '../../../../indicators/momentum/momentum';
import * as bop from '../../../../indicators/bop/bop';

describe('Overlay Indicators Integration Test', () => {
  // Create test bars
  const bars = Array.from({ length: 100 }, (_, i) => ({
    time: 1609459200 + i * 86400,
    open: 100 + i * 0.5,
    high: 110 + i * 0.5,
    low: 90 + i * 0.5,
    close: 100 + i * 0.5,
    volume: 1000000
  }));

  describe('SMA (overlay indicator)', () => {
    it('should return plot0 with data', () => {
      const result = sma.Moving_Average_Simple(bars, { len: 9, src: 'close' });
      
      expect(result.metadata.overlay).toBe(true);
      expect(result.plots.plot0).toBeDefined();
      expect(result.plots.plot0).toHaveLength(bars.length);
      
      // Count non-NaN values
      const nonNanCount = result.plots.plot0.filter((p: any) => !Number.isNaN(p.value)).length;
      expect(nonNanCount).toBeGreaterThan(0);
      
      // Check structure of plot data
      expect(result.plots.plot0[0]).toHaveProperty('time');
      expect(result.plots.plot0[0]).toHaveProperty('value');
    });
  });

  describe('DEMA (overlay indicator)', () => {
    it('should return plot0 with data', () => {
      const result = dema.Double_EMA(bars, { len: 9, src: 'close' });
      
      expect(result.metadata.overlay).toBe(true);
      expect(result.plots.plot0).toBeDefined();
      expect(result.plots.plot0).toHaveLength(bars.length);
      
      // Count non-NaN values
      const nonNanCount = result.plots.plot0.filter((p: any) => !Number.isNaN(p.value)).length;
      expect(nonNanCount).toBeGreaterThan(0);
    });
  });

  describe('Momentum (non-overlay indicator)', () => {
    it('should return plot0 with data (regression test)', () => {
      const result = momentum.Momentum(bars, { len: 10, src: 'close' });
      
      expect(result.metadata.overlay).toBe(false);
      expect(result.plots.plot0).toBeDefined();
      expect(result.plots.plot0).toHaveLength(bars.length);
      
      // Count non-NaN values
      const nonNanCount = result.plots.plot0.filter((p: any) => !Number.isNaN(p.value)).length;
      expect(nonNanCount).toBeGreaterThan(0);
    });
  });

  describe('BOP (non-overlay indicator)', () => {
    it('should return plot0 with data (regression test)', () => {
      const result = bop.Balance_of_Power(bars);
      
      expect(result.metadata.overlay).toBe(false);
      expect(result.plots.plot0).toBeDefined();
      expect(result.plots.plot0).toHaveLength(bars.length);
      
      // Count non-NaN values  
      const nonNanCount = result.plots.plot0.filter((p: any) => !Number.isNaN(p.value)).length;
      expect(nonNanCount).toBeGreaterThan(0);
    });
  });
});
