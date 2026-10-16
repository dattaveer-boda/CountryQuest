import { feature, neighbors } from 'topojson-client'
import type { Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import worldData from 'world-atlas/countries-50m.json'
import indiaBoundaryData from './indiaBoundary.json'
import { getCountryCode, getMapCountries } from './geography'

type CountryTopology = Topology<{ countries: GeometryCollection }>

const MAP_COLORS = ['#efc66f', '#8fc2e7', '#e9a0af', '#a3cd92', '#b6a5d7', '#eca87e']
const worldTopology = worldData as unknown as CountryTopology

export function createCountryColors(topology: CountryTopology): Record<string, string> {
  const geometries = topology.objects.countries.geometries
  const countryCodes = geometries.map((geometry) => getCountryCode(geometry.id))
  const adjacency = new Map<string, Set<string>>()
  for (const code of countryCodes) {
    if (code) adjacency.set(code, new Set())
  }

  // TopoJSON neighbors share boundary arcs, not merely overlapping bounding boxes.
  // Merge all features for a country so its islands use the same color as its mainland.
  neighbors(geometries).forEach((neighborIndices, index) => {
    const code = countryCodes[index]
    if (!code) return
    for (const neighborIndex of neighborIndices) {
      const neighborCode = countryCodes[neighborIndex]
      if (!neighborCode || neighborCode === code) continue
      adjacency.get(code)?.add(neighborCode)
      adjacency.get(neighborCode)?.add(code)
    }
  })

  const assigned = new Map<string, number>()
  const uncolored = new Set([...adjacency.keys()].sort())
  const colorUsage: number[] = []

  // Color the most constrained country first: distinct neighbor colors, then degree.
  // Sorted ISO codes break ties deterministically, independent of atlas feature order.
  while (uncolored.size) {
    let nextCode = ''
    let highestSaturation = -1
    let highestDegree = -1
    for (const code of uncolored) {
      const adjacent = adjacency.get(code)!
      const saturation = new Set([...adjacent].map((neighbor) => assigned.get(neighbor)).filter((color) => color !== undefined)).size
      if (saturation > highestSaturation || (saturation === highestSaturation && adjacent.size > highestDegree)) {
        nextCode = code
        highestSaturation = saturation
        highestDegree = adjacent.size
      }
    }

    const forbidden = new Set([...adjacency.get(nextCode)!].map((neighbor) => assigned.get(neighbor)))
    // Balance safe palette choices so disconnected islands are not all one color.
    let colorIndex = MAP_COLORS.map((_, index) => index)
      .filter((index) => !forbidden.has(index))
      .sort((first, second) => (colorUsage[first] ?? 0) - (colorUsage[second] ?? 0) || first - second)[0]
    if (colorIndex === undefined) {
      colorIndex = MAP_COLORS.length
      while (forbidden.has(colorIndex)) colorIndex += 1
    }
    assigned.set(nextCode, colorIndex)
    colorUsage[colorIndex] = (colorUsage[colorIndex] ?? 0) + 1
    uncolored.delete(nextCode)
  }

  // If a future dataset needs more colors, add distinct hues instead of reusing a neighbor's.
  return Object.fromEntries([...assigned].map(([code, index]) => [
    code, MAP_COLORS[index] ?? `hsl(${(index * 137.508) % 360} 55% 76%)`,
  ]))
}

// Use the same atlas for coloring and rendering; no duplicate URL fetch or dataset drift.
export const WORLD_COUNTRY_COLORS = createCountryColors(worldTopology)
const atlasGeography = feature(worldTopology, worldTopology.objects.countries)
const indiaGeography = atlasGeography.features.find((geography) => getCountryCode(geography.id) === 'IND')
if (!indiaGeography || indiaGeography.geometry.type !== 'MultiPolygon') {
  throw new Error('The world atlas must contain India as a MultiPolygon')
}

const rawIndiaBoundaryGeometry = indiaBoundaryData.features[0]?.geometry as Geometry | undefined
if (!rawIndiaBoundaryGeometry || rawIndiaBoundaryGeometry.type !== 'MultiPolygon') {
  throw new Error('The India boundary dataset must contain a MultiPolygon')
}
const indiaBoundaryGeometry: Geometry = {
  ...rawIndiaBoundaryGeometry,
  coordinates: rawIndiaBoundaryGeometry.coordinates.map((polygon) => polygon.map((ring) => [...ring].reverse())),
}

const indiaPatchedGeography = {
  ...indiaGeography,
  geometry: indiaBoundaryGeometry,
}

export const WORLD_GEOGRAPHY = {
  ...atlasGeography,
  features: [
    ...atlasGeography.features.filter((geography) => geography !== indiaGeography),
    indiaPatchedGeography,
  ],
}
export const WORLD_COUNTRIES = getMapCountries(WORLD_GEOGRAPHY.features)