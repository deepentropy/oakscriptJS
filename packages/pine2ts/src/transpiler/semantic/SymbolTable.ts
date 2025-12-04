/**
 * Symbol table for tracking declared symbols and their metadata
 */

import type { PineType } from './PineTypes.js';

export interface SourceLocation {
  line: number;
  column: number;
}

export type ScopeKind = 'global' | 'function' | 'block' | 'loop';

export interface Scope {
  id: number;
  parent: Scope | null;
  symbols: Map<string, Symbol>;
  kind: ScopeKind;
}

export interface Symbol {
  name: string;
  kind: 'variable' | 'function' | 'type' | 'method' | 'parameter';
  type: PineType;
  isConst: boolean;         // Declared with = vs var
  isSeries: boolean;        // Is this a Series type?
  isReassignable: boolean;  // Can be reassigned with :=
  declaredAt: SourceLocation;
  scope: Scope;
}

export class SymbolTable {
  private symbols: Map<string, Symbol> = new Map();
  private scopes: Scope[] = [];
  private nextScopeId: number = 0;
  
  constructor() {
    // Create global scope
    this.enterScope('global');
  }
  
  /**
   * Enter a new scope
   */
  enterScope(kind: ScopeKind): Scope {
    const currentScope = this.currentScope();
    const newScope: Scope = {
      id: this.nextScopeId++,
      parent: currentScope,
      symbols: new Map(),
      kind,
    };
    this.scopes.push(newScope);
    return newScope;
  }
  
  /**
   * Exit the current scope
   */
  exitScope(): void {
    if (this.scopes.length > 1) {
      this.scopes.pop();
    }
  }
  
  /**
   * Get the current scope
   */
  currentScope(): Scope | null {
    return this.scopes.length > 0 ? this.scopes[this.scopes.length - 1]! : null;
  }
  
  /**
   * Declare a symbol in the current scope
   */
  declareSymbol(symbol: Omit<Symbol, 'scope'>): void {
    const scope = this.currentScope();
    if (!scope) {
      throw new Error('No active scope');
    }
    
    const fullSymbol: Symbol = {
      ...symbol,
      scope,
    };
    
    scope.symbols.set(symbol.name, fullSymbol);
    this.symbols.set(symbol.name, fullSymbol);
  }
  
  /**
   * Look up a symbol in the current scope and parent scopes
   */
  lookupSymbol(name: string): Symbol | undefined {
    let scope = this.currentScope();
    
    while (scope) {
      const symbol = scope.symbols.get(name);
      if (symbol) {
        return symbol;
      }
      scope = scope.parent;
    }
    
    return undefined;
  }
  
  /**
   * Check if a symbol is declared in the current scope (not parent scopes)
   */
  isInCurrentScope(name: string): boolean {
    const scope = this.currentScope();
    return scope ? scope.symbols.has(name) : false;
  }
  
  /**
   * Get all symbols in the symbol table
   */
  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }
  
  /**
   * Check if we're inside a loop scope
   */
  isInsideLoop(): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]!.kind === 'loop') {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if we're inside a function scope
   */
  isInsideFunction(): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]!.kind === 'function') {
        return true;
      }
    }
    return false;
  }
}
