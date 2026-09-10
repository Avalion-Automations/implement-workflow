import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { inspectRoot, requireRecordedWorktree, resolveBuildWorktree } from "./worktree-root.mjs";
import { mountInfoFor } from "./worktree-root.mjs";

const local = (root) => ({ root: resolve(root), availableBytes: 10_000_000_000, filesystem: "ext4", mountPoint: root });

test("configured root owns every Build lane while status remains independent", () => {
  const worktree = resolveBuildWorktree({ runId: "circle run", environment: { BASICS_WORKTREE_ROOT: "/temp/build space", BASICS_RUNS_DIR: "/durable/status" }, inspect: local });
  assert.equal(worktree.root, "/temp/build space");
  assert.equal(worktree.integration, "/temp/build space/build-runs/circle run/integration");
  assert.doesNotMatch(worktree.runRoot, /durable\/status/);
});

test("unset configuration uses the centralized platform temporary root", () => {
  const worktree = resolveBuildWorktree({ runId: "fallback", environment: {}, fallbackRoot: "/portable/tmp", inspect: local });
  assert.equal(worktree.source, "os-tmpdir");
  assert.equal(worktree.runRoot, "/portable/tmp/build-runs/fallback");
});

test("preflight failures happen during resolution", () => {
  assert.throws(() => resolveBuildWorktree({ runId: "bad", environment: { BASICS_WORKTREE_ROOT: "/bad" }, inspect: () => { throw new Error("unwritable root"); } }), /unwritable root/);
});

test("preflight rejects missing, unwritable, full, network, and incompatible roots", () => {
  const root = mkdtempSync(join(tmpdir(), "worktree root "));
  assert.throws(() => inspectRoot(join(root, "missing")), /does not exist/);
  assert.throws(() => inspectRoot(root, 1, { access: () => { throw new Error("denied"); } }), /not writable/);
  const base = { statfs: () => ({ bavail: 0, bsize: 4096 }), mountInfo: () => ({ filesystem: "ext4", mountPoint: root, options: new Set() }) };
  assert.throws(() => inspectRoot(root, 1, base), /free bytes/);
  const roomy = { statfs: () => ({ bavail: 100, bsize: 4096 }) };
  assert.throws(() => inspectRoot(root, 1, { ...roomy, mountInfo: () => ({ filesystem: "nfs", mountPoint: root, options: new Set() }) }), /network filesystem/);
  for (const option of ["ro", "noexec"]) assert.throws(() => inspectRoot(root, 1, { ...roomy, mountInfo: () => ({ filesystem: "ext4", mountPoint: root, options: new Set([option]) }) }), /incompatible mount options/);
});

test("children inherit the recorded root and cannot override it", () => {
  const worktree = { root: "/temp", runRoot: "/temp/build-runs/one", integration: "/temp/build-runs/one/integration" };
  assert.equal(requireRecordedWorktree({ worktree }).root, "/temp");
  assert.throws(() => requireRecordedWorktree({ worktree }, "/var/tmp"), /override rejected/);
});

test("stacked mounts prefer the newest effective mount", () => {
  const selected = mountInfoFor("/tmp/project", [
    { mountId: 10, mountPoint: "/tmp", filesystem: "tmpfs", options: new Set(["ro"]) },
    { mountId: 20, mountPoint: "/tmp", filesystem: "tmpfs", options: new Set(["rw"]) },
  ]);
  assert.equal(selected.mountId, 20);
});
