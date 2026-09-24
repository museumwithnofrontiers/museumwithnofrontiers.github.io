#!/usr/bin/env node
/**
 * Builds the organization site into dist/: one static page listing every
 * website in sites.json, grouped by kind, plus the stylesheet.
 *
 * sites.json is generated in inventory-app (scripts/org-site/list-sites.mjs),
 * never edited by hand. No dependencies: `node build.mjs`.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const DIST = join(ROOT, 'dist')

export const LINKS = {
  about: 'https://github.com/museumwithnofrontiers',
  license: 'https://github.com/museumwithnofrontiers/.github/blob/main/LICENSE.md',
  source: 'https://github.com/museumwithnofrontiers/museumwithnofrontiers.github.io',
  logo: 'https://github.com/museumwithnofrontiers.png?size=160',
}

// Page order of the groups; a kind not listed here goes under "Other websites".
export const GROUPS = [
  { kind: 'standalone', heading: 'Virtual museums' },
  { kind: 'exhibition', heading: 'Exhibitions' },
  { kind: 'gallery', heading: 'Galleries' },
]

const INTRO =
  'Museum With No Frontiers (MWNF) is the largest online museum dedicated to digitally preserving ' +
  'and presenting art, artefacts, and sites that connect transnational histories.'

export function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return String(value).replace(/[&<>"']/g, (c) => entities[c])
}

/** Throws on anything the page could not render safely; returns the data. */
export function validate(data) {
  if (!data || !Array.isArray(data.sites) || data.sites.length === 0) {
    throw new Error('sites.json lists no sites')
  }
  data.sites.forEach((site, i) => {
    for (const key of ['slug', 'title', 'kind', 'url', 'repository']) {
      if (typeof site?.[key] !== 'string' || site[key] === '') {
        throw new Error(`sites.json: site ${i} has no ${key}`)
      }
    }
    for (const key of ['url', 'repository']) {
      if (!site[key].startsWith('https://')) {
        throw new Error(`sites.json: ${site.slug} ${key} is not an https:// address`)
      }
    }
  })
  return data
}

/** [{ heading, sites }] in page order, empty groups left out. */
export function groupSites(sites) {
  const known = GROUPS.map((g) => g.kind)
  const groups = GROUPS.map((g) => ({ heading: g.heading, sites: sites.filter((s) => s.kind === g.kind) }))
  groups.push({ heading: 'Other websites', sites: sites.filter((s) => !known.includes(s.kind)) })
  return groups.filter((g) => g.sites.length > 0)
}

function renderSite(site) {
  const address = site.url.replace(/^https:\/\//, '').replace(/\/$/, '')
  return `        <li class="site">
          <a class="site-title" href="${escapeHtml(site.url)}">${escapeHtml(site.title)}</a>
          <span class="site-meta">${escapeHtml(address)} · <a href="${escapeHtml(site.repository)}">source</a></span>
        </li>`
}

function renderGroup(group) {
  return `    <section>
      <h2>${escapeHtml(group.heading)} <span class="count">${group.sites.length}</span></h2>
      <ul class="sites">
${group.sites.map(renderSite).join('\n')}
      </ul>
    </section>`
}

export function renderPage(data) {
  const { sites } = validate(data)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Museum With No Frontiers</title>
  <meta name="description" content="${escapeHtml(INTRO)}">
  <link rel="icon" href="${escapeHtml(LINKS.logo)}">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <img class="logo" src="${escapeHtml(LINKS.logo)}" alt="" width="64" height="64">
    <div>
      <h1>Museum With No Frontiers</h1>
      <p class="intro">${escapeHtml(INTRO)}</p>
      <nav>
        <a href="${escapeHtml(LINKS.about)}">About us on GitHub</a>
        <a href="${escapeHtml(LINKS.license)}">License</a>
      </nav>
    </div>
  </header>
  <main>
    <p class="lead">The ${sites.length} websites we publish.</p>
${groupSites(sites).map(renderGroup).join('\n')}
  </main>
  <footer>
    <a href="${escapeHtml(LINKS.license)}">License</a> ·
    <a href="${escapeHtml(LINKS.about)}">github.com/museumwithnofrontiers</a> ·
    <a href="${escapeHtml(LINKS.source)}">Source of this page</a>
  </footer>
</body>
</html>
`
}

function main() {
  const data = JSON.parse(readFileSync(join(ROOT, 'sites.json'), 'utf8'))
  mkdirSync(DIST, { recursive: true })
  writeFileSync(join(DIST, 'index.html'), renderPage(data))
  copyFileSync(join(ROOT, 'src', 'style.css'), join(DIST, 'style.css'))
  console.log(`Built dist/ with ${data.sites.length} sites`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
