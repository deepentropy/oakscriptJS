/**
 * Babel Plugin: Transform PineScript Operators to Series Method Calls
 *
 * This plugin enables writing Series operations with natural operators:
 *
 * Input:  const bop = (close - open) / (high - low)
 * Output: const bop = close.sub(open).div(high.sub(low))
 *
 * @module babel-plugin-pinescript-operators
 */

module.exports = function ({ types: t }) {
  // Built-in series identifiers from OakScriptJS
  const BUILTIN_SERIES = new Set([
    'close', 'open', 'high', 'low', 'volume',
    'hl2', 'hlc3', 'ohlc4', 'hlcc4',
    'bar_index'
  ]);

  // Operator to method name mapping
  const OPERATOR_TO_METHOD = {
    // Arithmetic
    '+': 'add',
    '-': 'sub',
    '*': 'mul',
    '/': 'div',
    '%': 'mod',

    // Comparison
    '>': 'gt',
    '<': 'lt',
    '>=': 'gte',
    '<=': 'lte',
    '===': 'eq',
    '==': 'eq',
    '!==': 'neq',
    '!=': 'neq',

    // Logical (will be converted to and/or/not)
    '&&': 'and',
    '||': 'or',
  };

  /**
   * Check if a node is likely a Series
   */
  function isSeries(node, scope) {
    // Check if it's a built-in series identifier
    if (t.isIdentifier(node) && BUILTIN_SERIES.has(node.name)) {
      return true;
    }

    // Check if it's a call expression that returns a Series (e.g., ta.sma(...))
    if (t.isCallExpression(node)) {
      const callee = node.callee;

      // ta.* functions return Series
      if (t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object) &&
          callee.object.name === 'ta') {
        return true;
      }

      // Series method calls return Series
      if (t.isMemberExpression(callee)) {
        return isSeries(callee.object, scope);
      }
    }

    // Check if it's a member expression on a Series (e.g., close.offset(1))
    if (t.isMemberExpression(node)) {
      return isSeries(node.object, scope);
    }

    // Check if it's a binary expression - if any operand is a Series, the result is a Series
    // This handles cases like: (close - open) / (high - low)
    if (t.isBinaryExpression(node)) {
      return isSeries(node.left, scope) || isSeries(node.right, scope);
    }

    // Check if it's a logical expression - if any operand is a Series, the result is a Series
    // This handles cases like: condition1 && condition2
    if (t.isLogicalExpression(node)) {
      return isSeries(node.left, scope) || isSeries(node.right, scope);
    }

    // Check if it's a unary expression - if the argument is a Series, the result is a Series
    // This handles cases like: -close or !condition
    if (t.isUnaryExpression(node)) {
      return isSeries(node.argument, scope);
    }

    // Check if variable is assigned from a Series
    if (t.isIdentifier(node)) {
      const binding = scope.getBinding(node.name);
      if (binding && binding.path.isVariableDeclarator()) {
        const init = binding.path.node.init;
        if (init) {
          return isSeries(init, scope);
        }
      }
    }

    return false;
  }

  /**
   * Transform binary expression to method call
   */
  function transformBinaryExpression(path) {
    const { left, right, operator } = path.node;
    const method = OPERATOR_TO_METHOD[operator];

    if (!method) {
      return; // Unknown operator, skip
    }

    const scope = path.scope;
    const leftIsSeries = isSeries(left, scope);
    const rightIsSeries = isSeries(right, scope);

    // Only transform if at least one operand is a Series
    if (!leftIsSeries && !rightIsSeries) {
      return;
    }

    // Transform: left OP right  →  left.method(right)
    const memberExpression = t.memberExpression(left, t.identifier(method));
    const callExpression = t.callExpression(memberExpression, [right]);

    path.replaceWith(callExpression);
  }

  /**
   * Transform unary expression (negation)
   */
  function transformUnaryExpression(path) {
    const { operator, argument } = path.node;
    const scope = path.scope;

    // Handle negation: -close → close.neg()
    if (operator === '-' && isSeries(argument, scope)) {
      const memberExpression = t.memberExpression(argument, t.identifier('neg'));
      const callExpression = t.callExpression(memberExpression, []);
      path.replaceWith(callExpression);
      return;
    }

    // Handle logical NOT: !condition → condition.not()
    if (operator === '!' && isSeries(argument, scope)) {
      const memberExpression = t.memberExpression(argument, t.identifier('not'));
      const callExpression = t.callExpression(memberExpression, []);
      path.replaceWith(callExpression);
      return;
    }
  }

  /**
   * Transform logical expressions (&&, ||)
   */
  function transformLogicalExpression(path) {
    const { left, right, operator } = path.node;
    const method = OPERATOR_TO_METHOD[operator];

    if (!method) {
      return;
    }

    const scope = path.scope;
    const leftIsSeries = isSeries(left, scope);
    const rightIsSeries = isSeries(right, scope);

    if (!leftIsSeries && !rightIsSeries) {
      return;
    }

    // Transform: left && right  →  left.and(right)
    const memberExpression = t.memberExpression(left, t.identifier(method));
    const callExpression = t.callExpression(memberExpression, [right]);

    path.replaceWith(callExpression);
  }

  /**
   * Transform member expression (array subscript to offset method)
   */
  function transformMemberExpression(path) {
    const { object, property, computed } = path.node;

    // Only transform computed member expressions (src[len])
    // Skip dot notation (src.method)
    if (!computed) {
      return;
    }

    const scope = path.scope;

    // Only transform if object is a Series
    if (!isSeries(object, scope)) {
      return;
    }

    // Transform: object[property]  →  object.offset(property)
    const offsetCall = t.callExpression(
      t.memberExpression(object, t.identifier('offset')),
      [property]
    );

    path.replaceWith(offsetCall);
  }

  return {
    name: 'pinescript-operators',
    visitor: {
      BinaryExpression(path) {
        transformBinaryExpression(path);
      },

      UnaryExpression(path) {
        transformUnaryExpression(path);
      },

      LogicalExpression(path) {
        transformLogicalExpression(path);
      },

      MemberExpression(path) {
        transformMemberExpression(path);
      },
    },
  };
};
