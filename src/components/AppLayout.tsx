import type { ReactNode } from 'react'
import { Compass, Flag, Globe2, HelpCircle, Map as MapIcon, Search, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ScreenId } from '../types/game'

const SCREENS: { id: ScreenId; label: string; shortLabel: string; subtitle: string; icon: LucideIcon }[] = [
  { id: 'learn', label: 'Explore', shortLabel: 'Explore', subtitle: 'Wander the map and discover somewhere new.', icon: Compass },
  { id: 'learn-flags', label: 'Learn flags', shortLabel: 'Learn flags', subtitle: 'Country flags', icon: Flag },
  { id: 'identify', label: 'Name that country', shortLabel: 'Name it', subtitle: 'Pick a country, then see if you can name it.', icon: Search },
  { id: 'find-countries', label: 'Find 10 countries', shortLabel: 'Find 10', subtitle: 'Find each country on the map. You’ve got this!', icon: MapIcon },
  { id: 'find-flags', label: 'Flag finder', shortLabel: 'Flags', subtitle: 'Can you match these flags to their home countries?', icon: Globe2 },
  { id: 'flag-challenge', label: 'Flag challenge', shortLabel: 'Challenge', subtitle: 'One flag. One map. How many can you get right?', icon: HelpCircle },
]

type AppLayoutProps = {
  screen: ScreenId
  onNavigate: (screen: ScreenId) => void
  children: ReactNode
}

// Layout receives the active screen but does not own game state. The workspace
// is supplied through children so screen content can change without duplicating navigation.
export default function AppLayout({ screen, onNavigate, children }: AppLayoutProps) {
  const activeScreen = SCREENS.find((item) => item.id === screen) ?? SCREENS[0]
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); onNavigate('learn') }}>
          <span className="brand-mark"><Globe2 size={21} strokeWidth={2.3} /></span>
          <span>Country<span className="brand-dot">Quest</span></span>
        </a>
        <div className="topbar-right">
          <div className="streak-pill"><Sparkles size={15} /> <span>Little steps, big world</span></div>
          <button className="avatar-button" type="button" aria-label="Your profile">AK</button>
        </div>
      </header>
      <div className="page-layout">
        <aside className="sidebar">
          <div className="sidebar-label">YOUR CLASSROOM</div>
          <nav className="main-nav" aria-label="Main navigation">
            {SCREENS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item${screen === item.id ? ' is-active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={screen === item.id ? 'page' : undefined}
                >
                  <span className="nav-icon"><Icon size={18} /></span>
                  <span className="nav-label-full">{item.label}</span>
                  <span className="nav-label-short">{item.shortLabel}</span>
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
              <p className="page-subtitle">{activeScreen.subtitle}</p>
            </div>
            <div className="heading-badge"><span>✦</span> Made for curious minds</div>
          </div>
          {children}
          <footer className="page-footer">
            <span>Made for the joy of knowing our world <span className="footer-heart">♥</span></span>
            <span className="footer-right">No ads, just adventures <span>✦</span></span>
          </footer>
        </section>
      </div>
    </main>
  )
}