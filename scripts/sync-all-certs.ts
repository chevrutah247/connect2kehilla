#!/usr/bin/env npx tsx
// scripts/sync-all-certs.ts
// Master sync — runs every kashrus-agency importer in sequence so cert tags
// stay current. Each child script is idempotent (sync mode): it tags new
// listings, updates changed ones, and revokes the cert from any business
// that fell off the agency's published list.
//
// Run weekly (Sundays 6 AM is the default cron). Scheduled by the
// `weekly-cert-resync` task in the scheduled-tasks MCP.
//
// Usage: npx tsx scripts/sync-all-certs.ts

import { spawn } from 'child_process';

const SCRIPTS = [
  'scripts/import-cert-vaad-queens.ts',
  'scripts/import-cert-vaad-5tfr.ts',
  'scripts/import-cert-ou.ts',
  'scripts/import-cert-star-k.ts',
  'scripts/import-cert-ok.ts',
  'scripts/import-cert-beis-din-ch.ts',
];

function run(script: string): Promise<{ script: string; exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', script], {
      env: process.env,
      cwd: process.cwd(),
    });
    let buf = '';
    child.stdout.on('data', d => { buf += d.toString(); process.stdout.write(d); });
    child.stderr.on('data', d => { buf += d.toString(); process.stderr.write(d); });
    child.on('close', code => resolve({ script, exitCode: code ?? 1, output: buf }));
  });
}

async function main() {
  console.log(`\n🔄 Cert sync — ${new Date().toISOString()}\n`);
  const results: { script: string; exitCode: number }[] = [];
  for (const s of SCRIPTS) {
    console.log(`\n──────────  ${s}  ──────────`);
    const r = await run(s);
    results.push({ script: s, exitCode: r.exitCode });
  }

  console.log('\n══════════ SUMMARY ══════════');
  const failed = results.filter(r => r.exitCode !== 0);
  for (const r of results) {
    console.log(`  ${r.exitCode === 0 ? '✅' : '❌'}  ${r.script}`);
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length} importer(s) failed`);
    process.exit(1);
  }
  console.log('\nAll cert importers completed.');
}

main().catch(e => { console.error(e); process.exit(1); });
