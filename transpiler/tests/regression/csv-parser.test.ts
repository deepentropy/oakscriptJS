import { describe, it, expect } from 'vitest';
import { parseCSV } from './utils/csv-parser.js';

describe('CSV Parser', () => {
  it('should parse CSV content', () => {
    const csvContent = 'time,open,high,low,close,volume\n2020-01-01,100,105,95,102,1000\n2020-01-02,102,108,100,107,1200';
    const data = parseCSV(csvContent);
    
    expect(data).toHaveLength(2);
    expect(data[0].open).toBe(100);
    expect(data[0].close).toBe(102);
    expect(data[1].open).toBe(102);
    expect(data[1].close).toBe(107);
  });
});
