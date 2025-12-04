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

  it('should handle already-encoded paths without double encoding', async () => {
    // Mock successful response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'time,open,high,low,close,volume\n1,2,3,4,5,6',
    });

    // Path is already encoded with %20 for spaces
    const filePath = 'data/20251203/Simple%20Moving%20Average.csv';
    const token = 'test-token';

    await fetchPineSuiteCSV(filePath, token);

    // Get the URL that was used
    const calledUrl = fetchMock.mock.calls[0][0];

    // Verify it doesn't double-encode to %2520
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents/data/20251203/Simple%20Moving%20Average.csv'
    );
    expect(calledUrl).not.toContain('%2520');
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

    // Verify leading/trailing slashes are removed during normalization
    expect(calledUrl).toBe(
      'https://api.github.com/repos/deepentropy/pinesuite/contents/data/20251203/test.csv'
    );
  });

  describe('Error Handling', () => {
    it('should provide clear error message for 404 with URL and status', async () => {
      // Mock 404 response
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '{"message":"Not Found"}',
      });

      const filePath = 'data/20251203/NonExistent.csv';
      const token = 'test-token';

      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow(
        'File not found or no access: data/20251203/NonExistent.csv'
      );
      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow('URL:');
      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow('Status: 404');
    });

    it('should provide clear error message for 401 authentication failures', async () => {
      // Mock 401 response
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"message":"Bad credentials"}',
      });

      const filePath = 'data/test/test.csv';
      const token = 'invalid-token';

      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow(
        'Authentication failed: Invalid token or token expired'
      );
    });

    it('should provide clear error message for 403 access forbidden', async () => {
      // Mock 403 response
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => '{"message":"Forbidden"}',
      });

      const filePath = 'data/test/test.csv';
      const token = 'limited-token';

      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow(
        'Access forbidden: Token may not have access to deepentropy/pinesuite'
      );
    });

    it('should include response body in error messages when available', async () => {
      // Mock 403 response with detailed error
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => '{"message":"Resource protected by organization SAML enforcement"}',
      });

      const filePath = 'data/test/test.csv';
      const token = 'test-token';

      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow(
        'Response: {"message":"Resource protected by organization SAML enforcement"}'
      );
    });

    it('should handle errors when reading response body fails', async () => {
      // Mock 500 response that fails to read body
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => {
          throw new Error('Failed to read body');
        },
      });

      const filePath = 'data/test/test.csv';
      const token = 'test-token';

      // Should still throw error even if body reading fails
      await expect(fetchPineSuiteCSV(filePath, token)).rejects.toThrow(
        'GitHub API error: 500 Internal Server Error'
      );
    });
  });
});
