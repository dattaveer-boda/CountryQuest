import { ArrowRight, Globe2, X } from 'lucide-react'
import { getCountryFacts } from '../countryFacts'
import type { Country } from '../types/game'
import CountryFlag from './CountryFlag'

type ExplorePanelProps = {
  country: Country | null
  onClose: () => void
  onStartQuiz: () => void
}

export default function ExplorePanel({ country, onClose, onStartQuiz }: ExplorePanelProps) {
  if (!country) {
    return (
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
          <button className="adventure-card" type="button" onClick={onStartQuiz}>
            <span className="adventure-icon">🧭</span>
            <span className="adventure-text"><strong>Name that country</strong><small>A little map-reading practice</small></span>
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="tip-card"><span className="tip-icon">💡</span><p><strong>Map tip</strong><br />Drag to wander, scroll to zoom. The world is yours to explore!</p></div>
      </>
    )
  }

  const facts = getCountryFacts(country.code)
  return (
    <div className="country-detail panel-card">
      <button className="panel-close" type="button" aria-label="Close country details" onClick={onClose}><X size={17} /></button>
      <div className="detail-kicker">COUNTRY SPOTLIGHT</div>
      <div className="detail-flag"><CountryFlag country={country} /></div>
      <h2>{country.name}</h2>
      <div className="detail-code">ISO 3166 · {country.code}</div>
      <div className="detail-continent">
        <Globe2 size={14} />
        <span>{country.continents.join(' & ') || 'Continent unavailable'}</span>
      </div>
      <div className="detail-divider" />
      <dl className="country-facts">
        <div><dt>Capital</dt><dd>{facts.capitals}</dd></div>
        <div><dt>Currency</dt><dd>{facts.currencies}</dd></div>
        <div><dt>Official languages</dt><dd>{facts.languages}</dd></div>
        <div>
          <dt>Famous monuments & landmarks</dt>
          <dd>{facts.monuments.length
            ? <ul>{facts.monuments.map((monument) => <li key={monument}>{monument}</li>)}</ul>
            : 'No landmarks listed yet.'}</dd>
        </div>
      </dl>
      <button className="soft-action" type="button" onClick={onStartQuiz}>Try a quick quiz <ArrowRight size={15} /></button>
    </div>
  )
}