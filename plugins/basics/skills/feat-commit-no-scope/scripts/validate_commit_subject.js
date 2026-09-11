#!/usr/bin/env node

const subject = process.argv.slice(2).join(" ").trim();
const allowedTypes = new Set([
  "feat",
  "fix",
  "docs",
  "refactor",
  "test",
  "chore",
  "build",
  "ci",
  "perf",
  "style",
  "revert",
]);
const errors = [];

if (!subject) {
  errors.push("Commit subject is required.");
} else {
  if (/\r|\n/.test(subject)) {
    errors.push("Subject must be a single line.");
  }

  if (subject.length > 72) {
    errors.push(`Subject is ${subject.length} characters; maximum is 72.`);
  }

  const match = /^([a-z]+): (\S.*)$/.exec(subject);
  if (!match) {
    errors.push("Subject must use 'type: description' with no scope or ! marker.");
  } else if (!allowedTypes.has(match[1])) {
    errors.push(`Unsupported commit type '${match[1]}'.`);
  } else {
    const [, type, description] = match;

    if (type === "feat" && /^improve\b/i.test(description)) {
      errors.push("Use 'refactor:' for an improvement unless it is named as a concrete new capability.");
    }

    if (type !== "chore" && /^merge\b/i.test(description)) {
      errors.push("Use 'chore:' for merge commits and merge subjects.");
    }

    if (/^update (?:project files|project tooling|app flow|app behavior|project docs|validation docs|branch tracking docs|documentation|test coverage)$/i.test(description)) {
      errors.push("Replace the generic 'update ...' placeholder with the concrete outcome from the diff.");
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Valid commit subject.");
