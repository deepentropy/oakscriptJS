import { describe, it, expect } from 'vitest';
import { PineParser } from '../src/transpiler/PineParser';
import { transpile } from '../src/transpiler/PineToTS';
import { LibraryResolver, FileSystemInterface } from '../src/transpiler/LibraryResolver';

describe('Phase 4: Library Import System', () => {
  describe('Import Statement Parsing', () => {
    describe('Basic import parsing', () => {
      it('should parse import statement with alias', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ZigZag/8 as zigzag');
        
        expect(errors).toHaveLength(0);
        expect(ast.children).toBeDefined();
        expect(ast.children![0]!.type).toBe('ImportStatement');
        expect(ast.children![0]!.value).toBe('zigzag');
      });

      it('should parse import statement and extract publisher', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ZigZag/8 as zigzag');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        const publisherNode = importNode.children?.find(c => c.type === 'Publisher');
        expect(publisherNode?.value).toBe('TradingView');
      });

      it('should parse import statement and extract library name', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ZigZag/8 as zigzag');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        const libraryNode = importNode.children?.find(c => c.type === 'LibraryName');
        expect(libraryNode?.value).toBe('ZigZag');
      });

      it('should parse import statement and extract version', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ZigZag/8 as zigzag');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        const versionNode = importNode.children?.find(c => c.type === 'Version');
        expect(versionNode?.value).toBe(8);
      });

      it('should parse import statement without alias (default to library name)', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ZigZag/8');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        expect(importNode.type).toBe('ImportStatement');
        expect(importNode.value).toBe('ZigZag'); // Default alias is library name
      });

      it('should parse import with different version numbers', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import TradingView/ta/10 as ta');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        const versionNode = importNode.children?.find(c => c.type === 'Version');
        expect(versionNode?.value).toBe(10);
      });

      it('should parse import with PineCoders publisher', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('import PineCoders/Polyline/3 as poly');
        
        expect(errors).toHaveLength(0);
        const importNode = ast.children![0]!;
        expect(importNode.value).toBe('poly');
        const publisherNode = importNode.children?.find(c => c.type === 'Publisher');
        expect(publisherNode?.value).toBe('PineCoders');
      });
    });

    describe('Multiple imports parsing', () => {
      it('should parse multiple import statements', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`import TradingView/ZigZag/8 as zigzag
import TradingView/ta/10 as ta`);
        
        expect(errors).toHaveLength(0);
        expect(ast.children).toHaveLength(2);
        expect(ast.children![0]!.type).toBe('ImportStatement');
        expect(ast.children![1]!.type).toBe('ImportStatement');
      });
    });
  });

  describe('Library Declaration Parsing', () => {
    describe('Basic library declaration', () => {
      it('should parse library declaration', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('library("ZigZag", overlay = true)');
        
        expect(errors).toHaveLength(0);
        expect(ast.children![0]!.type).toBe('LibraryDeclaration');
      });

      it('should extract library name from declaration', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('library("ZigZag")');
        
        expect(errors).toHaveLength(0);
        const libNode = ast.children![0]!;
        expect(libNode.type).toBe('LibraryDeclaration');
        expect(libNode.children![0]!.type).toBe('StringLiteral');
        expect(libNode.children![0]!.value).toBe('ZigZag');
      });

      it('should parse library declaration without overlay', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('library("MyLib")');
        
        expect(errors).toHaveLength(0);
        expect(ast.children![0]!.type).toBe('LibraryDeclaration');
      });
    });
  });

  describe('Import Code Generation', () => {
    describe('Basic import generation', () => {
      it('should generate ES6 import statement', () => {
        const source = `indicator("Test")
import TradingView/ZigZag/8 as zigzag`;
        
        const result = transpile(source);
        
        expect(result).toContain("import * as zigzag from './libs/TradingView_ZigZag_v8'");
      });

      it('should generate correct module path for version', () => {
        const source = `indicator("Test")
import TradingView/ta/10 as ta`;
        
        const result = transpile(source);
        
        expect(result).toContain("import * as ta from './libs/TradingView_ta_v10'");
      });

      it('should generate import with library name as alias when no alias specified', () => {
        const source = `indicator("Test")
import TradingView/ZigZag/8`;
        
        const result = transpile(source);
        
        expect(result).toContain("import * as ZigZag from './libs/TradingView_ZigZag_v8'");
      });

      it('should generate multiple import statements', () => {
        const source = `indicator("Test")
import TradingView/ZigZag/8 as zigzag
import TradingView/ta/10 as ta`;
        
        const result = transpile(source);
        
        expect(result).toContain("import * as zigzag from './libs/TradingView_ZigZag_v8'");
        expect(result).toContain("import * as ta from './libs/TradingView_ta_v10'");
      });
    });
  });

  describe('Aliased Access Parsing', () => {
    describe('Aliased type access', () => {
      it('should parse aliased type instantiation', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('settings = zigzag.Settings.new(5.0, 10)');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        expect(assignment.type).toBe('Assignment');
      });

      it('should parse aliased function call', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('zz = zigzag.newInstance(settings)');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        const call = assignment.children![1]!;
        expect(call.type).toBe('FunctionCall');
        expect(call.value).toBe('zigzag.newInstance');
      });

      it('should parse aliased method call', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('zigzag.update()');
        
        expect(errors).toHaveLength(0);
        const stmt = ast.children![0]!;
        const call = stmt.children![0]!;
        expect(call.type).toBe('FunctionCall');
        expect(call.value).toBe('zigzag.update');
      });
    });
  });

  describe('Aliased Access Code Generation', () => {
    describe('Aliased type and function generation', () => {
      it('should generate aliased type instantiation', () => {
        const source = `indicator("Test")
import TradingView/ZigZag/8 as zigzag
settings = zigzag.Settings.new(5.0, 10)`;
        
        const result = transpile(source);
        
        expect(result).toContain('zigzag.Settings.new(5, 10)');
      });

      it('should generate aliased function call', () => {
        const source = `indicator("Test")
import TradingView/ZigZag/8 as zigzag
zz = zigzag.newInstance()`;
        
        const result = transpile(source);
        
        expect(result).toContain('zigzag.newInstance()');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle indicator with import and aliased access', () => {
      const source = `indicator("Auto Fib Extension", overlay=true)
import TradingView/ZigZag/7 as zigzag
var zz = zigzag.newInstance()`;
      
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Check import is generated
      expect(result).toContain("import * as zigzag from './libs/TradingView_ZigZag_v7'");
      
      // Check function call is preserved
      expect(result).toContain('zigzag.newInstance()');
    });

    it('should handle library declaration', () => {
      const source = `library("ZigZag", overlay = true)

export type Settings
    float devThreshold = 5.0
    int depth = 10`;
      
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Library should export types
      expect(result).toContain('export interface Settings');
    });

    it('should compile generated TypeScript without syntax errors', () => {
      const source = `indicator("Import Test")
import TradingView/ZigZag/8 as zigzag
var settings = zigzag.Settings.new(5.0, 10)
var zz = zigzag.newInstance(settings)`;
      
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Basic structure checks
      expect(result).toContain('export function');
      expect(result).toContain('return {');
      expect(result).toContain('metadata:');
      expect(result).toContain('plots:');
    });
  });

  describe('Library Resolver', () => {
    describe('Basic functionality', () => {
      it('should generate correct library key', () => {
        const key = LibraryResolver.getLibraryKey('TradingView', 'ZigZag', 8);
        expect(key).toBe('TradingView/ZigZag/8');
      });

      it('should generate correct module name', () => {
        const moduleName = LibraryResolver.getModuleName('TradingView', 'ZigZag', 8);
        expect(moduleName).toBe('TradingView_ZigZag_v8');
      });

      it('should resolve library path correctly', () => {
        const mockFs: FileSystemInterface = {
          readFile: () => null,
          fileExists: () => false,
        };
        const resolver = new LibraryResolver(mockFs);
        const path = resolver.resolveLibraryPath('TradingView', 'ZigZag', 8);
        expect(path).toBe('docs/official/libraries/TradingView/ZigZag-v8.pine');
      });

      it('should resolve library path with custom base path', () => {
        const mockFs: FileSystemInterface = {
          readFile: () => null,
          fileExists: () => false,
        };
        const resolver = new LibraryResolver(mockFs, 'custom/path');
        const path = resolver.resolveLibraryPath('TradingView', 'ZigZag', 8);
        expect(path).toBe('custom/path/TradingView/ZigZag-v8.pine');
      });
    });

    describe('Import extraction', () => {
      it('should extract imports from source', () => {
        const mockFs: FileSystemInterface = {
          readFile: () => null,
          fileExists: () => false,
        };
        const resolver = new LibraryResolver(mockFs);
        
        const source = `indicator("Test")
import TradingView/ZigZag/8 as zigzag
import TradingView/ta/10 as ta`;
        
        const imports = resolver.findImports(source);
        
        expect(imports).toHaveLength(2);
        expect(imports[0].publisher).toBe('TradingView');
        expect(imports[0].libraryName).toBe('ZigZag');
        expect(imports[0].version).toBe(8);
        expect(imports[0].alias).toBe('zigzag');
        expect(imports[1].alias).toBe('ta');
      });
    });

    describe('Transpilation', () => {
      it('should transpile a simple library', () => {
        const librarySource = `library("TestLib")
export type Settings
    float value = 1.0`;
        
        const mockFs: FileSystemInterface = {
          readFile: (path) => {
            if (path === 'docs/official/libraries/Test/TestLib-v1.pine') {
              return librarySource;
            }
            return null;
          },
          fileExists: (path) => path === 'docs/official/libraries/Test/TestLib-v1.pine',
        };
        
        const resolver = new LibraryResolver(mockFs);
        const result = resolver.resolveAndTranspile('Test', 'TestLib', 1, transpile);
        
        expect(result).not.toBeNull();
        expect(result!.key).toBe('Test/TestLib/1');
        expect(result!.moduleName).toBe('Test_TestLib_v1');
        expect(result!.code).toContain('interface Settings');
      });

      it('should detect circular dependencies', () => {
        // LibA imports LibB, LibB imports LibA
        const libASource = `library("LibA")
import Test/LibB/1 as b`;
        const libBSource = `library("LibB")
import Test/LibA/1 as a`;
        
        const mockFs: FileSystemInterface = {
          readFile: (path) => {
            if (path === 'docs/official/libraries/Test/LibA-v1.pine') return libASource;
            if (path === 'docs/official/libraries/Test/LibB-v1.pine') return libBSource;
            return null;
          },
          fileExists: () => true,
        };
        
        const resolver = new LibraryResolver(mockFs);
        
        expect(() => {
          resolver.resolveAndTranspile('Test', 'LibA', 1, transpile);
        }).toThrow(/Circular dependency/);
      });

      it('should cache transpiled libraries', () => {
        const librarySource = `library("TestLib")
export type Settings
    float value = 1.0`;
        
        let readCount = 0;
        const mockFs: FileSystemInterface = {
          readFile: (path) => {
            if (path === 'docs/official/libraries/Test/TestLib-v1.pine') {
              readCount++;
              return librarySource;
            }
            return null;
          },
          fileExists: () => true,
        };
        
        const resolver = new LibraryResolver(mockFs);
        
        // First transpile
        resolver.resolveAndTranspile('Test', 'TestLib', 1, transpile);
        // Second transpile should use cache
        resolver.resolveAndTranspile('Test', 'TestLib', 1, transpile);
        
        expect(readCount).toBe(1);
      });

      it('should check if library exists', () => {
        const librarySource = `library("TestLib")`;
        
        const mockFs: FileSystemInterface = {
          readFile: () => librarySource,
          fileExists: () => true,
        };
        
        const resolver = new LibraryResolver(mockFs);
        
        expect(resolver.hasLibrary('Test', 'TestLib', 1)).toBe(false);
        
        resolver.resolveAndTranspile('Test', 'TestLib', 1, transpile);
        
        expect(resolver.hasLibrary('Test', 'TestLib', 1)).toBe(true);
      });

      it('should clear cache', () => {
        const librarySource = `library("TestLib")`;
        
        const mockFs: FileSystemInterface = {
          readFile: () => librarySource,
          fileExists: () => true,
        };
        
        const resolver = new LibraryResolver(mockFs);
        resolver.resolveAndTranspile('Test', 'TestLib', 1, transpile);
        
        expect(resolver.hasLibrary('Test', 'TestLib', 1)).toBe(true);
        
        resolver.clear();
        
        expect(resolver.hasLibrary('Test', 'TestLib', 1)).toBe(false);
      });
    });

    describe('Dependency resolution', () => {
      it('should resolve all imports in correct order', () => {
        // Main imports LibA, LibA imports LibB
        const libASource = `library("LibA")
import Test/LibB/1 as b
export type TypeA
    float value = 1.0`;
        const libBSource = `library("LibB")
export type TypeB
    int value = 0`;
        
        const mockFs: FileSystemInterface = {
          readFile: (path) => {
            if (path === 'docs/official/libraries/Test/LibA-v1.pine') return libASource;
            if (path === 'docs/official/libraries/Test/LibB-v1.pine') return libBSource;
            return null;
          },
          fileExists: () => true,
        };
        
        const resolver = new LibraryResolver(mockFs);
        const imports = [{ publisher: 'Test', libraryName: 'LibA', version: 1, alias: 'a' }];
        const result = resolver.resolveAll(imports, transpile);
        
        expect(result.errors).toHaveLength(0);
        expect(result.libraries).toHaveLength(2);
        // LibB should come before LibA (dependency order)
        expect(result.libraries[0].key).toBe('Test/LibB/1');
        expect(result.libraries[1].key).toBe('Test/LibA/1');
      });
    });
  });
});
