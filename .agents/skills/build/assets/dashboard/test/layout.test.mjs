import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const css = readFileSync(fileURLToPath(new URL("../src/styles.css", import.meta.url)), "utf8");
const app = readFileSync(fileURLToPath(new URL("../src/App.jsx", import.meta.url)), "utf8");

test("wide desktop layout centers the dashboard in half the viewport", () => {
  assert.match(css, /body \{[^}]*grid-template-columns: 25vw 50vw 25vw;/);
  assert.match(css, /#root \{ grid-column: 2;/);
});

test("dashboard content retains a compact 25-50-25 three-column hierarchy", () => {
  assert.match(css, /\.board \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 2fr\) minmax\(0, 1fr\);/);
  assert.match(css, /:root \{[^}]*font: 14px\/1\.35/);
});

test("run information sits above the search and export action row", () => {
  assert.match(app, /className="topbar-actions">\s*<div className="run-state"[\s\S]*?<div className="run-tools">/);
  assert.match(css, /\.topbar-actions \{ display: flex; flex-direction: column;/);
  assert.match(css, /\.run-tools \{ display: flex;/);
});

test("both header stacks share their bottom edge and distribute complete lines", () => {
  assert.match(app, /<div className="run-heading">\s*<p className="eyebrow">[\s\S]*?<h1>[\s\S]*?<p className="muted">/);
  assert.match(css, /\.topbar \{ align-items: stretch;/);
  assert.match(css, /\.run-heading \{ display: flex; flex-direction: column; justify-content: space-between;/);
  assert.match(css, /\.topbar-actions \{[^}]*justify-content: space-between;/);
});

test("search and export share one explicit control height", () => {
  assert.match(css, /--header-control-height: 30px;/);
  assert.match(css, /\.run-search input \{[^}]*height: var\(--header-control-height\);/);
  assert.match(css, /\.export-button \{[^}]*height: var\(--header-control-height\);/);
});

test("run status uses an informational treatment distinct from export", () => {
  assert.match(css, /\.run-state > \.pill \{[^}]*border-color: transparent;[^}]*box-shadow: inset 3px 0 currentColor;/);
  assert.match(css, /\.export-button \{[^}]*border: 1px solid #80a7ff;/);
});

test("selected item and recent events render as independent center-column cards", () => {
  assert.match(app, /<div className="detail-stack">\s*<aside className="detail-panel"[\s\S]*?<\/aside>\s*<section className="events-panel"/);
  assert.match(app, /<div className="section-heading"><h2>Recent events<\/h2><span>\{recentEvents\.length\}<\/span><\/div>/);
  assert.match(css, /\.detail-stack \{ display: grid; gap: 10px;/);
  assert.match(css, /\.queue-panel, \.workflow-panel, \.detail-panel, \.events-panel \{[^}]*border-radius: 10px;/);
});
