import { useEffect, useState } from 'react'
import {
  loadBorderData,
  type BorderData,
  type BorderObservation,
} from './data/borderData.ts'
import { BorderHistoryChart } from './components/BorderHistoryChart.tsx'
import styles from './App.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: BorderData; latest: BorderObservation }
  | { status: 'error' }

const numberFormatter = new Intl.NumberFormat('ja-JP')
const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function latestObservation(data: BorderData): BorderObservation {
  const latest = data.observations.at(-1)
  if (latest === undefined) {
    throw new Error('Validated data has no observations')
  }
  return latest
}
function DataStatus({ state }: { state: LoadState }) {
  if (state.status === 'loading') {
    return (
      <p className={styles.loading} role="status">
        検証済みデータを読み込んでいます…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.error} role="alert">
        <strong>データを表示できませんでした</strong>
        <span>不明な値で補完せず、表示を停止しています。</span>
      </div>
    )
  }

  const generatedAt = new Date(state.data.generated_at)

  return (
    <div className={styles.statusGrid} aria-label="公開データの状態">
      <div>
        <span className={styles.eyebrow}>最新の観測</span>
        <strong>{dateFormatter.format(new Date(`${state.latest.target_date}T00:00:00+09:00`))}</strong>
        <small>締め時刻 {state.latest.close_time}</small>
      </div>
      <div>
        <span className={styles.eyebrow}>収録ランク</span>
        <strong>{numberFormatter.format(state.latest.ranks.length)}段階</strong>
        <small>検証済みの公開値のみ</small>
      </div>
      <div>
        <span className={styles.eyebrow}>データ生成</span>
        <strong>{dateFormatter.format(generatedAt)}</strong>
        <small>{state.data.source.name}</small>
      </div>
    </div>
  )
}

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    void loadBorderData({ signal: controller.signal })
      .then((data) => {
        setState({ status: 'ready', data, latest: latestObservation(data) })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setState({ status: 'error' })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Pococha Border Tools トップ">
          <span aria-hidden="true">PB</span>
          <strong>Pococha Border Tools</strong>
        </a>
        <span className={styles.badge}>FOUNDATION / MVP</span>
      </header>

      <main id="top">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>STREAM DECISION SUPPORT</p>
            <h1 id="hero-title">配信判断を、<br />根拠の見える数字で。</h1>
            <p className={styles.lead}>
              検証済みのランクボーダーデータを、安全に見やすく届けるための小規模ツールです。
            </p>
          </div>
          <div className={styles.orbit} aria-hidden="true">
            <span />
            <span />
            <span />
            <b>DATA<br />READY</b>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="data-heading">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>VALIDATED DATA CHANNEL</p>
              <h2 id="data-heading">公開データ接続状態</h2>
            </div>
            <span className={state.status === 'ready' ? styles.online : styles.pending}>
              {state.status === 'ready' ? 'VERIFIED' : 'CHECKING'}
            </span>
          </div>
          <DataStatus state={state} />
        </section>

        {state.status === 'ready' && <BorderHistoryChart data={state.data} />}

        <section className={styles.features} aria-labelledby="features-heading">
          <div className={styles.sectionIntro}>
            <p className={styles.kicker}>NEXT MODULES</p>
            <h2 id="features-heading">次に追加する機能</h2>
          </div>
          <article className={styles.featureCard}>
            <span>01</span>
            <h3>ボーダーまでの花火数</h3>
            <p>現在値と目標ボーダーから、必要な花火数の目安を手早く計算できるようにします。</p>
            <small>計算機能は次のステップ</small>
          </article>
          <article className={styles.featureCard}>
            <span>02</span>
            <h3>参考予測</h3>
            <p>履歴が十分に蓄積された段階で、予測範囲と過去の評価を分かりやすく表示します。</p>
            <small>データ蓄積後に実装</small>
          </article>
        </section>

        <aside className={styles.safetyNote}>
          <strong>DATA SAFETY</strong>
          <p>検証できないデータは推測で補いません。読み込みに失敗した場合は、値を表示せず停止します。</p>
        </aside>
      </main>

      <footer className={styles.footer}>
        <span>Pococha Border Tools</span>
        <p className={styles.analyticsNotice}>
          アクセス状況の把握に、Cookieを使用しないCloudflare Web Analyticsを利用しています。
        </p>
        <span>Small, verifiable, replaceable.</span>
      </footer>
    </div>
  )
}
