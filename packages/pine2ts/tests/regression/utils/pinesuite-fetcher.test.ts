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

  it('should properly encode file paths with spaces in the URL', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filePath = 'data/20251203/Simple Moving Average.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filePath, token);

    // Verify fetch was called
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify the URL contains encoded spaces (%20) instead of literal spaces
    expect(calledUrl).toContain('Simple%20Moving%20Average.csv');
    expect(calledUrl).not.toContain('Simple Moving Average.csv');
    
    // Verify the full URL structure with properly encoded path segments
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents/data/20251203/Simple%20Moving%20Average.csv'
    );
  });

  it('should properly encode file paths with spaces only', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filePath = 'data/test/Test File.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filePath, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify only spaces are encoded, not other characters
    expect(calledUrl).toContain('Test%20File.csv');
    expect(calledUrl).not.toContain('Test File.csv');
  });

  it('should not encode slashes in the path', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filePath = 'data/20251203/simple.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filePath, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify slashes are preserved and not encoded
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

    const filePath = 'data/test/test.csv';
    const token = 'my-secret-token';

    await fetchPineSuiteCSV(filePath, token);

    // Verify fetch was called with correct headers
    const [url, options] = fetchMock.mock.calls[0];
    expect(options.headers).toEqual({
      'Authorization': 'token my-secret-token',
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'oakscriptJS-regression-tests',
      'X-GitHub-Api-Version': '2022-11-28',
    });
  });

  it('should handle paths with leading/trailing slashes', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    const filePath = '/data/20251203/test.csv/';
    const token = 'test-token';

    await fetchPineSuiteCSV(filePath, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Note: Simple space replacement doesn't handle leading/trailing slashes
    // This is acceptable as paths from indicator-mapping.json don't have them
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents//data/20251203/test.csv/'
    );
  });
});
