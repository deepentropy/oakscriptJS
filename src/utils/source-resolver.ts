/**
 * Sources other than the bar fields: a study calculated on another study's output (PineScript hosts call it "study
 * on study"). A source input then holds a host name such as `"<sourceId>$<plotIndex>"`; the host resolves it to
 * values aligned with the bars it passes to the calculation (`NaN` where there is no value).
 *
 * The host sets the resolver around a calculation and clears it after; a name it does not know falls back to
 * `close`, as before.
 */

/** Values of a source by name, aligned with the bars of the calculation; null/undefined = unknown name. */
export type SourceResolver = (name: string) => ArrayLike<number> | null | undefined;

let resolver: SourceResolver | null = null;

/** Built-in sources (bar fields and their averages). */
export const BUILTIN_SOURCES: ReadonlySet<string> = new Set([
  'open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume',
]);

/** Set (or clear with null) how source names other than the built-ins are read. */
export function setSourceResolver(fn: SourceResolver | null): void {
  resolver = fn;
}

/** Values of a non built-in source name, or null when no resolver knows it. */
export function externalSource(name: string): ArrayLike<number> | null {
  if (!resolver || BUILTIN_SOURCES.has(name)) return null;
  return resolver(name) ?? null;
}
