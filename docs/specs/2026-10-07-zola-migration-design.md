# Zola migration + site refresh — design

Date: 2026-10-07

## Goal

Replace the dead Gatsby 2 / Node 10 / Travis CI setup with Zola and GitHub
Actions, keep the minimal "console" look, and turn the site into a minimal CV
plus a runtime-log (blog) and a reading list.

Non-goals: redirects for old URLs (nobody depends on them), PWA/offline
support, tweet embeds.

## Stack

- **Generator:** Zola, single binary. CI pins a specific version (latest
  stable at implementation time, currently 0.23.x).
- **Styles:** the existing `src/styles/style.sass`, compiled by Zola's built-in
  Sass. The `~katex` import is removed; KaTeX CSS loads from a CDN instead.
- **Hosting:** GitHub Pages, deployed by GitHub Actions (`actions/deploy-pages`).
- **Removed:** `package.json`, `gatsby-*.js`, `src/`, `.travis.yml`,
  `.prettierrc`, `.prettierignore`, the Google Analytics ID (dead since the
  Universal Analytics shutdown), the PWA manifest and the web counter.

## Site structure

| URL | Source | Content |
|---|---|---|
| `/` | `content/_index.md` + `templates/index.html` | Minimal CV + latest runtime-log entry |
| `/runtime-log/` | `content/runtime-log/_index.md` + `templates/section.html` | Tag badges + post list, newest first |
| `/runtime-log/<file-name>/` | `content/runtime-log/*.md` + `templates/page.html` | A single post |
| `/tags/` and `/tags/<tag>/` | taxonomy templates | All tags; posts with one tag |
| `/reading/` | `data/reading.toml` + `templates/reading.html` | Interesting blogs, tweets, papers, etc. |
| `404.html` | `templates/404.html` | Not found |

URLs follow Zola's default slugify behaviour (lowercase, hyphenated). The
contact page is removed; contact details live on the home page.

Header menu: `/home  /runtime-log  /reading`, the same dashed-border console
style as today. Footer: a single "built with Zola" line. The cheesy
"send a PR if wrong" note is removed.

## Home page (CV)

Written as Markdown in `content/_index.md`, so updating it means editing one
file. It shows company, title and dates only, with no description of the work.

```
Sandesh Ghanta
Software Engineer, AI Infra @ Scale AI
<one-line bio>

#### Experience
Nov 2024 – now        Scale AI — Software Developer, AI Infra
Jan 2023 – Nov 2024   Pure Storage — Software Engineer, Filesystem
Jun 2022 – Aug 2022   NetApp — Software Engineer Intern
Aug 2021 – May 2022   Secure Trusted and Applied Microelectronics, ASU — Graduate Research Assistant
Feb 2020 – Jul 2021   Amazon — Software Development Engineer, Prime Video

#### Education
2021 – 2022   Arizona State University — M.S., Computer Science
2016 – 2020   Amrita Vishwa Vidyapeetham — B.Tech., Computer Science and Engineering

#### Elsewhere
GitHub · LinkedIn · Codeforces · Codechef · Instagram · Facebook · sghanta05@gmail.com

#### Latest from runtime-log
[YYYY-MM-DD]: <title>
```

Experience and education rows render as a two-column layout (dates column +
text), so they stay aligned on desktop and stack on mobile.

Confirmed details:
- The bio: "Software engineer working on AI infrastructure. I like most
  things in computers and programming, especially distributed systems and
  systems programming."
- No location is shown.
- The email shown is `sghanta05@gmail.com`.

## Runtime-log (posts)

Front matter is TOML (`+++`), Zola's native format:

```toml
+++
title = "Sample"
date = 2020-10-20      # created
updated = 2020-10-20   # last modified
draft = false
[taxonomies]
tags = ["sample", "tag"]
+++
```

- The list is sorted by `date` (Zola sections can only sort by `date`,
  `title` or `weight`). Each entry shows `[updated or date]: title` followed by
  tag badges.
- A post page shows the title, author (from config), created date, last
  modified date, and the body.
- **Code:** Zola's built-in syntax highlighting, with a light theme to match
  the site.
- **Math:** KaTeX CSS/JS and auto-render, from a pinned jsDelivr version,
  loaded only on post pages. `$$…$$` and `$…$` delimiters.
- **Emoji:** `render_emoji = true`.
- The existing sample post is migrated as-is, so the pipeline has something to
  render. Delete it once there are real posts.

## Reading page

Data lives in `data/reading.toml`, loaded by `templates/reading.html` with
`load_data`:

```toml
[[items]]
date  = 2026-10-07
kind  = "blog"          # blog | tweet | paper | video | talk
title = "..."
url   = "https://..."
note  = "optional one-liner"
```

It renders newest first as `[date] [kind] title: note`, with the title linking
out. Tweets are plain links, not embeds. It ships with one example entry.

## Config (`config.toml`)

- `base_url = "https://sandeshghanta.github.io"`
- `compile_sass = true`, `build_search_index = false`
- `taxonomies = [{ name = "tags" }]`
- `[markdown]`: code highlighting on, `render_emoji = true`
- `[extra]`: `author`, `email`, and a `links` list (name, url). The home page's
  "Elsewhere" line is generated from it.
- `[extra]`: `goatcounter_code`, empty by default.

## Analytics

GoatCounter, for the owner only.
- `base.html` adds GoatCounter's `count.js` script only when
  `config.extra.goatcounter_code` is set.
- No cookies and no consent banner. Nothing is shown on the site.
- The dashboard at `<code>.goatcounter.com` stays private (GoatCounter's
  default; leave "public dashboard" off).
- The user creates the GoatCounter account and sets the code.

## CI/CD

`.github/workflows/deploy.yml`:
- **On `pull_request`:** install the pinned Zola release binary, run
  `zola check --skip-external-links` and `zola build`.
- **On push to `master`:** the same build, then `actions/upload-pages-artifact`
  and `actions/deploy-pages`. Permissions are `pages: write` and
  `id-token: write`, with concurrency group `pages`.
- No secrets are needed.
- **One-time change:** the repo's Pages source switches from the `gh-pages`
  branch to "GitHub Actions" (`gh api` PUT on `repos/.../pages` with
  `build_type=workflow`). Ask the user before running it. Keep the `gh-pages`
  branch until the user says to delete it.

## Verification

1. `zola check` and `zola build` succeed locally.
2. Run `zola serve`. Screenshot each page (home, runtime-log list, sample post
   with math and code, tag page, reading, 404) and compare against the old
   design for look and feel.
3. After merge, confirm the Actions run deploys and the live site serves the
   new pages.

## Work location

Worktree `.claude/worktrees/zola-migration`, branch
`sandeshghanta/_claude/zola-migration`. Squash into one commit, then merge
into `master`.
