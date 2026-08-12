import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { POCOCHA_RANKS, type BorderObservation } from '../data/borderData.ts'
import { calculateRequiredFireworks } from '../domain/fireworkCalculation.ts'
import { FireworkCalculator } from './FireworkCalculator.tsx'

const observation: BorderObservation = {
  target_date: '2026-08-09',
  close_time: '24:00',
  ranks: POCOCHA_RANKS.map((rank, index) => ({
    rank,
    border_zero: 10_000 + index * 1_000,
    border_plus_1: 20_000 + index * 1_000,
    border_plus_2: 30_000 + index * 1_000,
  })),
}

afterEach(cleanup)

describe('calculateRequiredFireworks', () => {
  it('rounds a partial firework up and returns zero after reaching the target', () => {
    expect(calculateRequiredFireworks(1_999, 10_000)).toEqual({
      remainingPoints: 8_001,
      requiredFireworks: 3,
    })
    expect(calculateRequiredFireworks(10_000, 10_000)).toEqual({
      remainingPoints: 0,
      requiredFireworks: 0,
    })
    expect(calculateRequiredFireworks(12_000, 10_000)).toEqual({
      remainingPoints: 0,
      requiredFireworks: 0,
    })
  })

  it('rejects invalid point values', () => {
    expect(() => calculateRequiredFireworks(-1, 10_000)).toThrow()
    expect(() => calculateRequiredFireworks(1.5, 10_000)).toThrow()
  })
})

describe('FireworkCalculator', () => {
  it('uses all ranks, a selected border, and the manually entered current value', () => {
    render(<FireworkCalculator observation={observation} />)

    expect(screen.getByRole('combobox', { name: 'ランク' })).toHaveTextContent('S6')
    fireEvent.change(screen.getByRole('combobox', { name: 'ランク' }), {
      target: { value: 'S6' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: '目標ボーダー' }), {
      target: { value: 'border_plus_2' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: '現在の応援ポイント' }), {
      target: { value: '35000' },
    })

    expect(screen.getByText('47,000')).toBeInTheDocument()
    expect(screen.getByText('12,000')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/4,000ポイント/)).toHaveTextContent('結果は目安')
  })
})
