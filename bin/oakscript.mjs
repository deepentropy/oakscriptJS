#!/usr/bin/env node
// oakscript check <script.js> [options]: see `oakscript --help` and skills/oakscript/reference/check.md
import { main } from '../dist/esm/check/node.js';

process.exitCode = main(process.argv.slice(2));
