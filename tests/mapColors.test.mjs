import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { geoArea, geoContains } from 'd3-geo'
import { neighbors } from 'topojson-client'
import { createServer } from 'vite'

const topology = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url), 'utf8'))
let server
let createCountryColors
let getCountryCode
let worldColors
let worldCountries
let worldGeography
let getCountryStatus
let getCountryFacts

// Vite loads the same TypeScript and JSON imports used by the browser application.
before(async () => {
  server = await createServer({ server: { middlewareMode: true } })
  const colorsModule = await server.ssrLoadModule('/src/mapColors.ts')
  createCountryColors = colorsModule.createCountryColors
  worldColors = colorsModule.WORLD_COUNTRY_COLORS
  worldCountries = colorsModule.WORLD_COUNTRIES
  worldGeography = colorsModule.WORLD_GEOGRAPHY
  getCountryCode = (await server.ssrLoadModule('/src/geography.ts')).getCountryCode
  getCountryStatus = (await server.ssrLoadModule('/src/countryStatus.ts')).getCountryStatus
  getCountryFacts = (await server.ssrLoadModule('/src/countryFacts.ts')).getCountryFacts
})

after(async () => {
  await server?.close()
})

test('the shared country pool is available without a map and contains unique usable countries', () => {
  const codes = worldCountries.map((country) => country.code)
  assert.equal(new Set(codes).size, codes.length)
  assert.deepEqual([...codes].sort(), Object.keys(worldColors).sort())
  for (const country of worldCountries) {
    assert.ok(country.name)
    assert.ok(country.alpha2)
    assert.ok(country.mapPosition.coordinates.every(Number.isFinite))
    assert.ok(country.area > 0)
  }
})

test('the India map has one patched country geometry with a closed northern outline', () => {
  const indiaGeographies = worldGeography.features.filter((geography) => getCountryCode(geography.id) === 'IND')
  assert.equal(indiaGeographies.length, 1)
  const india = indiaGeographies[0]
  assert.equal(india.geometry.type, 'MultiPolygon')
  const points = india.geometry.coordinates.flat(2)
  const latitudes = points.map(([, latitude]) => latitude)
  assert.ok(Math.max(...latitudes) > 36.9)
  assert.ok(geoArea(india.geometry) < Math.PI * 2)
  assert.equal(worldCountries.filter((country) => country.code === 'IND').length, 1)

  const china = worldGeography.features.find((geography) => getCountryCode(geography.id) === 'CHN')
  assert.ok(china)
  const easternKashmirPoint = [79.5, 35.5]
  assert.ok(geoContains(india.geometry, easternKashmirPoint))
  assert.ok(geoContains(china.geometry, easternKashmirPoint))
  assert.equal(worldGeography.features.at(-1), india)
})

test('flag entities distinguish UN membership, observers, territories and disputed statuses', () => {
  const counts = { member: 0, observer: 0, other: 0 }
  for (const country of worldCountries) {
    const status = getCountryStatus(country.code)
    assert.ok(status.label)
    assert.ok(status.detail)
    assert.notEqual(status.label, 'Other entity', `Unclassified entity: ${country.code}`)
    if (status.kind === 'member' || status.kind === 'observer') counts[status.kind] += 1
    else counts.other += 1
  }
  assert.deepEqual(counts, { member: 192, observer: 2, other: 41 })
  assert.equal(getCountryStatus('VAT').kind, 'observer')
  assert.equal(getCountryStatus('PSE').kind, 'observer')
  assert.equal(getCountryStatus('TUV').kind, 'member')
  assert.equal(getCountryStatus('TWN').kind, 'disputed')
  assert.equal(getCountryStatus('ESH').kind, 'disputed')
  assert.equal(getCountryStatus('ATA').kind, 'other')
  assert.match(getCountryStatus('GUM').detail, /US territory/)
  assert.match(getCountryStatus('GGY').detail, /not part of the UK/)
  assert.equal(getCountryStatus('COK').kind, 'associated')
  assert.equal(getCountryStatus('NIU').kind, 'associated')
})

test('every mapped country has a color and shared-border countries have different colors', () => {
  const geometries = topology.objects.countries.geometries
  const codes = geometries.map((geometry) => getCountryCode(geometry.id))
  for (const code of codes) {
    if (code) assert.ok(worldColors[code], `Missing color for ${code}`)
  }
  let checkedBorders = 0
  neighbors(geometries).forEach((neighborIndices, index) => {
    const code = codes[index]
    if (!code) return
    for (const neighborIndex of neighborIndices) {
      const neighborCode = codes[neighborIndex]
      if (!neighborCode || neighborCode === code || neighborIndex <= index) continue
      assert.notEqual(worldColors[code], worldColors[neighborCode], `${code} borders ${neighborCode}`)
      checkedBorders += 1
    }
  })
  assert.ok(checkedBorders > 0, 'The test must actually check shared borders')
})

test('country colors are independent of atlas feature order', () => {
  const reordered = {
    ...topology,
    objects: {
      ...topology.objects,
      countries: { ...topology.objects.countries, geometries: [...topology.objects.countries.geometries].reverse() },
    },
  }
  assert.deepEqual(createCountryColors(reordered), worldColors)
})

test('duplicate country features do not change country colors', () => {
  const geometries = topology.objects.countries.geometries
  const duplicate = geometries.find((geometry) => getCountryCode(geometry.id) === 'IND')
  assert.ok(duplicate)
  const multipart = {
    ...topology,
    objects: {
      ...topology.objects,
      countries: { ...topology.objects.countries, geometries: [...geometries, duplicate] },
    },
  }
  assert.deepEqual(createCountryColors(multipart), worldColors)
})

test('a graph needing more than six colors gets extra colors instead of conflicts', () => {
  const ids = ['356', '156', '840', '250', '276', '643', '032']
  const crowded = {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: ids.map((id) => ({ type: 'Polygon', id, arcs: [[0]] })),
      },
    },
    arcs: [[[0, 0], [1, 0], [0, 1], [0, 0]]],
  }
  const colors = createCountryColors(crowded)
  assert.equal(Object.keys(colors).length, ids.length)
  assert.equal(new Set(Object.values(colors)).size, ids.length)
})

test('Equatorial Guinea uses Ciudad de la Paz as its capital', () => {
  assert.equal(getCountryFacts('GNQ').capitals, 'Ciudad de la Paz')
})