import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  LOCAL_SCRIPT,
  TUNNEL_SCRIPT,
  configurePackage,
  inspectPackage,
} from "../.agents/skills/expo-run/scripts/configure-expo-run.mjs";
import {
  expoArguments,
  extractExpoUrl,
  formatReadyOutput,
  writeQrArtifact,
} from "../.agents/skills/expo-run/scripts/expo-go-launch.mjs";

test("configures one-command tunnel and local launch scripts without disturbing package data", () => {
  const source = {
    name: "sample-app",
    private: true,
    scripts: { test: "node --test", start: "old-command" },
    dependencies: { expo: "~57.0.0", react: "19.1.0" },
    devDependencies: { "@expo/ngrok": "^4.1.0", "qrcode-terminal": "^0.12.0" },
  };

  const configured = configurePackage(source);

  assert.equal(configured.scripts.start, TUNNEL_SCRIPT);
  assert.equal(configured.scripts["start:local"], LOCAL_SCRIPT);
  assert.equal(configured.scripts.test, "node --test");
  assert.equal(configured.dependencies.react, "19.1.0");
  assert.notEqual(configured, source);
  assert.equal(source.scripts.start, "old-command");
});

test("rejects non-Expo packages and reports project-local launcher dependencies", () => {
  assert.deepEqual(inspectPackage({ name: "not-expo", scripts: {} }), {
    expo: false,
    missing: ["@expo/ngrok", "qrcode-terminal"],
  });
  assert.deepEqual(inspectPackage({
    dependencies: { expo: "~57.0.0" },
    devDependencies: { "@expo/ngrok": "^4.1.0" },
  }), {
    expo: true,
    missing: ["qrcode-terminal"],
  });
});

test("builds exact Expo CLI arguments for tunnel and local browser modes", () => {
  assert.deepEqual(expoArguments("tunnel"), ["start", "--go", "--tunnel", "--clear"]);
  assert.deepEqual(expoArguments("local"), ["start", "--web", "--localhost", "--clear"]);
  assert.throws(() => expoArguments("lan"), /mode/i);
});

test("extracts only a published Expo URL and ignores ordinary local endpoints", () => {
  const text = "Local: http://localhost:8081\nMetro waiting on exp://abc-123.exp.direct\n";
  assert.equal(extractExpoUrl(text), "exp://abc-123.exp.direct");
  assert.equal(extractExpoUrl("Local: http://localhost:8081"), null);
});

test("writes a project-specific terminal QR artifact containing the exact published URL", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "expo-run-contract-"));
  const projectRoot = join(temporaryRoot, "My Expo App");
  const url = "exp://abc-123.exp.direct";
  const artifact = await writeQrArtifact({
    projectRoot,
    temporaryRoot,
    url,
    render: (value) => `QR FOR ${value}\n`,
  });

  assert.equal(artifact, join(temporaryRoot, "my-expo-app-expo-go-qr.txt"));
  assert.equal(await readFile(artifact, "utf8"), `QR FOR ${url}\n\nExpo Go URL: ${url}\n`);
});

test("ready output tells an agent to read the QR file and distinguishes observed endpoints", () => {
  const output = formatReadyOutput({
    url: "exp://abc-123.exp.direct",
    qrPath: "/tmp/my-app-expo-go-qr.txt",
    localEndpoints: ["http://localhost:8081"],
  });
  assert.match(output, /Mobile tunnel: exp:\/\/abc-123\.exp\.direct/);
  assert.match(output, /QR text file: \/tmp\/my-app-expo-go-qr\.txt/);
  assert.match(output, /read.*QR text file.*response/is);
  assert.match(output, /Observed local endpoint: http:\/\/localhost:8081/);
});

test("configuration preview is representable without writing the package file", async () => {
  const root = await mkdtemp(join(tmpdir(), "expo-run-preview-"));
  const packagePath = join(root, "package.json");
  const original = `${JSON.stringify({ name: "preview", dependencies: { expo: "~57.0.0" } }, null, 2)}\n`;
  await writeFile(packagePath, original);

  const parsed = JSON.parse(await readFile(packagePath, "utf8"));
  const preview = configurePackage(parsed);

  assert.equal(preview.scripts.start, TUNNEL_SCRIPT);
  assert.equal(await readFile(packagePath, "utf8"), original);
});
