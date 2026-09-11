#!/usr/bin/env python3
from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import sys
import unittest


MODULE_PATH = Path(__file__).with_name("worktree_inventory.py")
SPEC = importlib.util.spec_from_file_location("worktree_inventory", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class NoteDiscoveryTests(unittest.TestCase):
    def test_note_paths_are_hints_and_registered_paths_are_omitted(self) -> None:
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            notes = root / "notes"
            notes.mkdir()
            existing = root / "existing worktree"
            existing.mkdir()
            registered = root / "registered"
            (notes / "candidates.md").write_text(
                f"- `{existing}`\n- `{registered}`\n- `/missing/worktree`\n",
                encoding="utf-8",
            )
            hints = MODULE.discover_note_hints(notes, {str(registered)}, owner_resolver=lambda _: "/repo")
            self.assertEqual({hint.path for hint in hints}, {str(existing), "/missing/worktree"})
            self.assertTrue(next(hint for hint in hints if hint.path == str(existing)).exists)
            self.assertFalse(next(hint for hint in hints if hint.path == "/missing/worktree").exists)

    def test_missing_registry_is_empty(self) -> None:
        with TemporaryDirectory() as temporary:
            self.assertEqual(MODULE.discover_note_hints(Path(temporary) / "missing", set()), [])


if __name__ == "__main__":
    unittest.main()
