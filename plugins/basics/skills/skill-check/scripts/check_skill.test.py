#!/usr/bin/env python3
"""Regression tests for local-reference boundaries."""

from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import sys
import unittest


MODULE_PATH = Path(__file__).with_name("check_skill.py")
SPEC = importlib.util.spec_from_file_location("check_skill", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def write_skill(path: Path, link: str) -> None:
    path.mkdir(parents=True)
    (path / "SKILL.md").write_text(
        f"---\nname: {path.name}\ndescription: Test fixture.\n---\n\n## Workflow\n\nRead [target]({link}).\n",
        encoding="utf-8",
    )


class LocalReferenceTests(unittest.TestCase):
    def test_allows_existing_sibling_skill_entrypoint(self) -> None:
        with TemporaryDirectory() as temporary:
            skills = Path(temporary) / "skills"
            write_skill(skills / "build", "../brainstorm/SKILL.md")
            write_skill(skills / "brainstorm", "SKILL.md")
            findings = MODULE.Checker(skills / "build").check()
            self.assertFalse(any(item.rule == "local-reference" for item in findings))

    def test_rejects_arbitrary_escape_from_skill_suite(self) -> None:
        with TemporaryDirectory() as temporary:
            skills = Path(temporary) / "skills"
            write_skill(skills / "build", "../../outside.md")
            (Path(temporary) / "outside.md").write_text("outside\n", encoding="utf-8")
            findings = MODULE.Checker(skills / "build").check()
            self.assertTrue(any(item.rule == "local-reference" and "escapes" in item.message for item in findings))

    def test_rejects_missing_sibling_skill_entrypoint(self) -> None:
        with TemporaryDirectory() as temporary:
            skills = Path(temporary) / "skills"
            write_skill(skills / "build", "../missing/SKILL.md")
            findings = MODULE.Checker(skills / "build").check()
            self.assertTrue(any(item.rule == "local-reference" and "missing" in item.message for item in findings))


if __name__ == "__main__":
    unittest.main()
