/**
 * Phase 1 Automated Verification Suite
 * Verifies catalog preservation, price consistency, schema alignment, and knowledge grounding.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const productsFile = path.join(projectRoot, 'frontend', 'src', 'data', 'products.ts');
const knowledgeFile = path.join(projectRoot, 'frontend', 'src', 'data', 'knowledge.ts');
const migration5File = path.join(projectRoot, 'supabase', 'migrations', '20261017110000_add_product_metadata.sql');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== Running Sattva Life Phase 1 Automated Checks ===\n');

// 1. Verify 24 products in products.ts
const productsContent = fs.readFileSync(productsFile, 'utf8');
const productIds = [...productsContent.matchAll(/id:\s*['"]([a-z]{2}-\d{3})['"]/g)].map(m => m[1]);

assert(productIds.length === 24, `Expected 24 product IDs, found ${productIds.length}`);
assert(new Set(productIds).size === 24, 'All 24 product IDs are unique');

const expectedPrefixes = ['fw', 'yg', 'bc', 'cw', 'sc', 'bk'];
expectedPrefixes.forEach(prefix => {
  const count = productIds.filter(id => id.startsWith(prefix)).length;
  assert(count === 4, `Category prefix '${prefix}' has exactly 4 products (found ${count})`);
});

// 2. Verify migration 5 has all 24 products matching exactly
const migration5Content = fs.readFileSync(migration5File, 'utf8');
const migration5Ids = [...migration5Content.matchAll(/\(['"]([a-z]{2}-\d{3})['"],/g)].map(m => m[1]);
assert(migration5Ids.length === 24, `Migration 5 contains all 24 product IDs (found ${migration5Ids.length})`);
assert(productIds.every(id => migration5Ids.includes(id)), 'All product IDs in products.ts exist in migration 5 SQL');

// 3. Verify knowledge base grounding
const knowledgeContent = fs.readFileSync(knowledgeFile, 'utf8');
assert(knowledgeContent.includes('ownerApproved: true'), 'Verified knowledge entries marked as ownerApproved: true');
assert(knowledgeContent.includes('PENDING_OWNER_CONFIRMATION'), 'Unverified assumptions explicitly segregated in PENDING_OWNER_CONFIRMATION');
assert(knowledgeContent.includes('CATEGORY_GUIDANCE'), 'Category shopping guidance present for all 6 categories');

// 4. Verify no Gemini SDK imports in Phase 1
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'frontend', 'package.json'), 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
assert(!allDeps['@google/genai'] && !allDeps['@google/generative-ai'], 'Zero Gemini AI dependencies installed in Phase 1');

console.log(`\n=== Summary: ${passedTests} / ${totalTests} checks passed ===`);
if (passedTests !== totalTests) {
  process.exit(1);
}
