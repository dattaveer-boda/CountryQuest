import countries from 'world-countries'

export type CountryStatus = {
  kind: 'member' | 'observer' | 'territory' | 'associated' | 'disputed' | 'other'
  label: string
  detail: string
}

const unMembers = new Set(countries.filter((country) => country.unMember && country.cca3 !== 'VAT').map((country) => country.cca3))

const TERRITORY_RELATIONSHIPS: Record<string, string> = {
  ABW: 'Constituent country of the Kingdom of the Netherlands',
  AIA: 'UK overseas territory',
  ALA: 'Autonomous region of Finland',
  ASM: 'US territory',
  ATF: 'French overseas territory',
  BLM: 'French overseas collectivity',
  BMU: 'UK overseas territory',
  CUW: 'Constituent country of the Kingdom of the Netherlands',
  CYM: 'UK overseas territory',
  FRO: 'Self-governing territory of the Kingdom of Denmark',
  GGY: 'British Crown dependency; not part of the UK',
  GRL: 'Self-governing territory of the Kingdom of Denmark',
  GUM: 'US territory',
  HKG: 'Special administrative region of China',
  HMD: 'Australian external territory',
  IMN: 'British Crown dependency; not part of the UK',
  JEY: 'British Crown dependency; not part of the UK',
  MAC: 'Special administrative region of China',
  MAF: 'French overseas collectivity',
  MNP: 'US commonwealth',
  MSR: 'UK overseas territory',
  NCL: 'French territory with special status',
  NFK: 'Australian external territory',
  PCN: 'UK overseas territory',
  PRI: 'US commonwealth',
  PYF: 'French overseas collectivity',
  SHN: 'UK overseas territory',
  SPM: 'French overseas collectivity',
  SXM: 'Constituent country of the Kingdom of the Netherlands',
  TCA: 'UK overseas territory',
  VGB: 'UK overseas territory',
  VIR: 'US territory',
  WLF: 'French overseas collectivity',
}

const SPECIAL_STATUSES: Record<string, CountryStatus> = {
  VAT: { kind: 'observer', label: 'UN observer state', detail: 'The Holy See holds UN observer status; Vatican City is its territorial state' },
  PSE: { kind: 'observer', label: 'UN observer state', detail: 'State of Palestine; not a UN member' },
  COK: { kind: 'associated', label: 'Associated state', detail: 'Self-governing; free association with New Zealand' },
  NIU: { kind: 'associated', label: 'Associated state', detail: 'Self-governing; free association with New Zealand' },
  TWN: { kind: 'disputed', label: 'Disputed status', detail: 'Self-governing; claimed by China; not a UN member' },
  ESH: { kind: 'disputed', label: 'Disputed territory', detail: 'UN non-self-governing territory; competing claims by Morocco and the Polisario Front' },
  FLK: { kind: 'disputed', label: 'Disputed territory', detail: 'UK-administered; also claimed by Argentina' },
  SGS: { kind: 'disputed', label: 'Disputed territory', detail: 'UK-administered; also claimed by Argentina' },
  IOT: { kind: 'disputed', label: 'Special sovereignty status', detail: 'Chagos Archipelago; subject to UK-Mauritius sovereignty arrangements' },
  ATA: { kind: 'other', label: 'Antarctic region', detail: 'Not a country; governed under the Antarctic Treaty system' },
}

export function getCountryStatus(code: string): CountryStatus {
  if (SPECIAL_STATUSES[code]) return SPECIAL_STATUSES[code]
  if (unMembers.has(code)) return { kind: 'member', label: 'UN member state', detail: 'One of the 193 UN member states' }
  if (TERRITORY_RELATIONSHIPS[code]) return { kind: 'territory', label: 'Territory / special region', detail: TERRITORY_RELATIONSHIPS[code] }
  return { kind: 'other', label: 'Other entity', detail: 'Not a UN member or observer state' }
}