import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadManifest, promote, validate } from './promotion.mjs';

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'review-promote-docs-'));
  mkdirSync(path.join(root, 'docs/draft'), { recursive: true });
  writeFileSync(path.join(root, 'docs/draft/topic.md'), 'approved draft\n');
  writeFileSync(path.join(root, 'docs/manifest.yaml'), `${JSON.stringify({
    schemaVersion: 1,
    requiredTopics: [{
      topic: 'topic',
      draft: 'docs/draft/topic.md',
      canonical: 'docs/topic.md',
      version: null,
      sha256: null,
    }],
  }, null, 2)}\n`);
  return root;
}

test('dry-run reports promotion without writing', () => {
  const root = fixture();
  const result = promote(root, 'docs/manifest.yaml', 'topic', '1.0.0', { dryRun: true });
  assert.equal(result.version, '1.0.0');
  assert.equal(readFileSync(path.join(root, 'docs/manifest.yaml'), 'utf8').includes('"version": null'), true);
});

test('promote copies bytes, records digest, and passes gate', () => {
  const root = fixture();
  promote(root, 'docs/manifest.yaml', 'topic', '1.0.0');
  assert.deepEqual(
    readFileSync(path.join(root, 'docs/topic.md')),
    readFileSync(path.join(root, 'docs/draft/topic.md')),
  );
  const { manifest } = loadManifest(root);
  assert.deepEqual(validate(root, manifest), []);
});

test('existing canonical requires explicit replacement', () => {
  const root = fixture();
  writeFileSync(path.join(root, 'docs/topic.md'), 'existing canonical\n');
  assert.throws(
    () => promote(root, 'docs/manifest.yaml', 'topic', '1.0.0'),
    /explicit --replace approval required/,
  );
});

test('explicit replacement installs approved bytes and new version', () => {
  const root = fixture();
  writeFileSync(path.join(root, 'docs/topic.md'), 'existing canonical\n');
  promote(root, 'docs/manifest.yaml', 'topic', '2.0.0', { replace: true });
  assert.equal(readFileSync(path.join(root, 'docs/topic.md'), 'utf8'), 'approved draft\n');
  const { manifest } = loadManifest(root);
  assert.equal(manifest.requiredTopics[0].version, '2.0.0');
  assert.deepEqual(validate(root, manifest), []);
});

test('manifest paths cannot escape the docs directory', () => {
  const root = fixture();
  const manifestPath = path.join(root, 'docs/manifest.yaml');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.requiredTopics[0].canonical = 'docs/../outside.md';
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.throws(
    () => promote(root, 'docs/manifest.yaml', 'topic', '1.0.0'),
    /path escapes project root/,
  );
});
