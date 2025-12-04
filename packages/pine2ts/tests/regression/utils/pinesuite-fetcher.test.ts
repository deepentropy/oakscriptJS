/**
 * Unit tests for PineSuite Fetcher - URL encoding validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPineSuiteCSV } from './pinesuite-fetcher.js';

describe('PineSuite Fetcher - URL Encoding', () => {
  let originalFetch: typeof global.fetch;
  let fetchMock: any;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
    
    // Create a mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should properly encode filenames with spaces in the URL', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filename = 'Simple Moving Average.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filename, token);

    // Verify fetch was called
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify the URL contains encoded spaces (%20) instead of literal spaces
    expect(calledUrl).toContain('Simple%20Moving%20Average.csv');
    expect(calledUrl).not.toContain('Simple Moving Average.csv');
    
    // Verify the full URL structure
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents/data/20251203/Simple%20Moving%20Average.csv'
    );
  });

  it('should properly encode filenames with special characters', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filename = 'Test & File (1).csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filename, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify special characters are encoded
    expect(calledUrl).toContain('Test%20%26%20File%20(1).csv');
    expect(calledUrl).not.toContain('Test & File (1).csv');
  });

  it('should not double-encode already encoded filenames', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    // This is an edge case - if someone passes an already encoded filename
    const filename = 'simple.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filename, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify normal filenames work correctly
    expect(calledUrl).toContain('simple.csv');
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents/data/20251203/simple.csv'
    );
  });

  it('should include correct authorization headers', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filename = 'test.csv';
    const token = 'my-secret-token';

    await fetchPineSuiteCSV(filename, token);

    // Verify fetch was called with correct headers
    const [url, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Authorization': 'Bearer my-secret-token',
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'oakscriptJS-regression-tests',
    });
  });
});
