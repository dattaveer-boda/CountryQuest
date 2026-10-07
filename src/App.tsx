import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Globe2,
  HelpCircle,
  Map as MapIcon,
  RotateCcw,
  Search,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  ZoomableGroup,
} from 'react-simple-maps'
import type { Feature, Geometry } from 'geojson'

import { getContinentName } from '@brixtol/country-continent'
import worldDataUrl from 'world-atlas/countries-50m.json?url'
import countries from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'
import { getCountryFacts } from './countryFacts'
import './App.css'

countries.registerLocale(english)

type Country = {
  code: string
  name: string
  alpha2: string | null
  continent: string | null
}

type MapGeography = Feature<Geometry> & {
  rsmKey: string
  svgPath: string | null
}

type ScreenId = 'learn' | 'identify' | 'find-countries' | 'find-flags' | 'flag-challenge'
type AnswerState = 'correct' | 'incorrect' | null

const SCREENS: { id: ScreenId; label: string; shortLabel: string }[] = [
  { id: 'learn', label: 'Explore', shortLabel: 'Explore' },
  { id: 'identify', label: 'Name that country', shortLabel: 'Name it' },
  { id: 'find-countries', label: 'Find 10 countries', shortLabel: 'Find 10' },
  { id: 'find-flags', label: 'Flag finder', shortLabel: 'Flags' },
  { id: 'flag-challenge', label: 'Flag challenge', shortLabel: 'Challenge' },
]

const FLAG_COLORS = ['#f5cc76', '#eeb4a4', '#b9c6f2', '#a9d8ca', '#e3b6dc', '#aed2ed']

type MapPosition = { coordinates: [number, number]; zoom: number }

const CONTINENT_VIEWS: Record<string, MapPosition> = {
  'Whole world': { coordinates: [0, 5], zoom: 1 },
  Africa: { coordinates: [18, 0], zoom: 2 },
  Asia: { coordinates: [100, 30], zoom: 1.8 },
  Europe: { coordinates: [15, 54], zoom: 4 },
  'North America': { coordinates: [-100, 45], zoom: 1.8 },
  'South America': { coordinates: [-60, -22], zoom: 2.3 },
  Oceania: { coordinates: [140, -25], zoom: 2.3 },
  Antarctica: { coordinates: [0, -80], zoom: 1.8 },
}

function getCountryFromGeography(geography: MapGeography): Country | null {
  if (geography.id == null) return null
  const numericCode = String(geography.id).padStart(3, '0')
  const code = countries.numericToAlpha3(numericCode)
  if (!code) return null
  const name = countries.getName(code, 'en')
  if (!name) return null
  const alpha2 = countries.alpha3ToAlpha2(code)
  const continent = code === 'ATA' ? 'Antarctica' : alpha2 ? getContinentName(alpha2) ?? null : null
  return { code, name, alpha2: alpha2?.toLowerCase() ?? null, continent }
}

function CountryFlag({
  country,
  className,
}: {
  country: Country
  className?: string
}) {
  return (
    <span
      className={`fi fi-${country.alpha2 ?? 'xx'}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={`${country.name} flag`}
    />
  )
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function MapCountries({
  geographies,
  selectedCode,
  statusByCode,
  onSelect,
  onBackgroundClick,
  onCountriesLoaded,
  continent,
}: {
  geographies: MapGeography[]
  selectedCode: string | null
  statusByCode: Record<string, AnswerState>
  onSelect: (country: Country) => void
  onBackgroundClick: () => void
  onCountriesLoaded: (countries: Country[]) => void
  continent: string
}) {
  const mappedCountries = useMemo(
    () => [...new Map(geographies
      .map(getCountryFromGeography)
      .filter((country): country is Country => country !== null)
      .map((country) => [country.code, country])).values()],
    [geographies],
  )

  useEffect(() => {
    onCountriesLoaded(mappedCountries)
  }, [mappedCountries, onCountriesLoaded])

  return (
    <>
      <Sphere
        fill="#eaf5fb"
        stroke="#dcecf4"
        strokeWidth={0.6}
        onClick={onBackgroundClick}
        className="map-ocean"
      />
      {geographies.map((geography, index) => {
        const country = getCountryFromGeography(geography)
        if (!country) return null
        if (continent !== 'Whole world' && country.continent !== continent) return null
        const status = statusByCode[country.code]
        const fill = status === 'correct'
          ? '#69c7a1'
          : status === 'incorrect'
            ? '#f39b8d'
            : selectedCode === country.code
              ? '#ffb74d'
              : FLAG_COLORS[index % FLAG_COLORS.length]
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
    </>
  )
}

function WorldMap({
  selectedCode,
  statusByCode,
  onSelect,
  onBackgroundClick,
  onCountriesLoaded,
  continent,
}: {
  selectedCode: string | null
  statusByCode: Record<string, AnswerState>
  onSelect: (country: Country | null) => void
  onBackgroundClick: () => void
  onCountriesLoaded: (countries: Country[]) => void
  continent: string
}) {
  const initialPosition = CONTINENT_VIEWS[continent]
  const [position, setPosition] = useState<MapPosition>(initialPosition)
  const handleMapSelect = useCallback((country: Country) => {
    onSelect(country)
  }, [onSelect])

  return (
    <div className="map-stage">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 160, center: [0, 5] }}
        className="world-map"
        aria-label={`Interactive political map: ${continent}`}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={({ coordinates, zoom }) => {
            if (coordinates && zoom !== undefined && coordinates.every(Number.isFinite)) {
              setPosition({ coordinates, zoom })
            }
          }}
          minZoom={1}
          maxZoom={12}
        >
          <Geographies geography={worldDataUrl}>
            {({ geographies }) => (
              <MapCountries
                geographies={geographies}
                selectedCode={selectedCode}
                statusByCode={statusByCode}
                onSelect={handleMapSelect}
                onBackgroundClick={onBackgroundClick}
                onCountriesLoaded={onCountriesLoaded}
                continent={continent}
              />
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <div className="map-controls" aria-label="Map controls">
        <button type="button" aria-label="Zoom in" title="Zoom in" disabled={position.zoom >= 12} onClick={() => setPosition((current) => ({ ...current, zoom: Math.min(current.zoom * 1.4, 12) }))}>
          <ZoomIn size={17} />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" disabled={position.zoom <= 1} onClick={() => setPosition((current) => ({ ...current, zoom: Math.max(current.zoom / 1.4, 1) }))}>
          <ZoomOut size={17} />
        </button>
        <button type="button" aria-label="Reset map view" title="Reset map view" onClick={() => setPosition(initialPosition)}>
          <RotateCcw size={15} />
        </button>
      </div>
      <span className="map-attribution">Map data · Natural Earth</span>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<ScreenId>('learn')
  const [mapCountries, setMapCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [continent, setContinent] = useState('Whole world')
  const [identifyGuess, setIdentifyGuess] = useState('')
  const [identifyResult, setIdentifyResult] = useState<AnswerState>(null)
  const [identifyScore, setIdentifyScore] = useState({ correct: 0, total: 0 })
  const [searchValue, setSearchValue] = useState('')
  const [showCountryOptions, setShowCountryOptions] = useState(false)
  const [roundCountries, setRoundCountries] = useState<Country[]>([])
  const [foundCodes, setFoundCodes] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [challengeResult, setChallengeResult] = useState<AnswerState>(null)
  const [challengeScore, setChallengeScore] = useState({ correct: 0, total: 0 })

  const onCountriesLoaded = useCallback((available: Country[]) => {
    setMapCountries((current) => current.length === available.length ? current : available)
    setRoundCountries((current) => current.length ? current : shuffled(available).slice(0, 10))
  }, [])

  const activeScreen = SCREENS.find((item) => item.id === screen) ?? SCREENS[0]
  const selectedFacts = selectedCountry ? getCountryFacts(selectedCountry.code) : null
  const currentPrompt = roundCountries[activeIndex]
  const foundSet = useMemo(() => new Set(foundCodes), [foundCodes])
  const statusByCode = useMemo<Record<string, AnswerState>>(() => {
    const statuses: Record<string, AnswerState> = {}
    if (screen === 'identify' && identifyResult && selectedCountry) {
      statuses[selectedCountry.code] = identifyResult
    }
    if (screen === 'find-countries' || screen === 'find-flags') {
      for (const code of foundCodes) statuses[code] = 'correct'
    }
    if (screen === 'flag-challenge' && challengeResult && selectedCountry) {
      statuses[selectedCountry.code] = challengeResult
    }
    return statuses
  }, [challengeResult, foundCodes, identifyResult, screen, selectedCountry])

  const navigate = (nextScreen: ScreenId) => {
    setScreen(nextScreen)
    setSelectedCountry(null)
    setIdentifyGuess('')
    setIdentifyResult(null)
    setSearchValue('')
    setShowCountryOptions(false)
    setFoundCodes([])
    setActiveIndex(0)
    setChallengeResult(null)
    if (nextScreen === 'find-countries' || nextScreen === 'find-flags' || nextScreen === 'flag-challenge') {
      setRoundCountries(shuffled(mapCountries).slice(0, 10))
    }
  }

  const resetFindRound = (mode: 'find-countries' | 'find-flags') => {
    setRoundCountries(shuffled(mapCountries).slice(0, 10))
    setFoundCodes([])
    setActiveIndex(0)
    setSelectedCountry(null)
    setSearchValue('')
    setScreen(mode)
  }

  const handleCountrySelect = (country: Country | null) => {
    if (!country) {
      setSelectedCountry(null)
      return
    }
    if (screen === 'learn') {
      setSelectedCountry(country)
      return
    }
    if (screen === 'identify') {
      if (identifyResult) return
      setSelectedCountry(country)
      setIdentifyGuess('')
      setSearchValue('')
      setShowCountryOptions(false)
      return
    }
    if (screen === 'find-countries' || screen === 'find-flags') {
      if (foundSet.has(country.code) || foundCodes.length === 10) return
      if (roundCountries.some((item) => item.code === country.code)) {
        setFoundCodes((current) => [...current, country.code])
        setSelectedCountry(country)
      } else {
        setSelectedCountry(country)
        window.setTimeout(() => setSelectedCountry((current) => current?.code === country.code ? null : current), 750)
      }
      return
    }
    if (screen === 'flag-challenge' && !challengeResult && currentPrompt) {
      const result = country.code === currentPrompt.code ? 'correct' : 'incorrect'
      setSelectedCountry(country)
      setChallengeResult(result)
      setChallengeScore((score) => ({ correct: score.correct + (result === 'correct' ? 1 : 0), total: score.total + 1 }))
    }
  }

  const submitIdentify = () => {
    if (!selectedCountry || !identifyGuess || identifyResult) return
    const result = identifyGuess === selectedCountry.code ? 'correct' : 'incorrect'
    setIdentifyResult(result)
    setIdentifyScore((score) => ({ correct: score.correct + (result === 'correct' ? 1 : 0), total: score.total + 1 }))
  }

  const nextIdentify = () => {
    setSelectedCountry(null)
    setIdentifyGuess('')
    setIdentifyResult(null)
  }

  const nextChallenge = () => {
    if (activeIndex >= roundCountries.length - 1) {
      setRoundCountries(shuffled(mapCountries).slice(0, 10))
      setActiveIndex(0)
    } else {
      setActiveIndex((index) => index + 1)
    }
    setSelectedCountry(null)
    setChallengeResult(null)
  }

  const filteredCountries = mapCountries.filter((country) =>
    country.name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()),
  )

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate('learn') }}>
          <span className="brand-mark"><Globe2 size={21} strokeWidth={2.3} /></span>
          <span>Country<span className="brand-dot">Quest</span></span>
        </a>
        <div className="topbar-right">
          <div className="streak-pill"><Sparkles size={15} /> <span>Little steps, big world</span></div>
          <button className="avatar-button" type="button" aria-label="Your profile">A</button>
        </div>
      </header>

      <div className="page-layout">
        <aside className="sidebar">
          <div className="sidebar-label">YOUR CLASSROOM</div>
          <nav className="main-nav" aria-label="Main navigation">
            {SCREENS.map((item, index) => {
              const Icon = index === 0 ? Compass : index === 1 ? Search : index === 2 ? MapIcon : index === 3 ? Globe2 : HelpCircle
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item${screen === item.id ? ' is-active' : ''}`}
                  onClick={() => navigate(item.id)}
                  aria-current={screen === item.id ? 'page' : undefined}
                >
                  <span className="nav-icon"><Icon size={18} /></span>
                  <span>{item.label}</span>
                  {item.id === 'learn' && <span className="nav-tag">START</span>}
                </button>
              )
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-art" aria-hidden="true">
              <span className="art-sun" />
              <span className="art-cloud">☁</span>
              <span className="art-planet">🌍</span>
              <span className="art-star">✦</span>
            </div>
            <p>Curiosity has no borders.</p>
            <span>Keep exploring, one country at a time.</span>
          </div>
        </aside>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> WORLD GEOGRAPHY</div>
              <h1>{screen === 'learn' ? 'A world of wonder' : activeScreen.label}</h1>
              <p className="page-subtitle">
                {screen === 'learn' && 'Wander the map and discover somewhere new.'}
                {screen === 'identify' && 'Pick a country, then see if you can name it.'}
                {screen === 'find-countries' && 'Find each country on the map. You’ve got this!'}
                {screen === 'find-flags' && 'Can you match these flags to their home countries?'}
                {screen === 'flag-challenge' && 'One flag. One map. How many can you get right?'}
              </p>
            </div>
            <div className="heading-badge"><span>✦</span> Made for curious minds</div>
          </div>

          <div className={`workspace${screen === 'learn' ? ' is-learning' : ''}`}>
            <section className="map-card" aria-label="World map">
              <div className="map-card-header">
                <div className="map-title">
                  <span className="map-title-icon"><Globe2 size={16} /></span>
                  <span>{screen === 'learn' && continent !== 'Whole world' ? continent.toUpperCase() : 'THE WORLD'}</span>
                  <span className="live-dot" />
                </div>
                {screen === 'learn' ? (
                  <select
                    className="continent-filter"
                    aria-label="Continent"
                    value={continent}
                    onChange={(event) => {
                      setContinent(event.target.value)
                      setSelectedCountry(null)
                    }}
                  >
                    {Object.keys(CONTINENT_VIEWS).map((name) => <option key={name}>{name}</option>)}
                  </select>
                ) : <span className="map-hint">Select a country on the map</span>}
              </div>
              <WorldMap
                key={`${screen}-${screen === 'learn' ? continent : 'Whole world'}`}
                selectedCode={selectedCountry?.code ?? null}
                statusByCode={statusByCode}
                onSelect={handleCountrySelect}
                onBackgroundClick={() => {
                  if (screen === 'learn') setSelectedCountry(null)
                }}
                onCountriesLoaded={onCountriesLoaded}
                continent={screen === 'learn' ? continent : 'Whole world'}
              />
              <div className="map-card-footer">
                <span><i className="legend-dot legend-land" /> Countries</span>
                {screen !== 'learn' && <span><i className="legend-dot legend-found" /> Correct</span>}
                <span className="map-zoom-label">Scroll or use + / − to zoom</span>
              </div>
            </section>

            <aside className="side-panel">
              {screen === 'learn' && (
                selectedCountry ? (
                  <div className="country-detail panel-card">
                    <button className="panel-close" type="button" aria-label="Close country details" onClick={() => setSelectedCountry(null)}><X size={17} /></button>
                    <div className="detail-kicker">COUNTRY SPOTLIGHT</div>
                    <div className="detail-flag"><CountryFlag country={selectedCountry} /></div>
                    <h2>{selectedCountry.name}</h2>
                    <div className="detail-code">ISO 3166 · {selectedCountry.code}</div>
                    <div className="detail-continent">
                      <Globe2 size={14} />
                      <span>{selectedCountry.continent ?? 'Continent unavailable'}</span>
                    </div>
                    <div className="detail-divider" />
                    {selectedFacts && (
                      <dl className="country-facts">
                        <div><dt>Capital</dt><dd>{selectedFacts.capitals}</dd></div>
                        <div><dt>Currency</dt><dd>{selectedFacts.currencies}</dd></div>
                        <div><dt>Official languages</dt><dd>{selectedFacts.languages}</dd></div>
                        <div>
                          <dt>Famous monuments & landmarks</dt>
                          <dd>{selectedFacts.monuments.length
                            ? <ul>{selectedFacts.monuments.map((monument) => <li key={monument}>{monument}</li>)}</ul>
                            : 'No landmarks listed yet.'}</dd>
                        </div>
                      </dl>
                    )}
                    <button className="soft-action" type="button" onClick={() => navigate('identify')}>Try a quick quiz <ArrowRight size={15} /></button>
                  </div>
                ) : (
                  <>
                    <div className="welcome-card panel-card">
                      <div className="welcome-copy">
                        <span className="mini-kicker">READY TO ROAM?</span>
                        <h2>Pick a place.<br />Find a story.</h2>
                        <p>Click any country on the map to take a closer look.</p>
                      </div>
                      <div className="welcome-globe" aria-hidden="true">🌐</div>
                    </div>
                    <div className="side-section">
                      <div className="section-heading"><span>QUICK ADVENTURE</span><span className="section-spark">✦</span></div>
                      <button className="adventure-card" type="button" onClick={() => navigate('identify')}>
                        <span className="adventure-icon">🧭</span>
                        <span className="adventure-text"><strong>Name that country</strong><small>A little map-reading practice</small></span>
                        <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="tip-card"><span className="tip-icon">💡</span><p><strong>Map tip</strong><br />Drag to wander, scroll to zoom. The world is yours to explore!</p></div>
                  </>
                )
              )}

              {screen === 'identify' && (
                <div className="panel-card quiz-panel">
                  <div className="panel-topline"><span className="quiz-icon lavender"><Search size={17} /></span><span>COUNTRY IDENTIFIER</span></div>
                  <h2>What country<br />did you pick?</h2>
                  <p className="panel-instruction">First, tap a country on the map. Then choose its name below.</p>
                  <div className="selected-preview">
                    <span className="preview-flag">
                      {identifyResult && selectedCountry
                        ? <CountryFlag country={selectedCountry} />
                        : selectedCountry
                          ? '❔'
                          : '👆'}
                    </span>
                    <span>
                      {identifyResult
                        ? selectedCountry?.name
                        : selectedCountry
                          ? 'Country selected — can you name it?'
                          : 'Select a country on the map'}
                    </span>
                  </div>
                  <label className="field-label" htmlFor="country-guess">YOUR GUESS</label>
                  <div className="country-search">
                    <div className="search-input-wrap">
                      <Search size={16} />
                      <input
                        id="country-guess"
                        type="search"
                        role="combobox"
                        aria-label="Search for a country"
                        aria-expanded={Boolean(showCountryOptions && searchValue && !identifyResult)}
                        aria-controls="country-options"
                        autoComplete="off"
                        placeholder="Search or choose a country..."
                        value={searchValue}
                        disabled={!selectedCountry || Boolean(identifyResult)}
                        onFocus={() => setShowCountryOptions(true)}
                        onChange={(event) => {
                          setSearchValue(event.target.value)
                          setIdentifyGuess('')
                          setShowCountryOptions(true)
                        }}
                      />
                      <ChevronDown size={16} />
                    </div>
                    {showCountryOptions && searchValue && !identifyResult && (
                      <div className="country-options" id="country-options" role="listbox" aria-label="Countries">
                        {filteredCountries.length ? filteredCountries.slice(0, 7).map((country) => (
                          <button
                            type="button"
                            role="option"
                            aria-selected={identifyGuess === country.code}
                            key={country.code}
                            onClick={() => {
                              setIdentifyGuess(country.code)
                              setSearchValue(country.name)
                              setShowCountryOptions(false)
                            }}
                          >
                            <CountryFlag country={country} />{country.name}
                          </button>
                        )) : <div className="no-options">No countries found</div>}
                      </div>
                    )}
                  </div>
                  {!identifyResult ? (
                    <button className="primary-button" type="button" disabled={!selectedCountry || !identifyGuess} onClick={submitIdentify}>Check my answer <ArrowRight size={16} /></button>
                  ) : (
                    <div className={`answer-feedback ${identifyResult}`} role="status">
                      <span className="feedback-mark">{identifyResult === 'correct' ? <Check size={17} /> : <X size={17} />}</span>
                      <span><strong>{identifyResult === 'correct' ? 'That’s right!' : 'Not quite!'}</strong><small>{identifyResult === 'correct' ? 'You know your map!' : `That was ${selectedCountry?.name}.`}</small></span>
                    </div>
                  )}
                  {identifyResult && <button className="outline-button" type="button" onClick={nextIdentify}>Try another country <RotateCcw size={15} /></button>}
                  <div className="score-strip"><span>YOUR SCORE</span><strong>{identifyScore.correct}<small> / {identifyScore.total}</small></strong></div>
                </div>
              )}

              {screen === 'find-countries' && (
                <div className="panel-card quiz-panel">
                  <div className="panel-topline"><span className="quiz-icon peach"><MapIcon size={17} /></span><span>MAP SCAVENGER HUNT</span></div>
                  <h2>Find these<br />countries!</h2>
                  <div className="progress-line"><div style={{ width: `${foundCodes.length * 10}%` }} /></div>
                  <div className="progress-caption"><span>{foundCodes.length} of 10 found</span><span>{foundCodes.length === 10 ? 'Amazing!' : 'Keep going!'}</span></div>
                  <div className="target-list">
                    {roundCountries.map((country) => (
                      <div className={`target-row${foundSet.has(country.code) ? ' is-found' : ''}`} key={country.code}>
                        <span className="target-status">{foundSet.has(country.code) ? <Check size={13} /> : <span />}</span>
                        <span>{country.name}</span>
                        {foundSet.has(country.code) && <span className="target-flag"><CountryFlag country={country} /></span>}
                      </div>
                    ))}
                  </div>
                  {foundCodes.length === 10 ? (
                    <button className="primary-button" type="button" onClick={() => resetFindRound('find-countries')}>Play another round <ArrowRight size={16} /></button>
                  ) : (
                    <p className="micro-hint">Tap a country on the map to mark it found.</p>
                  )}
                </div>
              )}

              {screen === 'find-flags' && (
                <div className="panel-card quiz-panel">
                  <div className="panel-topline"><span className="quiz-icon mint"><Globe2 size={17} /></span><span>FLAG MATCH</span></div>
                  <h2>Where do these<br />flags belong?</h2>
                  <div className="progress-line"><div style={{ width: `${foundCodes.length * 10}%` }} /></div>
                  <div className="progress-caption"><span>{foundCodes.length} of 10 matched</span><span>Look closely!</span></div>
                  <div className="flag-grid">
                    {roundCountries.map((country) => (
                      <div className={`flag-tile${foundSet.has(country.code) ? ' is-found' : ''}`} key={country.code} title={foundSet.has(country.code) ? country.name : 'Mystery flag'}>
                        <CountryFlag country={country} />
                        {foundSet.has(country.code) && <small>{country.name}</small>}
                      </div>
                    ))}
                  </div>
                  {foundCodes.length === 10 ? (
                    <button className="primary-button" type="button" onClick={() => resetFindRound('find-flags')}>Play another round <ArrowRight size={16} /></button>
                  ) : (
                    <p className="micro-hint">Tap a country on the map to match its flag.</p>
                  )}
                </div>
              )}

              {screen === 'flag-challenge' && (
                <div className="panel-card quiz-panel challenge-panel">
                  <div className="panel-topline"><span className="quiz-icon yellow"><Sparkles size={17} /></span><span>FLAG CHALLENGE</span></div>
                  <div className="challenge-progress"><span>QUESTION {activeIndex + 1}</span><span>{challengeScore.correct} <small>correct</small></span></div>
                  <div className="challenge-flag" aria-label="Identify this country flag">
                    {currentPrompt ? <CountryFlag country={currentPrompt} /> : '🌐'}
                  </div>
                  <h2>Where in the<br />world is this?</h2>
                  <p className="panel-instruction">Click the country that flies this flag.</p>
                  {challengeResult ? (
                    <>
                      <div className={`answer-feedback ${challengeResult}`} role="status">
                        <span className="feedback-mark">{challengeResult === 'correct' ? <Check size={17} /> : <X size={17} />}</span>
                        <span><strong>{challengeResult === 'correct' ? 'Brilliant!' : currentPrompt?.name}</strong><small>{challengeResult === 'correct' ? 'You found the right place.' : 'A new flag is up next!'}</small></span>
                      </div>
                      <button className="primary-button" type="button" onClick={nextChallenge}>Next flag <ArrowRight size={16} /></button>
                    </>
                  ) : (
                    <div className="challenge-nudge">Choose your answer on the map <span>↗</span></div>
                  )}
                  <button className="text-button" type="button" onClick={nextChallenge}>Skip this flag <ArrowRight size={14} /></button>
                </div>
              )}
            </aside>
          </div>
          <footer className="page-footer">
            <span>Made for the joy of knowing our world <span className="footer-heart">♥</span></span>
            <span className="footer-right">No ads, just adventures <span>✦</span></span>
          </footer>
        </section>
      </div>
    </main>
  )
}

export default App
