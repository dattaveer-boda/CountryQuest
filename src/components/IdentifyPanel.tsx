import { ArrowRight, Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import type { AnswerState, Country, Score } from '../types/game'
import CountryFlag from './CountryFlag'

type IdentifyPanelProps = {
  country: Country | null
  countries: Country[]
  guess: string
  result: AnswerState
  score: Score
  searchValue: string
  showOptions: boolean
  onOpenOptions: () => void
  onSearchChange: (value: string) => void
  onGuessSelect: (country: Country) => void
  onSubmit: () => void
  onNext: () => void
}

// Controlled inputs read their values from App and report user actions through callbacks.
// This panel renders feedback; App remains responsible for grading and scoring.
export default function IdentifyPanel({
  country, countries, guess, result, score, searchValue, showOptions,
  onOpenOptions, onSearchChange, onGuessSelect, onSubmit, onNext,
}: IdentifyPanelProps) {
  const filteredCountries = countries.filter((item) => item.name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()))
  return (
    <div className="panel-card quiz-panel">
      <div className="panel-topline"><span className="quiz-icon lavender"><Search size={17} /></span><span>COUNTRY IDENTIFIER</span></div>
      <h2>What country<br />did you pick?</h2>
      <p className="panel-instruction">First, tap a country on the map. Then choose its name below.</p>
      <div className="selected-preview">
        <span className="preview-flag">
          {result && country ? <CountryFlag country={country} /> : country ? '❔' : '👆'}
        </span>
        <span>{result ? country?.name : country ? 'Country selected — can you name it?' : 'Select a country on the map'}</span>
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
            aria-expanded={Boolean(showOptions && searchValue && !result)}
            aria-controls="country-options"
            autoComplete="off"
            placeholder="Search or choose a country..."
            value={searchValue}
            disabled={!country || Boolean(result)}
            onFocus={onOpenOptions}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <ChevronDown size={16} />
        </div>
        {showOptions && searchValue && !result && (
          <div className="country-options" id="country-options" role="listbox" aria-label="Countries">
            {filteredCountries.length ? filteredCountries.slice(0, 7).map((item) => (
              <button type="button" role="option" aria-selected={guess === item.code} key={item.code} onClick={() => onGuessSelect(item)}>
                <CountryFlag country={item} />{item.name}
              </button>
            )) : <div className="no-options">No countries found</div>}
          </div>
        )}
      </div>
      {!result ? (
        <button className="primary-button" type="button" disabled={!country || !guess} onClick={onSubmit}>Check my answer <ArrowRight size={16} /></button>
      ) : (
        <div className={`answer-feedback ${result}`} role="status">
          <span className="feedback-mark">{result === 'correct' ? <Check size={17} /> : <X size={17} />}</span>
          <span><strong>{result === 'correct' ? 'That’s right!' : 'Not quite!'}</strong><small>{result === 'correct' ? 'You know your map!' : `That was ${country?.name}.`}</small></span>
        </div>
      )}
      {result && <button className="outline-button" type="button" onClick={onNext}>Try another country <RotateCcw size={15} /></button>}
      <div className="score-strip"><span>YOUR SCORE</span><strong>{score.correct}<small> / {score.total}</small></strong></div>
    </div>
  )
}