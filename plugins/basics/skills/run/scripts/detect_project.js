#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { root: '.' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') out.root = argv[++i];
    else if (arg === '-h' || arg === '--help') out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

function usage() { console.log('usage: detect_project.js [--root ROOT]'); }

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function exists(root, name) { return fs.existsSync(path.join(root, name)); }

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { usage(); return; }
  const root = path.resolve(args.root);
  const suggestions = [];
  const pkg = readJson(path.join(root, 'package.json'));
  if (pkg && pkg.scripts && typeof pkg.scripts === 'object') {
    for (const name of ['dev', 'start', 'preview', 'serve']) {
      if (Object.prototype.hasOwnProperty.call(pkg.scripts, name)) {
        suggestions.push({ kind: 'npm-script', command: `npm run ${name}`, reason: `package.json script ${name}` });
      }
    }
  }
  if (exists(root, 'Makefile') || exists(root, 'makefile')) {
    for (const target of ['dev', 'run', 'serve', 'start']) {
      suggestions.push({ kind: 'make-target', command: `make ${target}`, reason: 'common Makefile target; verify target exists' });
    }
  }
  if (exists(root, 'pyproject.toml') || exists(root, 'requirements.txt')) {
    suggestions.push({ kind: 'python', command: 'python -m <module>', reason: 'Python project; inspect entrypoint' });
  }
  if (exists(root, 'go.mod')) suggestions.push({ kind: 'go', command: 'go run ./...', reason: 'Go module' });
  if (exists(root, 'Cargo.toml')) suggestions.push({ kind: 'rust', command: 'cargo run', reason: 'Rust package' });
  for (const compose of ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml']) {
    if (exists(root, compose)) suggestions.push({ kind: 'compose', command: `docker compose -f ${compose} up`, reason: 'compose file present' });
  }
  console.log(JSON.stringify({ root, suggestions }, null, 2));
}

try { main(); } catch (err) { console.error(err.message); process.exit(1); }