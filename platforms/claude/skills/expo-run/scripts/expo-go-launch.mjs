#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const DEFAULT_TIMEOUT_MS = 120_000;
const LOCAL_ENDPOINT = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s"'`<>]*)?/gi;
const EXPO_URL = /\bexp:\/\/[^\s"'`<>]+/i;

export function expoArguments(mode) {
  if (mode === "tunnel") return ["start", "--go", "--tunnel", "--clear"];
  if (mode === "local") return ["start", "--web", "--localhost", "--clear"];
  throw new Error(`Unsupported Expo run mode: ${mode}`);
}

export function extractExpoUrl(output) {
  return output.match(EXPO_URL)?.[0] ?? null;
}

export function extractLocalEndpoints(output) {
  return [...new Set(output.match(LOCAL_ENDPOINT) ?? [])];
}

function projectSlug(projectRoot) {
  const slug = basename(resolve(projectRoot))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "expo-app";
}

export function qrArtifactPath({ projectRoot, temporaryRoot = tmpdir() }) {
  return join(temporaryRoot, `${projectSlug(projectRoot)}-expo-go-qr.txt`);
}

export async function writeQrArtifact({ projectRoot, temporaryRoot = tmpdir(), url, render }) {
  if (!/^exp:\/\//i.test(url ?? "")) throw new Error("A published exp:// URL is required before creating a QR artifact.");
  const qr = await render(url);
  const artifact = qrArtifactPath({ projectRoot, temporaryRoot });
  const contents = `${qr.trimEnd()}\n\nExpo Go URL: ${url}\n`;
  await mkdir(temporaryRoot, { recursive: true });
  await writeFile(artifact, contents, "utf8");
  return artifact;
}

export function formatReadyOutput({ url, qrPath, localEndpoints = [] }) {
  const lines = [
    `Mobile tunnel: ${url}`,
    `QR text file: ${qrPath}`,
    "Read the QR text file and reproduce it in your response, even if terminal output is truncated.",
  ];
  for (const endpoint of localEndpoints) lines.push(`Observed local endpoint: ${endpoint}`);
  return `${lines.join("\n")}\n`;
}

function projectRequire(projectRoot) {
  return createRequire(join(resolve(projectRoot), "package.json"));
}

export function resolveExpoCli(projectRoot) {
  try {
    return projectRequire(projectRoot).resolve("expo/bin/cli");
  } catch {
    throw new Error(
      "Project-local Expo CLI is unavailable. Install the project's declared expo dependency before running this launcher; do not use a global Expo CLI.",
    );
  }
}

export function terminalQrRenderer(projectRoot) {
  let qrcode;
  try {
    qrcode = projectRequire(projectRoot)("qrcode-terminal");
  } catch {
    throw new Error(
      "Project-local qrcode-terminal is required for tunnel QR output. With approval, run: pnpm add -D qrcode-terminal",
    );
  }
  return (url) => new Promise((resolveQr, rejectQr) => {
    try {
      qrcode.generate(url, { small: true }, (qr) => resolveQr(qr));
    } catch (error) {
      rejectQr(error);
    }
  });
}

export function assertTunnelDependencies(projectRoot) {
  const requireFromProject = projectRequire(projectRoot);
  const missing = [];
  try {
    requireFromProject.resolve("@expo/ngrok/package.json");
  } catch {
    missing.push("@expo/ngrok");
  }
  try {
    requireFromProject.resolve("qrcode-terminal");
  } catch {
    missing.push("qrcode-terminal");
  }
  if (missing.length) {
    throw new Error(
      `Missing project-local tunnel dependencies: ${missing.join(", ")}. With approval, run: pnpm add -D ${missing.join(" ")}`,
    );
  }
}

function timeoutFromEnvironment(value) {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("EXPO_RUN_TIMEOUT_MS must be a positive number of milliseconds.");
  return parsed;
}

function streamChildOutput(child, onChunk, stdout, stderr) {
  child.stdout?.on("data", (chunk) => {
    const output = String(chunk);
    stdout.write(output);
    onChunk(output);
  });
  child.stderr?.on("data", (chunk) => {
    const output = String(chunk);
    stderr.write(output);
    onChunk(output);
  });
}

export async function runExpo({
  mode,
  projectRoot = process.cwd(),
  temporaryRoot = tmpdir(),
  timeoutMs = timeoutFromEnvironment(process.env.EXPO_RUN_TIMEOUT_MS),
  spawnImpl = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
  render = terminalQrRenderer,
} = {}) {
  const root = resolve(projectRoot);
  const args = expoArguments(mode);
  if (mode === "tunnel") assertTunnelDependencies(root);
  const cli = resolveExpoCli(root);
  const child = spawnImpl(process.execPath, [cli, ...args], {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
  });

  let publishedUrl = null;
  let publishedPromise = Promise.resolve();
  let timeout;
  let timedOut = false;
  let requestedSignal = null;
  const localEndpoints = new Set();

  const stopOwnedChild = (signal) => {
    if (!requestedSignal) requestedSignal = signal;
    if (!child.killed) child.kill(signal);
  };
  const forwardSignal = (signal) => () => stopOwnedChild(signal);
  const onSigint = forwardSignal("SIGINT");
  const onSigterm = forwardSignal("SIGTERM");
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);

  const publish = (url) => {
    if (publishedUrl || mode !== "tunnel") return;
    publishedUrl = url;
    clearTimeout(timeout);
    publishedPromise = (async () => {
      const renderQr = render(root);
      const qr = await renderQr(url);
      const artifact = await writeQrArtifact({ projectRoot: root, temporaryRoot, url, render: async () => qr });
      stdout.write(`${qr.trimEnd()}\n\nExpo Go URL: ${url}\n`);
      stdout.write(formatReadyOutput({ url, qrPath: artifact, localEndpoints: [...localEndpoints] }));
    })().catch((error) => {
      stderr.write(`expo-run QR setup failed: ${error.message}\n`);
      stopOwnedChild("SIGTERM");
      throw error;
    });
  };

  streamChildOutput(child, (output) => {
    for (const endpoint of extractLocalEndpoints(output)) localEndpoints.add(endpoint);
    const url = extractExpoUrl(output);
    if (url) publish(url);
  }, stdout, stderr);

  if (mode === "tunnel") {
    timeout = setTimeout(() => {
      if (publishedUrl) return;
      timedOut = true;
      stderr.write(
        `Expo did not publish an exp:// URL within ${timeoutMs}ms. Check the project-local @expo/ngrok dependency and tunnel connectivity; no QR was created.\n`,
      );
      stopOwnedChild("SIGTERM");
    }, timeoutMs);
  }

  return new Promise((resolveRun, rejectRun) => {
    child.once("error", (error) => {
      clearTimeout(timeout);
      rejectRun(error);
    });
    child.once("close", async (code, signal) => {
      clearTimeout(timeout);
      process.removeListener("SIGINT", onSigint);
      process.removeListener("SIGTERM", onSigterm);
      try {
        await publishedPromise;
      } catch (error) {
        rejectRun(error);
        return;
      }
      if (timedOut) {
        rejectRun(new Error(`Expo did not publish an exp:// URL within ${timeoutMs}ms.`));
        return;
      }
      if (mode === "tunnel" && !publishedUrl && !requestedSignal) {
        rejectRun(new Error("Expo exited before publishing an exp:// URL; no QR artifact was created."));
        return;
      }
      if (code !== 0 && !requestedSignal) {
        rejectRun(new Error(`Expo exited with code ${code ?? "unknown"}${signal ? ` (${signal})` : ""}.`));
        return;
      }
      resolveRun({ code, signal, url: publishedUrl, localEndpoints: [...localEndpoints] });
    });
  });
}

async function main(argv) {
  if (argv.length !== 1) throw new Error("Usage: node scripts/expo-go-launch.mjs <tunnel|local>");
  await runExpo({ mode: argv[0] });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`expo-run launch failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
