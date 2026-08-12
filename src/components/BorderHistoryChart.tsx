import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js'
import {
  POCOCHA_RANKS,
  type BorderData,
  type PocochaRank,
} from '../data/borderData.ts'
import styles from './BorderHistoryChart.module.css'

interface BorderHistoryChartProps {
  data: BorderData
}

const pointFormatter = new Intl.NumberFormat('ja-JP')
const axisFormatter = new Intl.NumberFormat('ja-JP', { notation: 'compact' })
const shortDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  timeZone: 'Asia/Tokyo',
})

const series = [
  { key: 'border_zero', label: '±0ボーダー', color: '#74e8ff' },
  { key: 'border_plus_1', label: '+1ボーダー', color: '#9b8cff' },
  { key: 'border_plus_2', label: '+2ボーダー', color: '#ffb65c' },
] as const

function observationLabel(targetDate: string, closeTime: string): string {
  const date = shortDateFormatter.format(new Date(`${targetDate}T00:00:00+09:00`))
  return `${date} ${closeTime}`
}

export function BorderHistoryChart({ data }: BorderHistoryChartProps) {
  const [selectedRank, setSelectedRank] = useState<PocochaRank>(POCOCHA_RANKS[0])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rankIndex = POCOCHA_RANKS.indexOf(selectedRank)
  const rows = useMemo(
    () =>
      data.observations.map((observation) => ({
        targetDate: observation.target_date,
        closeTime: observation.close_time,
        values: observation.ranks[rankIndex]!,
      })),
    [data.observations, rankIndex],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: rows.map((row) => observationLabel(row.targetDate, row.closeTime)),
        datasets: series.map(({ key, label, color }) => ({
          label,
          data: rows.map((row) => row.values[key]),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointBackgroundColor: '#071322',
          pointBorderColor: color,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.28,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y
                return value === null
                  ? (context.dataset.label ?? '')
                  : `${context.dataset.label ?? ''}: ${pointFormatter.format(value)} pt`
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(121, 161, 190, 0.10)' },
            ticks: { color: '#8fa8ba', maxRotation: 0 },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(121, 161, 190, 0.14)' },
            ticks: {
              color: '#8fa8ba',
              callback: (value) => axisFormatter.format(Number(value)),
            },
          },
        },
      },
    }

    const chart = new Chart(canvas, config)
    return () => chart.destroy()
  }, [rows])

  return (
    <section className={styles.section} aria-labelledby="history-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>BORDER HISTORY</p>
          <h2 id="history-heading">ボーダー履歴</h2>
          <p>検証済みの観測値を、締め時刻ごとに表示します。</p>
        </div>
        <label className={styles.rankSelector}>
          <span>表示するランク</span>
          <select
            value={selectedRank}
            onChange={(event) => setSelectedRank(event.target.value as PocochaRank)}
          >
            {POCOCHA_RANKS.map((rank) => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.seriesLegend} aria-label="グラフの系列">
        {series.map(({ key, label, color }) => (
          <span key={key}>
            <i style={{ '--series-color': color } as CSSProperties} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
      <div className={styles.chartFrame}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${selectedRank}ランクのボーダー履歴グラフ`}
          aria-describedby="history-table-note"
        />
      </div>

      <p className={styles.tableNote} id="history-table-note">
        グラフと同じ値を、次の一覧でも確認できます。単位は応援ポイントです。
      </p>
      <div className={styles.tableScroll}>
        <table>
          <caption>{selectedRank}ランクの観測値</caption>
          <thead>
            <tr>
              <th scope="col">対象日</th>
              <th scope="col">締め時刻</th>
              {series.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.targetDate}-${row.closeTime}`}>
                <td>{row.targetDate}</td>
                <td>{row.closeTime}</td>
                {series.map(({ key }) => (
                  <td key={key}>{pointFormatter.format(row.values[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
