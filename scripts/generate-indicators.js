#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PINE_DIR = path.join(__dirname, '..', 'pinescript');
const INDICATORS_DIR = path.join(__dirname, '..', 'indicators');

// Find all .pine files
const pineFiles = fs.readdirSync(PINE_DIR).filter(f => f.endsWith('.pine'));

console.log(`Found ${pineFiles.length} PineScript files to transpile`);

for (const pineFile of pineFiles) {
  const baseName = path.basename(pineFile, '.pine');
  // Convert to kebab-case: replace spaces first, then handle camelCase
  const indicatorName = baseName
    .replace(/\s+/g, '-')                     // Replace spaces with hyphens first
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')  // Insert hyphen between lowercase/digit and uppercase
    .toLowerCase();
  const outputDir = path.join(INDICATORS_DIR, indicatorName);
  
  console.log(`Transpiling ${pineFile} -> ${indicatorName}/`);
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    execSync(`node ./transpiler/bin/pine2ts.js "${path.join(PINE_DIR, pineFile)}" "${path.join(outputDir, indicatorName + '.ts')}"`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`Failed to transpile ${pineFile}:`, error.message);
  }
}

console.log('Done!');
