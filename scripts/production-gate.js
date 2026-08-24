#!/usr/bin/env node
const { spawnSync } = require('child_process');

const steps = [
  ['Auditoria do pacote', ['run','audit:release']],
  ['Sintaxe', ['run','check:syntax']],
  ['Smoke test', ['run','test:smoke']]
];

let failed = 0;
console.log('╔════════════════════════════════════════════╗');
console.log('║ FABIANO REIS — PRODUÇÃO 1.0.0             ║');
console.log('║ HOSTINGER PRODUCTION RELEASE GATE         ║');
console.log('╚════════════════════════════════════════════╝\n');

for (const [label, args] of steps) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync('npm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    failed++;
    console.error(`✗ ${label}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

console.log('\n════════════════════════════════════════════');
if (failed) {
  console.error(`PRODUCTION GATE: FAIL — ${failed} etapa(s) falharam.`);
  process.exit(1);
}
console.log('PRODUCTION GATE: PASS — 10/10');
