/**
 * PineSuite Fetcher - Fetch CSV data from the private pinesuite repository
 */

/**
 * Fetch CSV data from the private deepentropy/pinesuite repository
 * @param filePath - Full path to CSV file (e.g., "data/20251203/Simple Moving Average.csv")
 * @param token - GitHub personal access token (defaults to PINESUITE_TOKEN env var)
 * @returns Raw CSV content as string
 * @throws Error if token is missing, network fails, or file not found
 */
export async function fetchPineSuiteCSV(
  filePath: string,
  token?: string
): Promise<string> {
  const githubToken = token || process.env.PINESUITE_TOKEN;
  
  if (!githubToken) {
    throw new Error('PINESUITE_TOKEN environment variable is not set');
  }

  const owner = 'deepentropy';
  const repo = 'pinesuite';
  
  // Encode each path segment separately (filter out empty segments)
  const encodedPath = filePath
    .split('/')
    .filter(segment => segment.length > 0)
    .map(segment => encodeURIComponent(segment))
    .join('/');
  
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'oakscriptJS-regression-tests',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${filePath} (URL: ${url})`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed (${response.status}). Check your PINESUITE_TOKEN has access to deepentropy/pinesuite.`);
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
    throw new Error(`Failed to fetch ${filePath}: ${String(error)}`);
  }
}

/**
 * Check if PINESUITE_TOKEN is available
 */
export function hasPineSuiteToken(): boolean {
  return !!process.env.PINESUITE_TOKEN;
}
