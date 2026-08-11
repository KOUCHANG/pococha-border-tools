import { describe, expect, it, vi } from 'vitest'
import { loadBorderData, parseBorderData, POCOCHA_RANKS } from './borderData.ts'

function validData() {
  return {
    schema_version: '1.0.0',
    dataset_kind: 'pococha_border_history',
    generated_at: '2026-08-11T19:46:18+09:00',
    source: {
      name: 'LIVER CAMPUS Pocochaランクボーダー早見表',
      url: 'https://one-carat.com/campus/archives/category/streamer-tips/pococha-rank-border',
    },
    unit: 'support_point',
    observations: [
      {
        target_date: '2026-08-09',
        close_time: '24:00',
        ranks: POCOCHA_RANKS.map((rank, index) => ({
          rank,
          border_zero: index * 100,
          border_plus_1: index * 100 + 100,
          border_plus_2: index * 100 + 200,
        })),
      },
    ],
  }
}

describe('parseBorderData', () => {
  it('accepts a complete validated public dataset', () => {
    expect(parseBorderData(validData()).observations).toHaveLength(1)
  })

  it('rejects a missing rank instead of filling it', () => {
    const input = validData()
    input.observations[0]!.ranks.pop()

    expect(() => parseBorderData(input)).toThrow('invalid')
  })

  it('rejects border values with an invalid order', () => {
    const input = validData()
    input.observations[0]!.ranks[0]!.border_plus_1 = -1

    expect(() => parseBorderData(input)).toThrow('invalid')
  })
})
describe('loadBorderData', () => {
  it('uses the configured base path and returns validated data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(validData()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(loadBorderData({ fetcher, baseUrl: '/pococha-border-tools/' })).resolves.toMatchObject({
      schema_version: '1.0.0',
    })
    expect(fetcher).toHaveBeenCalledWith(
      '/pococha-border-tools/border-data.json',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('rejects an unsuccessful response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }))

    await expect(loadBorderData({ fetcher, baseUrl: '/' })).rejects.toThrow('request failed')
  })
})
