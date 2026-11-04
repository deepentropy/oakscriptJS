/**
 * @fileoverview The check report as text (the output of `oakscript check`) and {@link assertCheck}, which throws it
 * from a test of any test runner.
 *
 * @module check/format
 */
import type { CheckReport } from './index.js';

const fmt = (v: number | null | undefined): string =>
  v === null || v === undefined ? 'na' : Number.isInteger(v) ? String(v) : Number(v.toPrecision(6)).toString();

const shown = (v: unknown): string => (v === undefined ? 'nothing' : JSON.stringify(v));

/** The report as text, for a terminal or an agent. `file` and `typesSkipped` come from the command. */
export function formatReport(r: CheckReport & { file?: string; typesSkipped?: string }): string {
  const file = r.file ?? 'script';
  const out: string[] = [];
  out.push(`oakscript check ${file}: ${r.bars.count} ${r.bars.synthetic ? 'synthetic ' : ''}bars, timeframe ${r.bars.timeframe}`);
  const d = r.declaration;
  if (d) {
    out.push(`${d.kind} "${d.title}"${d.overlay ? ' (overlay)' : ' (own pane)'}`);
    if (d.inputs.length) {
      out.push('inputs:');
      for (const i of d.inputs) {
        const extra = [i.options ? `options ${i.options.join(' | ')}` : '', i.min !== undefined ? `min ${i.min}` : '', i.max !== undefined ? `max ${i.max}` : '']
          .filter(Boolean)
          .join(', ');
        out.push(`  ${i.id} (${i.type}) = ${JSON.stringify(i.defval)}${i.title ? `  "${i.title}"` : ''}${extra ? `  ${extra}` : ''}`);
      }
    }
  }
  if (r.plots.length || r.signals.length) out.push('outputs:');
  for (const p of r.plots) {
    out.push(
      p.values
        ? `  plot   "${p.title}": ${p.values} values from bar ${p.firstBar}, ${fmt(p.min)} .. ${fmt(p.max)}, last ${p.last.map(fmt).join(' ')}${p.colours ? `, ${p.colours} colours` : ''}`
        : `  plot   "${p.title}": no value`
    );
  }
  for (const s of r.signals) {
    out.push(`  ${s.kind.padEnd(6)} "${s.title}": ${s.count} bars (${(s.share * 100).toFixed(1)} %)${s.count ? `, first ${s.firstBar}, last ${s.lastBar}` : ''}`);
  }
  const dr = Object.entries(r.drawings).filter(([, n]) => n > 0);
  if (dr.length) out.push(`drawings: ${dr.map(([k, n]) => `${n} ${k}`).join(', ')}`);
  if (r.alertCalls) out.push(`alert() calls: ${r.alertCalls}`);
  if (r.strategy) {
    const s = r.strategy;
    out.push(`strategy: ${s.closedTrades} closed trades${s.openTrade ? ' + 1 open' : ''}, ${s.wins} wins, net profit ${fmt(s.netProfit)}`);
    for (const t of s.first) {
      out.push(`  ${t.direction} "${t.entry}" bar ${t.entryBar} @ ${fmt(t.entryPrice)} -> bar ${t.exitBar ?? '-'} @ ${fmt(t.exitPrice)}: ${fmt(t.profit)}`);
    }
  }
  if (r.errors.length) {
    out.push('errors:');
    for (const e of r.errors) {
      const at = e.line ? `${file}:${e.line}${e.column ? `:${e.column}` : ''} ` : '';
      out.push(`  ${at}[${e.stage}${e.code ? ` ${e.code}` : ''}] ${e.message}`);
    }
  }
  if (r.typesSkipped) out.push(`types: not checked (${r.typesSkipped})`);
  if (r.warnings.length) {
    out.push('warnings:');
    for (const w of r.warnings) out.push(`  [${w.code}] ${w.message}`);
  }
  if (r.spec) {
    out.push(`spec and checks: ${r.spec.passed} passed, ${r.spec.failed} failed`);
    for (const i of r.spec.items.filter((x) => !x.ok)) {
      out.push(`  FAIL ${i.check}${i.expected !== undefined ? `: expected ${shown(i.expected)}, got ${shown(i.actual)}` : i.actual !== undefined ? `: ${typeof i.actual === 'string' ? i.actual : shown(i.actual)}` : ''}`);
    }
  }
  for (const c of r.reference ?? []) {
    const m = c.firstMismatch;
    out.push(
      c.ignored
        ? `reference "${c.column}": ignored (no plot with this id or title)`
        : c.output === undefined
          ? `reference "${c.column}": FAIL no plot with this id or title`
          : `reference "${c.column}": ${c.equal} / ${c.total} bars equal${m ? `, first difference on bar ${m.bar}: expected ${fmt(m.expected)}, got ${fmt(m.actual)}` : ''}`
    );
  }
  if (r.scenarios) {
    out.push('scenarios:');
    for (const s of r.scenarios) {
      const notes = [...s.errors.map((e) => `ERROR ${e.message}`), ...s.warnings.map((w) => `[${w.code}] ${w.message}`)];
      out.push(`  ${s.name} (${s.description}): ${notes.length ? '' : 'ok'}`);
      for (const n of notes) out.push(`    ${n}`);
    }
  }
  const failed =
    (r.spec?.failed ?? 0) + (r.reference ?? []).filter((c) => !c.ignored && (c.equal !== c.total || c.output === undefined)).length;
  out.push(
    r.ok
      ? r.warnings.length
        ? `result: OK with ${r.warnings.length} warning(s)`
        : 'result: OK'
      : `result: FAIL (${r.errors.length} error(s), ${failed} failed check(s), ${r.warnings.length} warning(s))`
  );
  return out.join('\n');
}

/**
 * Throws the report as text when the check failed (an error, a failed spec item, check or reference column), or with
 * `{ warnings: false }` when it has warnings. For the tests of a project:
 *
 * ```ts
 * it('my indicator follows its spec', () => {
 *   assertCheck(checkScript(source, { spec, checks: (t) => { ... } }));
 * });
 * ```
 */
export function assertCheck(report: CheckReport, options: { warnings?: boolean } = {}): void {
  if (!report.ok || (options.warnings === false && report.warnings.length > 0)) {
    const error = new Error(formatReport(report));
    error.name = 'CheckError';
    throw error;
  }
}
