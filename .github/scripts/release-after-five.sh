#!/usr/bin/env bash
set -euo pipefail

# The fifth saved site revision is the first GitHub release.
initial_commit=b509787ba632c330e74cc46f329daabbd92644ce
initial_tag=v0.1.0
updates_per_release=5
dry_run=${1:-}

if ! git merge-base --is-ancestor "$initial_commit" HEAD; then
  echo "The initial site revision is missing from this branch's history." >&2
  exit 1
fi

if [[ "$dry_run" != --dry-run ]]; then
  published_tags=$(gh api --paginate "repos/$GITHUB_REPOSITORY/releases?per_page=100" \
    --jq '.[] | select(.draft == false) | .tag_name')
fi

publish_release() {
  local tag=$1 commit=$2 previous_commit=${3:-}
  local tag_commit notes

  if [[ "$dry_run" == --dry-run ]]; then
    printf '%s %s\n' "$tag" "$commit"
    return
  fi

  if git show-ref --quiet --verify "refs/tags/$tag"; then
    tag_commit=$(git rev-parse "refs/tags/$tag^{commit}")
    if [[ "$tag_commit" != "$commit" ]]; then
      echo "Tag $tag already points to a different commit." >&2
      exit 1
    fi
  fi

  if [[ $'\n'"${published_tags}"$'\n' == *$'\n'"${tag}"$'\n'* ]]; then
    return
  fi

  if [[ -z "$previous_commit" ]]; then
    notes="Initial GitHub release of Melksanj, based on the fifth saved site revision."
  else
    notes=$(git log --first-parent --format='- %s (%h)' "$previous_commit..$commit" -- melksanj/)
  fi

  gh release create "$tag" --repo "$GITHUB_REPOSITORY" --target "$commit" \
    --title "$tag" --notes "$notes"
}

publish_release "$initial_tag" "$initial_commit"
previous_release_commit=$initial_commit
update_count=0
patch=0

commits=$(git rev-list --first-parent --reverse "$initial_commit..HEAD")
for commit in $commits; do
  # Count each change to site files once, including a branch merged into the default branch.
  changed_site_files=$(git diff --name-only "$commit^1" "$commit" -- melksanj/)
  if [[ -z "$changed_site_files" ]]; then
    continue
  fi

  update_count=$((update_count + 1))
  if ((update_count % updates_per_release == 0)); then
    patch=$((patch + 1))
    publish_release "v0.1.$patch" "$commit" "$previous_release_commit"
    previous_release_commit=$commit
  fi
done
