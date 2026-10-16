import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Eye, Flag, RotateCcw, Search } from 'lucide-react'
import { getCountryFacts } from '../countryFacts'
import { CONTINENT_VIEWS } from '../geography'
import { getCountryStatus } from '../countryStatus'
import type { Country } from '../types/game'
import CountryFlag from './CountryFlag'
import ExplorePanel from './ExplorePanel'

type FlagLearningScreenProps = {
  countries: Country[]
  onStartQuiz: () => void
}

function searchableName(name: string) {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('en')
}

export default function FlagLearningScreen({ countries, onStartQuiz }: FlagLearningScreenProps) {
  const [continent, setContinent] = useState('Whole world')
  const [letter, setLetter] = useState('')
  const [search, setSearch] = useState('')
  const [hideNames, setHideNames] = useState(true)
  const [revealedCodes, setRevealedCodes] = useState<string[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchText = searchableName(search.trim())

  // All filters combine. Accent folding makes A include names such as Aland Islands.
  const filteredCountries = countries
    .filter((country) => country.alpha2
      && (continent === 'Whole world' || country.continents.includes(continent))
      && (!letter || searchableName(country.name).startsWith(letter.toLowerCase()))
      && searchableName(country.name).includes(searchText))
    .sort((first, second) => first.name.localeCompare(second.name, 'en'))
  const selectedCountry = filteredCountries.find((country) => country.code === selectedCode) ?? null
  const memberCount = filteredCountries.filter((country) => getCountryStatus(country.code).kind === 'member').length
  const observerCount = filteredCountries.filter((country) => getCountryStatus(country.code).kind === 'observer').length
  const otherCount = filteredCountries.length - memberCount - observerCount

  // Keep selection and the native dialog in sync; the browser manages modal focus.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (selectedCountry && !dialog.open) dialog.showModal()
    if (!selectedCountry && dialog.open) dialog.close()
  }, [selectedCountry])

  const clearFilters = () => {
    setContinent('Whole world')
    setLetter('')
    setSearch('')
    setSelectedCode(null)
  }

  return (
    <section className="flag-learning" aria-label="Flag learning">
      <div className="flag-learning-controls">
        <label className="flag-learning-field">
          <span>Continent</span>
          <select aria-label="Flag continent" value={continent} onChange={(event) => { setContinent(event.target.value); setSelectedCode(null) }}>
            <option value="Whole world">All continents</option>
            {Object.keys(CONTINENT_VIEWS).filter((name) => name !== 'Whole world').map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="flag-learning-field">
          <span>Starts with</span>
          <select aria-label="Country first letter" value={letter} onChange={(event) => { setLetter(event.target.value); setSelectedCode(null) }}>
            <option value="">All letters</option>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((initial) => <option key={initial}>{initial}</option>)}
          </select>
        </label>
        <label className="flag-learning-field flag-learning-search">
          <span>Search countries</span>
          <div>
            <Search size={17} aria-hidden="true" />
            <input type="search" aria-label="Search flags by country" placeholder="Country name" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedCode(null) }} />
          </div>
        </label>
        <button className="flag-learning-reset" type="button" onClick={clearFilters} aria-label="Clear flag filters" title="Clear filters"><RotateCcw size={18} /></button>
      </div>
      <div className="flag-learning-summary">
        <div className="flag-learning-counts" role="status">
          <p>{filteredCountries.length} {filteredCountries.length === 1 ? 'flag' : 'flags'}</p>
          <span>{memberCount} UN members, {observerCount} UN observers, {otherCount} territories &amp; other entities</span>
        </div>
        <label className="flag-learning-hide"><input type="checkbox" checked={hideNames} onChange={(event) => { setHideNames(event.target.checked); setRevealedCodes([]) }} />Hide country names</label>
        <button type="button" className="soft-action" onClick={onStartQuiz}>Practice flags <ArrowRight size={16} /></button>
      </div>
      <p className="flag-learning-coverage">
        Worldwide: <a href="https://www.un.org/en/about-us/member-states" target="_blank" rel="noreferrer">193 UN member states</a> and <a href="https://www.un.org/en/about-us/non-member-states" target="_blank" rel="noreferrer">2 observer states</a>. This atlas-based gallery includes territories and other entities; it omits Tuvalu.
      </p>
      {filteredCountries.length ? (
        <div className="flag-learning-grid">
          {filteredCountries.map((country, index) => {
            const nameVisible = !hideNames || revealedCodes.includes(country.code)
            const status = getCountryStatus(country.code)
            const capital = getCountryFacts(country.code).capitals
            return (
              <article key={country.code} className={`flag-learning-country is-${status.kind}`}>
                <button
                  type="button"
                  className="flag-learning-image"
                  aria-label={nameVisible ? `Learn about ${country.name}` : `Country details for flag ${index + 1}`}
                  title="Country details"
                  onClick={() => setSelectedCode(country.code)}
                ><CountryFlag country={country} /></button>
                <span className="flag-learning-name" aria-live="polite">{nameVisible ? country.name : <Eye size={19} aria-hidden="true" />}</span>
                <span className="flag-learning-continent">{country.continents.join(' & ') || 'Not listed'}</span>
                <span className="flag-learning-capital">Capital: {capital}</span>
                <div className="flag-learning-status">
                  <span className="flag-status-label">{status.label}</span>
                  <span className="flag-status-detail">{status.detail}</span>
                </div>
                <button
                  type="button"
                  className="flag-reveal-button"
                  disabled={nameVisible}
                  aria-label={`Reveal country name for flag ${index + 1}`}
                  onClick={() => setRevealedCodes((current) => current.includes(country.code) ? current : [...current, country.code])}
                ><Eye size={16} aria-hidden="true" />{nameVisible ? 'Revealed' : 'Reveal name'}</button>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flag-learning-empty">
          <Flag size={30} aria-hidden="true" />
          <h2>No matching flags</h2>
          <button type="button" className="soft-action" onClick={clearFilters}><RotateCcw size={16} />Clear filters</button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="flag-learning-dialog"
        aria-label={selectedCountry ? `${selectedCountry.name} country details` : 'Country details'}
        onCancel={() => setSelectedCode(null)}
        onClose={() => setSelectedCode(null)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setSelectedCode(null)
          }
        }}
        onClick={(event) => { if (event.target === event.currentTarget) setSelectedCode(null) }}
      >
        {selectedCountry && <ExplorePanel country={selectedCountry} onClose={() => setSelectedCode(null)} onStartQuiz={onStartQuiz} />}
      </dialog>
    </section>
  )
}