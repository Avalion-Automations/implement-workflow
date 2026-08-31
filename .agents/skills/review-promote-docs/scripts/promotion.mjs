#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SHA256 = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeDocsPath(root, relative) {
  if (typeof relative !== 'string' || !relative.startsWith('docs/')) {
    fail(`unsafe documentation path: ${String(relative)}`);
  }
  const resolvedRoot = path.resolve(root);
  const resolvedDocs = path.resolve(root, 'docs');
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)
      || (resolved !== resolvedDocs && !resolved.startsWith(`${resolvedDocs}${path.sep}`))) {
    fail(`path escapes project root: ${relative}`);
  }
  return resolved;
}

export function loadManifest(root, manifestRelative = 'docs/manifest.yaml') {
  const manifestPath = safeDocsPath(root, manifestRelative);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    fail(`manifest must be readable JSON/YAML 1.2 JSON subset: ${error.message}`);
  }
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.requiredTopics)) {
    fail('manifest must contain schemaVersion 1 and requiredTopics array');
  }
  return { manifest, manifestPath };
}

function topicEntry(manifest, topic) {
  const entries = manifest.requiredTopics.filter(entry => entry?.topic === topic);
  if (entries.length !== 1) fail(`expected exactly one manifest row for topic: ${topic}`);
  return entries[0];
}

export function validate(root, manifest) {
  const errors = [];
  const names = new Set();
  for (const entry of manifest.requiredTopics) {
    const label = typeof entry?.topic === 'string' ? entry.topic : '<unnamed>';
    if (names.has(label)) errors.push(`${label}: duplicate topic`);
    names.add(label);
    let draftPath;
    let canonicalPath;
    try {
      draftPath = safeDocsPath(root, entry?.draft);
      canonicalPath = safeDocsPath(root, entry?.canonical);
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
      continue;
    }
    if (!existsSync(draftPath)) errors.push(`${label}: draft missing (${entry.draft})`);
    if (!existsSync(canonicalPath)) errors.push(`${label}: canonical missing (${entry.canonical})`);
    if (!SEMVER.test(entry?.version ?? '')) errors.push(`${label}: invalid semver`);
    if (!SHA256.test(entry?.sha256 ?? '')) errors.push(`${label}: invalid sha256`);
    if (!existsSync(draftPath) || !existsSync(canonicalPath)) continue;
    const draft = readFileSync(draftPath);
    const canonical = readFileSync(canonicalPath);
    if (!draft.equals(canonical)) errors.push(`${label}: canonical bytes differ from draft`);
    if (SHA256.test(entry.sha256) && digest(canonical) !== entry.sha256) {
      errors.push(`${label}: canonical digest differs from manifest`);
    }
  }
  return errors;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = new Map();
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) fail(`unexpected argument: ${token}`);
    if (token === '--dry-run' || token === '--replace') {
      flags.set(token, true);
      continue;
    }
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) fail(`${token} requires a value`);
    flags.set(token, value);
    index += 1;
  }
  return { command, flags };
}

export function promote(
  root,
  manifestRelative,
  topic,
  version,
  { dryRun = false, replace = false } = {},
) {
  if (!topic) fail('--topic is required');
  if (!SEMVER.test(version ?? '')) fail('--version must be valid semver');
  const { manifest, manifestPath } = loadManifest(root, manifestRelative);
  const entry = topicEntry(manifest, topic);
  const draftPath = safeDocsPath(root, entry.draft);
  const canonicalPath = safeDocsPath(root, entry.canonical);
  if (!existsSync(draftPath)) fail(`draft missing: ${entry.draft}`);
  const canonicalExisted = existsSync(canonicalPath);
  if (canonicalExisted && !replace) {
    fail(`canonical exists; explicit --replace approval required: ${entry.canonical}`);
  }
  const draftBytes = readFileSync(draftPath);
  const priorCanonical = canonicalExisted ? readFileSync(canonicalPath) : null;
  const sha256 = digest(draftBytes);
  const receipt = { topic, draft: entry.draft, canonical: entry.canonical, version, sha256 };
  if (dryRun) return receipt;

  const canonicalTmp = `${canonicalPath}.promotion-tmp`;
  const manifestTmp = `${manifestPath}.promotion-tmp`;
  if (existsSync(canonicalTmp) || existsSync(manifestTmp)) {
    fail('stale promotion temp file exists; inspect it before retrying');
  }
  let canonicalInstalled = false;
  try {
    copyFileSync(draftPath, canonicalTmp);
    if (!readFileSync(canonicalTmp).equals(draftBytes)) fail('temporary canonical copy differs');
    entry.version = version;
    entry.sha256 = sha256;
    writeFileSync(manifestTmp, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    renameSync(canonicalTmp, canonicalPath);
    canonicalInstalled = true;
    renameSync(manifestTmp, manifestPath);
  } catch (error) {
    if (canonicalInstalled) {
      if (priorCanonical) writeFileSync(canonicalPath, priorCanonical);
      else if (existsSync(canonicalPath)) unlinkSync(canonicalPath);
    }
    if (existsSync(canonicalTmp)) unlinkSync(canonicalTmp);
    if (existsSync(manifestTmp)) unlinkSync(manifestTmp);
    throw error;
  }
  return receipt;
}

function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const root = path.resolve(flags.get('--root') ?? process.cwd());
  const manifestRelative = flags.get('--manifest') ?? 'docs/manifest.yaml';
  if (command === 'check') {
    const { manifest } = loadManifest(root, manifestRelative);
    const errors = validate(root, manifest);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
      return;
    }
    console.log('Documentation promotion gate passed.');
    return;
  }
  if (command === 'promote') {
    const receipt = promote(
      root,
      manifestRelative,
      flags.get('--topic'),
      flags.get('--version'),
      { dryRun: flags.has('--dry-run'), replace: flags.has('--replace') },
    );
    console.log(JSON.stringify(receipt));
    return;
  }
  fail('usage: promotion.mjs check|promote [--root PATH] [--manifest docs/manifest.yaml] [--topic NAME --version X.Y.Z] [--dry-run] [--replace]');
}

const invoked = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invoked) {
  try {
    main();
  } catch (error) {
    console.error(`promotion failed: ${error.message}`);
    process.exitCode = 1;
  }
}
