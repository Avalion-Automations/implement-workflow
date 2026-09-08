#!/usr/bin/env python3
"""Read-only inventory of Git worktrees and local branches for work-cleanup."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


PROTECTED_BRANCHES = frozenset({"devel", "main", "master"})
DEFAULT_NOTES_DIR = Path.home() / ".codex" / "notes" / "work-cleanup"
ABSOLUTE_PATH = re.compile(r"`(/[^`\r\n]+)`|(?<![A-Za-z0-9_.-])(/[^\s`|)]+)")


def git(*args: str) -> tuple[int, str]:
    result = subprocess.run(
        ["git", *args], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    return result.returncode, result.stdout.strip()


@dataclass
class Worktree:
    path: str
    head: str = ""
    branch: str = ""
    detached: bool = False
    locked: bool = False
    prunable: bool = False


@dataclass(frozen=True)
class NoteHint:
    path: str
    note: str
    owner: str
    exists: bool


def repository_owner(path: Path) -> str:
    probe = path if path.is_dir() else path.parent
    while not probe.exists() and probe != probe.parent:
        probe = probe.parent
    result = subprocess.run(
        ["git", "-C", str(probe), "rev-parse", "--show-toplevel"],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.strip() if result.returncode == 0 else "unknown"


def discover_note_hints(notes_dir: Path, registered: set[str], owner_resolver=repository_owner) -> list[NoteHint]:
    if not notes_dir.is_dir():
        return []
    hints: dict[str, NoteHint] = {}
    for note in sorted(notes_dir.glob("*.md")):
        for match in ABSOLUTE_PATH.finditer(note.read_text(encoding="utf-8")):
            raw = (match.group(1) or match.group(2)).strip().rstrip(".,:;]")
            path = str(Path(raw).expanduser())
            normalized = str(Path(path).resolve(strict=False))
            if normalized in registered or normalized in hints:
                continue
            candidate = Path(normalized)
            hints[normalized] = NoteHint(normalized, str(note), owner_resolver(candidate), candidate.exists())
    return list(hints.values())


def worktrees() -> list[Worktree]:
    code, output = git("worktree", "list", "--porcelain")
    if code:
        raise RuntimeError("not a Git repository or git worktree list failed")
    entries: list[Worktree] = []
    current: Worktree | None = None
    for line in output.splitlines() + [""]:
        if not line:
            if current:
                entries.append(current)
                current = None
            continue
        key, _, value = line.partition(" ")
        if key == "worktree":
            current = Worktree(path=value)
        elif current and key == "HEAD":
            current.head = value
        elif current and key == "branch":
            current.branch = value.removeprefix("refs/heads/")
        elif current and key == "detached":
            current.detached = True
        elif current and key == "locked":
            current.locked = True
        elif current and key == "prunable":
            current.prunable = True
    return entries


def status(path: str) -> str:
    code, output = git("-C", path, "status", "--porcelain")
    if code:
        return "missing/unreadable"
    return "dirty" if output else "clean"


def merged(branch: str, base: str | None) -> str:
    if not branch or not base:
        return "not evaluated"
    code, _ = git("merge-base", "--is-ancestor", branch, base)
    return "merged" if code == 0 else "not merged"


def local_branches() -> list[str]:
    code, output = git("for-each-ref", "--format=%(refname:short)", "refs/heads")
    if code:
        return []
    return [line for line in output.splitlines() if line]


def current_worktree() -> str:
    code, output = git("rev-parse", "--show-toplevel")
    return str(Path(output).resolve()) if code == 0 else ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="approved integration branch used only for merge evidence")
    parser.add_argument("--notes-dir", type=Path, default=DEFAULT_NOTES_DIR, help="read-only Markdown registry of cleanup discovery hints")
    parser.add_argument(
        "--report",
        action="store_true",
        help="read-only evaluated status report; never propose or perform cleanup",
    )
    args = parser.parse_args()
    try:
        entries = worktrees()
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    checked_out = {entry.branch for entry in entries if entry.branch}
    registered = {str(Path(entry.path).resolve(strict=False)) for entry in entries}
    note_hints = discover_note_hints(args.notes_dir, registered)
    current = current_worktree()
    if args.report:
        print("| Worktree/path | Branch or HEAD | Current state | Merge evidence |")
        print("| --- | --- | --- | --- |")
        for entry in entries:
            ref = entry.branch or entry.head[:12] or "unknown"
            is_current = str(Path(entry.path).resolve()) == current
            state = ", ".join(item for item in [
                status(entry.path), "current" if is_current else "",
                "locked" if entry.locked else "",
                "detached" if entry.detached else "",
                "stale registration" if entry.prunable else "",
            ] if item)
            merge = merged(entry.branch, args.base)
            print(f"| {entry.path} | {ref} | {state} | {merge} |")
        for branch in local_branches():
            if branch not in checked_out:
                merge = merged(branch, args.base)
                print(f"| — | {branch} | local branch, not checked out | {merge} |")
        for hint in note_hints:
            state = f"registry hint, {'exists' if hint.exists else 'missing'}, owner: {hint.owner}, source: {hint.note}"
            print(f"| {hint.path} | note hint | {state} | not evaluated |")
        return 0

    print("| Worktree/path | Branch or HEAD | State | Merge evidence | Proposed action | Requires approval |")
    print("| --- | --- | --- | --- | --- | --- |")
    for entry in entries:
        ref = entry.branch or entry.head[:12] or "unknown"
        is_current = str(Path(entry.path).resolve()) == current
        state = ", ".join(item for item in [
            status(entry.path), "current" if is_current else "",
            "locked" if entry.locked else "",
            "stale registration" if entry.prunable else "",
        ] if item)
        merge = merged(entry.branch, args.base)
        if entry.branch in PROTECTED_BRANCHES:
            action = "keep / protected branch"
            approval = "not applicable"
        elif entry.prunable:
            action = "candidate: prune stale registration"
            approval = "yes for any removal"
        elif is_current or entry.locked or entry.detached or status(entry.path) != "clean" or merge == "not merged":
            action = "keep / needs investigation"
            approval = "yes for any removal"
        elif merge == "merged":
            action = "candidate: remove worktree"
            approval = "yes for any removal"
        else:
            action = "keep / choose base"
            approval = "yes for any removal"
        print(f"| {entry.path} | {ref} | {state} | {merge} | {action} | {approval} |")

    for branch in local_branches():
        if branch in checked_out:
            continue
        merge = merged(branch, args.base)
        if branch in PROTECTED_BRANCHES:
            action = "keep / protected branch"
            approval = "not applicable"
        elif branch == args.base:
            action = "keep / protected base"
            approval = "not applicable"
        else:
            action = "candidate: delete branch" if merge == "merged" else "keep / needs investigation"
            approval = "yes for deletion"
        print(f"| — | {branch} | not checked out | {merge} | {action} | {approval} |")
    for hint in note_hints:
        state = f"registry hint, {'exists' if hint.exists else 'missing'}, owner: {hint.owner}, source: {hint.note}"
        print(f"| {hint.path} | note hint | {state} | not evaluated | needs investigation | yes for any removal |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
