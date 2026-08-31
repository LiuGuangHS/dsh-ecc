'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const dshRoot = path.join(repoRoot, 'dsh');
const packageJson = JSON.parse(fs.readFileSync(path.join(dshRoot, 'package.json'), 'utf8'));

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;

if (runTest('declares a DSH bundle entry', () => {
  assert.strictEqual(packageJson.name, '@liuguanghs/dsh-ecc');
  assert.strictEqual(packageJson.dsh.bundle.patch, './cordis.patch.yml');
  assert.strictEqual(packageJson.main, './index.mjs');
  assert.ok(packageJson.files.includes('skills'));
  assert.ok(packageJson.files.includes('docs'));
  assert.ok(packageJson.files.includes('upstream.json'));
})) passed += 1; else failed += 1;

if (runTest('bundle entry and canonical source skills exist', () => {
  assert.ok(fs.existsSync(path.join(dshRoot, 'cordis.patch.yml')));
  assert.ok(fs.existsSync(path.join(dshRoot, 'index.mjs')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'skills')));
})) passed += 1; else failed += 1;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exitCode = failed > 0 ? 1 : 0;
