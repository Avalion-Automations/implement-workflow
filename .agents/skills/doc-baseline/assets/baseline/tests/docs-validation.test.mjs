import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { validate } from '../scripts/validate-docs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'docs/manifest.yaml'), 'utf8'));

test('documentation baseline has a usable registry and tracking templates', () => {
  assert.equal(existsSync(path.join(root, 'docs/draft/README.md')), true);
  for (const file of ['README.md', 'goal-template.md', 'result-handoff-template.md']) {
    assert.equal(existsSync(path.join(root, 'docs/tracking', file)), true, `missing docs/tracking/${file}`);
  }
  for (const topic of manifest.requiredTopics) {
    assert.equal(existsSync(path.join(root, topic.draft)), true, `missing ${topic.draft}`);
  }
});

test('draft registry lists every required topic', () => {
  const registry = readFileSync(path.join(root, 'docs/draft/README.md'), 'utf8');
  for (const topic of manifest.requiredTopics) assert.match(registry, new RegExp(topic.topic));
});

test('promotion validator fails closed before every topic is promoted', () => {
  assert.notDeepEqual(validate(root), []);
});
