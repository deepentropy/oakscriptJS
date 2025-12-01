import { describe, it, expect } from 'vitest';
import { PineParser } from '../src/transpiler/PineParser';
import { transpile } from '../src/transpiler/PineToTS';

describe('Phase 1: Core Language Features', () => {
  describe('Reassignment Operator `:=`', () => {
    it('should parse `:=` reassignment', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse('counter := counter + 1');
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('ExpressionStatement');
      expect(ast.children![0]!.children![0]!.type).toBe('Reassignment');
    });

    it('should transpile `:=` to assignment', () => {
      const source = `indicator("Test")
var counter = 0
counter := counter + 1`;
      
      const result = transpile(source);
      
      expect(result).toContain('const counter = 0');
      expect(result).toContain('counter = (counter + 1)');  // Expression has parentheses
    });
  });

  describe('Ternary Operator `?:`', () => {
    it('should parse ternary expression', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse('x = condition ? 1 : 2');
      
      expect(errors).toHaveLength(0);
    });

    it('should transpile ternary expression', () => {
      const source = `indicator("Test")
color = close > open ? 1 : 0`;
      
      const result = transpile(source);
      
      expect(result).toContain('close.gt(open) ? 1 : 0');
    });
  });

  describe('History Operator `[n]`', () => {
    it('should parse history access', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse('prevClose = close[1]');
      
      expect(errors).toHaveLength(0);
      const assignment = ast.children![0]!.children![0]!;
      expect(assignment.type).toBe('Assignment');
      const rightSide = assignment.children![1]!;
      expect(rightSide.type).toBe('HistoryAccess');
    });

    it('should transpile history access to `.get()`', () => {
      const source = `indicator("Test")
prevClose = close[1]
highFive = high[5]`;
      
      const result = transpile(source);
      
      expect(result).toContain('close.get(1)');
      expect(result).toContain('high.get(5)');
    });

    it('should handle dynamic history index', () => {
      const source = `indicator("Test")
idx = 3
value = close[idx]`;
      
      const result = transpile(source);
      
      expect(result).toContain('close.get(idx)');
    });
  });

  describe('If/Else Statements', () => {
    it('should parse simple if statement', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`if close > open
    x := 1`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('IfStatement');
    });

    it('should parse if/else statement', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`if close > open
    x := 1
else
    x := 0`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('IfStatement');
      expect(ast.children![0]!.children!.length).toBe(3); // condition, if-body, else-body
    });

    it('should transpile if/else to TypeScript', () => {
      const source = `indicator("Test")
var x = 0
if close > open
    x := 1
else
    x := 0`;
      
      const result = transpile(source);
      
      expect(result).toContain('if (close.gt(open)) {');
      expect(result).toContain('x = 1');
      expect(result).toContain('} else {');
      expect(result).toContain('x = 0');
    });

    it('should parse if/else if/else chain', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`if condition1
    x := 1
else if condition2
    x := 2
else
    x := 0`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('IfStatement');
    });
  });

  describe('For Loops', () => {
    it('should parse standard for loop', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for i = 0 to 10
    sum := sum + i`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('ForLoop');
      expect(ast.children![0]!.name).toBe('i');
    });

    it('should parse for loop with step', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for i = 0 to 10 by 2
    sum := sum + i`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('ForLoop');
      expect(ast.children![0]!.step).toBeDefined();
    });

    it('should transpile standard for loop', () => {
      const source = `indicator("Test")
var sum = 0
for i = 0 to 10
    sum := sum + i`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (let i = 0; i <= 10; i += 1)');
      expect(result).toContain('sum = (sum + i)');  // Expression has parentheses
    });

    it('should transpile for loop with step', () => {
      const source = `indicator("Test")
var sum = 0
for i = 0 to 10 by 2
    sum := sum + i`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (let i = 0; i <= 10; i += 2)');
    });

    it('should parse for-in loop', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for item in myArray
    total := total + item`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('ForInLoop');
      expect(ast.children![0]!.name).toBe('item');
    });

    it('should transpile for-in loop', () => {
      const source = `indicator("Test")
var total = 0
for item in myArray
    total := total + item`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (const item of myArray)');
    });

    it('should parse for-in loop with index destructuring', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for [index, item] in myArray
    total := total + item`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('ForInLoop');
      expect(ast.children![0]!.name).toBe('index,item');
    });

    it('should transpile for-in loop with index destructuring', () => {
      const source = `indicator("Test")
var total = 0
for [index, item] in myArray
    total := total + item`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (const [index, item] of myArray.entries())');
    });
  });

  describe('While Loops', () => {
    it('should parse while loop', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`while condition
    x := x + 1`);
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('WhileLoop');
    });

    it('should transpile while loop', () => {
      const source = `indicator("Test")
var x = 0
while x < 10
    x := x + 1`;
      
      const result = transpile(source);
      
      expect(result).toContain('while ((x < 10))');
      expect(result).toContain('x = (x + 1)');  // The transpiler adds parentheses around expressions
    });
  });

  describe('Switch Expressions', () => {
    it('should parse switch expression', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`switch maType
    "SMA" => 1
    "EMA" => 2
    => 0`);
      
      expect(errors).toHaveLength(0);
      // Switch is wrapped in ExpressionStatement
      expect(ast.children![0]!.type).toBe('ExpressionStatement');
      expect(ast.children![0]!.children![0]!.type).toBe('SwitchExpression');
    });

    it('should transpile switch expression', () => {
      const source = `indicator("Test")
maType = "SMA"
ma = switch maType
    "SMA" => 1
    "EMA" => 2
    => 0`;
      
      const result = transpile(source);
      
      expect(result).toContain('switch (maType)');
      expect(result).toContain('case "SMA": return 1');
      expect(result).toContain('case "EMA": return 2');
      expect(result).toContain('default: return 0');
    });
  });

  describe('Tuple Destructuring', () => {
    it('should parse tuple destructuring', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse('[a, b, c] = someFunction()');
      
      expect(errors).toHaveLength(0);
      expect(ast.children![0]!.type).toBe('TupleDestructuring');
      expect(ast.children![0]!.name).toBe('a,b,c');
    });

    it('should transpile tuple destructuring', () => {
      const source = `indicator("Test")
[macdLine, signalLine, hist] = ta.macd(close, 12, 26, 9)`;
      
      const result = transpile(source);
      
      // The transpiler outputs without spaces after commas
      expect(result).toContain('const [macdLine,signalLine,hist] = ta.macd(close, 12, 26, 9)');
    });
  });

  describe('Break and Continue Statements', () => {
    it('should parse break statement', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for i = 0 to 10
    if condition
        break`);
      
      expect(errors).toHaveLength(0);
    });

    it('should parse continue statement', () => {
      const parser = new PineParser();
      const { ast, errors } = parser.parse(`for i = 0 to 10
    if condition
        continue`);
      
      expect(errors).toHaveLength(0);
    });

    it('should transpile break statement', () => {
      const source = `indicator("Test")
for i = 0 to 10
    if i > 5
        break`;
      
      const result = transpile(source);
      
      expect(result).toContain('break;');
    });

    it('should transpile continue statement', () => {
      const source = `indicator("Test")
for i = 0 to 10
    if i < 5
        continue`;
      
      const result = transpile(source);
      
      expect(result).toContain('continue;');
    });
  });

  describe('Integration Tests', () => {
    it('should handle simple RSI indicator with if/else', () => {
      const source = `indicator("If/Else Test")
var color barColor = 0

if close > open
    barColor := 1
else if close < open
    barColor := 2
else
    barColor := 0

plot(close)`;
      
      const result = transpile(source);
      
      expect(result).toContain('if (close.gt(open))');
      expect(result).toContain('barColor = 1');
      expect(result).toContain('else if (close.lt(open))');
      expect(result).toContain('barColor = 2');
      expect(result).toContain('barColor = 0');
    });

    it('should handle for loop with history access', () => {
      const source = `indicator("For Loop Test")
length = 14
var sum = 0

for i = 0 to length
    sum := sum + close[i]

customSMA = sum / length
plot(customSMA)`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (let i = 0; i <= length; i += 1)');
      expect(result).toContain('close.get(i)');
      expect(result).toContain('sum / length');
    });

    it('should handle tuple destructuring with MACD', () => {
      const source = `indicator("Tuple Test")
[macdLine, signalLine, hist] = ta.macd(close, 12, 26, 9)
plot(macdLine)`;
      
      const result = transpile(source);
      
      // The transpiler outputs without spaces after commas
      expect(result).toContain('const [macdLine,signalLine,hist] = ta.macd(close, 12, 26, 9)');
    });

    it('should handle nested control structures', () => {
      const source = `indicator("Nested Test")
var total = 0

for i = 0 to 10
    if i > 5
        total := total + 1
    else
        total := total + 2`;
      
      const result = transpile(source);
      
      expect(result).toContain('for (let i = 0; i <= 10; i += 1)');
      expect(result).toContain('if ((i > 5))');
      expect(result).toContain('} else {');
    });
  });
});
