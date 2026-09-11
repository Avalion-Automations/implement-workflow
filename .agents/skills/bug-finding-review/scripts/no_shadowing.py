#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

DECL_RE = re.compile(r"^\s*(?:local|global|static)\s+(.+)$", re.IGNORECASE)
FOR_RE = re.compile(r"^\s*for\s+([^\n]+?)\s+in\b", re.IGNORECASE)
CATCH_RE = re.compile(r"^\s*catch\s+([A-Za-z_][A-Za-z0-9_]*)\b", re.IGNORECASE)
FUNC_RE = re.compile(r"^\s*[A-Za-z_#@\$][A-Za-z0-9_#@\$]*\s*\(([^\)]*)\)\s*(?:=>|\{)")
METHOD_RE = re.compile(r"^\s*[A-Za-z_#@\$][A-Za-z0-9_#@\$]*\s*\(([^\)]*)\)\s*(?:=>|\{)")
IDENT_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\b")


def read_builtin_names(base: Path) -> set[str]:
    names_file = base / "ahk_builtin_names.txt"
    names: set[str] = set()
    for raw in names_file.read_text(encoding="utf-8").splitlines():
        name = raw.strip()
        if not name or name.startswith("#"):
            continue
        names.add(name.casefold())
    return names


def strip_comments(line: str) -> str:
    idx = line.find(";")
    if idx == -1:
        return line
    return line[:idx]


def parse_decl_list(text: str) -> list[str]:
    vars_found: list[str] = []
    for part in text.split(","):
        seg = part.strip()
        if not seg:
            continue
        seg = seg.split(":=", 1)[0].strip()
        m = IDENT_RE.match(seg)
        if m:
            vars_found.append(m.group(1))
    return vars_found


def parse_params(text: str) -> list[str]:
    out: list[str] = []
    for part in text.split(","):
        seg = part.strip()
        if not seg:
            continue
        seg = re.sub(r"\b(?:ByRef|Optional|const)\b", "", seg, flags=re.IGNORECASE).strip()
        seg = seg.lstrip("*&")
        seg = seg.split(":=", 1)[0].strip()
        m = IDENT_RE.match(seg)
        if m:
            out.append(m.group(1))
    return out


def lint_file(path: Path, blocked: set[str]) -> list[tuple[int, str]]:
    issues: list[tuple[int, str]] = []
    try:
        lines = path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    except OSError as exc:
        return [(0, f"read-error: {exc}")]

    for lineno, raw in enumerate(lines, start=1):
        line = strip_comments(raw)
        if not line.strip():
            continue

        m = DECL_RE.match(line)
        if m:
            for name in parse_decl_list(m.group(1)):
                if name.casefold() in blocked:
                    issues.append((lineno, f"shadowed name in declaration: {name}"))
            continue

        m = FOR_RE.match(line)
        if m:
            for name in parse_decl_list(m.group(1)):
                if name.casefold() in blocked:
                    issues.append((lineno, f"shadowed name in for-variable: {name}"))
            continue

        m = CATCH_RE.match(line)
        if m:
            name = m.group(1)
            if name.casefold() in blocked:
                issues.append((lineno, f"shadowed name in catch-variable: {name}"))
            continue

        for regex in (FUNC_RE, METHOD_RE):
            m = regex.match(line)
            if m:
                for name in parse_params(m.group(1)):
                    if name.casefold() in blocked:
                        issues.append((lineno, f"shadowed name in parameter: {name}"))
                break

    return issues


def iter_targets(args: list[str]) -> list[Path]:
    roots = [Path(a) for a in args] if args else [Path.cwd()]
    files: list[Path] = []
    for root in roots:
        if root.is_file() and root.suffix.lower() == ".ahk":
            files.append(root)
            continue
        if root.is_dir():
            files.extend(sorted(p for p in root.rglob("*.ahk") if p.is_file()))
    return files


def main() -> int:
    base = Path(__file__).resolve().parent
    blocked = read_builtin_names(base)
    targets = iter_targets(sys.argv[1:])

    if not targets:
        print("no-shadow: no .ahk files found", file=sys.stderr)
        return 2

    total = 0
    for path in targets:
        issues = lint_file(path, blocked)
        for lineno, message in issues:
            if lineno > 0:
                print(f"{path}:{lineno}: {message}")
            else:
                print(f"{path}: {message}")
        total += len(issues)

    if total:
        print(f"no-shadow: found {total} issue(s)", file=sys.stderr)
        return 1

    print(f"no-shadow: clean ({len(targets)} file(s) checked)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
