import { ArrowRight, Check, Eye, Globe2, Map as MapIcon } from 'lucide-react'
import type { Country } from '../types/game'
import CountryFlag from './CountryFlag'

type FinderPanelProps = {
  mode: 'find-countries' | 'find-flags'
  countries: Country[]
  foundCodes: string[]
  revealedCodes: string[]
  onReveal: (country: Country) => void
  onRestart: () => void
}

// Both finder modes use the same round progress. Revealed flags remain separate
// from found countries, so asking for help never automatically awards a match.
export default function FinderPanel({
  mode, countries, foundCodes, revealedCodes, onReveal, onRestart,
}: FinderPanelProps) {
  const isFlagMode = mode === 'find-flags'
  const foundSet = new Set(foundCodes)
  return (
    <div className="panel-card quiz-panel">
      <div className="panel-topline">
        <span className={`quiz-icon ${isFlagMode ? 'mint' : 'peach'}`}>{isFlagMode ? <Globe2 size={17} /> : <MapIcon size={17} />}</span>
        <span>{isFlagMode ? 'FLAG MATCH' : 'MAP SCAVENGER HUNT'}</span>
      </div>
      <h2>{isFlagMode ? <>Where do these<br />flags belong?</> : <>Find these<br />countries!</>}</h2>
      <div className="progress-line"><div style={{ width: `${foundCodes.length * 10}%` }} /></div>
      <div className="progress-caption">
        <span>{foundCodes.length} of 10 {isFlagMode ? 'matched' : 'found'}</span>
        <span>{isFlagMode ? revealedCodes.length ? `${revealedCodes.length} revealed` : 'Look closely!' : foundCodes.length === 10 ? 'Amazing!' : 'Keep going!'}</span>
      </div>
      {isFlagMode ? (
        <div className="flag-grid">
          {countries.map((country, index) => {
            const isFound = foundSet.has(country.code)
            const isRevealed = revealedCodes.includes(country.code)
            const showName = isFound || isRevealed
            return (
              <div className={`flag-tile${isFound ? ' is-found' : isRevealed ? ' is-revealed' : ''}`} key={country.code}>
                <CountryFlag country={country} />
                <small>{showName ? country.name : 'Mystery flag'}</small>
                <button
                  type="button"
                  className="flag-reveal-button"
                  aria-label={showName ? `Show ${country.name} on map` : `Reveal flag ${index + 1}`}
                  onClick={() => onReveal(country)}
                >
                  <Eye size={15} />{showName ? 'Show on map' : 'Reveal'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="target-list">
          {countries.map((country) => (
            <div className={`target-row${foundSet.has(country.code) ? ' is-found' : ''}`} key={country.code}>
              <span className="target-status">{foundSet.has(country.code) ? <Check size={13} /> : <span />}</span>
              <span>{country.name}</span>
              {foundSet.has(country.code) && <span className="target-flag"><CountryFlag country={country} /></span>}
            </div>
          ))}
        </div>
      )}
      {foundCodes.length === 10 ? (
        <button className="primary-button" type="button" onClick={onRestart}>Play another round <ArrowRight size={16} /></button>
      ) : (
        <p className="micro-hint">{isFlagMode ? 'Tap a country on the map to match its flag.' : 'Tap a country on the map to mark it found.'}</p>
      )}
    </div>
  )
}