import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { LINKS, escapeHtml, groupSites, renderPage, validate } from '../build.mjs'

const site = (slug, kind, extra = {}) => ({
  slug,
  title: slug,
  kind,
  url: `https://museumwithnofrontiers.github.io/${slug}/`,
  repository: `https://github.com/museumwithnofrontiers/${slug}`,
  ...extra,
})

test('the committed sites.json is valid and lists every kind the page groups', () => {
  const data = validate(JSON.parse(readFileSync(new URL('../sites.json', import.meta.url), 'utf8')))
  const kinds = new Set(data.sites.map((s) => s.kind))
  for (const kind of ['standalone', 'exhibition', 'gallery']) assert.ok(kinds.has(kind), kind)
})

test('groups in page order, with unknown kinds last and empty groups left out', () => {
  const groups = groupSites([site('a', 'gallery'), site('b', 'new-kind'), site('c', 'standalone')])
  assert.deepEqual(groups.map((g) => g.heading), ['Virtual museums', 'Galleries', 'Other websites'])
})

test('renders every site as a link to its address and its source', () => {
  const html = renderPage({ sites: [site('carpets', 'gallery', { title: 'Carpets' })] })
  assert.match(html, /<a class="site-title" href="https:\/\/museumwithnofrontiers\.github\.io\/carpets\/">Carpets<\/a>/)
  assert.match(html, /href="https:\/\/github\.com\/museumwithnofrontiers\/carpets">source<\/a>/)
})

test('links to the organization page and the license', () => {
  const html = renderPage({ sites: [site('carpets', 'gallery')] })
  assert.ok(html.includes(`href="${LINKS.about}"`))
  assert.ok(html.includes(`href="${LINKS.license}"`))
})

test('escapes text taken from sites.json', () => {
  const html = renderPage({ sites: [site('x', 'gallery', { title: '<script>alert(1)</script> & "Co"' })] })
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Co&quot;'))
  assert.equal(escapeHtml(`'`), '&#39;')
})

test('refuses a site whose address is not https', () => {
  assert.throws(() => validate({ sites: [site('x', 'gallery', { url: 'javascript:alert(1)' })] }), /not an https/)
})

test('refuses an empty list or a site with a missing field', () => {
  assert.throws(() => validate({ sites: [] }), /no sites/)
  assert.throws(() => validate({ sites: [site('x', 'gallery', { title: '' })] }), /has no title/)
})
