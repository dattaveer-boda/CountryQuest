import type { Country } from '../types/game'

export default function CountryFlag({
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