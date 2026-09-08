#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SHA256 = /^[a-f0-9]{64}$/;

function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative.startsWith('docs/')) return null;
  const resolved = path.resolve(root, relative);
  return resolved.startsWith(`${path.resolve(root)}${path.sep}`) ? resolved : null;
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function validateManifest(root) {
  const errors = [];
  let manifest;
  try {
    // JSON is a YAML 1.2 subset, keeping the gate dependency-free.
    manifest = JSON.parse(readFileSync(path.join(root, 'docs/manifest.yaml'), 'utf8'));
  } catch (error) {
    return [`manifest is unreadable or invalid YAML/JSON: ${error.message}`];
  }
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.requiredTopics) || !manifest.requiredTopics.length) {
    return ['manifest must contain schemaVersion 1 and a non-empty requiredTopics array'];
  }
  const topics = new Set();
  for (const entry of manifest.requiredTopics) {
    const topic = typeof entry?.topic === 'string' ? entry.topic : '<unnamed topic>';
    if (topics.has(topic)) errors.push(`${topic}: duplicate required topic`);
    topics.add(topic);
    const draft = safePath(root, entry?.draft);
    const canonical = safePath(root, entry?.canonical);
    if (!draft || !canonical) {
      errors.push(`${topic}: draft and canonical paths must be safe docs/ paths`);
      continue;
    }
    if (!existsSync(draft)) errors.push(`${topic}: draft is missing (${entry.draft})`);
    if (!existsSync(canonical)) errors.push(`${topic}: promotion blocked; canonical file is missing (${entry.canonical})`);
    if (!SEMVER.test(entry?.version ?? '')) errors.push(`${topic}: promotion blocked; version must be valid semver`);
    if (!SHA256.test(entry?.sha256 ?? '')) errors.push(`${topic}: promotion blocked; sha256 must be 64 lowercase hexadecimal characters`);
    if (!existsSync(draft) || !existsSync(canonical)) continue;
    const draftBytes = readFileSync(draft);
    const canonicalBytes = readFileSync(canonical);
    if (!draftBytes.equals(canonicalBytes)) errors.push(`${topic}: promotion blocked; canonical bytes differ from draft`);
    if (SHA256.test(entry.sha256) && digest(canonicalBytes) !== entry.sha256) errors.push(`${topic}: promotion blocked; canonical SHA-256 does not match manifest`);
  }
  return errors;
}

export function validate(root) {
  return validateManifest(path.resolve(root));
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const errors = validate(process.cwd());
  if (errors.length) {
    console.error('Documentation promotion blocked:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('Documentation promotion gate passed.');
  }
}
