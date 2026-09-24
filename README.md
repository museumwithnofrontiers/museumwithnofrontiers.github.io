# museumwithnofrontiers.github.io

The Museum With No Frontiers organization site, published at
<https://museumwithnofrontiers.github.io>. It lists every website we publish,
and links to [the organization on GitHub](https://github.com/museumwithnofrontiers)
and to the [license](https://github.com/museumwithnofrontiers/.github/blob/main/LICENSE.md).

Each website keeps its own address under this one
(`https://museumwithnofrontiers.github.io/<site>/`). Never set a custom domain
here: GitHub would move every website's address to that domain too.

## How it works

- `sites.json` is the list of websites. It is **generated**, never edited by
  hand, by `scripts/org-site/list-sites.mjs` in
  [inventory-app](https://github.com/museumwithnofrontiers/inventory-app). The
  script lists every repository created from `website-template`, the rule
  `propagate.mjs` also uses. It takes each site's title and kind from
  inventory-app's exporter instances, and its address from its GitHub Pages
  settings.
- `build.mjs` renders `sites.json` into one static page, `dist/index.html`,
  with `src/style.css`. It has no dependencies.
- `.github/workflows/pages.yml` tests and builds every pull request. On `main`,
  it deploys `dist/` to GitHub Pages (Settings → Pages → Source: GitHub
  Actions).

## Refresh the list after a new website

This repository is a submodule of inventory-app, at
`.new-architecture/museumwithnofrontiers.github.io`. From the inventory-app root
(PowerShell), regenerate the list in Docker with your own `gh` login:

```powershell
docker run --rm -e GH_TOKEN=$(gh auth token) -v "${PWD}:/w" -w /w node:lts-alpine sh -c "apk add --no-cache github-cli >/dev/null && node scripts/org-site/list-sites.mjs"
```

Then, in `.new-architecture/museumwithnofrontiers.github.io`, commit `sites.json`
on a branch and open a pull request. Merging it deploys the page.

## Build and test locally

```powershell
docker run --rm -v "${PWD}:/w" -w /w node:lts-alpine sh -c "npm test && npm run build"
```

Open `dist/index.html` to look at the result.
