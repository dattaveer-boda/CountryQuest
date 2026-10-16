# CountryQuest

A responsive geography app for exploring countries and practicing country and flag recognition. It is a client-side React application: there is no backend, login service, database, or paid map API.

## Run Locally

Use Node.js 22.12 or newer on a supported release line, and npm. Node.js 24 LTS is a suitable choice.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. If your terminal rejects forwarded npm arguments, launch Vite directly:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot updates. |
| `npx tsc -b` | Check TypeScript types without building the app. |
| `npm run lint` | Check source code with Oxlint. |
| `npm run test:map-colors` | Check shared-border coloring, stable assignments, multipart countries, and palette expansion. |
| `npm run build` | Type-check, then create a production bundle in `dist`. |
| `npm run preview` | Serve the existing production build locally; run build first. |

Scores, selections, and preferences are stored in React memory. Reloading the page resets them.

## Screens

- **Explore:** choose Whole world or a continent, pan, zoom, and select a country to see its flag, continents, ISO code, capitals, currencies, languages, and landmark examples. Country names default to Off; turn them On to add decluttered labels. Reset restores the current continent's starting view.
- **Learn flags:** browse an alphabetically sorted flag gallery. Combine continent, first-letter, and country-name search filters; transcontinental countries appear under both continents. Hide country names for recall practice, select a flag to reveal its details, or open the flag challenge with Practice flags. Escape, the close button, or the backdrop closes details. Clear filters restores the complete gallery without changing the hide-names preference.
- **Name that country:** select a country, search for a name, and submit a guess. The result and country name are revealed after submission.
- **Find 10 countries:** locate ten listed countries. Each correct map selection advances progress.
- **Flag finder:** match ten flags to map countries. Reveal shows a name, highlights the country, and focuses a location marker without awarding a match. Show on map returns to a revealed or matched location.
- **Flag challenge:** identify one flag at a time; correct and incorrect answers update the score. Skipping advances without grading.

All quizzes use the whole world and hide Explore labels, regardless of Explore preferences.

## Libraries And Why

### Application Libraries

| Library | Role in this app | Why use it? |
| --- | --- | --- |
| [React](https://react.dev/) | Components, state, effects, and conditional rendering. | Keeps map selection, quiz state, and panels synchronized declaratively. |
| [React DOM](https://react.dev/reference/react-dom/client/createRoot) | Mounts React into the page. | Connects the component tree to the browser DOM. |
| [react-simple-maps](https://www.react-simple-maps.io/) | SVG map, country shapes, markers, projection context, and pan/zoom. | Provides React-friendly map primitives instead of hand-writing geographic rendering and gestures. |
| [topojson-client](https://www.npmjs.com/package/topojson-client) | Converts atlas geometry to GeoJSON and identifies shared boundary arcs. | Finds actual map neighbors, so base colors can differ across every shared border. |
| [d3-geo](https://d3js.org/d3-geo) | `geoArea`, `geoBounds`, and `geoCentroid`. | Proven geographic calculations for picking a landmass, positioning labels, and fitting revealed countries. |
| [world-atlas](https://www.npmjs.com/package/world-atlas) | Bundled Natural Earth country geometry at 50m resolution. | Supplies map boundaries without an external map service. TopoJSON shares boundary data to reduce duplication. |
| [geoBoundaries](https://www.geoboundaries.org/) | India ADM0 outline (CC0 1.0; sourced from Wikimedia Commons). | Replaces the simplified atlas outline with a detailed India boundary including Jammu and Kashmir and Ladakh. |
| [i18n-iso-countries](https://www.npmjs.com/package/i18n-iso-countries) | Numeric ISO IDs, alpha-3/alpha-2 conversions, and English names. | Connects the map's numeric IDs to country names, facts, and flags. |
| [@brixtol/country-continent](https://www.npmjs.com/package/@brixtol/country-continent) | Default continent lookup from alpha-2 codes. | Avoids maintaining a complete continent table ourselves. Explicit overrides cover transcontinental countries and Antarctica. |
| [world-countries](https://www.npmjs.com/package/world-countries) | Capitals, currencies, and languages. | Provides a bundled dataset so selecting a country does not need a live country API request. |
| [flag-icons](https://flagicons.lipis.dev/) | Flag assets and CSS classes such as `fi fi-in`. | Supplies recognizable flags without making our own images for each country. |
| [lucide-react](https://lucide.dev/guide/packages/lucide-react) | Icons for zoom, reset, navigation, reveal, and feedback. | Keeps controls visually consistent and uses reusable React icon components. |

### Development Tools

| Tool | Purpose |
| --- | --- |
| [TypeScript](https://www.typescriptlang.org/docs/) | Checks country models, component props, and callback signatures before runtime. Type-only imports are removed from JavaScript. |
| [Vite](https://vite.dev/guide/) | Development server, module handling, and production bundling. The atlas JSON is bundled into the app. |
| [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) | React integration and Fast Refresh during development. |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Finds code-quality issues, including questionable React patterns. |
| `@types/react`, `@types/react-dom`, `@types/d3-geo`, `@types/topojson-client`, `@types/topojson-specification`, `@types/node` | Type definitions for React, geographic and topology helpers, and Node-based tooling. These are development dependencies, not runtime libraries. |

## Project Guide

| File | Responsibility |
| --- | --- |
| [src/main.tsx](src/main.tsx) | Mounts React, enables Strict Mode, and imports global and flag styles. |
| [src/App.tsx](src/App.tsx) | Owns shared game state, navigation, grading, scores, rounds, reveals, and component composition. |
| [src/types/game.ts](src/types/game.ts) | Shared `Country`, `MapPosition`, `ScreenId`, `AnswerState`, `MapStatus`, and `Score` types. |
| [src/geography.ts](src/geography.ts) | Converts atlas features into countries; defines continent views and transcontinental memberships. |
| [src/mapColors.ts](src/mapColors.ts) | Builds country border adjacency, assigns stable base colors, and supplies the matching rendered GeoJSON. |
| [src/countryFacts.ts](src/countryFacts.ts) | Looks up bundled facts and locally curated landmark examples. |
| [src/components/AppLayout.tsx](src/components/AppLayout.tsx) | Header, navigation, screen headings, footer, and a `children` slot for the workspace. |
| [src/components/MapPanel.tsx](src/components/MapPanel.tsx) | Continent selector, name radios, map legend, and quiz-safe map options. |
| [src/components/WorldMap.tsx](src/components/WorldMap.tsx) | Map rendering, zoom controls, label decluttering, responsive markers, and the internal `MapCountries` component. |
| [src/components/CountryFlag.tsx](src/components/CountryFlag.tsx) | Shared flag rendering from a country's alpha-2 code. |
| [src/components/ExplorePanel.tsx](src/components/ExplorePanel.tsx) | Welcome content or details for the selected country. |
| [src/components/FlagLearningScreen.tsx](src/components/FlagLearningScreen.tsx) | Flag gallery, combined filters, optional hidden names, empty state, and a keyboard-accessible country-details dialog. |
| [src/components/IdentifyPanel.tsx](src/components/IdentifyPanel.tsx) | Controlled country search, guess selection, feedback, and score display. |
| [src/components/FinderPanel.tsx](src/components/FinderPanel.tsx) | Shared progress and round UI for country finder and flag finder. |
| [src/components/FlagChallengePanel.tsx](src/components/FlagChallengePanel.tsx) | Current flag, result, score, next, and skip controls. |
| [src/App.css](src/App.css) | Layout, component styles, flag sizes, and responsive breakpoints. |
| [src/index.css](src/index.css) | Global typography, page defaults, and focus styles. |
| [vite.config.ts](vite.config.ts) | Registers Vite's React plugin. |
| [tests/mapColors.test.mjs](tests/mapColors.test.mjs) | Node regression tests for country coloring using the actual atlas and a synthetic crowded graph. |

Start reading with the shared types, then geography conversion, then `App`, and finally one panel and the map. This separates the data model, game decisions, and rendering.

## How Data Flows

```text
Bundled atlas TopoJSON
	-> TopoJSON helpers extract shared borders and convert the atlas to GeoJSON
	-> mapColors assigns neighbor-safe base colors by country code
	-> Geographies prepares the rendered map features
	-> geography helpers normalize and deduplicate features into WORLD_COUNTRIES
	-> App and the map share that country pool, even when no map is mounted
	-> App creates rounds and supplies countries to the active screen

User clicks a country or a panel button
	-> a callback reaches App
	-> App updates state
	-> the map and active panel render the new state
```

The normalized `Country` is the common language between components. Numeric ISO code `356` identifies India in the map; alpha-3 `IND` identifies it in game state and facts; lowercase alpha-2 `in` selects its flag asset. Coordinates always use **[longitude, latitude]**, not the reverse.

### State, Props, And Callbacks

`App` is the single source of truth for state shared by the map and panels. A panel receives values through props and reports user actions through callbacks; it does not directly update its sibling map.

For example, `ExplorePanel` receives `country` and calls `onClose`. In `App`, closing changes `selectedCountry` to `null`, which updates both the map highlight and the panel. The same pattern connects a Reveal button to the map's focus position.

`AppLayout` uses React's `children` prop for composition: it provides the frame while `App` supplies the workspace. `FinderPanel` uses a typed `mode` prop to share common progress UI without sharing the two modes' different content.

`FlagLearningScreen` owns its own filters, hide-names preference, and dialog selection because those values are local to that screen. Leaving and returning resets these controls. Its gallery uses the same atlas-based country pool as the map, including some territories. Selecting a flag reuses `ExplorePanel` inside a native dialog rather than duplicating the country facts UI. Practice flags opens the existing whole-world flag challenge; learning filters do not alter quiz rounds.

### React Hooks In This Project

- `useState` stores values that change through interaction, such as the selected country or current round.
- `useMemo` derives country lookup maps, found-code membership, and map statuses. These values are not a second source of truth.
- `useCallback` keeps the country-loading callback stable across renders, which matters because it is a dependency of a map effect.
- `useEffect` handles synchronization: reporting loaded map data, observing SVG size, or scrolling a revealed location into view.
- `useRef` holds the actual SVG element for measurement and scrolling without putting a DOM node into game state.

Strict Mode can run effect setup and cleanup an extra time in development. The map's resize observer disconnects in its cleanup function.

### Map Details Worth Understanding

1. Atlas data can contain multiple shapes for the same country. We render every shape, but deduplicate quiz entries by alpha-3 code, retaining the largest feature's metadata.
2. A MultiPolygon can include distant islands. We calculate focus and labels from its largest polygon to avoid a misleading centroid.
3. D3 handles pointer-centered scroll and double-click zoom. `onMoveEnd` saves **both** geographic center and zoom; saving only zoom can cause recentering.
4. Country-name labels use approximate bounding boxes to suppress overlaps. Selected countries have priority, and more labels can appear as you zoom.
5. Label and marker sizes compensate for SVG resizing and zoom, so they stay readable instead of growing huge or becoming tiny.
6. A reveal updates `revealedCodes`, `selectedCountry`, `focusCountry`, and map position, but not `foundCodes`. A later correct selection overrides the revealed map color.
7. Base colors use a border-adjacency graph, not the atlas array index. The most constrained country is colored first, avoiding its neighbors' colors. All shapes of one country share a color, and continent filtering never changes that assignment. Selection, reveal, and correct/incorrect fills remain intentional status overrides.

## Small Code Examples

These examples are intended for TypeScript or TSX files directly inside `src`, where the relative imports below apply. They are learning snippets, not commands to paste into a shell.

### Convert A Map ID

```ts
import { getCountryCode } from './geography'

console.log(getCountryCode(356)) // 'IND'
console.log(getCountryCode(840)) // 'USA'
console.log(getCountryCode(undefined)) // undefined
```

Padding numeric IDs to three digits is important: Antarctica uses ISO numeric code `010`. Unknown or unmapped IDs are skipped instead of creating broken quiz entries.

### Look Up Country Facts

```ts
import { getCountryFacts } from './countryFacts'

const facts = getCountryFacts('IND')
console.log(facts.capitals) // 'New Delhi'
console.log(facts.currencies) // 'Indian rupee (INR)'
console.log(facts.monuments) // includes 'Taj Mahal'
```

### Render A Reusable Flag

```tsx
import CountryFlag from './components/CountryFlag'
import type { Country } from './types/game'

export function FlagPreview({ country }: { country: Country | null }) {
	if (!country) return null
	return <CountryFlag country={country} />
}
```

The `Country` comes from the map's normalized country pool. The global flag stylesheet is imported once by the entry point, not by every flag component.

### Connect A Panel To Parent State

```tsx
import { useState } from 'react'
import ExplorePanel from './components/ExplorePanel'
import type { Country } from './types/game'

export function ExploreExample({ country }: { country: Country }) {
	const [selected, setSelected] = useState<Country | null>(country)

	return (
		<ExplorePanel
			country={selected}
			onClose={() => setSelected(null)}
			onStartQuiz={() => console.log('Navigate to the quiz here')}
		/>
	)
}
```

This simplified example demonstrates values flowing down and events flowing up. In the real application, `onStartQuiz` calls `navigate('identify')`.

### Change A Continent's Starting View

Edit the existing entry in `CONTINENT_VIEWS` in the geography module:

```ts
Europe: { coordinates: [15, 54], zoom: 4 },
```

The coordinates choose the center, and zoom chooses magnification. Reset uses the same entry. Geographic continent membership is separate: for example, Russia uses `['Europe', 'Asia']`, and filtering checks `country.continents.includes(continent)` rather than comparing one string.

### Add A Landmark Example

Edit India's existing entry in `monumentsByCode` in the country facts module:

```ts
IND: ['Taj Mahal', 'Red Fort', 'Qutub Minar', 'Gateway of India', 'India Gate'],
```

Use alpha-3 codes as keys. Countries without curated entries display an explicit fallback instead of invented landmarks.

## Data Conventions And Limits

- Capitals, currencies, and languages are bundled package data, not live updates. Multiple entries are joined for display; missing values show `Not listed`.
- India's displayed national official languages are Hindi and English. This is not a complete list of regional official languages.
- Landmark names are curated locally and are not comprehensive.
- Russia, Turkey, Kazakhstan, Georgia, and Azerbaijan belong to Europe and Asia; Egypt to Africa and Asia; Indonesia to Asia and Oceania. This convention follows the Ural and Greater Caucasus boundaries and includes western New Guinea in Oceania. Other continent conventions can differ.
- Overseas dependencies do not add continent memberships to their parent country. A transcontinental country's whole shape is included in both filters; it is not clipped at a continent boundary.
- The quiz pool comes from recognized atlas features, including some territories. This is not a strict list of sovereign states, and tiny countries depend on atlas coverage.
- No paid map API is used. Map geometry, country facts, and flag assets are served as part of the app; the font stylesheet uses Google Fonts.

## Verify A Change

```sh
npm run build
npm run lint
npm run test:map-colors
```

The map-color regression tests use Node's built-in test runner and Vite to load the application's TypeScript. They check the real atlas's shared borders, reordered features, duplicate country shapes, and a graph requiring more than the initial six colors. There is no automated browser-test script in the package. After changing behavior, also check these workflows in a browser:

1. Select India in Explore and confirm facts and flag; select Russia in both Europe and Asia and confirm both continent names.
2. Toggle country names, zoom near a country, drag, and reset. Confirm labels remain usable and the view does not snap back.
3. Name a selected country correctly and incorrectly; verify feedback, scores, and the next attempt.
4. Complete a ten-country round and start another. Confirm new-round progress resets.
5. Reveal a flag, confirm its map marker and unchanged match count, then select the country and verify progress.
6. Answer and skip flag challenges. Confirm only graded attempts change the score.
7. Check a narrow mobile viewport for clipped flags, overlapping labels, and horizontal overflow.
8. In Learn flags, combine Asia, the letter I, and the search India. Confirm one result, hide its name, reveal details, and close with Escape. Search for a nonexistent name and use Clear filters. Confirm Russia appears with the letter R in both Europe and Asia.

## Learning Exercises

1. Add a curated monument to an existing country and inspect how the details panel renders it.
2. Adjust a continent view, then compare zooming and Reset behavior.
3. Follow a Reveal click from `FinderPanel` to `revealFlag` in `App`, then to the marker in `WorldMap`.
4. Change the shared `Country` type temporarily and run the type-check to see how TypeScript catches inconsistent component props.
5. Add a new screen only after tracing the full route: the `ScreenId` type, navigation metadata, App state/actions, and its panel component.
