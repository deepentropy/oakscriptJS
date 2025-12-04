/**
 * PineSuite Fetcher - Fetch CSV data from the private pinesuite repository
 */

/**
 * Fetch CSV data from the private deepentropy/pinesuite repository
 * @param filename - CSV filename (e.g., "Simple Moving Average.csv")
 * @param token - GitHub personal access token (defaults to PINESUITE_TOKEN env var)
 * @returns Raw CSV content as string
 * @throws Error if token is missing, network fails, or file not found
 */
export async function fetchPineSuiteCSV(
  filename: string,
  token?: string
): Promise<string> {
  const githubToken = token || process.env.PINESUITE_TOKEN;
  
  if (!githubToken) {
    throw new Error('PINESUITE_TOKEN environment variable is not set');
  }

  const owner = 'deepentropy';
  const repo = 'pinesuite';
  const path = `data/20251203/${encodeURIComponent(filename)}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'oakscriptJS-regression-tests',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${filename}`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Check your PINESUITE_TOKEN.');
      } else {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
    }

    const csvContent = await response.text();
    return csvContent;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch ${filename}: ${String(error)}`);
  }
}

/**
 * Check if PINESUITE_TOKEN is available
 */
export function hasPineSuiteToken(): boolean {
  return !!process.env.PINESUITE_TOKEN;
}
