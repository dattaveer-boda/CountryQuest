import { useCallback, useMemo, useState } from 'react'
import type { AnswerState, Country, MapPosition, MapStatus, Score, ScreenId } from './types/game'
import AppLayout from './components/AppLayout'
import MapPanel from './components/MapPanel'
import ExplorePanel from './components/ExplorePanel'
import IdentifyPanel from './components/IdentifyPanel'
import FinderPanel from './components/FinderPanel'
import FlagChallengePanel from './components/FlagChallengePanel'
import FlagLearningScreen from './components/FlagLearningScreen'
import { CONTINENT_VIEWS } from './geography'
import { WORLD_COUNTRIES } from './mapColors'
import './App.css'

function shuffled<T>(items: T[]): T[] {
  // Fisher-Yates gives a random order without mutating the original country pool.
  const copy = [...items]
  for (let currentIndex = copy.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1))
    ;[copy[currentIndex], copy[randomIndex]] = [copy[randomIndex], copy[currentIndex]]
  }
  return copy
}

function App() {
  // Shared state lives here so a map click and the active panel always agree.
  const [screen, setScreen] = useState<ScreenId>('learn')
  const [mapCountries, setMapCountries] = useState<Country[]>(WORLD_COUNTRIES)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [continent, setContinent] = useState('Whole world')
  const [mapPosition, setMapPosition] = useState<MapPosition>(CONTINENT_VIEWS['Whole world'])
  const [showCountryNames, setShowCountryNames] = useState(false)
  const [revealedCodes, setRevealedCodes] = useState<string[]>([])
  const [focusCountry, setFocusCountry] = useState<Country | null>(null)
  const [identifyGuess, setIdentifyGuess] = useState('')
  const [identifyResult, setIdentifyResult] = useState<AnswerState>(null)
  const [identifyScore, setIdentifyScore] = useState<Score>({ correct: 0, total: 0 })
  const [searchValue, setSearchValue] = useState('')
  const [showCountryOptions, setShowCountryOptions] = useState(false)
  const [roundCountries, setRoundCountries] = useState<Country[]>([])
  const [foundCodes, setFoundCodes] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [challengeResult, setChallengeResult] = useState<AnswerState>(null)
  const [challengeScore, setChallengeScore] = useState<Score>({ correct: 0, total: 0 })

  // The map reports the full, deduplicated country pool even in a continent view.
  // A stable callback prevents the map's loading effect from rerunning unnecessarily.
  const onCountriesLoaded = useCallback((available: Country[]) => {
    setMapCountries((current) => current.length === available.length ? current : available)
    setRoundCountries((current) => current.length ? current : shuffled(available).slice(0, 10))
  }, [])

  const currentPrompt = roundCountries[activeIndex]
  const foundSet = useMemo(() => new Set(foundCodes), [foundCodes])
  // Map colors are derived from game state, rather than stored as separate state.
  const statusByCode = useMemo<Record<string, MapStatus>>(() => {
    const statuses: Record<string, MapStatus> = {}
    if (screen === 'find-flags') {
      for (const code of revealedCodes) statuses[code] = 'revealed'
    }
    if (screen === 'identify' && identifyResult && selectedCountry) {
      statuses[selectedCountry.code] = identifyResult
    }
    if (screen === 'find-countries' || screen === 'find-flags') {
      // A real match takes precedence over an earlier reveal.
      for (const code of foundCodes) statuses[code] = 'correct'
    }
    if (screen === 'flag-challenge' && challengeResult && selectedCountry) {
      statuses[selectedCountry.code] = challengeResult
    }
    return statuses
  }, [challengeResult, foundCodes, identifyResult, revealedCodes, screen, selectedCountry])

  // Navigation clears the current attempt but retains scores and Explore preferences.
  const navigate = (nextScreen: ScreenId) => {
    setScreen(nextScreen)
    setMapPosition(CONTINENT_VIEWS[nextScreen === 'learn' ? continent : 'Whole world'])
    setSelectedCountry(null)
    setIdentifyGuess('')
    setIdentifyResult(null)
    setSearchValue('')
    setShowCountryOptions(false)
    setFoundCodes([])
    setRevealedCodes([])
    setFocusCountry(null)
    setActiveIndex(0)
    setChallengeResult(null)
    if (nextScreen === 'find-countries' || nextScreen === 'find-flags' || nextScreen === 'flag-challenge') {
      setRoundCountries(shuffled(mapCountries).slice(0, 10))
    }
  }

  const resetFindRound = (mode: 'find-countries' | 'find-flags') => {
    setMapPosition(CONTINENT_VIEWS['Whole world'])
    setRoundCountries(shuffled(mapCountries).slice(0, 10))
    setFoundCodes([])
    setRevealedCodes([])
    setFocusCountry(null)
    setActiveIndex(0)
    setSelectedCountry(null)
    setSearchValue('')
    setScreen(mode)
  }

  const revealFlag = (country: Country) => {
    if (!foundSet.has(country.code)) {
      setRevealedCodes((current) => current.includes(country.code) ? current : [...current, country.code])
    }
    setSelectedCountry(country)
    // A new object also lets repeated "Show on map" actions scroll the map into view.
    setFocusCountry({ ...country })
    setMapPosition(country.mapPosition)
  }

  // The map emits the same Country in every mode; the active game decides its meaning.
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

  return (
    <AppLayout screen={screen} onNavigate={navigate}>
      {screen === 'learn-flags' ? (
        <FlagLearningScreen countries={mapCountries} onStartQuiz={() => navigate('flag-challenge')} />
      ) : (
      <div className={`workspace${screen === 'learn' ? ' is-learning' : ''}`}>
        <MapPanel
          screen={screen}
          countries={mapCountries}
          onCountrySearchSelect={(country) => {
            if (continent !== 'Whole world' && !country.continents.includes(continent)) {
              setContinent('Whole world')
            }
            setSelectedCountry(country)
            setMapPosition(country.mapPosition)
          }}
          selectedCode={selectedCountry?.code ?? null}
          statusByCode={statusByCode}
          onSelect={handleCountrySelect}
          onBackgroundClick={() => {
            if (screen === 'learn') setSelectedCountry(null)
          }}
          onCountriesLoaded={onCountriesLoaded}
          continent={continent}
          showNames={showCountryNames}
          onContinentChange={(nextContinent) => {
            setContinent(nextContinent)
            setMapPosition(CONTINENT_VIEWS[nextContinent])
            setSelectedCountry(null)
          }}
          onShowNamesChange={setShowCountryNames}
          focusCountry={screen === 'find-flags' ? focusCountry : null}
          position={mapPosition}
          onPositionChange={setMapPosition}
        />
        <aside className="side-panel">
          {screen === 'learn' && (
            <ExplorePanel country={selectedCountry} onClose={() => setSelectedCountry(null)} onStartQuiz={() => navigate('identify')} />
          )}
          {screen === 'identify' && (
            <IdentifyPanel
              country={selectedCountry}
              countries={mapCountries}
              guess={identifyGuess}
              result={identifyResult}
              score={identifyScore}
              searchValue={searchValue}
              showOptions={showCountryOptions}
              onOpenOptions={() => setShowCountryOptions(true)}
              onSearchChange={(value) => {
                setSearchValue(value)
                setIdentifyGuess('')
                setShowCountryOptions(true)
              }}
              onGuessSelect={(country) => {
                setIdentifyGuess(country.code)
                setSearchValue(country.name)
                setShowCountryOptions(false)
              }}
              onSubmit={submitIdentify}
              onNext={nextIdentify}
            />
          )}
          {(screen === 'find-countries' || screen === 'find-flags') && (
            <FinderPanel
              mode={screen}
              countries={roundCountries}
              foundCodes={foundCodes}
              revealedCodes={revealedCodes}
              onReveal={revealFlag}
              onRestart={() => resetFindRound(screen)}
            />
          )}
          {screen === 'flag-challenge' && (
            <FlagChallengePanel country={currentPrompt} questionIndex={activeIndex} result={challengeResult} score={challengeScore} onNext={nextChallenge} />
          )}
        </aside>
      </div>
      )}
    </AppLayout>
  )
}

export default App
