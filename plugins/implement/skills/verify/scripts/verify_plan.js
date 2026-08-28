#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const out = { root: '.' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') out.root = argv[++i];
    else if (arg === '--claim') out.claim = argv[++i];
    else if (arg === '-h' || arg === '--help') out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

function usage() { console.log('usage: verify_plan.js --claim CLAIM [--root ROOT]'); }

function gitChanged(root) {
  const cp = spawnSync('git', ['diff', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 15000 });
  if (cp.error || cp.status !== 0) return [];
  return cp.stdout.split(/\r?\n/).filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return; }
  if (!args.claim) { usage(); process.exit(2); }
  const root = path.resolve(args.root);
  const payload = {
    claim: args.claim,
    root,
    changed_files: gitChanged(root),
    checklist: [
      'Identify old failure mode or target user flow',
      'Run focused static/build prerequisite',
      'Launch app or command under test',
      'Exercise behavior directly',
      'Capture evidence and residual risk'
    ],
    evidence: { commands: [], observations: [], artifacts: [] }
  };
  console.log(JSON.stringify(payload, null, 2));
}

try { main(); } catch (err) { console.error(err.message); process.exit(1); }