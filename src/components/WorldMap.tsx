import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import {
  ComposableMap, Geographies, Geography, Marker, Sphere,
  useMapContext, useZoomPanContext, ZoomableGroup,
} from 'react-simple-maps'
import { CONTINENT_VIEWS, getCountryCode } from '../geography'
import { WORLD_COUNTRIES, WORLD_COUNTRY_COLORS, WORLD_GEOGRAPHY } from '../mapColors'
import type { Country, MapGeography, MapPosition, MapStatus } from '../types/game'

type MapCountriesProps = {
  geographies: MapGeography[]
  selectedCode: string | null
  statusByCode: Record<string, MapStatus>
  onSelect: (country: Country) => void
  onBackgroundClick: () => void
  onCountriesLoaded: (countries: Country[]) => void
  continent: string
  showNames: boolean
  focusCountry: Country | null
  mapScale: number
}

function MapCountries({
  geographies, selectedCode, statusByCode, onSelect, onBackgroundClick,
  onCountriesLoaded, continent, showNames, focusCountry, mapScale,
}: MapCountriesProps) {
  const { projection, width, height } = useMapContext()
  const { x: translateX, y: translateY, k: currentZoom } = useZoomPanContext()
  const mappedCountries = WORLD_COUNTRIES

  useEffect(() => {
    onCountriesLoaded(mappedCountries)
  }, [mappedCountries, onCountriesLoaded])

  const countriesByCode = useMemo(() => new Map(mappedCountries.map((country) => [country.code, country])), [mappedCountries])
  const visibleCountries = mappedCountries.filter((country) => continent === 'Whole world' || country.continents.includes(continent))
  const labelFontSize = 14 / mapScale
  const occupied: { left: number; right: number; top: number; bottom: number }[] = []
  // Give selected and larger countries priority; reject overlapping label boxes.
  // This runs against the live zoom transform so zooming reveals more names.
  const labelCountries = showNames ? [...visibleCountries]
    .sort((first, second) => Number(second.code === selectedCode) - Number(first.code === selectedCode) || second.area - first.area)
    .filter((country) => {
      const point = projection(country.mapPosition.coordinates)
      if (!point) return false
      const labelWidth = country.name.length * labelFontSize * 0.55 + 10 / mapScale
      const centerX = point[0] * currentZoom + translateX
      const centerY = point[1] * currentZoom + translateY
      const bounds = {
        left: centerX - labelWidth / 2,
        right: centerX + labelWidth / 2,
        top: centerY - labelFontSize,
        bottom: centerY + labelFontSize / 2,
      }
      if (bounds.left < 0 || bounds.right > width || bounds.top < 0 || bounds.bottom > height) return false
      if (occupied.some((label) => bounds.left < label.right && bounds.right > label.left && bounds.top < label.bottom && bounds.bottom > label.top)) return false
      occupied.push(bounds)
      return true
    }) : []

  return (
    <>
      <Sphere fill="#eaf5fb" stroke="#dcecf4" strokeWidth={0.6} onClick={onBackgroundClick} className="map-ocean" />
      {geographies.map((geography) => {
        const countryCode = getCountryCode(geography.id)
        const country = countryCode ? countriesByCode.get(countryCode) : null
        if (!country) return null
        if (continent !== 'Whole world' && !country.continents.includes(continent)) return null
        const status = statusByCode[country.code]
        const fill = status === 'correct'
          ? '#69c7a1'
          : status === 'incorrect'
            ? '#f39b8d'
            : status === 'revealed'
              ? '#f5cc76'
              : selectedCode === country.code
                ? '#ffb74d'
                : WORLD_COUNTRY_COLORS[country.code]
        return (
          <Geography
            key={geography.rsmKey}
            geography={geography}
            onClick={() => onSelect(country)}
            aria-label={country.name}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(country)
              }
            }}
            fill={fill}
            stroke="#fff"
            strokeWidth={0.7}
            vectorEffect="non-scaling-stroke"
            className={`country-shape${status ? ` is-${status}` : ''}${selectedCode === country.code ? ' is-selected' : ''}`}
          />
        )
      })}
      {labelCountries.map((country) => (
        <Marker key={country.code} coordinates={country.mapPosition.coordinates} className="country-label" aria-hidden="true">
          <text textAnchor="middle" fontSize={labelFontSize / currentZoom} strokeWidth={3 / (mapScale * currentZoom)}>{country.name}</text>
        </Marker>
      ))}
      {focusCountry && (
        <Marker coordinates={focusCountry.mapPosition.coordinates} className="revealed-country-marker" aria-label={`Revealed country: ${focusCountry.name}`}>
          <circle r={9 / (mapScale * currentZoom)} strokeWidth={3 / (mapScale * currentZoom)} />
          <text textAnchor="middle" y={-17 / (mapScale * currentZoom)} fontSize={labelFontSize / currentZoom} strokeWidth={3 / (mapScale * currentZoom)}>{focusCountry.name}</text>
        </Marker>
      )}
    </>
  )
}

export type WorldMapProps = Omit<MapCountriesProps, 'geographies' | 'mapScale' | 'onSelect'> & {
  onSelect: (country: Country | null) => void
  position: MapPosition
  onPositionChange: (position: MapPosition) => void
}

export default function WorldMap({
  selectedCode, statusByCode, onSelect, onBackgroundClick, onCountriesLoaded,
  continent, showNames, focusCountry, position, onPositionChange,
}: WorldMapProps) {
  const initialPosition = CONTINENT_VIEWS[continent]
  const [mapScale, setMapScale] = useState(1)
  const mapRef = useRef<SVGSVGElement>(null)

  // Convert SVG units to screen pixels to keep labels and markers readable on mobile.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const observer = new ResizeObserver(() => {
      const bounds = map.getBoundingClientRect()
      setMapScale(Math.max(0.1, Math.min(bounds.width / 1000, bounds.height / 800)))
    })
    observer.observe(map)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!focusCountry) return
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusCountry])

  const handleMapSelect = useCallback((country: Country) => {
    onSelect(country)
  }, [onSelect])

  return (
    <div className="map-stage">
      <ComposableMap
        ref={mapRef}
        width={990}
        height={780}
        projection="geoEqualEarth"
        projectionConfig={{ scale: 195, center: [0, 5] }}
        className="world-map"
        aria-label={`Interactive political map: ${continent}`}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          // Let D3 handle the gesture, then save BOTH center and zoom. Updating only
          // zoom during a gesture would pull the map back to its previous center.
          onMoveEnd={({ coordinates, zoom }) => {
            if (coordinates && zoom !== undefined && coordinates.every(Number.isFinite)) {
              onPositionChange({ coordinates, zoom })
            }
          }}
          minZoom={1}
          maxZoom={12}
        >
          <Geographies geography={WORLD_GEOGRAPHY}>
            {({ geographies }) => (
              <MapCountries
                geographies={geographies}
                selectedCode={selectedCode}
                statusByCode={statusByCode}
                onSelect={handleMapSelect}
                onBackgroundClick={onBackgroundClick}
                onCountriesLoaded={onCountriesLoaded}
                continent={continent}
                showNames={showNames}
                focusCountry={focusCountry}
                mapScale={mapScale}
              />
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <div className="map-controls" aria-label="Map controls">
        <button type="button" aria-label="Zoom in" title="Zoom in" disabled={position.zoom >= 12} onClick={() => onPositionChange({ ...position, zoom: Math.min(position.zoom * 1.4, 12) })}>
          <ZoomIn size={17} />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" disabled={position.zoom <= 1} onClick={() => onPositionChange({ ...position, zoom: Math.max(position.zoom / 1.4, 1) })}>
          <ZoomOut size={17} />
        </button>
        <button type="button" aria-label="Reset map view" title="Reset map view" onClick={() => onPositionChange(initialPosition)}>
          <RotateCcw size={15} />
        </button>
      </div>
      <span className="map-attribution">Natural Earth · India: geoBoundaries (CC0)</span>
    </div>
  )
}