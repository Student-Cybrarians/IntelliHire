import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Running Preflight Checks...');

try {
  // 1. Check Git working tree
  const status = execSync('git status --porcelain').toString();
  if (status.trim() !== '') {
    console.error('❌ Preflight failed: Git working directory is not clean. Commit or stash changes first.');
    process.exit(1);
  }

  // 2. Check for node_modules in git cache
  const lsFiles = execSync('git ls-files').toString();
  if (lsFiles.includes('node_modules/') || lsFiles.includes('.env') || lsFiles.includes('.dev.vars')) {
    console.error('❌ Preflight failed: node_modules or secret files (.env, .dev.vars) are currently tracked in git.');
    process.exit(1);
  }

  // 3. Check for placeholder config
  const wranglerConfig = fs.readFileSync('wrangler.jsonc', 'utf8');
  if (wranglerConfig.includes('resume_kv_placeholder_id')) {
    console.error('❌ Preflight failed: Placeholder KV ID found in wrangler.jsonc.');
    process.exit(1);
  }

  // 4. Run tests
  console.log('🧪 Running Vitest...');
  execSync('npm run test', { stdio: 'inherit' });

  // 5. Run build
  console.log('📦 Running Build...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ All preflight checks passed.');
} catch (e) {
  console.error('❌ Preflight failed with an exception.');
  if (e.stdout) console.error(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
  process.exit(1);
}
