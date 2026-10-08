# Zola Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead Gatsby/Travis site with a Zola site (CV home, runtime-log, reading list) deployed to GitHub Pages by GitHub Actions.

**Architecture:** A plain Zola site. Content is Markdown/TOML, templates are Tera 2, and styles are the old Sass carried over. One bash script (`tests/check-site.sh`) builds a scratch copy of the site with test fixtures added and greps the generated HTML. CI runs that script on PRs, then builds and deploys `public/` to Pages on pushes to `master`.

**Tech Stack:** Zola 0.23.6 (Tera 2 templates, grass Sass, giallo highlighting), KaTeX 0.19.0 from jsDelivr, GitHub Actions (`actions/checkout@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`), GoatCounter (optional).

**Spec:** `docs/specs/2026-10-07-zola-migration-design.md`

## Global Constraints

- All work happens in the worktree `/Users/sandesh.ghanta/workplace/temp/sandeshghanta.github.io/.claude/worktrees/zola-migration` (branch `sandeshghanta/_claude/zola-migration`). Run every command from there.
- Zola version: `0.23.6`, the same locally and in CI. Install it with `brew install zola` or the release binary.
- **Templates are Tera 2, not Tera 1:**
  - There are no macros, `import` or `default` filter. Use components: define with `{% component name(arg) %}…{% endcomponent name %}`, call with `{{<name arg={value} />}}`.
  - Reading an undefined nested field errors, so use `a?.b or fallback`.
  - Reverse a list with `(list | sort(attribute="date"))[::-1]`.
- Internal links in templates use `get_url(path="@/<content file>")`. That gives validated URLs with trailing slashes. A plain `get_url(path="x/")` drops the slash.
- `base_url = "https://sandeshghanta.github.io"`. URLs follow Zola's default slugify (lowercase, hyphenated). No redirects from old URLs.
- No Node, npm or package.json anywhere in the repo.
- KaTeX is pinned to `0.19.0` on `cdn.jsdelivr.net` and loaded only by `templates/page.html`.
- Analytics: GoatCounter loads only when `config.extra.goatcounter_code` is non-empty. Ship it empty.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- CV copy, verbatim:
  - Headline: `Software Engineer, AI Infra @ Scale AI`
  - Bio: `Software engineer working on AI infrastructure. I like most things in computers and programming, especially distributed systems and systems programming.`
  - Experience: `Scale AI — Software Developer, AI Infra` (Nov 2024 – now); `Pure Storage — Software Engineer, Filesystem` (Jan 2023 – Nov 2024); `NetApp — Software Engineer Intern` (Jun 2022 – Aug 2022); `Secure Trusted and Applied Microelectronics, ASU — Graduate Research Assistant` (Aug 2021 – May 2022); `Amazon — Software Development Engineer, Prime Video` (Feb 2020 – Jul 2021).
  - Education: `Arizona State University — M.S., Computer Science` (2021 – 2022); `Amrita Vishwa Vidyapeetham — B.Tech., Computer Science and Engineering` (2016 – 2020).
  - Email: `sghanta05@gmail.com`
  - Links: GitHub, LinkedIn, Codeforces, Codechef, Instagram, Facebook.

## Review Focus

1. **Draft posts** (`draft = true`) must not appear anywhere: post page, runtime-log list, home "Latest", tag pages. Covered by Task 2 and Task 3 checks.
2. **A post without `updated`** must list with its `date`, not crash or show blank. Covered by a Task 2 check.
3. **Math with underscores** (`$$x_{ij} + y_{kl}$$`) must reach the browser untouched by Markdown emphasis. Covered by a Task 2 check.
4. **The reading list** must still build when `data/reading.toml` is empty, and must not print a dangling `: ` for an item without a `note`. Covered by Task 4 checks.
5. **The GoatCounter script** must not be emitted when the code is empty, and must be emitted with the right URL when set. Covered by Task 5 checks.

---

## File Structure

```
config.toml                  # site config, markdown options, [extra] author/email/links/goatcounter_code
sass/style.sass              # console look (ported from src/styles/style.sass)
static/favicon.png           # moved from src/images/favicon.png
content/_index.md            # home: CV Markdown
content/reading.md           # stub page that selects templates/reading.html at /reading/
content/runtime-log/_index.md
content/runtime-log/firstblog.md
data/reading.toml            # reading list entries
templates/base.html          # html shell, menu, footer, analytics
templates/components.html    # post_entry component (shared list row)
templates/index.html         # home
templates/section.html       # runtime-log list
templates/page.html          # single post (+KaTeX)
templates/reading.html
templates/404.html
templates/tags/list.html
templates/tags/single.html
tests/check-site.sh          # build + HTML assertions (runs in CI)
.github/workflows/deploy.yml
README.md
```

Removed: `package.json`, `gatsby-browser.js`, `gatsby-config.js`, `gatsby-node.js`, `src/`, `.travis.yml`, `.prettierrc`, `.prettierignore`. Keep `.gitignore`, but replace its contents (Task 1).

---

### Task 1: Zola skeleton, layout, styles; remove Gatsby

**Files:**
- Create: `tests/check-site.sh`, `config.toml`, `sass/style.sass`, `templates/base.html`, `templates/index.html`, `templates/section.html`, `templates/page.html`, `templates/reading.html`, `content/_index.md`, `content/runtime-log/_index.md`, `content/reading.md`
- Move: `src/images/favicon.png` → `static/favicon.png`
- Delete: `package.json`, `gatsby-browser.js`, `gatsby-config.js`, `gatsby-node.js`, `.travis.yml`, `.prettierrc`, `.prettierignore`, `src/styles/`, `src/pages/`, `src/components/`, `src/templates/`, `src/scripts/`, `src/content/config/`, `src/content/projects/`. Keep `src/content/runtimeLog/firstblog.md` for Task 2.
- Modify: `.gitignore` (replace all contents)

**Interfaces:**
- Produces:
  - `templates/base.html` with blocks `title`, `head`, `content`.
  - The menu links to `@/_index.md`, `@/runtime-log/_index.md` and `@/reading.md`.
  - `tests/check-site.sh` has two marked sections, `# --- fixtures ---` and `# --- checks ---`, which later tasks append to.
  - Helpers: `has FILE TEXT`, `lacks FILE TEXT`, `exists FILE`, `absent PATH`, `before FILE A B`, `variant NAME`, `build_in DIR`. FILE paths are absolute.
  - Variables: `$ROOT` (repo), `$SITE` (scratch copy), `$P` (`$SITE/public`), `$B` (base URL), `$WORK`.
  - The stub templates `section.html`, `page.html` and `reading.html` get replaced in Tasks 2 and 4.

- [ ] **Step 1: Write the check script (failing)**

Create `tests/check-site.sh`:

```bash
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
build_in() { (cd "$1" && zola build) >"$WORK/build.log" 2>&1 || { cat "$WORK/build.log"; exit 1; }; }

# --- fixtures ---

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

if [[ $fail -ne 0 ]]; then echo "site checks FAILED"; exit 1; fi
echo "site checks passed"
```

Run: `chmod +x tests/check-site.sh`

- [ ] **Step 2: Run it to confirm it fails**

Run: `tests/check-site.sh`
Expected: exits non-zero, with a Zola error about the missing `config.toml`.

- [ ] **Step 3: Move the favicon and delete the Gatsby files**

```bash
mkdir -p static
git mv src/images/favicon.png static/favicon.png
git rm -q package.json gatsby-browser.js gatsby-config.js gatsby-node.js .travis.yml .prettierrc .prettierignore
git rm -rq src/styles src/pages src/components src/templates src/scripts src/content/config src/content/projects
```

Replace `.gitignore` entirely with:

```
public/
.DS_Store
```

- [ ] **Step 4: Write `config.toml`**

```toml
base_url = "https://sandeshghanta.github.io"
title = "Sandesh Ghanta"
description = "Sandesh Ghanta: software engineer. CV, runtime-log and reading list."
default_language = "en"
compile_sass = true
build_search_index = false
generate_feeds = false
taxonomies = [{ name = "tags" }]

[markdown]
render_emoji = true
definition_list = true

[markdown.highlighting]
theme = "github-light"

[extra]
author = "Sandesh Ghanta"
email = "sghanta05@gmail.com"
# GoatCounter site code (the "xyz" in xyz.goatcounter.com). Empty = no analytics.
goatcounter_code = ""
links = [
  { name = "GitHub", url = "https://github.com/sandeshghanta" },
  { name = "LinkedIn", url = "https://www.linkedin.com/in/sandeshghanta/" },
  { name = "Codeforces", url = "https://codeforces.com/profile/sandeshghanta" },
  { name = "Codechef", url = "https://www.codechef.com/users/sandeshghanta" },
  { name = "Instagram", url = "https://www.instagram.com/sandeshghanta/" },
  { name = "Facebook", url = "https://www.facebook.com/sandesh.ghanta/" },
]
```

- [ ] **Step 5: Write `sass/style.sass`**

```sass
// Console look carried over from the Gatsby site.
$fg: #000
$bg: #fff
$muted: #555

body
  background-color: $bg
  color: $fg
  font-family: 'Lato', sans-serif
  line-height: 1.5
  margin: 0

a
  color: $fg

.content-wrapper
  width: 90%
  max-width: 1000px
  margin: 0 auto

header
  margin-top: 25px
  margin-bottom: 10px

.menu
  border-top: dashed 1px $fg
  border-bottom: dashed 1px $fg
  margin-bottom: 25px

  ul
    list-style: none
    margin: 12px 0
    padding: 0
    text-align: right

  li
    display: inline
    margin-left: 10px
    font-size: 16px

  li.home
    float: left
    margin-left: 0

  a
    text-decoration: none
    color: $fg

    &:hover
      background-color: $fg
      color: $bg

.footer
  border-top: dashed 1px $fg
  margin: 20px auto 15px
  padding-top: 10px
  text-align: right
  font-size: 14px

.list
  font-size: 16px
  padding-left: 40px

  li
    padding: .25rem

  a
    text-decoration: none
    color: $fg

    &:hover
      background-color: $fg
      color: $bg

.badge
  display: inline-block
  margin-left: .25rem
  padding: .35em .5em
  font-size: 75%
  font-weight: 700
  line-height: 1
  white-space: nowrap
  border-radius: .25rem
  color: $bg !important
  background-color: #343a40
  text-decoration: none

// CV rows: dates column + text column, stacked on narrow screens.
.cv dl
  display: grid
  grid-template-columns: 11rem 1fr
  gap: .25rem 1rem
  margin: 0

.cv dt
  color: $muted

.cv dd
  margin: 0

@media (max-width: 600px)
  .cv dl
    grid-template-columns: 1fr
    gap: 0

  .cv dd
    margin-bottom: .5rem

.content
  text-align: justify

  a
    text-decoration: underline

  .meta
    color: $muted

pre.giallo
  padding: 1rem
  overflow-x: auto
  border-radius: .25rem
  background-color: #f6f8fa !important
```

- [ ] **Step 6: Write `templates/base.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% block title %}{{ config.title }}{% endblock title %}</title>
  <meta name="description" content="{{ config.description }}">
  <link rel="icon" type="image/png" href="{{ get_url(path='favicon.png') }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lato&display=swap">
  <link rel="stylesheet" href="{{ get_url(path='style.css') }}">
  {% block head %}{% endblock head %}
</head>
<body>
  <div class="content-wrapper">
    <header>
      <nav class="menu">
        <ul>
          <li class="home"><a href="{{ get_url(path='@/_index.md') }}">/home</a></li>
          <li><a href="{{ get_url(path='@/runtime-log/_index.md') }}">/runtime-log</a></li>
          <li><a href="{{ get_url(path='@/reading.md') }}">/reading</a></li>
        </ul>
      </nav>
    </header>
    <main>
      {% block content %}{% endblock content %}
    </main>
    <footer class="footer">built with <a href="https://www.getzola.org">Zola</a></footer>
  </div>
</body>
</html>
```

- [ ] **Step 7: Write the stub content and templates**

`content/_index.md`:

```
+++
title = "Sandesh Ghanta"
+++
```

`content/runtime-log/_index.md`:

```
+++
title = "runtime-log"
sort_by = "date"
+++
```

`content/reading.md`:

```
+++
title = "reading"
path = "reading"
template = "reading.html"
+++
```

`templates/index.html`:

```html
{% extends "base.html" %}
{% block content %}
<div class="cv">{{ section.content | safe }}</div>
{% endblock content %}
```

`templates/section.html`, `templates/page.html` and `templates/reading.html` all get the same placeholder, which Tasks 2 and 4 replace:

```html
{% extends "base.html" %}
```

- [ ] **Step 8: Run the checks**

Run: `tests/check-site.sh`
Expected: `site checks passed`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Replace Gatsby with a Zola skeleton

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: runtime-log (list, posts, tags, math, code)

**Files:**
- Create: `templates/components.html`, `templates/tags/list.html`, `templates/tags/single.html`
- Replace: `templates/section.html`, `templates/page.html`
- Move + rewrite: `src/content/runtimeLog/firstblog.md` → `content/runtime-log/firstblog.md`, then delete `src/`
- Modify: `tests/check-site.sh` (fixtures + checks)

**Interfaces:**
- Consumes: `base.html` blocks `title`, `head`, `content`; the `content/runtime-log/_index.md` section.
- Produces: the component `post_entry(page)`, called as `{{<post_entry page={p} />}}`. It renders `<a href="permalink">[updated-or-date]: title</a>` followed by tag badges `<a class="badge" href="tag url">tag</a>`. Task 3 uses it for the home "Latest" row.

- [ ] **Step 1: Add fixtures and checks (failing)**

In `tests/check-site.sh`, under `# --- fixtures ---`, add:

~~~bash
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
~~~

Under `# --- checks ---`, before the final `if`, add:

```bash
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
```

- [ ] **Step 2: Run to confirm failure**

Run: `tests/check-site.sh`
Expected: many `FAIL:` lines, for example `runtime-log/index.html should contain: href="…/runtime-log/firstblog/"…`, ending with `site checks FAILED`.

- [ ] **Step 3: Migrate the sample post**

```bash
mkdir -p content/runtime-log
git mv src/content/runtimeLog/firstblog.md content/runtime-log/firstblog.md
git rm -rq src
```

Replace the front matter of `content/runtime-log/firstblog.md` (everything between the two `---` lines, inclusive) with:

```
+++
title = "Sample"
date = 2020-10-20
updated = 2020-10-20
draft = false

[taxonomies]
tags = ["sample", "tag"]
+++
```

Leave the body (the math and code sections) unchanged.

- [ ] **Step 4: Write `templates/components.html`**

```html
{% component post_entry(page) %}<a href="{{ page.permalink | safe }}">[{% if page.updated %}{{ page.updated }}{% else %}{{ page.date }}{% endif %}]: {{ page.title }}</a>{% for tag in page.taxonomies?.tags or [] %} <a class="badge" href="{{ get_taxonomy_url(kind='tags', name=tag) | safe }}">{{ tag }}</a>{% endfor %}{% endcomponent post_entry %}
```

- [ ] **Step 5: Write `templates/section.html`**

```html
{% extends "base.html" %}
{% block title %}runtime-log | {{ config.title }}{% endblock title %}
{% block content %}
<h4>Tags</h4>
<p>{% for term in get_taxonomy(kind="tags").items %}<a class="badge" href="{{ term.permalink | safe }}">{{ term.name }}</a>{% endfor %}</p>
<h4>runtime-log</h4>
<ul class="list">
  {% for p in section.pages %}<li>{{<post_entry page={p} />}}</li>
  {% endfor %}
</ul>
{% endblock content %}
```

- [ ] **Step 6: Write `templates/page.html`**

```html
{% extends "base.html" %}
{% block title %}{{ page.title }} | {{ config.title }}{% endblock title %}
{% block head %}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.querySelector('.content'), {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]})"></script>
{% endblock head %}
{% block content %}
<article class="content">
  <h2>{{ page.title }}</h2>
  <p class="meta">Author: {{ config.extra.author }} · Created: {{ page.date }}{% if page.updated %} · Last modified: {{ page.updated }}{% endif %}</p>
  <hr>
  {{ page.content | safe }}
</article>
{% endblock content %}
```

- [ ] **Step 7: Write the tag templates**

`templates/tags/list.html`:

```html
{% extends "base.html" %}
{% block title %}tags | {{ config.title }}{% endblock title %}
{% block content %}
<h4>Tags</h4>
<ul class="list">
  {% for term in terms %}<li><a href="{{ term.permalink | safe }}">{{ term.name }}</a> ({{ term.page_count }})</li>
  {% endfor %}
</ul>
{% endblock content %}
```

`templates/tags/single.html`:

```html
{% extends "base.html" %}
{% block title %}#{{ term.name }} | {{ config.title }}{% endblock title %}
{% block content %}
<h4>runtime-log with tag: {{ term.name }}</h4>
<ul class="list">
  {% for p in term.pages %}<li>{{<post_entry page={p} />}}</li>
  {% endfor %}
</ul>
<p><a href="{{ get_url(path='@/runtime-log/_index.md') }}">all posts</a></p>
{% endblock content %}
```

- [ ] **Step 8: Run the checks**

Run: `tests/check-site.sh`
Expected: `site checks passed`

If the `class="badge" href=` check fails only because of whitespace or attribute order, fix the template so the output matches the check. Never weaken the check.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add runtime-log section, post page, tags, math and highlighting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Home page CV

**Files:**
- Replace: `content/_index.md`, `templates/index.html`
- Modify: `tests/check-site.sh` (checks)

**Interfaces:**
- Consumes: `post_entry` (Task 2); `config.extra.links` (each has `name`, `url`) and `config.extra.email` (Task 1).

- [ ] **Step 1: Add checks (failing)**

Under `# --- checks ---`, before the final `if`, add:

```bash
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
```

- [ ] **Step 2: Run to confirm failure**

Run: `tests/check-site.sh`
Expected: `FAIL:` lines for the Task 3 checks (Tasks 1 and 2 still pass), ending with `site checks FAILED`.

- [ ] **Step 3: Write `content/_index.md`**

```markdown
+++
title = "Sandesh Ghanta"
+++

# Sandesh Ghanta

Software Engineer, AI Infra @ Scale AI

Software engineer working on AI infrastructure. I like most things in computers and programming, especially distributed systems and systems programming.

#### Experience

Nov 2024 – now
: Scale AI — Software Developer, AI Infra

Jan 2023 – Nov 2024
: Pure Storage — Software Engineer, Filesystem

Jun 2022 – Aug 2022
: NetApp — Software Engineer Intern

Aug 2021 – May 2022
: Secure Trusted and Applied Microelectronics, ASU — Graduate Research Assistant

Feb 2020 – Jul 2021
: Amazon — Software Development Engineer, Prime Video

#### Education

2021 – 2022
: Arizona State University — M.S., Computer Science

2016 – 2020
: Amrita Vishwa Vidyapeetham — B.Tech., Computer Science and Engineering
```

- [ ] **Step 4: Write `templates/index.html`**

```html
{% extends "base.html" %}
{% block content %}
<div class="cv">{{ section.content | safe }}</div>

<h4>Elsewhere</h4>
<p>
  {% for link in config.extra.links %}<a href="{{ link.url }}">{{ link.name }}</a> · {% endfor %}<a href="mailto:{{ config.extra.email }}">{{ config.extra.email }}</a>
</p>

{% set latest = get_section(path="runtime-log/_index.md").pages | first %}
{% if latest %}
<h4>Latest from runtime-log</h4>
<ul class="list">
  <li>{{<post_entry page={latest} />}}</li>
</ul>
{% endif %}
{% endblock content %}
```

- [ ] **Step 5: Run the checks**

Run: `tests/check-site.sh`
Expected: `site checks passed`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Turn the home page into a minimal CV

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Reading page

**Files:**
- Create: `data/reading.toml`
- Replace: `templates/reading.html`
- Modify: `tests/check-site.sh` (fixtures + checks)

**Interfaces:**
- Consumes: `content/reading.md` (Task 1) selects this template at `/reading/`.
- Data shape: `[[items]]` with `date` (TOML date), `kind` (string), `title`, `url`, and an optional `note`.

- [ ] **Step 1: Add fixtures and checks (failing)**

Under `# --- fixtures ---`, add:

```bash
# A newest reading item without a note.
cat >> "$SITE/data/reading.toml" <<'EOF'

[[items]]
date = 2099-01-01
kind = "tweet"
title = "Fixture tweet"
url = "https://example.com/fixture-tweet"
EOF
```

Under `# --- checks ---`, before the final `if`, add:

```bash
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
```

- [ ] **Step 2: Run to confirm failure**

Run: `tests/check-site.sh`
Expected: it fails, because `data/reading.toml` doesn't exist yet. The `cat >>` creates it with only the fixture, so the `Dan Luu` checks fail.

- [ ] **Step 3: Write `data/reading.toml`**

```toml
# Things worth reading. Newest first on the page (sorted by date).
# kind: blog | tweet | paper | video | talk     note: optional one-liner

[[items]]
date = 2026-10-07
kind = "blog"
title = "Dan Luu"
url = "https://danluu.com/"
note = "Example entry. Replace with your own."
```

- [ ] **Step 4: Write `templates/reading.html`**

```html
{% extends "base.html" %}
{% block title %}reading | {{ config.title }}{% endblock title %}
{% block content %}
{% set data = load_data(path="data/reading.toml") %}
{% set items = data?.items or [] %}
<h4>reading</h4>
{% if items %}
<ul class="list">
  {% for item in (items | sort(attribute="date"))[::-1] %}<li>[{{ item.date }}] [{{ item.kind }}] <a href="{{ item.url }}">{{ item.title }}</a>{% if item.note %}: {{ item.note }}{% endif %}</li>
  {% endfor %}
</ul>
{% else %}
<p>Nothing here yet.</p>
{% endif %}
{% endblock content %}
```

- [ ] **Step 5: Run the checks**

Run: `tests/check-site.sh`
Expected: `site checks passed`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add reading list page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 404 page and GoatCounter

**Files:**
- Create: `templates/404.html`
- Modify: `templates/base.html` (analytics snippet), `tests/check-site.sh` (checks)

**Interfaces:**
- Consumes: `config.extra.goatcounter_code` (Task 1, empty by default).

- [ ] **Step 1: Add checks (failing)**

Under `# --- checks ---`, before the final `if`, add:

```bash
# Task 5: 404 + analytics
has "$P/404.html" "NOT FOUND"
has "$P/404.html" "/runtime-log</a>"
lacks "$P/index.html" "goatcounter"
variant analytics
sed -i.bak 's/^goatcounter_code = ""/goatcounter_code = "test-gc"/' "$WORK/analytics/config.toml"
build_in "$WORK/analytics"
has "$WORK/analytics/public/index.html" 'data-goatcounter="https://test-gc.goatcounter.com/count"'
has "$WORK/analytics/public/index.html" 'src="https://gc.zgo.at/count.js"'
```

- [ ] **Step 2: Run to confirm failure**

Run: `tests/check-site.sh`
Expected: `FAIL:` lines for `404.html` and `data-goatcounter`, ending with `site checks FAILED`.

- [ ] **Step 3: Write `templates/404.html`**

```html
{% extends "base.html" %}
{% block title %}404 | {{ config.title }}{% endblock title %}
{% block content %}
<h4>NOT FOUND</h4>
<p>You just hit a route that doesn't exist.</p>
{% endblock content %}
```

- [ ] **Step 4: Add the analytics snippet to `templates/base.html`**

Directly after `{% block head %}{% endblock head %}`, insert:

```html
  {% if config.extra.goatcounter_code %}
  <script data-goatcounter="https://{{ config.extra.goatcounter_code }}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
  {% endif %}
```

- [ ] **Step 5: Run the checks**

Run: `tests/check-site.sh`
Expected: `site checks passed`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add 404 page and optional GoatCounter analytics

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: GitHub Actions and README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Replace: `README.md`

**Interfaces:**
- Consumes: `tests/check-site.sh` (needs `zola` on PATH) and `zola build` output in `public/`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Build and deploy

on:
  push:
    branches: [master]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  ZOLA_VERSION: "0.23.6"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Install Zola
        run: |
          mkdir -p "$HOME/.local/bin"
          curl -sSfL "https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
            | tar xz -C "$HOME/.local/bin" zola
          echo "$HOME/.local/bin" >> "$GITHUB_PATH"

      - name: Check site
        run: tests/check-site.sh

      - name: Build
        run: zola build

      - name: Upload Pages artifact
        if: github.ref == 'refs/heads/master'
        uses: actions/upload-pages-artifact@v5
        with:
          path: public

  deploy:
    if: github.ref == 'refs/heads/master'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Validate the workflow**

Run: `yq '.jobs | keys' .github/workflows/deploy.yml`
Expected: `- build` and `- deploy`

If `actionlint` is installed (`command -v actionlint`), also run `actionlint .github/workflows/deploy.yml`. Expected: no output.

- [ ] **Step 3: Write `README.md`**

````markdown
# sandeshghanta.github.io

My personal site: a minimal CV, a runtime-log (notes) and a reading list.
Built with [Zola](https://www.getzola.org) and deployed to GitHub Pages by
GitHub Actions on every push to `master`.

## Develop

```bash
brew install zola        # or grab a release binary
zola serve               # http://127.0.0.1:1111
tests/check-site.sh      # build + HTML checks (also runs in CI)
```

## Edit

- **CV:** `content/_index.md`
- **Links, email, analytics:** `[extra]` in `config.toml`
- **New post:** `content/runtime-log/<kebab-case-name>.md` with `title`, `date`,
  optional `updated`, `draft`, and `[taxonomies] tags`. Math goes in `$…$` / `$$…$$`.
- **Reading list:** add an `[[items]]` entry to `data/reading.toml`

Thanks to @Harshithpabbati for the original
[console theme](https://github.com/harshithpabbati/gatsby-theme-console).
````

- [ ] **Step 4: Run the checks once more**

Run: `tests/check-site.sh`
Expected: `site checks passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Deploy with GitHub Actions; update README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Visual check, merge, go live

**Files:** none new.

- [ ] **Step 1: Visual check in a browser**

Run `zola serve` in the background from the worktree. With Chrome automation, screenshot each page at desktop width (1280px) and phone width (390px):
- `/`
- `/runtime-log/`
- `/runtime-log/firstblog/` (confirm the KaTeX formulas render as math, not raw `$$`)
- `/tags/sample/`
- `/reading/`
- `/nope` (the 404)

Compare against the live site (https://sandeshghanta.github.io) for the console look: dashed menu borders, `/home` on the left, black hover highlight, and dark tag badges. At 390px, check that the CV rows stack (date above text) and there's no horizontal scroll. Fix any problems in `sass/style.sass`, rerun `tests/check-site.sh`, and commit.

- [ ] **Step 2: Squash and merge into `master`**

From the initiative root (`/Users/sandesh.ghanta/workplace/temp/sandeshghanta.github.io`):

```bash
git merge --squash sandeshghanta/_claude/zola-migration
git commit -m "Migrate site from Gatsby to Zola; add CV, reading list, Actions deploy

Replace the Gatsby 2 / Node 10 / Travis setup with Zola 0.23.6 and a GitHub
Actions workflow that checks, builds and deploys to GitHub Pages. The home page
becomes a minimal CV, contact info moves onto it, runtime-log moves to
/runtime-log/ with tag pages, and a new /reading/ page lists things worth
reading. Optional GoatCounter analytics; no cookies.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Leave the worktree in place.

- [ ] **Step 3: Ask the user before going live**

Pushing `master` and changing the Pages source both affect the public site, so ask for explicit approval first. With approval:

```bash
gh api --method PUT repos/sandeshghanta/sandeshghanta.github.io/pages -f build_type=workflow
git push origin master
```

- [ ] **Step 4: Watch the deploy**

Run: `gh run watch --exit-status $(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: the `build` and `deploy` jobs succeed.

Then run `curl -s https://sandeshghanta.github.io/ | grep -c "Pure Storage"`. Expected: `1` or more. The CDN can take a minute to update.

- [ ] **Step 5: Report**

Tell the user:
- The live URL.
- That the `gh-pages` branch is still there and can be deleted when they're ready.
- How to turn on GoatCounter: sign up at goatcounter.com, then set `goatcounter_code` in `config.toml`.
