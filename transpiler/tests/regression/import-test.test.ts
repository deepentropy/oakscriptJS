/**
 * Test taCore import
 */

import { describe, it, expect } from 'vitest';

describe('taCore import test', () => {
  it('should import taCore', async () => {
    const { taCore } = await import('@deepentropy/oakscriptjs');
    
    expect(taCore).toBeDefined();
    expect(taCore.sma).toBeDefined();
    expect(taCore.ema).toBeDefined();
    
    // Test simple SMA
    const data = [1, 2, 3, 4, 5];
    const result = taCore.sma(data, 3);
    expect(result).toBeDefined();
    console.log('SMA result:', result);
  });
});
