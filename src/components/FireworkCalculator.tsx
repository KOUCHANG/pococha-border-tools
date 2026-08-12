import { useMemo, useState } from 'react'
import {
  POCOCHA_RANKS,
  type BorderObservation,
  type PocochaRank,
} from '../data/borderData.ts'
import { calculateRequiredFireworks } from '../domain/fireworkCalculation.ts'
import styles from './FireworkCalculator.module.css'

type BorderKey = 'border_zero' | 'border_plus_1' | 'border_plus_2'

const borderOptions: ReadonlyArray<{ value: BorderKey; label: string }> = [
  { value: 'border_zero', label: '±0ボーダー' },
  { value: 'border_plus_1', label: '+1ボーダー' },
  { value: 'border_plus_2', label: '+2ボーダー' },
]

const pointFormatter = new Intl.NumberFormat('ja-JP')

interface FireworkCalculatorProps {
  observation: BorderObservation
}

export function FireworkCalculator({ observation }: FireworkCalculatorProps) {
  const [selectedRank, setSelectedRank] = useState<PocochaRank>(POCOCHA_RANKS[0])
  const [selectedBorder, setSelectedBorder] = useState<BorderKey>('border_zero')
  const [currentInput, setCurrentInput] = useState('')
  const rankIndex = POCOCHA_RANKS.indexOf(selectedRank)
  const targetPoints = observation.ranks[rankIndex]![selectedBorder]
  const currentPoints = Number(currentInput)
  const hasInput = currentInput.trim().length > 0
  const isValidInput = hasInput && Number.isSafeInteger(currentPoints) && currentPoints >= 0
  const result = useMemo(
    () => isValidInput ? calculateRequiredFireworks(currentPoints, targetPoints) : null,
    [currentPoints, isValidInput, targetPoints],
  )

  return (
    <section className={styles.section} aria-labelledby="firework-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>FIREWORK ESTIMATOR</p>
          <h2 id="firework-heading">ボーダーまでの花火数</h2>
          <p>最新の検証済みボーダーまで、花火がいくつ必要かを計算します。</p>
        </div>
        <div className={styles.observation}>
          <span>使用する観測値</span>
          <strong>{observation.target_date}</strong>
          <small>締め時刻 {observation.close_time}</small>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.formGrid}>
          <label>
            <span>ランク</span>
            <select
              value={selectedRank}
              onChange={(event) => setSelectedRank(event.target.value as PocochaRank)}
            >
              {POCOCHA_RANKS.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </label>

          <label>
            <span>目標ボーダー</span>
            <select
              value={selectedBorder}
              onChange={(event) => setSelectedBorder(event.target.value as BorderKey)}
            >
              {borderOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.currentInput}>
            <span>現在の応援ポイント</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="例: 120000"
              value={currentInput}
              onChange={(event) => setCurrentInput(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.target}>
          <span>{selectedRank}・{borderOptions.find((option) => option.value === selectedBorder)!.label}</span>
          <strong>{pointFormatter.format(targetPoints)}</strong>
          <small>目標応援ポイント</small>
        </div>

        <div className={styles.result} aria-live="polite">
          {!hasInput && <p>現在の応援ポイントを入力すると結果を表示します。</p>}
          {hasInput && !isValidInput && (
            <p className={styles.inputError} role="alert">0以上の整数を入力してください。</p>
          )}
          {result !== null && (
            <>
              <div>
                <span>ボーダーまで</span>
                <strong>{pointFormatter.format(result.remainingPoints)}<small> ポイント</small></strong>
              </div>
              <div className={styles.fireworkCount}>
                <span>必要な花火数（目安）</span>
                <strong>{pointFormatter.format(result.requiredFireworks)}<small> 個</small></strong>
              </div>
              {result.requiredFireworks === 0 && <p>現在値は選択した目標に到達しています。</p>}
            </>
          )}
        </div>

        <p className={styles.note}>
          花火1個＝4,000ポイントとして端数を切り上げます。実際の増加量は状況により変動するため、結果は目安です。
        </p>
      </div>
    </section>
  )
}
