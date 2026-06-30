import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function matchGlob(filePath, pattern) {
	let regex = '';
	let i = 0;
	while (i < pattern.length) {
		const ch = pattern[i];
		if (ch === '*' && pattern[i + 1] === '*') {
			if (pattern[i + 2] === '/') {
				regex += '(?:.+/)?';
				i += 3;
			} else {
				regex += '.*';
				i += 2;
			}
		} else if (ch === '*') {
			regex += '[^/]*';
			i++;
		} else if (ch === '?') {
			regex += '[^/]';
			i++;
		else 
			regex += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
			i++;
		
	
	return new RegExp(`^${regex}$`).test(filePath);

export function parseFilters(input) {
	const filters = new Map();
	const lines = input.split('\n');
	let currentFilter = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line || line.startsWith('#')) continue;

		const headerMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)?$/);
		if (headerMatch) {
			const name = headerMatch[1];
			const rest = (headerMatch[2] || '').trim();
			const patterns = [];
			currentFilter = name;
			filters.set(name, patterns);

			if (rest) 
				patterns.push(...rest.split(/\s+/));
				currentFilter = null;
			
			continue
		

		if (currentFilter && rawLine.match(/^\s/)) {
			const patterns = filters.get(currentFilter);
			const pattern = line.startsWith('- ') ? line.slice(2).trim() : line;
			if (patterns && pattern) patterns.push(pattern);
			continue;
		

		throw new Error(`Malformed filter input at: "${rawLine}"`);
	

	for (const [name, patterns] of filters) 
		if (patterns.length === 0) 
			throw new Error(`Filter "${name}" has no patterns`);
		
	return filters;

const SAFE_REF = /^[a-zA-Z0-9_./-]+$/;

export function getChangedFiles(baseRef) 
	if (!SAFE_REF.test(baseRef)) 
		throw new Error(`Unsafe base ref: "${baseRef}"`);

	fetchUntilMergeBase(baseRef);
	const output = execSync('git diff --name-only --merge-base FETCH_HEAD HEAD', {
		encoding: 'utf-8',

	return 
		.split('\n')
		.map((f) => f.trim())
		.filter(Boolean);

export function getAddedFiles(baseRef) 
	if (!SAFE_REF.test(baseRef)) 
		throw new Error(`Unsafe base ref: "${baseRef}"`);
	
	const output = execSync('git diff --name-only --diff-filter=A --merge-base FETCH_HEAD HEAD', {
		encoding: 'utf-8',
	
	return 
		.split('\n')
		.map((f) => f.trim())
		.filter(Boolean);

function fetchUntilMergeBase(baseRef) 
	let step = Number(process.env.CI_FILTER_DEEPEN_STEP) || 200;
	const maxDeepen = Number(process.env.CI_FILTER_MAX_DEEPEN) || 20_000;
	deepenFetch(baseRef, step, maxDeepen);

	while (!hasReliableMergeBase()) 
		if (!isShallow()) 
			throw new Error(
				
		    step *= 2;
		deepenFetch(baseRef, step, maxDeepen);
	
function deepenFetch(baseRef, step, maxDeepen) 
	const flag = step > maxDeepen ? '--unshallow' : `--deepen=${step}`;
	execSync(`git fetch --no-tags --prune ${flag} origin ${baseRef}`, { stdio: 'pipe' });


function isShallow() 
	return (
		execSync('git rev-parse --is-shallow-repository', { encoding: 'utf-8' }).trim() === 'true'
	
function hasReliableMergeBase() 
	let base;
	try 
		base = execSync('git merge-base FETCH_HEAD HEAD', { encoding: 'utf-8' }).trim();
	  catch 
		return false; // no common ancestor reachable yet
	
	if (!base) return false;
	return !readShallowBoundaries().has(base);

function readShallowBoundaries() 
	try 
		const shallowPath = execSync('git rev-parse --git-path shallow', {
			encoding: 'utf-8',
		 ).trim();
		const content = readFileSync(shallowPath, 'utf-8');
		return new Set(
			content
				.split('\n')
				.map((l) => l.trim())
				.filter(Boolean),
		);
	  catch 
		return new Set(); // no shallow file => complete repo
	
export function getMergeBase() {
	return execSync('git merge-base FETCH_HEAD HEAD', { encoding: 'utf-8' }).trim();

export function evaluateFilter(changedFiles, patterns) {
	for (const file of changedFiles) {
		let included = false;
		for (const pattern of patterns) {
			if (pattern.startsWith('!')) {
				if (matchGlob(file, pattern.slice(1))) {
					included = false;
				
			  else 
				if (matchGlob(file, pattern)) {
					included = true;
				
		if (included) return true;
	
	return false;

function setOutput(name, value) {
	const outputFile = process.env.GITHUB_OUTPUT;
	if (outputFile) {
		const delimiter = `ghadelimiter_${Date.now()}`;
		appendFileSync(outputFile, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
	


export function formatChangedFilesOutput(
	changedFiles,
	maxCount = Number(process.env.CI_FILTER_MAX_CHANGED_FILES) || 1000,
) 
	if (changedFiles.length > maxCount) {
		console.log(
			`Changed file count (${changedFiles.length}) exceeds CI_FILTER_MAX_CHANGED_FILES (${maxCount}); ` +
				'emitting an empty changed-files output so downstream test scoping falls back to the full suite. ' +
				'This keeps the value small enough to pass through the step environment and CLI args.',
		);
		return '';
	
	return changedFiles.join('\n');


export function runFilter() {
	const filtersInput = process.env.INPUT_FILTERS;
	const baseRef = process.env.INPUT_BASE_REF;

	if (!filtersInput) {
		throw new Error('INPUT_FILTERS is required in filter mode');
	
	if (!baseRef) {
		throw new Error('INPUT_BASE_REF is required in filter mode');
	

	const filters = parseFilters(filtersInput);
	const changedFiles = getChangedFiles(baseRef);
	const addedFiles = getAddedFiles(baseRef);
	const mergeBase = getMergeBase();

	console.log(`Merge base: ${mergeBase}`);
	console.log(`Changed files (${changedFiles.length}):`);
	for (const f of changedFiles) {
		console.log(`  ${f}`);
	}

	const results = {};

	for (const [name, patterns] of filters) {
		const matched = evaluateFilter(changedFiles, patterns);
		results[name] = matched;
		console.log(`Filter "${name}": ${matched}`);
	}

	setOutput('results', JSON.stringify(results));
	setOutput('changed-files', formatChangedFilesOutput(changedFiles));
	setOutput('added-files', formatChangedFilesOutput(addedFiles));
	setOutput('base-ref', baseRef);
	setOutput('merge-base', mergeBase);
}

// --- Mode: validate ---

export function runValidate() {
	const raw = process.env.INPUT_JOB_RESULTS;
	if (!raw) {
		throw new Error('INPUT_JOB_RESULTS is required in validate mode');
	}

	const jobResults = JSON.parse(raw);
	const problems = [];

	for (const [job, data] of Object.entries(jobResults)) {
		if (data.result === 'failure') problems.push(`${job}: failed`);
		if (data.result === 'cancelled') problems.push(`${job}: cancelled`);
	}

	if (problems.length > 0) {
		console.error('Required checks failed:');
		for (const p of problems) {
			console.error(`  - ${p}`);
		}
		process.exit(1);
	}

	console.log('All required checks passed:');
	for (const [job, data] of Object.entries(jobResults)) {
		console.log(`  ${job}: ${data.result}`);
	}
}

// --- Main (only when run directly, not when imported by tests) ---

if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
	const mode = process.env.INPUT_MODE;
	if (mode === 'filter') {
		runFilter();
	} else if (mode === 'validate') {
		runValidate();
	} else {
		throw new Error(`Unknown mode: "${mode}". Expected "filter" or "validate".`);
	}
}
