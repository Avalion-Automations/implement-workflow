#!/usr/bin/env python3
"""Lint Claude Code skill structure and flag design-quality heuristics."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import yaml


MAX_NAME_LENGTH = 64
RECOMMENDED_DESCRIPTION_LENGTH = 300
MAX_BODY_LINES = 500
RESOURCE_DIRS = ("scripts", "references", "assets")
ALLOWED_FRONTMATTER = {"name", "description", "license", "allowed-tools", "metadata"}


@dataclass
class Finding:
    level: str
    rule: str
    message: str


class Checker:
    def __init__(self, skill_path: Path) -> None:
        self.skill_path = skill_path
        self.findings: list[Finding] = []
        self.content = ""
        self.body = ""
        self.frontmatter: dict[str, Any] = {}

    def add(self, level: str, rule: str, message: str) -> None:
        self.findings.append(Finding(level, rule, message))

    def check(self) -> list[Finding]:
        skill_md = self.skill_path / "SKILL.md"
        if not self.skill_path.is_dir():
            self.add("error", "skill-directory", "Skill directory does not exist.")
            return self.findings
        if not skill_md.is_file():
            self.add("error", "skill-md", "SKILL.md is missing.")
            return self.findings

        self.content = skill_md.read_text(encoding="utf-8")
        self._check_frontmatter()
        self._check_body()
        self._check_resources()
        self._check_local_references()
        self._check_openai_metadata()
        return self.findings

    def _check_frontmatter(self) -> None:
        match = re.match(r"^---\n(.*?)\n---(?:\n|$)", self.content, re.DOTALL)
        if not match:
            self.add("error", "frontmatter", "Missing or invalid YAML frontmatter.")
            self.body = self.content
            return

        self.body = self.content[match.end() :]
        try:
            loaded = yaml.safe_load(match.group(1))
        except yaml.YAMLError as exc:
            self.add("error", "frontmatter-yaml", f"Invalid YAML: {exc}")
            return
        if not isinstance(loaded, dict):
            self.add("error", "frontmatter-shape", "Frontmatter must be a YAML mapping.")
            return

        self.frontmatter = loaded
        unexpected = sorted(set(loaded) - ALLOWED_FRONTMATTER)
        if unexpected:
            self.add("error", "frontmatter-keys", f"Unsupported frontmatter keys: {', '.join(unexpected)}.")

        name = loaded.get("name")
        if not isinstance(name, str) or not name.strip():
            self.add("error", "name", "A non-empty skill name is required.")
        else:
            name = name.strip()
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
                self.add("error", "name-format", "Name must use lowercase hyphen-case.")
            if len(name) > MAX_NAME_LENGTH:
                self.add("error", "name-length", f"Name exceeds {MAX_NAME_LENGTH} characters.")

        description = loaded.get("description")
        if not isinstance(description, str) or not description.strip():
            self.add("error", "description", "A non-empty description is required.")
        elif len(description.strip()) > RECOMMENDED_DESCRIPTION_LENGTH:
            self.add(
                "warning",
                "description-length",
                f"Description exceeds the recommended {RECOMMENDED_DESCRIPTION_LENGTH} characters; make trigger guidance more concise.",
            )

    def _check_body(self) -> None:
        body_lines = self.body.splitlines()
        if not self.body.strip():
            self.add("error", "body", "Skill instructions are empty.")
            return
        if len(body_lines) > MAX_BODY_LINES:
            self.add("error", "body-length", f"Instructions exceed {MAX_BODY_LINES} lines; split optional detail into references.")
        if re.search(r"\b(?:TODO|TBD|FIXME)\b", self.body, re.IGNORECASE):
            self.add("error", "stale-placeholder", "Instructions contain TODO, TBD, or FIXME placeholders.")
        if not re.search(r"^##\s+\S+", self.body, re.MULTILINE):
            self.add("warning", "sectioning", "Use level-two headings to make the workflow scannable.")

        has_numbered_steps = bool(re.search(r"^\s*\d+\.\s+", self.body, re.MULTILINE))
        has_task_sections = len(re.findall(r"^##\s+", self.body, re.MULTILINE)) >= 2
        if len(body_lines) > 80 and not (has_numbered_steps or has_task_sections):
            self.add("warning", "workflow-clarity", "Long instructions have no visible step sequence or task-oriented sections.")

        conditional_lines = sum(
            1
            for line in body_lines
            if re.search(r"\b(if|when|unless|otherwise|case|depending on)\b", line, re.IGNORECASE)
        )
        references_dir = self.skill_path / "references"
        if conditional_lines >= 10 and not references_dir.is_dir():
            self.add(
                "warning",
                "progressive-disclosure",
                f"Found {conditional_lines} conditional-instruction lines without a references directory; move substantial variants out of SKILL.md.",
            )

        scripts_dir = self.skill_path / "scripts"
        for language, block in re.findall(r"```([^\n]*)\n(.*?)```", self.body, re.DOTALL):
            lines = block.strip().splitlines()
            is_executable = language.strip().lower() in {"bash", "sh", "zsh", "python", "javascript", "js", "typescript", "ts", "powershell"}
            is_control_flow = bool(re.search(r"^\s*(?:for|while|if|def|function)\b", block, re.MULTILINE))
            if is_executable and len(lines) >= 12 and is_control_flow and not scripts_dir.is_dir():
                self.add(
                    "warning",
                    "deterministic-script",
                    "Long executable control-flow block has no scripts directory; move repeatable deterministic logic into a script.",
                )
                break

    def _check_resources(self) -> None:
        for directory_name in RESOURCE_DIRS:
            directory = self.skill_path / directory_name
            if directory.exists() and not directory.is_dir():
                self.add("error", "resource-type", f"{directory_name} exists but is not a directory.")
                continue
            if directory.is_dir() and not any(path.is_file() for path in directory.rglob("*")):
                self.add("warning", "empty-resource", f"{directory_name}/ is empty; remove it or add the intended resource.")
            if directory.is_dir() and any(path.is_file() for path in directory.rglob("*")):
                if f"{directory_name}/" not in self.body:
                    self.add(
                        "warning",
                        "unreferenced-resource",
                        f"{directory_name}/ contains files but SKILL.md does not reference that directory.",
                    )

    def _check_local_references(self) -> None:
        candidates = re.findall(r"\[[^\]]+\]\(([^)]+)\)", self.body)
        candidates += re.findall(r"(?<![\w/])((?:scripts|references|assets)/[A-Za-z0-9_.-]+)", self.body)
        skill_root = self.skill_path.resolve()
        skills_root = skill_root.parent
        for candidate in sorted(set(candidates)):
            target = candidate.split("#", 1)[0].strip()
            if not target or target.startswith(("http:", "https:", "mailto:")):
                continue
            target_path = (self.skill_path / target).resolve()
            try:
                target_path.relative_to(skill_root)
            except ValueError:
                is_sibling_skill = target_path.name == "SKILL.md" and target_path.parent.parent == skills_root
                if not is_sibling_skill:
                    self.add("error", "local-reference", f"Reference escapes the skill directory: {candidate}")
                    continue
            if not target_path.exists():
                self.add("error", "local-reference", f"Referenced local resource is missing: {candidate}")

    def _check_openai_metadata(self) -> None:
        metadata_path = self.skill_path / "agents" / "host-ui-metadata.yaml"
        if not metadata_path.exists():
            self.add("warning", "ui-metadata", "agents/host-ui-metadata.yaml is absent; create it for skill discovery UI.")
            return
        try:
            metadata = yaml.safe_load(metadata_path.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as exc:
            self.add("error", "ui-metadata-yaml", f"Invalid agents/host-ui-metadata.yaml: {exc}")
            return
        interface = metadata.get("interface") if isinstance(metadata, dict) else None
        if not isinstance(interface, dict):
            self.add("error", "ui-metadata-shape", "agents/host-ui-metadata.yaml must contain an interface mapping.")
            return
        display_name = interface.get("display_name")
        short_description = interface.get("short_description")
        default_prompt = interface.get("default_prompt")
        if not isinstance(display_name, str) or not display_name.strip():
            self.add("warning", "display-name", "UI metadata should include a display_name.")
        if not isinstance(short_description, str) or not short_description.strip():
            self.add("warning", "short-description", "UI metadata should include a short_description.")
        elif not 25 <= len(short_description.strip()) <= 64:
            self.add("warning", "short-description-length", "short_description should be 25–64 characters.")
        skill_name = self.frontmatter.get("name")
        accepted_invocations = (f"${skill_name}", f"/basics:{skill_name}")
        if not isinstance(default_prompt, str) or not any(invocation in default_prompt for invocation in accepted_invocations):
            self.add("warning", "default-prompt", "default_prompt should include the explicit skill invocation.")


def render(findings: list[Finding], as_json: bool) -> None:
    if as_json:
        print(json.dumps([asdict(finding) for finding in findings], indent=2))
        return
    if not findings:
        print("PASS: no structural or heuristic design findings.")
        return
    print("| Level | Rule | Finding |")
    print("| --- | --- | --- |")
    for finding in findings:
        print(f"| {finding.level.upper()} | {finding.rule} | {finding.message} |")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Claude Code skill structure and design heuristics.")
    parser.add_argument("skill_dir", type=Path)
    parser.add_argument("--strict", action="store_true", help="Fail on warnings as well as errors.")
    parser.add_argument("--json", action="store_true", help="Emit findings as JSON.")
    args = parser.parse_args()

    findings = Checker(args.skill_dir).check()
    render(findings, args.json)
    has_error = any(finding.level == "error" for finding in findings)
    has_warning = any(finding.level == "warning" for finding in findings)
    return 1 if has_error or (args.strict and has_warning) else 0


if __name__ == "__main__":
    raise SystemExit(main())
