import { ArrowRight, Check, Sparkles, X } from 'lucide-react'
import type { AnswerState, Country, Score } from '../types/game'
import CountryFlag from './CountryFlag'

type FlagChallengePanelProps = {
  country: Country | undefined
  questionIndex: number
  result: AnswerState
  score: Score
  onNext: () => void
}

export default function FlagChallengePanel({ country, questionIndex, result, score, onNext }: FlagChallengePanelProps) {
  return (
    <div className="panel-card quiz-panel challenge-panel">
      <div className="panel-topline"><span className="quiz-icon yellow"><Sparkles size={17} /></span><span>FLAG CHALLENGE</span></div>
      <div className="challenge-progress"><span>QUESTION {questionIndex + 1}</span><span>{score.correct} <small>correct</small></span></div>
      <div className="challenge-flag" aria-label="Identify this country flag">
        {country ? <CountryFlag country={country} /> : '🌐'}
      </div>
      <h2>Where in the<br />world is this?</h2>
      <p className="panel-instruction">Click the country that flies this flag.</p>
      {result ? (
        <>
          <div className={`answer-feedback ${result}`} role="status">
            <span className="feedback-mark">{result === 'correct' ? <Check size={17} /> : <X size={17} />}</span>
            <span><strong>{result === 'correct' ? 'Brilliant!' : country?.name}</strong><small>{result === 'correct' ? 'You found the right place.' : 'A new flag is up next!'}</small></span>
          </div>
          <button className="primary-button" type="button" onClick={onNext}>Next flag <ArrowRight size={16} /></button>
        </>
      ) : (
        <div className="challenge-nudge">Choose your answer on the map <span>↗</span></div>
      )}
      <button className="text-button" type="button" onClick={onNext}>Skip this flag <ArrowRight size={14} /></button>
    </div>
  )
}