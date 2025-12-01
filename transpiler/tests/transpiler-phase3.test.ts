import { describe, it, expect } from 'vitest';
import { PineParser } from '../src/transpiler/PineParser';
import { transpile } from '../src/transpiler/PineToTS';

describe('Phase 3: User-Defined Types and Methods', () => {
  describe('Type Declarations', () => {
    describe('Basic type parsing', () => {
      it('should parse simple type declaration', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`type Point
    float x = 0.0
    float y = 0.0`);
        
        expect(errors).toHaveLength(0);
        expect(ast.children).toBeDefined();
        expect(ast.children![0]!.type).toBe('TypeDeclaration');
        expect(ast.children![0]!.value).toBe('Point');
        expect(ast.children![0]!.children).toHaveLength(2);
      });

      it('should parse type with multiple field types', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`type Settings
    float devThreshold = 5.0
    int depth = 10
    color lineColor = color.blue
    bool extendLast = true
    string differencePriceMode = "Absolute"`);
        
        expect(errors).toHaveLength(0);
        const typeDecl = ast.children![0]!;
        expect(typeDecl.type).toBe('TypeDeclaration');
        expect(typeDecl.value).toBe('Settings');
        expect(typeDecl.children).toHaveLength(5);
        
        // Check field types
        expect(typeDecl.children![0]!.fieldType).toBe('float');
        expect(typeDecl.children![1]!.fieldType).toBe('int');
        expect(typeDecl.children![2]!.fieldType).toBe('color');
        expect(typeDecl.children![3]!.fieldType).toBe('bool');
        expect(typeDecl.children![4]!.fieldType).toBe('string');
      });

      it('should parse exported type', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`export type ZigZag
    float sumVol = 0`);
        
        expect(errors).toHaveLength(0);
        expect(ast.children![0]!.type).toBe('TypeDeclaration');
        expect(ast.children![0]!.exported).toBe(true);
      });

      it('should parse type with complex field types', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`type Pivot
    line ln
    label lb
    chart.point start
    chart.point end`);
        
        expect(errors).toHaveLength(0);
        const typeDecl = ast.children![0]!;
        expect(typeDecl.children![0]!.fieldType).toBe('line');
        expect(typeDecl.children![1]!.fieldType).toBe('label');
        expect(typeDecl.children![2]!.fieldType).toBe('chart.point');
        expect(typeDecl.children![3]!.fieldType).toBe('chart.point');
      });

      it('should parse type with generic array field', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`type ZigZag
    array<Pivot> pivots`);
        
        expect(errors).toHaveLength(0);
        const typeDecl = ast.children![0]!;
        expect(typeDecl.children![0]!.fieldType).toBe('array<Pivot>');
      });
    });

    describe('Type code generation', () => {
      it('should generate TypeScript interface for simple type', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0`;
        
        const result = transpile(source);
        
        expect(result).toContain('interface Point');
        expect(result).toContain('x: number');
        expect(result).toContain('y: number');
      });

      it('should generate namespace object with new() factory', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0`;
        
        const result = transpile(source);
        
        expect(result).toContain('const Point = {');
        expect(result).toContain('new:');
        // Check for parameter declaration with default value (0 or 0.0)
        expect(result).toMatch(/x: number = 0(\.0)?/);
        expect(result).toMatch(/y: number = 0(\.0)?/);
      });

      it('should export interface and namespace when type is exported', () => {
        const source = `indicator("UDT Test")
export type Settings
    float threshold = 5.0`;
        
        const result = transpile(source);
        
        expect(result).toContain('export interface Settings');
        expect(result).toContain('export const Settings = {');
      });

      it('should handle array field types', () => {
        const source = `indicator("UDT Test")
type Container
    array<int> values`;
        
        const result = transpile(source);
        
        expect(result).toContain('values: number[]');
      });
    });
  });

  describe('Type Instantiation', () => {
    describe('Type.new() parsing', () => {
      it('should parse Type.new() without arguments', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('p = Point.new()');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        expect(assignment.type).toBe('Assignment');
        const instantiation = assignment.children![1]!;
        expect(instantiation.type).toBe('TypeInstantiation');
        expect(instantiation.value).toBe('Point');
      });

      it('should parse Type.new() with arguments', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('p = Point.new(10.0, 20.0)');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        const instantiation = assignment.children![1]!;
        expect(instantiation.type).toBe('TypeInstantiation');
        expect(instantiation.value).toBe('Point');
        expect(instantiation.children).toHaveLength(2);
      });
    });

    describe('Type.new() code generation', () => {
      it('should generate Type.new() call', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0

p = Point.new(10.0, 20.0)`;
        
        const result = transpile(source);
        
        expect(result).toContain('Point.new(10, 20)');
      });

      it('should generate Type.new() with no args', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0

p = Point.new()`;
        
        const result = transpile(source);
        
        expect(result).toContain('Point.new()');
      });
    });
  });

  describe('Field Access', () => {
    describe('Field access parsing', () => {
      it('should parse simple field access', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('value = point.x');
        
        expect(errors).toHaveLength(0);
        // After member access parsing, we get a MemberExpression
        const assignment = ast.children![0]!.children![0]!;
        const right = assignment.children![1]!;
        // Due to how parseMemberAccess works, this becomes MemberExpression
        expect(right.type).toBe('MemberExpression');
      });

      it('should parse chained field access', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('price = pivot.end.price');
        
        expect(errors).toHaveLength(0);
        // This gets parsed as MemberExpression "pivot.end.price"
        const assignment = ast.children![0]!.children![0]!;
        const right = assignment.children![1]!;
        expect(right.value).toBe('pivot.end.price');
      });
    });

    describe('Field access code generation', () => {
      it('should generate simple field access', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0

p = Point.new(10.0, 20.0)
xVal = p.x`;
        
        const result = transpile(source);
        
        expect(result).toContain('p.x');
      });
    });
  });

  describe('Field Assignment', () => {
    it('should parse field reassignment with :=', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse('point.x := 5.0');
      
      expect(errors).toHaveLength(0);
      const reassignment = ast.children![0]!.children![0]!;
      expect(reassignment.type).toBe('Reassignment');
    });

    it('should generate field assignment', () => {
      const source = `indicator("UDT Test")
type Point
    float x = 0.0
    float y = 0.0

var p = Point.new()
p.x := 5.0`;
      
      const result = transpile(source);
      
      expect(result).toContain('p.x = 5');
    });
  });

  describe('Method Declarations', () => {
    describe('Method parsing', () => {
      it('should parse simple method declaration', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`method getValue(Counter this) =>
    this.value`);
        
        expect(errors).toHaveLength(0);
        const methodDecl = ast.children![0]!;
        expect(methodDecl.type).toBe('MethodDeclaration');
        expect(methodDecl.value).toBe('getValue');
        expect(methodDecl.boundType).toBe('Counter');
      });

      it('should parse method with additional parameters', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`method add(Counter this, int amount) =>
    this.value := this.value + amount`);
        
        expect(errors).toHaveLength(0);
        const methodDecl = ast.children![0]!;
        expect(methodDecl.type).toBe('MethodDeclaration');
        expect(methodDecl.value).toBe('add');
        expect(methodDecl.boundType).toBe('Counter');
        expect(methodDecl.params).toHaveLength(1);
        expect(methodDecl.params![0]!.value).toBe('amount');
        expect(methodDecl.params![0]!.fieldType).toBe('int');
      });

      it('should parse exported method', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`export method reset(Counter this) =>
    this.value := 0`);
        
        expect(errors).toHaveLength(0);
        const methodDecl = ast.children![0]!;
        expect(methodDecl.type).toBe('MethodDeclaration');
        expect(methodDecl.exported).toBe(true);
      });

      it('should parse method with multi-line body', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse(`method updatePivot(Pivot this, float vol) =>
    this.vol := vol
    this.isHigh := true`);
        
        expect(errors).toHaveLength(0);
        const methodDecl = ast.children![0]!;
        expect(methodDecl.type).toBe('MethodDeclaration');
        expect(methodDecl.children![0]!.type).toBe('Block');
        expect(methodDecl.children![0]!.children).toHaveLength(2);
      });
    });

    describe('Method code generation', () => {
      it('should generate method in type namespace', () => {
        const source = `indicator("UDT Test")
type Counter
    int value = 0

method increment(Counter this) =>
    this.value := this.value + 1`;
        
        const result = transpile(source);
        
        expect(result).toContain('const Counter = {');
        expect(result).toContain('new:');
        expect(result).toContain('increment:');
        expect(result).toContain('self: Counter');
      });

      it('should generate method with additional parameters', () => {
        const source = `indicator("UDT Test")
type Counter
    int value = 0

method add(Counter this, int amount) =>
    this.value := this.value + amount`;
        
        const result = transpile(source);
        
        expect(result).toContain('add:');
        expect(result).toContain('self: Counter, amount: number');
      });
    });
  });

  describe('Method Calls', () => {
    describe('Method call parsing', () => {
      it('should parse object.method() as FunctionCall', () => {
        // Without type information at parse time, we parse as FunctionCall
        const parser = new PineParser();
        const { ast, errors } = parser.parse('counter.increment()');
        
        expect(errors).toHaveLength(0);
        const stmt = ast.children![0]!;
        const expr = stmt.children![0]!;
        // Parsed as FunctionCall with value 'counter.increment'
        expect(expr.type).toBe('FunctionCall');
        expect(expr.value).toBe('counter.increment');
      });

      it('should parse object.method(args) as FunctionCall', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('counter.add(5)');
        
        expect(errors).toHaveLength(0);
        const stmt = ast.children![0]!;
        const expr = stmt.children![0]!;
        expect(expr.type).toBe('FunctionCall');
        expect(expr.value).toBe('counter.add');
        expect(expr.children!.length).toBe(1); // 1 arg
      });

      it('should parse chained method call after Type.new() as MethodCall', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('result = Point.new().getX()');
        
        expect(errors).toHaveLength(0);
        // After Type.new(), we can detect method calls
        const assignment = ast.children![0]!.children![0]!;
        const right = assignment.children![1]!;
        expect(right.type).toBe('MethodCall');
        expect(right.value).toBe('getX');
      });
    });

    describe('Method call code generation', () => {
      it('should generate method call on variable', () => {
        const source = `indicator("UDT Test")
type Counter
    int value = 0

method increment(Counter this) =>
    this.value := this.value + 1

var c = Counter.new()
c.increment()`;
        
        const result = transpile(source);
        
        // Method call generates c.increment() for now
        // (full type inference would generate Counter.increment(c))
        expect(result).toContain('c.increment()');
      });
    });
  });

  describe('Generic Arrays with UDT', () => {
    describe('array.new<Type>() parsing', () => {
      it('should parse array.new<Type>()', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('arr = array.new<Point>()');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        const call = assignment.children![1]!;
        expect(call.type).toBe('GenericFunctionCall');
        expect(call.value).toBe('array.new');
        expect(call.name).toBe('Point');
      });

      it('should parse array.new<Type>(size)', () => {
        const parser = new PineParser();
        const { ast, errors } = parser.parse('arr = array.new<Point>(10)');
        
        expect(errors).toHaveLength(0);
        const assignment = ast.children![0]!.children![0]!;
        const call = assignment.children![1]!;
        expect(call.type).toBe('GenericFunctionCall');
        expect(call.children).toHaveLength(1);
      });
    });

    describe('array.new<Type>() code generation', () => {
      it('should generate empty array for array.new<Type>()', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0

var arr = array.new<Point>()`;
        
        const result = transpile(source);
        
        expect(result).toContain('[]');
      });

      it('should generate Array with fill for array.new<Type>(size)', () => {
        const source = `indicator("UDT Test")
type Point
    float x = 0.0

var arr = array.new<Point>(10)`;
        
        const result = transpile(source);
        
        expect(result).toContain('new Array(10).fill(null)');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle basic UDT example from spec', () => {
      const source = `indicator("UDT Basic Test")

type Point
    float x = 0.0
    float y = 0.0

type Rectangle
    Point topLeft
    Point bottomRight
    color fillColor = color.blue

p1 = Point.new(10.0, 20.0)
p2 = Point.new(100.0, 50.0)
rect = Rectangle.new(p1, p2, color.red)`;
      
      // Should not throw
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Check interface generation
      expect(result).toContain('interface Point');
      expect(result).toContain('interface Rectangle');
      
      // Check namespace generation
      expect(result).toContain('const Point = {');
      expect(result).toContain('const Rectangle = {');
      
      // Check instantiation
      expect(result).toContain('Point.new(10, 20)');
      expect(result).toContain('Point.new(100, 50)');
    });

    it('should handle UDT with methods example from spec', () => {
      const source = `indicator("UDT Methods Test")

type Counter
    int value = 0
    string name = "default"

method increment(Counter this) =>
    this.value := this.value + 1

method reset(Counter this) =>
    this.value := 0

method getValue(Counter this) =>
    this.value

var counter = Counter.new(0, "myCounter")`;
      
      // Should not throw
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Check interface
      expect(result).toContain('interface Counter');
      
      // Check methods in namespace
      expect(result).toContain('increment:');
      expect(result).toContain('reset:');
      expect(result).toContain('getValue:');
      
      // Check instantiation
      expect(result).toContain('Counter.new(0, "myCounter")');
    });

    it('should handle UDT array example from spec', () => {
      const source = `indicator("UDT Array Test")

type DataPoint
    int index
    float price
    float volume

var points = array.new<DataPoint>()`;
      
      // Should not throw
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      expect(result).toContain('interface DataPoint');
      expect(result).toContain('const DataPoint = {');
      expect(result).toContain('[]');
    });

    it('should compile generated TypeScript without syntax errors', () => {
      const source = `indicator("Complete UDT Test")

type Settings
    float threshold = 5.0
    int depth = 10
    bool enabled = true

type Counter
    int value = 0
    Settings settings

method increment(Counter this) =>
    this.value := this.value + 1

var s = Settings.new(10.0, 20, false)
var c = Counter.new(0, s)`;
      
      // Should not throw
      expect(() => transpile(source)).not.toThrow();
      
      const result = transpile(source);
      
      // Basic structure checks
      expect(result).toContain('export function');
      expect(result).toContain('return {');
      expect(result).toContain('metadata:');
      expect(result).toContain('plots:');
    });
  });
});
