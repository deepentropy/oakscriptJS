/**
 * ImportTracker - Tracks imports during code generation
 *
 * This service is used to track which imports are actually needed
 * based on the generated code, not the source AST.
 *
 * Key principle: Track imports AS we emit code, not before.
 * This ensures transformations (like `na` -> `NaN`) don't cause
 * unnecessary imports.
 */
export class ImportTracker {
    private imports: Set<string> = new Set();

    /** Namespaces and functions that can be imported from oakscriptjs */
    private static readonly TRACKABLE = new Set([
        'ta',
        'taCore',
        'math',
        'array',
        'na',
        'nz',
        'Series',
        'IndicatorResult',
        'InputConfig',
        'PlotConfig',
    ]);

    /**
     * Track a namespace usage (e.g., 'ta' from 'ta.sma')
     */
    trackNamespace(name: string): void {
        const ns = name.split('.')[0];
        if (ns && ImportTracker.TRACKABLE.has(ns)) {
            this.imports.add(ns);
        }
    }

    /**
     * Track a function call that needs to be imported
     * (e.g., 'na' function call, not 'na' value)
     */
    trackFunction(name: string): void {
        if (name === 'na' || name === 'nz') {
            this.imports.add(name);
        }
    }

    /**
     * Track a direct import (e.g., 'Series', 'IndicatorResult')
     */
    track(name: string): void {
        if (ImportTracker.TRACKABLE.has(name)) {
            this.imports.add(name);
        }
    }

    /**
     * Get all tracked imports
     */
    getImports(): Set<string> {
        return new Set(this.imports);
    }

    /**
     * Check if a specific import is tracked
     */
    has(name: string): boolean {
        return this.imports.has(name);
    }

    /**
     * Clear all tracked imports
     */
    clear(): void {
        this.imports.clear();
    }
}
