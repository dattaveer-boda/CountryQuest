import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Globe2, Search } from 'lucide-react'
import { CONTINENT_VIEWS } from '../geography'
import type { Country, ScreenId } from '../types/game'
import WorldMap from './WorldMap'
import type { WorldMapProps } from './WorldMap'

type MapPanelProps = WorldMapProps & {
  screen: ScreenId
  countries: Country[]
  onCountrySearchSelect: (country: Country) => void
  onContinentChange: (continent: string) => void
  onShowNamesChange: (showNames: boolean) => void
}

function ExploreCountrySearch({ countries, selectedCode, onSelect }: {
  countries: Country[]
  selectedCode: string | null
  onSelect: (country: Country) => void
}) {
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const selectedName = countries.find((country) => country.code === selectedCode)?.name ?? ''
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('en')
  const options = countries
    .filter((country) => normalize(country.name).includes(normalize(query ?? '')))
    .sort((first, second) => first.name.localeCompare(second.name, 'en'))

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const selectCountry = (country: Country) => {
    onSelect(country)
    setQuery(null)
    setOpen(false)
  }

  return (
    <div className="country-search explore-country-search">
      <div className="search-input-wrap">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-label="Search Explore countries"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && options[activeIndex] ? `${listId}-${options[activeIndex].code}` : undefined}
          autoComplete="off"
          placeholder="Search countries..."
          value={query ?? selectedName}
          onFocus={() => { setQuery(''); setActiveIndex(0); setOpen(true) }}
          onBlur={() => { setOpen(false); setQuery(null) }}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActiveIndex((current) => Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))))
            } else if (event.key === 'Enter' && open && options[activeIndex]) {
              event.preventDefault()
              selectCountry(options[activeIndex])
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setQuery(null)
            }
          }}
        />
        <ChevronDown size={16} aria-hidden="true" />
      </div>
      {open && (
        <div className="country-options" id={listId} ref={listRef} role="listbox" aria-label="Explore countries">
          {options.length ? options.map((country, index) => (
            <button
              type="button"
              role="option"
              tabIndex={-1}
              id={`${listId}-${country.code}`}
              key={country.code}
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCountry(country)}
            >{country.name}</button>
          )) : <div className="no-options" role="status">No countries found</div>}
        </div>
      )}
    </div>
  )
}

export default function MapPanel({
  screen, countries, onCountrySearchSelect, continent, showNames, onContinentChange, onShowNamesChange, ...mapProps
}: MapPanelProps) {
  // Explore preferences are kept in App, but quizzes must always use an unlabeled world map.
  const mapContinent = screen === 'learn' ? continent : 'Whole world'
  return (
    <section className="map-card" aria-label="World map">
      <div className="map-card-header">
        <div className="map-title">
          <span className="map-title-icon"><Globe2 size={16} /></span>
          <span>{mapContinent !== 'Whole world' ? mapContinent.toUpperCase() : 'THE WORLD'}</span>
          <span className="live-dot" />
        </div>
        {screen === 'learn' ? (
          <div className="explore-map-options">
            <ExploreCountrySearch countries={countries} selectedCode={mapProps.selectedCode} onSelect={onCountrySearchSelect} />
            <select className="continent-filter" aria-label="Continent" value={continent} onChange={(event) => onContinentChange(event.target.value)}>
              {Object.keys(CONTINENT_VIEWS).map((name) => <option key={name}>{name}</option>)}
            </select>
            <fieldset className="country-name-options">
              <legend>Country names</legend>
              <label><input type="radio" name="country-names" value="off" checked={!showNames} onChange={() => onShowNamesChange(false)} />Off</label>
              <label><input type="radio" name="country-names" value="on" checked={showNames} onChange={() => onShowNamesChange(true)} />On</label>
            </fieldset>
          </div>
        ) : <span className="map-hint">Select a country on the map</span>}
      </div>
      <WorldMap
        key={`${screen}-${mapContinent}`}
        {...mapProps}
        continent={mapContinent}
        showNames={screen === 'learn' && showNames}
      />
      <div className="map-card-footer">
        <span><i className="legend-dot legend-land" /> Countries</span>
        {screen !== 'learn' && <span><i className="legend-dot legend-found" /> Correct</span>}
        {screen === 'find-flags' && <span><i className="legend-dot legend-revealed" /> Revealed</span>}
        <span className="map-zoom-label">Scroll or use + / − to zoom</span>
      </div>
    </section>
  )
}