# sandeshghanta.github.io

My personal site: a minimal CV, a runtime-log (notes) and a reading list.
Built with [Zola](https://www.getzola.org) and deployed to GitHub Pages by
GitHub Actions on every push to `main`.

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
  optional `updated`, `draft`, and `[taxonomies] tags`.
- **Math in posts:** wrap LaTeX in the `math` component so Markdown doesn't mangle it:
  `{% <math> %}\sum_{i} x_i{% </math> %}` (display) or
  `{% <math inline={true}> %}x_i{% </math> %}` (inline). Post bodies are Tera templates,
  so literal `{{`, `{%` or `{#` must go inside `{% raw %}…{% endraw %}`.
- **Reading list:** add an `[[items]]` entry to `data/reading.toml`

Thanks to @Harshithpabbati for the original
[console theme](https://github.com/harshithpabbati/gatsby-theme-console).
