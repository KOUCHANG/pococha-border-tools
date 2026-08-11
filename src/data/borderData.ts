export const POCOCHA_RANKS = [
  'D1',
  'D2',
  'D3',
  'C1',
  'C2',
  'C3',
  'B1',
  'B2',
  'B3',
  'A1',
  'A2',
  'A3',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
] as const

export type PocochaRank = (typeof POCOCHA_RANKS)[number]

export interface BorderRankValues {
  rank: PocochaRank
  border_zero: number
  border_plus_1: number
  border_plus_2: number
}

export interface BorderObservation {
  target_date: string
  close_time: '13:00' | '22:00' | '24:00'
  ranks: BorderRankValues[]
}

export interface BorderData {
  schema_version: '1.0.0'
  dataset_kind: 'pococha_border_history'
  generated_at: string
  source: {
    name: string
    url: string
  }
  unit: 'support_point'
  observations: BorderObservation[]
}

interface LoadBorderDataOptions {
  signal?: AbortSignal
  fetcher?: typeof fetch
  baseUrl?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isGeneratedAt(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))
}

function parseRank(value: unknown, expectedRank: PocochaRank): BorderRankValues {
  if (
    !isRecord(value) ||
    value.rank !== expectedRank ||
    !isNonNegativeInteger(value.border_zero) ||
    !isNonNegativeInteger(value.border_plus_1) ||
    !isNonNegativeInteger(value.border_plus_2) ||
    value.border_zero > value.border_plus_1 ||
    value.border_plus_1 > value.border_plus_2
  ) {
    throw new Error('Public border rank data is invalid')
  }

  return {
    rank: expectedRank,
    border_zero: value.border_zero,
    border_plus_1: value.border_plus_1,
    border_plus_2: value.border_plus_2,
  }
}

function parseObservation(value: unknown): BorderObservation {
  if (
    !isRecord(value) ||
    !isIsoDate(value.target_date) ||
    !['13:00', '22:00', '24:00'].includes(String(value.close_time)) ||
    !Array.isArray(value.ranks) ||
    value.ranks.length !== POCOCHA_RANKS.length
  ) {
    throw new Error('Public border observation is invalid')
  }

  return {
    target_date: value.target_date,
    close_time: value.close_time as BorderObservation['close_time'],
    ranks: value.ranks.map((rank, index) => parseRank(rank, POCOCHA_RANKS[index]!)),
  }
}

export function parseBorderData(value: unknown): BorderData {
  if (
    !isRecord(value) ||
    value.schema_version !== '1.0.0' ||
    value.dataset_kind !== 'pococha_border_history' ||
    !isGeneratedAt(value.generated_at) ||
    value.unit !== 'support_point' ||
    !isRecord(value.source) ||
    typeof value.source.name !== 'string' ||
    value.source.name.length === 0 ||
    typeof value.source.url !== 'string' ||
    !value.source.url.startsWith('https://one-carat.com/') ||
    !Array.isArray(value.observations) ||
    value.observations.length === 0
  ) {
    throw new Error('Public border dataset is invalid')
  }

  return {
    schema_version: '1.0.0',
    dataset_kind: 'pococha_border_history',
    generated_at: value.generated_at,
    source: {
      name: value.source.name,
      url: value.source.url,
    },
    unit: 'support_point',
    observations: value.observations.map(parseObservation),
  }
}

export async function loadBorderData(options: LoadBorderDataOptions = {}): Promise<BorderData> {
  const fetcher = options.fetcher ?? fetch
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL
  const response = await fetcher(`${baseUrl}border-data.json`, {
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Public border data request failed')
  }

  return parseBorderData(await response.json())
}
