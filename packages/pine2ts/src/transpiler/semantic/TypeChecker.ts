/**
 * Type checker for PineScript semantic analysis
 */

import type { ASTNode } from '../PineParser.js';
import type { PineType } from './PineTypes.js';
import { PineTypes, isAssignable, typeToString } from './PineTypes.js';
import type { SymbolTable } from './SymbolTable.js';

export class TypeChecker {
  /**
   * Check if a source type is assignable to a target type
   */
  isAssignable(source: PineType, target: PineType): boolean {
    return isAssignable(source, target);
  }
  
  /**
   * Infer the type of an expression
   */
  inferType(expr: ASTNode, symbolTable: SymbolTable): PineType {
    if (!expr) {
      return PineTypes.unknown();
    }
    
    switch (expr.type) {
      case 'NumberLiteral': {
        const value = Number(expr.value);
        // Check if it's an integer or float
        return Number.isInteger(value) ? PineTypes.int() : PineTypes.float();
      }
      
      case 'StringLiteral':
        return PineTypes.string();
      
      case 'Identifier': {
        // Special handling for 'na'
        if (expr.value === 'na') {
          return PineTypes.na();
        }
        
        const name = String(expr.value || '');
        const symbol = symbolTable.lookupSymbol(name);
        
        if (symbol) {
          return symbol.type;
        }
        
        // Unknown variable - return unknown type
        return PineTypes.unknown();
      }
      
      case 'FunctionCall': {
        const funcName = String(expr.value || '');
        const symbol = symbolTable.lookupSymbol(funcName);
        
        if (symbol && symbol.type.kind === 'function') {
          return symbol.type.returnType;
        }
        
        // For unknown functions or user-defined functions without type info,
        // assume they return a Series (common in PineScript)
        return PineTypes.series(PineTypes.float());
      }
      
      case 'BinaryExpression': {
        if (!expr.children || expr.children.length < 2) {
          return PineTypes.unknown();
        }
        
        const left = this.inferType(expr.children[0]!, symbolTable);
        const right = this.inferType(expr.children[1]!, symbolTable);
        const op = String(expr.value || '');
        
        // Comparison operators return bool
        if (['>', '<', '>=', '<=', '==', '!='].includes(op)) {
          // If either operand is a Series, result is Series<bool>
          if (left.kind === 'series' || right.kind === 'series') {
            return PineTypes.series(PineTypes.bool());
          }
          return PineTypes.bool();
        }
        
        // Logical operators return bool
        if (['&&', '||'].includes(op)) {
          if (left.kind === 'series' || right.kind === 'series') {
            return PineTypes.series(PineTypes.bool());
          }
          return PineTypes.bool();
        }
        
        // Arithmetic operators
        // If either is a Series, result is a Series
        if (left.kind === 'series' || right.kind === 'series') {
          // Determine the element type
          const leftElem = left.kind === 'series' ? left.elementType : left;
          const rightElem = right.kind === 'series' ? right.elementType : right;
          
          // If either is float, result is float
          if (leftElem.kind === 'float' || rightElem.kind === 'float') {
            return PineTypes.series(PineTypes.float());
          }
          
          // Both int -> result is int
          return PineTypes.series(PineTypes.int());
        }
        
        // Both scalars
        if (left.kind === 'float' || right.kind === 'float') {
          return PineTypes.float();
        }
        
        return PineTypes.int();
      }
      
      case 'UnaryExpression': {
        if (!expr.children || expr.children.length < 1) {
          return PineTypes.unknown();
        }
        
        const operand = this.inferType(expr.children[0]!, symbolTable);
        const op = String(expr.value || '');
        
        // Unary minus preserves the type
        if (op === '-') {
          return operand;
        }
        
        // Logical not returns bool
        if (op === '!') {
          if (operand.kind === 'series') {
            return PineTypes.series(PineTypes.bool());
          }
          return PineTypes.bool();
        }
        
        return operand;
      }
      
      case 'TernaryExpression': {
        if (!expr.children || expr.children.length < 3) {
          return PineTypes.unknown();
        }
        
        const consequent = this.inferType(expr.children[1]!, symbolTable);
        const alternate = this.inferType(expr.children[2]!, symbolTable);
        
        // If either branch is a Series, the result is a Series
        if (consequent.kind === 'series' || alternate.kind === 'series') {
          // Determine the element type
          const consElem = consequent.kind === 'series' ? consequent.elementType : consequent;
          const altElem = alternate.kind === 'series' ? alternate.elementType : alternate;
          
          // If either is float, result is series<float>
          if (consElem.kind === 'float' || altElem.kind === 'float') {
            return PineTypes.series(PineTypes.float());
          }
          
          // If either is na, use the other type
          if (consElem.kind === 'na') {
            return PineTypes.series(altElem);
          }
          if (altElem.kind === 'na') {
            return PineTypes.series(consElem);
          }
          
          // Otherwise use the consequent type
          return PineTypes.series(consElem);
        }
        
        // Both scalars - return consequent type
        return consequent;
      }
      
      case 'HistoryAccess': {
        if (!expr.children || expr.children.length < 1) {
          return PineTypes.unknown();
        }
        
        const baseType = this.inferType(expr.children[0]!, symbolTable);
        
        // History access on a Series returns the element type (scalar)
        if (baseType.kind === 'series') {
          return baseType.elementType;
        }
        
        // History access on non-series is an error, but return unknown for now
        return PineTypes.unknown();
      }
      
      default:
        return PineTypes.unknown();
    }
  }
  
  /**
   * Get a human-readable type string
   */
  typeToString(type: PineType): string {
    return typeToString(type);
  }
}
