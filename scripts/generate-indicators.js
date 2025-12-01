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
  const indicatorName = baseName.toLowerCase().replace(/\s+/g, '-');
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
