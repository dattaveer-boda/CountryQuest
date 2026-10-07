# CountryQuest

CountryQuest is a responsive geography app for exploring an interactive world map and practicing country and flag recognition.

## Run locally

```sh
npm install
npm run dev
```

For a production build and local type-check:

```sh
npm run build
npm run preview
```

## Screens

- **Explore** — pan and zoom around the unlabeled political map with pointer-centered scroll and double-click zoom. Choose Whole world or a continent to focus the map, then select a country to see its flag, continent, ISO code, capital, currencies, official languages, and famous monuments and landmarks. Reset restores the selected continent's starting view. Landmark examples are curated; countries without an entry display an explicit fallback.
- **Name that country** — select a country, search its name in the filterable list, and submit a guess. The answer is revealed only after submission.
- **Find 10 countries** — locate each listed country on the map.
- **Flag finder** — match ten mystery flags to countries on the map.
- **Flag challenge** — identify one flag at a time.

The shared map and country quiz pool use the bundled Natural Earth dataset from [`world-atlas`](https://www.npmjs.com/package/world-atlas); country names and ISO code conversion come from [`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries). The app makes no paid map API requests.

Country facts come from the bundled [`world-countries`](https://www.npmjs.com/package/world-countries) dataset. Countries with multiple capitals, currencies, or languages show all available entries. All quizzes continue to use the whole world regardless of the Explore filter.
