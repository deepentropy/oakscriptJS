/**
 * Runs agent-guide scripts (skills/oakscript) the way a host app runs a script written in its editor: the harness of
 * `oakscriptjs/check` (src/check/harness.ts).
 */
export { compileScript, runScript, syntheticBars, testChart, TestEngine, type ScriptRun } from '../../src/check/harness';
