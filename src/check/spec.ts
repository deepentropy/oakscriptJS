/**
 * @fileoverview The spec of a check (what the user asked for), described once: {@link validateSpec} rejects unknown
 * keys and wrong values (a misspelt key would otherwise be skipped and the check would pass without checking it), and
 * {@link specJsonSchema} gives the JSON Schema of a spec file (`skills/oakscript/spec.schema.json`).
 *
 * @module check/spec
 */

type Field =
  | { kind: 'string' | 'number' | 'boolean' | 'any' | 'string[]'; doc: string }
  | { kind: 'enum'; values: readonly string[]; doc: string }
  | { kind: 'object'; fields: Record<string, Field>; doc: string; required?: readonly string[] }
  | { kind: 'map'; of: Field; doc: string }
  | { kind: 'outputs'; doc: string };

const num = (doc: string): Field => ({ kind: 'number', doc });

export const INPUT_TYPES = ['int', 'float', 'bool', 'string', 'text_area', 'source', 'color', 'timeframe', 'session', 'time', 'symbol'] as const;
export const OUTPUT_KINDS = ['plot', 'shape', 'char', 'arrow', 'candle', 'bar', 'hline', 'bgcolor', 'barcolor', 'alertcondition'] as const;

/** The keys of a spec checked by checkScript. */
export const SPEC_FIELDS: Record<string, Field> = {
  kind: { kind: 'enum', values: ['indicator', 'strategy'], doc: 'indicator() or strategy()' },
  title: { kind: 'string', doc: 'the title of the declaration' },
  overlay: { kind: 'boolean', doc: 'true: price pane, false: own pane' },
  inputs: {
    kind: 'map',
    doc: 'inputs that must exist, by id or title',
    of: {
      kind: 'object',
      doc: 'the expected input',
      fields: {
        type: { kind: 'enum', values: INPUT_TYPES, doc: 'input type' },
        defval: { kind: 'any', doc: 'default value' },
        title: { kind: 'string', doc: 'title' },
        min: num('minval'),
        max: num('maxval'),
        options: { kind: 'string[]', doc: 'the choices of a string input' },
      },
    },
  },
  outputs: { kind: 'outputs', doc: 'outputs that must exist: a title, or { title, kind }' },
  plots: {
    kind: 'map',
    doc: 'value checks per plot, by id or title',
    of: {
      kind: 'object',
      doc: 'the expected values',
      fields: { min: num('every value is at least this'), max: num('every value is at most this'), warmup: num('the first value comes at this bar index or before') },
    },
  },
  signals: {
    kind: 'map',
    doc: 'count checks per signal (shape, char, arrow, alertcondition, bgcolor, barcolor), by id or title',
    of: {
      kind: 'object',
      doc: 'the expected count',
      fields: {
        min: num('at least this many bars'),
        max: num('at most this many bars'),
        minShare: num('at least this share of the bars (0 to 1)'),
        maxShare: num('at most this share of the bars (0 to 1)'),
      },
    },
  },
  trades: { kind: 'object', doc: 'closed trades of a strategy', fields: { min: num('at least'), max: num('at most') } },
};

/** The keys of a spec file read by the `oakscript check` command (paths relative to the spec file). */
export const SPEC_FILE_FIELDS: Record<string, Field> = {
  $schema: { kind: 'string', doc: 'the JSON Schema of the spec (oakscriptjs/skills/oakscript/spec.schema.json)' },
  reference: { kind: 'string', doc: 'CSV of expected values per bar (a time column, one column per plot)' },
  export: { kind: 'string', doc: 'chart export CSV: the bars (time, open, high, low, close, volume) and the expected plot values' },
  tolerance: num('relative tolerance of the reference values (default 1e-10)'),
  checks: { kind: 'string', doc: 'JavaScript file of behaviour checks (the body of a function of `t`)' },
  scenarios: { kind: 'boolean', doc: 'also run on the built-in edge-case bars' },
};

function closest(name: string, names: string[]): string | undefined {
  const dist = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let diag = row[0]!;
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const up = row[j]!;
        row[j] = Math.min(up + 1, row[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
        diag = up;
      }
    }
    return row[b.length]!;
  };
  const n = name.toLowerCase();
  const best = names.map((k) => ({ k, d: dist(n, k.toLowerCase()) })).sort((a, b) => a.d - b.d)[0];
  if (!best) return undefined;
  return best.d <= Math.max(2, Math.floor(name.length / 2)) || best.k.toLowerCase().startsWith(n.slice(0, 3)) ? best.k : undefined;
}

function check(value: unknown, field: Field, path: string, errors: string[]): void {
  const fail = (what: string): void => {
    errors.push(`${path}: ${what}`);
  };
  switch (field.kind) {
    case 'any':
      return;
    case 'string':
    case 'number':
    case 'boolean':
      if (typeof value !== field.kind || (field.kind === 'number' && !Number.isFinite(value))) fail(`expected a ${field.kind}, got ${JSON.stringify(value)}`);
      return;
    case 'string[]':
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) fail(`expected an array of strings, got ${JSON.stringify(value)}`);
      return;
    case 'enum':
      if (typeof value !== 'string' || !field.values.includes(value)) fail(`expected one of ${field.values.join(', ')}, got ${JSON.stringify(value)}`);
      return;
    case 'outputs':
      if (!Array.isArray(value)) return fail('expected an array of titles or { title, kind }');
      value.forEach((o, k) => {
        if (typeof o === 'string') return;
        check(o, { kind: 'object', doc: '', required: ['title'], fields: { title: { kind: 'string', doc: '' }, kind: { kind: 'enum', values: OUTPUT_KINDS, doc: '' } } }, `${path}[${k}]`, errors);
      });
      return;
    case 'map':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail('expected an object (name -> checks)');
      for (const [k, v] of Object.entries(value)) check(v, field.of, `${path}.${k}`, errors);
      return;
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail('expected an object');
      const keys = Object.keys(field.fields);
      for (const [k, v] of Object.entries(value)) {
        const f = field.fields[k];
        if (!f) {
          const near = closest(k, keys);
          fail(`unknown key "${k}"${near ? ` (did you mean "${near}"?)` : ''}; the keys are ${keys.join(', ')}`);
        } else check(v, f, `${path}.${k}`, errors);
      }
      for (const r of field.required ?? []) if (!(r in (value as object))) fail(`"${r}" is required`);
      return;
    }
  }
}

/**
 * The problems of a spec: unknown keys (with the closest key) and wrong values, one message per problem; empty when the
 * spec is valid. `file`: also accept the keys of a spec file (reference, export, tolerance, checks, scenarios).
 */
export function validateSpec(spec: unknown, options: { file?: boolean } = {}): string[] {
  const errors: string[] = [];
  const fields = options.file ? { ...SPEC_FIELDS, ...SPEC_FILE_FIELDS } : SPEC_FIELDS;
  check(spec, { kind: 'object', doc: '', fields }, 'spec', errors);
  return errors;
}

function schemaOf(field: Field): Record<string, unknown> {
  const description = field.doc ? { description: field.doc } : {};
  switch (field.kind) {
    case 'any':
      return { ...description };
    case 'string':
    case 'number':
    case 'boolean':
      return { type: field.kind, ...description };
    case 'string[]':
      return { type: 'array', items: { type: 'string' }, ...description };
    case 'enum':
      return { enum: [...field.values], ...description };
    case 'outputs':
      return {
        type: 'array',
        ...description,
        items: {
          oneOf: [
            { type: 'string' },
            { type: 'object', additionalProperties: false, required: ['title'], properties: { title: { type: 'string' }, kind: { enum: [...OUTPUT_KINDS] } } },
          ],
        },
      };
    case 'map':
      return { type: 'object', ...description, additionalProperties: schemaOf(field.of) };
    case 'object':
      return {
        type: 'object',
        ...description,
        additionalProperties: false,
        ...(field.required ? { required: [...field.required] } : {}),
        properties: Object.fromEntries(Object.entries(field.fields).map(([k, f]) => [k, schemaOf(f)])),
      };
  }
}

/** JSON Schema (draft 2020-12) of a spec file of `oakscript check`. */
export function specJsonSchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'oakscript check spec',
    description: 'What the user asked for, checked by `oakscript check --spec`: every given entry is checked, an unknown key is an error.',
    ...schemaOf({ kind: 'object', doc: '', fields: { ...SPEC_FIELDS, ...SPEC_FILE_FIELDS } }),
  };
}
