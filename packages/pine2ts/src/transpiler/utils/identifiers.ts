/**
 * Identifier sanitization utilities
 */

/**
 * Sanitize an identifier name for TypeScript
 * Converts to valid TypeScript identifier by removing invalid characters
 */
export function sanitizeIdentifier(name: string): string {
  // Convert to camelCase and remove invalid characters
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '') || 'unnamed';
}
