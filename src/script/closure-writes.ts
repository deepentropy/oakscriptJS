/**
 * The variables of the script that an eachBar() callback changes outside itself (#196): an incremental run cannot put
 * them back to their value at the last confirmed bar, so a script with such a write is calculated in full.
 *
 * Read from the callback's source text (`fn.toString()`), with a tokenizer (strings, template literals, comments and
 * regular expressions skipped). A write is an assignment (`x = `, `x += `, `x++`...) or a change of a member
 * (`x.y = `, `x[i] = `, `x.push(...)` and the other mutating methods) whose root name is not declared inside the
 * callback. The `.value` of a persist() box (`dir.value = 1`) is not a write. Conservative: a name declared anywhere
 * inside the callback counts as its own (a shadowed outer write is missed); functions called by the callback are not
 * read.
 *
 * @internal
 */

const MUTATORS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin',
  'set', 'delete', 'clear', 'add',
]);

const KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export',
  'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super',
  'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'await', 'of', 'true', 'false',
  'null', 'undefined', 'async', 'static', 'get',
]);

type Token = { kind: 'id' | 'punct' | 'num' | 'str'; text: string };

/** Tokens of a JavaScript source: names, numbers, punctuators; strings, template literals, comments and regexes skipped. */
function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = src.length;
  const regexAllowed = (): boolean => {
    const last = out[out.length - 1];
    if (!last) return true;
    if (last.kind === 'num' || last.kind === 'str') return false;
    if (last.kind === 'id') return KEYWORDS.has(last.text) && !['this', 'super', 'true', 'false', 'null', 'undefined'].includes(last.text);
    return ![')', ']', '}'].includes(last.text);
  };
  while (i < n) {
    const ch = src[i]!;
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
    } else if (ch === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2);
      i = i < 0 ? n : i + 2;
    } else if (ch === '"' || ch === "'") {
      i++;
      while (i < n && src[i] !== ch) i += src[i] === '\\' ? 2 : 1;
      i++;
      out.push({ kind: 'str', text: '' });
    } else if (ch === '`') {
      // a template literal: its ${...} parts are tokenized as code
      i++;
      let depth = 0;
      const inner: string[] = [];
      let part = '';
      while (i < n) {
        if (depth === 0 && src[i] === '\\') {
          i += 2;
          continue;
        }
        if (depth === 0 && src[i] === '`') break;
        if (depth === 0 && src[i] === '$' && src[i + 1] === '{') {
          depth = 1;
          i += 2;
          continue;
        }
        if (depth > 0) {
          if (src[i] === '{') depth++;
          if (src[i] === '}' && --depth === 0) {
            inner.push(part);
            part = '';
            i++;
            continue;
          }
          part += src[i];
        }
        i++;
      }
      i++;
      out.push({ kind: 'str', text: '' });
      for (const code of inner) {
        out.push({ kind: 'punct', text: '(' });
        out.push(...tokenize(code));
        out.push({ kind: 'punct', text: ')' });
      }
    } else if (ch === '/' && regexAllowed()) {
      i++;
      let inClass = false;
      while (i < n && (src[i] !== '/' || inClass)) {
        if (src[i] === '\\') i++;
        else if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        i++;
      }
      i++;
      while (i < n && /[a-z]/i.test(src[i]!)) i++;
      out.push({ kind: 'str', text: '' });
    } else if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(src[j]!)) j++;
      out.push({ kind: 'id', text: src.slice(i, j) });
      i = j;
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < n && /[\w.]/.test(src[j]!)) j++;
      out.push({ kind: 'num', text: src.slice(i, j) });
      i = j;
    } else {
      const three = src.slice(i, i + 4);
      const op = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '&&=', '||=', '??=', '>>>', '=>', '==', '!=', '<=', '>=',
        '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>']
        .find((o) => three.startsWith(o));
      const text = op ?? ch;
      out.push({ kind: 'punct', text });
      i += text.length;
    }
  }
  return out;
}

const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '&&=', '||=', '??=']);

/** Names declared inside the tokens: let / const / var / function / class / catch, and parameters of functions. */
function declaredNames(t: Token[]): Set<string> {
  const names = new Set<string>();
  const addUntil = (start: number, stop: (tok: Token, depth: number) => boolean): void => {
    let depth = 0;
    for (let k = start; k < t.length; k++) {
      const tok = t[k]!;
      if (tok.kind === 'punct' && ['(', '[', '{'].includes(tok.text)) depth++;
      if (tok.kind === 'punct' && [')', ']', '}'].includes(tok.text)) {
        if (depth === 0) return;
        depth--;
      }
      if (stop(tok, depth)) return;
      // a default value or a computed key is not a name: skip to the next , at this depth
      if (tok.kind === 'id' && !KEYWORDS.has(tok.text) && t[k - 1]?.text !== '.' && t[k + 1]?.text !== ':') names.add(tok.text);
    }
  };
  for (let k = 0; k < t.length; k++) {
    const tok = t[k]!;
    if (tok.kind !== 'id') continue;
    if (tok.text === 'let' || tok.text === 'const' || tok.text === 'var') {
      // up to the end of the declaration: an = at depth 0 ends a name, a , starts the next one
      let depth = 0;
      let naming = true;
      for (let j = k + 1; j < t.length; j++) {
        const x = t[j]!;
        if (x.kind === 'punct' && ['(', '[', '{'].includes(x.text)) depth++;
        else if (x.kind === 'punct' && [')', ']', '}'].includes(x.text)) {
          if (depth === 0) break;
          depth--;
        } else if (depth === 0 && x.text === ';') break;
        else if (depth === 0 && x.text === '=') naming = false;
        else if (depth === 0 && x.text === ',') naming = true;
        else if (depth === 0 && (x.text === 'of' || x.text === 'in')) break;
        if (naming && x.kind === 'id' && !KEYWORDS.has(x.text) && t[j + 1]?.text !== ':') names.add(x.text);
        if (!naming && depth === 0 && x.kind === 'punct' && x.text === '=>' ) break;
      }
    } else if ((tok.text === 'function' || tok.text === 'class') && t[k + 1]?.kind === 'id') {
      names.add(t[k + 1]!.text);
    } else if (tok.text === 'catch' && t[k + 1]?.text === '(') {
      addUntil(k + 2, () => false);
    }
  }
  // parameters: ( ... ) => or function name ( ... ), and a single name before =>
  for (let k = 0; k < t.length; k++) {
    const tok = t[k]!;
    if (tok.text === '=>' && t[k - 1]?.kind === 'id') names.add(t[k - 1]!.text);
    if (tok.text === '=>' && t[k - 1]?.text === ')') {
      let depth = 0;
      let j = k - 1;
      for (; j >= 0; j--) {
        if (t[j]!.text === ')') depth++;
        else if (t[j]!.text === '(' && --depth === 0) break;
      }
      addUntil(j + 1, () => false);
    }
    if (tok.text === 'function') {
      let j = k + 1;
      if (t[j]?.kind === 'id') j++;
      if (t[j]?.text === '(') addUntil(j + 1, () => false);
    }
  }
  return names;
}

/** The names outside the function source `src` that it assigns or changes (empty: none found). */
export function outerWrites(src: string): string[] {
  const t = tokenize(src);
  const inside = declaredNames(t);
  const found = new Set<string>();
  for (let k = 0; k < t.length; k++) {
    const tok = t[k]!;
    if (tok.kind !== 'id' || KEYWORDS.has(tok.text) || inside.has(tok.text)) continue;
    const before = t[k - 1];
    if (before && (before.text === '.' || before.text === '?.')) continue; // a member, not a root name
    if (t[k + 1]?.text === ':' && (before?.text === '{' || before?.text === ',')) continue; // an object key
    // the member chain after the name: .a.b / [x] / ?.a
    let j = k + 1;
    let members = 0;
    let firstMember = '';
    let lastMember = '';
    while (j < t.length) {
      if ((t[j]!.text === '.' || t[j]!.text === '?.') && t[j + 1]?.kind === 'id') {
        lastMember = t[j + 1]!.text;
        if (members === 0) firstMember = lastMember;
        j += 2;
        members++;
      } else if (t[j]!.text === '[') {
        if (members === 0) firstMember = '[]';
        let depth = 0;
        for (; j < t.length; j++) {
          if (t[j]!.text === '[') depth++;
          else if (t[j]!.text === ']' && --depth === 0) break;
        }
        j++;
        members++;
        lastMember = '[]';
      } else break;
    }
    const next = t[j];
    // array.push(zones, x) (PineScript namespaces): the call changes its first argument
    if (NAMESPACES.has(tok.text) && members === 1 && next?.text === '(' && !READS.has(lastMember)) {
      const arg = t[j + 1];
      if (arg?.kind === 'id' && !inside.has(arg.text) && !KEYWORDS.has(arg.text)) {
        const box = t[j + 2]?.text === '.' && t[j + 3]?.text === 'value';
        if (!box) found.add(arg.text);
      }
      continue;
    }
    // the content of a persist() box (dir.value = 1, zones.value.push(x)) is put back by the runtime
    if (firstMember === 'value') continue;
    const written =
      (next && ASSIGN.has(next.text)) ||
      (next && (next.text === '++' || next.text === '--')) ||
      before?.text === '++' ||
      before?.text === '--' ||
      (members > 0 && MUTATORS.has(lastMember) && next?.text === '(');
    if (written) found.add(tok.text);
  }
  return [...found];
}

/** PineScript namespaces whose functions change their first argument */
const NAMESPACES = new Set(['array', 'matrix', 'map']);

/** Functions of those namespaces that only read their first argument */
const READS = new Set([
  'get', 'size', 'includes', 'indexof', 'lastindexof', 'sum', 'avg', 'max', 'min', 'median', 'mode', 'stdev',
  'variance', 'range', 'first', 'last', 'slice', 'copy', 'join', 'every', 'some', 'abs', 'binary_search',
  'binary_search_leftmost', 'binary_search_rightmost', 'covariance', 'percentile_linear_interpolation',
  'percentile_nearest_rank', 'percentrank', 'standardize', 'sort_indices', 'from', 'new', 'new_float', 'new_int',
  'new_bool', 'new_string', 'new_color', 'new_line', 'new_label', 'new_box', 'new_table', 'new_linefill',
  'contains', 'keys', 'values', 'rows', 'columns', 'elements_count', 'row', 'col', 'det', 'inv', 'pinv', 'rank',
  'trace', 'transpose', 'mult', 'diff', 'pow', 'eigenvalues', 'eigenvectors', 'kron', 'is_square', 'is_zero',
  'is_binary', 'is_symmetric', 'is_antisymmetric', 'is_diagonal', 'is_antidiagonal', 'is_identity', 'is_triangular',
  'is_stochastic',
]);
