/**
 * Function and user-defined type generation logic
 */

import type { ASTNode } from '../PineParser.js';
import type { GeneratorContext, MethodInfo } from '../types.js';
import { ExpressionGenerator } from './ExpressionGenerator.js';
import { sanitizeIdentifier, applyIndent } from '../utils/index.js';
import { pineTypeToTs, getDefaultForPineType } from '../mappers/index.js';

/**
 * Generates TypeScript code for PineScript functions and user-defined types
 */
export class FunctionGenerator {
  private context: GeneratorContext;
  private expressionGen: ExpressionGenerator;
  private output: string[];
  private indent: number;

  constructor(context: GeneratorContext, output: string[], indent: number) {
    this.context = context;
    this.output = output;
    this.indent = indent;
    this.expressionGen = new ExpressionGenerator(context, indent);
  }

  /**
   * Update indent level for nested structures
   */
  setIndent(indent: number): void {
    this.indent = indent;
    this.expressionGen.setIndent(indent);
  }

  /**
   * Generate function declaration
   */
  generateFunctionDeclaration(node: ASTNode, generateStatement: (node: ASTNode) => void): void {
    const name = String(node.value || 'unknown');
    const tsName = sanitizeIdentifier(name);
    const paramsStr = String(node.name || '');
    const params = paramsStr ? paramsStr.split(',').map(p => `${p.trim()}: any`).join(', ') : '';
    
    // Mark function as defined
    this.context.variables.set(name, tsName);

    // Generate function signature
    this.emit(`function ${tsName}(${params}): any {`);
    this.indent++;

    // Generate function body
    if (node.children && node.children.length > 0) {
      const body = node.children[0]!;
      if (body.type === 'Block' && body.children) {
        // Check if this is a single expression block (like a switch expression)
        if (body.children.length === 1) {
          const singleChild = body.children[0]!;
          // If it's an expression statement containing a switch or other expression, return it
          if (singleChild.type === 'ExpressionStatement' && singleChild.children && singleChild.children.length > 0) {
            const expr = this.expressionGen.generateExpression(singleChild.children[0]!);
            this.emit(`return ${expr};`);
          } else {
            // Generate as a statement
            generateStatement(singleChild);
          }
        } else {
          // Multiple statements
          for (const stmt of body.children) {
            generateStatement(stmt);
          }
        }
      } else {
        // Single expression body - return it
        const expr = this.expressionGen.generateExpression(body);
        this.emit(`return ${expr};`);
      }
    }

    this.indent--;
    this.emit('}');
  }

  /**
   * Generate user-defined types (interfaces and namespace objects)
   */
  generateUserDefinedTypes(generateStatement: (node: ASTNode) => void): void {
    this.emit('// User-defined types');
    
    for (const [typeName, typeInfo] of this.context.types) {
      const exportKeyword = typeInfo.exported ? 'export ' : '';
      
      // Generate interface
      this.emit(`${exportKeyword}interface ${typeName} {`);
      this.indent++;
      for (const field of typeInfo.fields) {
        const tsType = pineTypeToTs(field.fieldType, this.context.types);
        this.emit(`${field.name}: ${tsType};`);
      }
      this.indent--;
      this.emit('}');
      this.emit('');
      
      // Generate namespace object with new() factory and methods
      this.emit(`${exportKeyword}const ${typeName} = {`);
      this.indent++;
      
      // Generate new() factory function
      const params = typeInfo.fields.map(f => {
        const tsType = pineTypeToTs(f.fieldType, this.context.types);
        const defaultVal = f.defaultValue || getDefaultForPineType(f.fieldType, this.context.types);
        return `${f.name}: ${tsType} = ${defaultVal}`;
      }).join(', ');
      
      const fieldNames = typeInfo.fields.map(f => f.name).join(', ');
      
      this.emit(`new: (${params}): ${typeName} => ({`);
      this.indent++;
      this.emit(`${fieldNames},`);
      this.indent--;
      this.emit('}),');
      
      // Generate methods bound to this type
      const typeMethods = this.context.methods.get(typeName) || [];
      for (const method of typeMethods) {
        this.generateMethodInNamespace(method, typeName, generateStatement);
      }
      
      this.indent--;
      this.emit('};');
      this.emit('');
    }
  }

  /**
   * Generate a method in a namespace object
   */
  generateMethodInNamespace(method: MethodInfo, typeName: string, generateStatement: (node: ASTNode) => void): void {
    const selfType = typeName;
    const otherParams = method.parameters.map(p => {
      const tsType = pineTypeToTs(p.paramType, this.context.types);
      const defaultVal = p.defaultValue ? ` = ${p.defaultValue}` : '';
      return `${p.name}: ${tsType}${defaultVal}`;
    }).join(', ');
    
    const allParams = otherParams ? `self: ${selfType}, ${otherParams}` : `self: ${selfType}`;
    
    // Determine return type - for now, use void or any
    const returnType = 'void';
    
    this.emit(`${method.name}: (${allParams}): ${returnType} => {`);
    this.indent++;
    
    // Generate method body
    if (method.bodyNode) {
      const bodyNode = method.bodyNode as ASTNode;
      if (bodyNode.type === 'Block' && bodyNode.children) {
        for (const stmt of bodyNode.children) {
          generateStatement(stmt);
        }
      } else {
        // Single expression body
        const expr = this.expressionGen.generateExpression(bodyNode);
        this.emit(`return ${expr};`);
      }
    }
    
    this.indent--;
    this.emit('},');
  }

  private emit(line: string): void {
    const indented = applyIndent(line, this.indent);
    this.output.push(indented);
  }
}
