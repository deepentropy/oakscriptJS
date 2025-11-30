/**
 * Library Resolver
 * 
 * Handles library resolution and dependency management for PineScript imports.
 * Resolves libraries from docs/official/libraries/ and manages the transpilation
 * of library dependencies in the correct order.
 */

import { PineParser } from './PineParser.js';
import type { ImportInfo } from './types.js';

/**
 * Represents a transpiled library output
 */
export interface TranspiledLibrary {
  /** The key identifying this library (Publisher/Name/Version) */
  key: string;
  /** The transpiled TypeScript code */
  code: string;
  /** The module name to use for imports */
  moduleName: string;
  /** Dependencies this library imports */
  dependencies: ImportInfo[];
}

/**
 * Result of library resolution
 */
export interface LibraryResolutionResult {
  /** Ordered list of transpiled libraries (dependencies first) */
  libraries: TranspiledLibrary[];
  /** Any errors encountered during resolution */
  errors: string[];
}

/**
 * Options for file system operations
 */
export interface FileSystemInterface {
  /** Read a file from the filesystem */
  readFile: (path: string) => string | null;
  /** Check if a file exists */
  fileExists: (path: string) => boolean;
}

/**
 * Library Resolver class
 * 
 * Manages the resolution and transpilation of PineScript libraries.
 * Handles recursive dependencies and circular dependency detection.
 */
export class LibraryResolver {
  /** Map of already transpiled libraries */
  private transpiled: Map<string, TranspiledLibrary> = new Map();
  /** Set of libraries currently being processed (for cycle detection) */
  private inProgress: Set<string> = new Set();
  /** File system interface */
  private fs: FileSystemInterface;
  /** Base path for library resolution */
  private basePath: string;

  constructor(fs: FileSystemInterface, basePath: string = 'docs/official/libraries') {
    this.fs = fs;
    this.basePath = basePath;
  }

  /**
   * Generate a unique key for a library
   */
  static getLibraryKey(publisher: string, name: string, version: number): string {
    return `${publisher}/${name}/${version}`;
  }

  /**
   * Generate the module name for a library (used in import statements)
   */
  static getModuleName(publisher: string, name: string, version: number): string {
    return `${publisher}_${name}_v${version}`;
  }

  /**
   * Resolve the file path for a library
   */
  resolveLibraryPath(publisher: string, name: string, version: number): string {
    return `${this.basePath}/${publisher}/${name}-v${version}.pine`;
  }

  /**
   * Extract import statements from a PineScript AST
   */
  findImports(source: string): ImportInfo[] {
    const parser = new PineParser();
    const { ast } = parser.parse(source);
    const imports: ImportInfo[] = [];

    if (ast.children) {
      for (const node of ast.children) {
        if (node.type === 'ImportStatement') {
          const alias = String(node.value || '');
          let publisher = '';
          let libraryName = '';
          let version = 0;

          if (node.children) {
            for (const child of node.children) {
              if (child.type === 'Publisher') {
                publisher = String(child.value || '');
              } else if (child.type === 'LibraryName') {
                libraryName = String(child.value || '');
              } else if (child.type === 'Version') {
                version = typeof child.value === 'number' ? child.value : 0;
              }
            }
          }

          imports.push({ publisher, libraryName, version, alias });
        }
      }
    }

    return imports;
  }

  /**
   * Resolve and transpile a library and all its dependencies
   * 
   * @param publisher - The library publisher (e.g., "TradingView")
   * @param name - The library name (e.g., "ZigZag")
   * @param version - The library version (e.g., 8)
   * @returns The transpiled library or null if not found/failed
   */
  resolveAndTranspile(
    publisher: string,
    name: string,
    version: number,
    transpileFunction: (source: string) => string
  ): TranspiledLibrary | null {
    const key = LibraryResolver.getLibraryKey(publisher, name, version);

    // Check if already transpiled
    if (this.transpiled.has(key)) {
      return this.transpiled.get(key)!;
    }

    // Check for circular dependency
    if (this.inProgress.has(key)) {
      throw new Error(`Circular dependency detected: ${key}`);
    }

    // Mark as in progress
    this.inProgress.add(key);

    try {
      // Resolve the file path
      const path = this.resolveLibraryPath(publisher, name, version);
      
      // Read the source file
      const source = this.fs.readFile(path);
      if (source === null) {
        throw new Error(`Library not found: ${path}`);
      }

      // Find dependencies
      const dependencies = this.findImports(source);

      // Recursively resolve dependencies first
      for (const dep of dependencies) {
        this.resolveAndTranspile(dep.publisher, dep.libraryName, dep.version, transpileFunction);
      }

      // Transpile this library
      const code = transpileFunction(source);
      const moduleName = LibraryResolver.getModuleName(publisher, name, version);

      const result: TranspiledLibrary = {
        key,
        code,
        moduleName,
        dependencies,
      };

      // Cache the result
      this.transpiled.set(key, result);
      this.inProgress.delete(key);

      return result;
    } catch (error) {
      this.inProgress.delete(key);
      throw error;
    }
  }

  /**
   * Resolve all libraries required by a list of imports
   * 
   * @param imports - List of import statements from the main file
   * @param transpileFunction - Function to transpile PineScript to TypeScript
   * @returns Resolution result with ordered libraries and any errors
   */
  resolveAll(
    imports: ImportInfo[],
    transpileFunction: (source: string) => string
  ): LibraryResolutionResult {
    const libraries: TranspiledLibrary[] = [];
    const errors: string[] = [];
    const visited = new Set<string>();

    // Helper to collect libraries in dependency order
    const collectOrdered = (lib: TranspiledLibrary) => {
      const key = lib.key;
      if (visited.has(key)) return;
      visited.add(key);

      // First collect dependencies
      for (const dep of lib.dependencies) {
        const depKey = LibraryResolver.getLibraryKey(dep.publisher, dep.libraryName, dep.version);
        const depLib = this.transpiled.get(depKey);
        if (depLib) {
          collectOrdered(depLib);
        }
      }

      // Then add this library
      libraries.push(lib);
    };

    // Resolve each import
    for (const imp of imports) {
      try {
        const lib = this.resolveAndTranspile(
          imp.publisher,
          imp.libraryName,
          imp.version,
          transpileFunction
        );
        if (lib) {
          collectOrdered(lib);
        }
      } catch (error) {
        errors.push(`Failed to resolve ${imp.publisher}/${imp.libraryName}/${imp.version}: ${error}`);
      }
    }

    return { libraries, errors };
  }

  /**
   * Clear the resolver cache
   */
  clear(): void {
    this.transpiled.clear();
    this.inProgress.clear();
  }

  /**
   * Check if a library has been transpiled
   */
  hasLibrary(publisher: string, name: string, version: number): boolean {
    const key = LibraryResolver.getLibraryKey(publisher, name, version);
    return this.transpiled.has(key);
  }

  /**
   * Get a transpiled library by its components
   */
  getLibrary(publisher: string, name: string, version: number): TranspiledLibrary | undefined {
    const key = LibraryResolver.getLibraryKey(publisher, name, version);
    return this.transpiled.get(key);
  }
}
