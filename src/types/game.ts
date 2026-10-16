import type { Feature, Geometry } from 'geojson'

// One normalized country model is shared by the map, facts panel, and quizzes.
export type Country = {
  code: string
  name: string
  alpha2: string | null
  continents: string[]
  mapPosition: MapPosition
  area: number
}

export type MapPosition = { coordinates: [number, number]; zoom: number }

export type MapGeography = Feature<Geometry> & {
  rsmKey: string
  svgPath: string | null
}

export type ScreenId = 'learn' | 'learn-flags' | 'identify' | 'find-countries' | 'find-flags' | 'flag-challenge'
export type AnswerState = 'correct' | 'incorrect' | null
export type MapStatus = AnswerState | 'revealed'
export type Score = { correct: number; total: number }