#!/usr/bin/env bash
# Builds a scratch copy of the site (plus test fixtures) and checks the
# generated HTML. Usage: tests/check-site.sh   (needs zola on PATH)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
SITE="$WORK/site"
P="$SITE/public"
B="https://sandeshghanta.github.io"

mkdir -p "$SITE"
tar -C "$ROOT" --exclude=.git --exclude=public --exclude=.claude -cf - . | tar -C "$SITE" -xf -

fail=0
has()    { grep -qF -- "$2" "$1" || { echo "FAIL: ${1#$WORK/} should contain: $2"; fail=1; }; }
lacks()  { ! grep -qF -- "$2" "$1" || { echo "FAIL: ${1#$WORK/} should not contain: $2"; fail=1; }; }
exists() { [[ -f "$1" ]] || { echo "FAIL: missing ${1#$WORK/}"; fail=1; }; }
absent() { [[ ! -e "$1" ]] || { echo "FAIL: should not exist: ${1#$WORK/}"; fail=1; }; }
# before FILE A B: the first A occurs before the first B
before() {
  local a b
  a=$(grep -boF -- "$2" "$1" | head -1 | cut -d: -f1)
  b=$(grep -boF -- "$3" "$1" | head -1 | cut -d: -f1)
  [[ -n "$a" && -n "$b" && "$a" -lt "$b" ]] || { echo "FAIL: ${1#$WORK/}: '$2' should come before '$3'"; fail=1; }
}
# variant NAME: a fresh copy of the site at $WORK/NAME for one-off changes
variant() { mkdir -p "$WORK/$1"; tar -C "$SITE" --exclude=public -cf - . | tar -C "$WORK/$1" -xf -; }
build_in() {
  (cd "$1" && zola build) >"$WORK/build.log" 2>&1 || { cat "$WORK/build.log"; exit 1; }
  # Zola only warns when it drops a post that has no date; treat that as an error.
  if grep -qF "page(s) ignored" "$WORK/build.log"; then cat "$WORK/build.log"; exit 1; fi
}

# --- fixtures ---

# A newer post with no `updated`, tagged, with math + highlighted code.
cat > "$SITE/content/runtime-log/zz-newer-fixture.md" <<'EOF'
+++
title = "Newer fixture"
date = 2030-01-01
[taxonomies]
tags = ["fixture"]
+++
$$x_{ij} + y_{kl}$$

```rust
fn main() {}
```
EOF
# A draft that must not show up anywhere.
cat > "$SITE/content/runtime-log/zz-draft-fixture.md" <<'EOF'
+++
title = "Draft fixture"
date = 2031-01-01
draft = true
[taxonomies]
tags = ["draftonly"]
+++
secret
EOF

# A newest reading item without a note.
cat >> "$SITE/data/reading.toml" <<'EOF'

[[items]]
date = 2099-01-01
kind = "tweet"
title = "Fixture tweet"
url = "https://example.com/fixture-tweet"
EOF

# Math that Markdown would mangle if it weren't wrapped in the math component.
cat > "$SITE/content/runtime-log/zz-math-fixture.md" <<'EOF'
+++
title = "Math fixture"
date = 2000-01-01
+++
Inline {% <math inline={true}> %}\hat{x}_{i} + \hat{y}_{j}{% </math> %} and a*b*c text.

{% <math> %}
\begin{bmatrix} a & b \\ c & d \end{bmatrix} \{a, b\} p*q*r
{% </math> %}
EOF

(cd "$SITE" && zola check --skip-external-links) >"$WORK/check.log" 2>&1 || { cat "$WORK/check.log"; exit 1; }
build_in "$SITE"

# --- checks ---

# Task 1: skeleton
for f in package.json gatsby-config.js .travis.yml src/pages; do absent "$ROOT/$f"; done
exists "$P/index.html"
exists "$P/style.css"
exists "$P/favicon.png"
has "$P/style.css" "dashed"
has "$P/index.html" "href=\"$B/\">/home</a>"
has "$P/index.html" "href=\"$B/runtime-log/\">/runtime-log</a>"
has "$P/index.html" "href=\"$B/reading/\">/reading</a>"
has "$P/index.html" "built with"
has "$P/index.html" 'name="viewport"'

# Task 2: runtime-log
L="$P/runtime-log/index.html"
has "$L" "href=\"$B/runtime-log/firstblog/\">[2020-10-20]: Sample</a>"
has "$L" "href=\"$B/runtime-log/zz-newer-fixture/\">[2030-01-01]: Newer fixture</a>"
before "$L" "Newer fixture" "Sample"
has "$L" "class=\"badge\" href=\"$B/tags/sample/\">sample</a>"
lacks "$L" "please inform me"
POST="$P/runtime-log/firstblog/index.html"
has "$POST" "<h2>Sample</h2>"
has "$POST" "Author: Sandesh Ghanta"
has "$POST" "Created: 2020-10-20"
has "$POST" "Last modified: 2020-10-20"
has "$POST" "katex@0.19.0/dist/katex.min.js"
has "$POST" "renderMathInElement"
FIX="$P/runtime-log/zz-newer-fixture/index.html"
has "$FIX" '$$x_{ij} + y_{kl}$$'
has "$FIX" 'class="giallo"'
lacks "$FIX" "Last modified"
exists "$P/tags/index.html"
has "$P/tags/index.html" "$B/tags/sample/"
has "$P/tags/sample/index.html" "Sample"
# drafts never render
absent "$P/runtime-log/zz-draft-fixture"
absent "$P/tags/draftonly"
lacks "$L" "Draft fixture"
lacks "$P/tags/index.html" "draftonly"
lacks "$P/index.html" "katex"

# Task 3: home CV
H="$P/index.html"
has "$H" "<h1"
has "$H" "Software Engineer, AI Infra @ Scale AI"
has "$H" "I like most things in computers and programming, especially distributed systems and systems programming."
has "$H" "<dl>"
has "$H" "<dt>Nov 2024 – now</dt>"
has "$H" "Scale AI — Software Developer, AI Infra"
has "$H" "Pure Storage — Software Engineer, Filesystem"
has "$H" "NetApp — Software Engineer Intern"
has "$H" "Secure Trusted and Applied Microelectronics, ASU — Graduate Research Assistant"
has "$H" "Amazon — Software Development Engineer, Prime Video"
has "$H" "Arizona State University — M.S., Computer Science"
has "$H" "Amrita Vishwa Vidyapeetham — B.Tech., Computer Science and Engineering"
before "$H" "Scale AI" "Amazon"
for url in https://github.com/sandeshghanta https://www.linkedin.com/in/sandeshghanta/ \
  https://codeforces.com/profile/sandeshghanta https://www.codechef.com/users/sandeshghanta \
  https://www.instagram.com/sandeshghanta/ https://www.facebook.com/sandesh.ghanta/; do
  has "$H" "href=\"$url\""
done
has "$H" 'href="mailto:sghanta05@gmail.com"'
has "$H" "Latest from runtime-log"
# latest = newest non-draft post (the 2030 fixture), and only one entry
has "$H" "$B/runtime-log/zz-newer-fixture/"
lacks "$H" "$B/runtime-log/firstblog/"
lacks "$H" "Draft fixture"
lacks "$H" "SDE1"
absent "$P/contact"

# Task 4: reading
R="$P/reading/index.html"
has "$R" '[2099-01-01] [tweet] <a href="https://example.com/fixture-tweet">Fixture tweet</a></li>'
has "$R" "Dan Luu"
has "$R" "Example entry. Replace with your own."
before "$R" "Fixture tweet" "Dan Luu"
variant empty-reading
: > "$WORK/empty-reading/data/reading.toml"
build_in "$WORK/empty-reading"
has "$WORK/empty-reading/public/reading/index.html" "Nothing here yet."

# Task 5: 404 + analytics
has "$P/404.html" "NOT FOUND"
has "$P/404.html" "/runtime-log</a>"
lacks "$P/index.html" "goatcounter"
variant analytics
sed -i.bak 's/^goatcounter_code = ""/goatcounter_code = "test-gc"/' "$WORK/analytics/config.toml"
build_in "$WORK/analytics"
has "$WORK/analytics/public/index.html" 'data-goatcounter="https://test-gc.goatcounter.com/count"'
has "$WORK/analytics/public/index.html" 'src="https://gc.zgo.at/count.js"'

# Final review: math survives Markdown
M="$P/runtime-log/zz-math-fixture/index.html"
has "$M" '$\hat{x}_{i} + \hat{y}_{j}$'
has "$M" '\begin{bmatrix} a &amp; b \\ c &amp; d \end{bmatrix} \{a, b\} p*q*r'
has "$M" "a<em>b</em>c"

# Final review: a post Zola would silently drop (no date) fails the build
variant undated
printf '+++\ntitle = "No date"\n+++\nx\n' > "$WORK/undated/content/runtime-log/no-date.md"
if (build_in "$WORK/undated" >/dev/null); then echo "FAIL: a post without a date should fail the build"; fail=1; fi

if [[ $fail -ne 0 ]]; then echo "site checks FAILED"; exit 1; fi
echo "site checks passed"
