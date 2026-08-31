#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <create|hash|cleanup> <directory>" >&2
  exit 2
}

hash_tree() {
  local root="$1"
  (
    cd "$root"
    find . -type f \
      -not -path './.git/*' \
      -not -path '*/node_modules/*' \
      -not -name '.bug-list-generator-snapshot' \
      -print0 \
      | sort -z \
      | xargs -0 -r sha256sum \
      | sha256sum \
      | cut -d' ' -f1
  )
}

mode="${1:-}"
target="${2:-}"
[[ -n "$mode" && -n "$target" && $# -eq 2 ]] || usage

case "$mode" in
  create)
    source_dir="$(realpath "$target")"
    [[ -d "$source_dir" ]] || { echo "Source directory does not exist: $target" >&2; exit 1; }
    temp_root="$(realpath -m "${TMPDIR:-/tmp}")"
    snapshot_dir="$(mktemp -d "$temp_root/bug-list-generator-snapshot.XXXXXX")"
    cleanup_on_error=true
    trap 'if [[ "${cleanup_on_error:-false}" == true ]]; then chmod -R u+w "$snapshot_dir" 2>/dev/null || true; rm -rf -- "$snapshot_dir"; fi' EXIT
    cp -a "$source_dir"/. "$snapshot_dir"/
    source_digest="$(hash_tree "$source_dir")"
    snapshot_digest="$(hash_tree "$snapshot_dir")"
    [[ "$source_digest" == "$snapshot_digest" ]] || { echo "Source changed while the snapshot was created" >&2; exit 1; }
    : > "$snapshot_dir/.bug-list-generator-snapshot"
    chmod -R a-w "$snapshot_dir"
    cleanup_on_error=false
    trap - EXIT
    printf 'source=%s\nsnapshot=%s\ndigest=%s\n' "$source_dir" "$snapshot_dir" "$source_digest"
    ;;
  hash)
    source_dir="$(realpath "$target")"
    [[ -d "$source_dir" ]] || { echo "Source directory does not exist: $target" >&2; exit 1; }
    hash_tree "$source_dir"
    ;;
  cleanup)
    snapshot_dir="$(realpath "$target")"
    temp_root="$(realpath -m "${TMPDIR:-/tmp}")"
    case "$snapshot_dir" in
      "$temp_root"/bug-list-generator-snapshot.*) ;;
      *) echo "Refusing to clean an unrecognized snapshot path: $snapshot_dir" >&2; exit 1 ;;
    esac
    [[ -f "$snapshot_dir/.bug-list-generator-snapshot" ]] || { echo "Snapshot marker is missing: $snapshot_dir" >&2; exit 1; }
    chmod -R u+w "$snapshot_dir"
    rm -rf -- "$snapshot_dir"
    ;;
  *)
    usage
    ;;
esac
