#!/usr/bin/env bash
# Create a read-only source snapshot without mutating the source repository.
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <repository> <commit-ish> [snapshot-directory]" >&2
  exit 2
fi

repository=$(cd "$1" && pwd -P)
revision=$2
if [[ $# -eq 3 ]]; then
  snapshot=$3
  if [[ -e "$snapshot" ]]; then
    echo "Snapshot path already exists: $snapshot" >&2
    exit 2
  fi
  mkdir -p "$snapshot"
else
  snapshot=$(mktemp -d "${TMPDIR:-/tmp}/red-team-snapshot.XXXXXX")
fi

cleanup=false
trap 'if [[ "$cleanup" == true ]]; then chmod -R u+w "$snapshot" 2>/dev/null || true; rm -rf "$snapshot"; fi' EXIT

commit=$(git -C "$repository" rev-parse --verify "${revision}^{commit}")
git -C "$repository" archive --format=tar "$commit" | tar -xf - -C "$snapshot"
chmod -R a-w "$snapshot"

echo "snapshot=$snapshot"
echo "commit=$commit"
