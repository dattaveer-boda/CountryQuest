import { getContinentName } from '@brixtol/country-continent'
import { geoArea, geoBounds, geoCentroid } from 'd3-geo'
import countries from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'
import type { Country, MapGeography, MapPosition } from './types/game'

countries.registerLocale(english)

export const CONTINENT_VIEWS: Record<string, MapPosition> = {
  'Whole world': { coordinates: [0, 5], zoom: 1 },
  Africa: { coordinates: [18, 0], zoom: 2 },
  Asia: { coordinates: [100, 30], zoom: 1.8 },
  Europe: { coordinates: [15, 54], zoom: 4 },
  'North America': { coordinates: [-100, 45], zoom: 1.8 },
  'South America': { coordinates: [-60, -22], zoom: 2.3 },
  Oceania: { coordinates: [140, -25], zoom: 2.3 },
  Antarctica: { coordinates: [0, -80], zoom: 1.8 },
}

// The lookup library returns one continent; these geographic memberships need two.
const TRANSCONTINENTAL_COUNTRIES: Record<string, string[]> = {
  RUS: ['Europe', 'Asia'],
  TUR: ['Europe', 'Asia'],
  KAZ: ['Europe', 'Asia'],
  GEO: ['Europe', 'Asia'],
  AZE: ['Europe', 'Asia'],
  EGY: ['Africa', 'Asia'],
  IDN: ['Asia', 'Oceania'],
}

export function getCountryCode(id: MapGeography['id']) {
  if (id == null) return undefined
  // Atlas IDs use numeric ISO codes, while facts and game state use alpha-3 codes.
  return countries.numericToAlpha3(String(id).padStart(3, '0'))
}

export function getCountryFromGeography(geography: Pick<MapGeography, 'id' | 'geometry'>): Country | null {
  const code = getCountryCode(geography.id)
  if (!code) return null
  const name = countries.getName(code, 'en')
  if (!name) return null
  const alpha2 = countries.alpha3ToAlpha2(code)
  const continent = code === 'ATA' ? 'Antarctica' : alpha2 ? getContinentName(alpha2) ?? null : null
  const continents = TRANSCONTINENTAL_COUNTRIES[code] ?? (continent ? [continent] : [])

  // Focus on the largest landmass, rather than a centroid distorted by distant islands.
  const shape = geography.geometry.type === 'MultiPolygon'
    ? geography.geometry.coordinates
      .map((coordinates) => ({ type: 'Polygon' as const, coordinates }))
      .sort((first, second) => geoArea(second) - geoArea(first))[0]
    : geography.geometry
  const coordinates = geoCentroid(shape)
  const [[west, south], [east, north]] = geoBounds(shape)
  // A country can cross longitude 180, so its bounds may wrap around the date line.
  const longitudeSpan = east >= west ? east - west : east + 360 - west
  const zoom = Math.min(10, Math.max(2, 100 / Math.max(longitudeSpan, (north - south) * 1.5, 1)))
  return {
    code,
    name,
    alpha2: alpha2?.toLowerCase() ?? null,
    continents,
    mapPosition: { coordinates, zoom },
    area: geoArea(shape),
  }
}

export function getMapCountries(geographies: Pick<MapGeography, 'id' | 'geometry'>[]): Country[] {
  // Deduplicate country IDs while retaining the largest feature's map focus point.
  return [...new Map(geographies
    .map(getCountryFromGeography)
    .filter((country): country is Country => country !== null)
    .sort((first, second) => first.area - second.area)
    .map((country) => [country.code, country])).values()]
}