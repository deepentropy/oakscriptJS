#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCES_JSON = path.join(__dirname, '..', '..', 'indicators', 'sources.json');
const INDICATORS_DIR = path.join(__dirname, '..', '..', 'indicators');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Read sources.json
if (!fs.existsSync(SOURCES_JSON)) {
  console.error(`Error: sources.json not found at ${SOURCES_JSON}`);
  process.exit(1);
}

const sources = JSON.parse(fs.readFileSync(SOURCES_JSON, 'utf-8'));

console.log(`Found ${sources.indicators.length} indicators to transpile`);

for (const indicator of sources.indicators) {
  const sourcePath = path.join(PROJECT_ROOT, indicator.sourcePath);
  const outputDir = path.join(INDICATORS_DIR, indicator.id);
  const outputFile = path.join(outputDir, `${indicator.id}.ts`);
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    continue;
  }
  
  console.log(`Transpiling ${indicator.name} -> ${indicator.id}/`);
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    execSync(`node ./packages/pine2ts/bin/pine2ts.js "${sourcePath}" "${outputFile}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`Failed to transpile ${indicator.name}:`, error.message);
  }
}

console.log('Done!');
