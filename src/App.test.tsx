import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'
import { POCOCHA_RANKS } from './data/borderData.ts'

const validResponse = {
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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('shows validated data status after loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(validResponse), { status: 200 }),
      ),
    )

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('読み込んでいます')
    await waitFor(() => expect(screen.getByText('VERIFIED')).toBeInTheDocument())
    expect(screen.getByText('18段階')).toBeInTheDocument()
    expect(screen.getByText(/Cloudflare Web Analytics/)).toHaveTextContent('Cookieを使用しない')
  })

  it('fails closed without rendering guessed values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('{"invalid":true}', { status: 200 })),
    )

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('不明な値で補完せず')
    expect(screen.queryByText('18段階')).not.toBeInTheDocument()
  })
})
