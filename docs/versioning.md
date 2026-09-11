# Basics versioning

Basics tracks one product-generation version and independent versions for each
host adapter.

## Product generation

`product.json` is the canonical product-generation manifest. Its plain semantic
version describes the overall Basics product generation, independently of any
particular host package. It has no adapter tag or cachebuster.

Product generations may advance separately from adapter releases. A product
release changes `product.json`; it does not require an unchanged adapter to
receive an artificial version bump.

Example:

```text
2.0.0
```

## Adapter releases

Each adapter owns an independent semantic-version stream and appends its host
identity plus a UTC release cachebuster:

```text
<major>.<minor>.<patch>+<adapter>.<YYYYMMDDHHMMSS>
```

Examples:

```text
2.1.15+codex.20260911032007
2.1.8+claude.20260911032007
```

The semantic part records compatibility and changes for that adapter. The
cachebuster identifies the exact packaged build but never substitutes for a
required semantic increment.

- Codex uses `platforms/codex/plugin.json` as its canonical manifest and
  `plugins/basics/.codex-plugin/plugin.json` as the generated matching copy.
- Claude Code uses `platforms/claude/.claude-plugin/plugin.json`; the matching
  entry in `.claude-plugin/marketplace.json` must carry the same version.
- A shared canonical-skill change affects every adapter that packages that
  skill, so each affected adapter advances independently.
- An adapter-only change advances only that adapter.
- A product-only release changes only the product-generation version.

Release checks must reject malformed adapter suffixes, mismatched canonical and
generated manifests, or mismatched Claude plugin and marketplace versions.
