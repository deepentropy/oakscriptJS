#!/usr/bin/env node

/**
 * Version bump script
 * Updates version in package.json and jsr.json
 *
 * Usage:
 *   node scripts/bump-version.js patch   # 0.1.1 -> 0.1.2
 *   node scripts/bump-version.js minor   # 0.1.1 -> 0.2.0
 *   node scripts/bump-version.js major   # 0.1.1 -> 1.0.0
 *   node scripts/bump-version.js 0.2.3   # Set specific version
 */

const fs = require('fs');
const path = require('path');

// Get version bump type from command line
const bumpType = process.argv[2];

if (!bumpType) {
  console.error('Usage: node scripts/bump-version.js <patch|minor|major|x.y.z>');
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (bumpType === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
  newVersion = bumpType;
} else {
  console.error(`Invalid bump type: ${bumpType}`);
  console.error('Use: patch, minor, major, or a specific version (x.y.z)');
  process.exit(1);
}

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✓ Updated package.json');

// Update jsr.json
const jsrJsonPath = path.join(__dirname, '..', 'jsr.json');
const jsrJson = JSON.parse(fs.readFileSync(jsrJsonPath, 'utf8'));
jsrJson.version = newVersion;
fs.writeFileSync(jsrJsonPath, JSON.stringify(jsrJson, null, 2) + '\n');
console.log('✓ Updated jsr.json');

console.log('\nNext steps:');
console.log('1. Run: npm install --package-lock-only');
console.log('2. Run: npm test');
console.log('3. Run: npm run build');
console.log('4. Commit: git add -A && git commit -m "Bump version to v' + newVersion + '"');
console.log('5. Tag: git tag v' + newVersion);
console.log('6. Push: git push && git push --tags');
console.log('\nOr create a GitHub release with tag v' + newVersion);
