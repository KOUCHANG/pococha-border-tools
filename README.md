# Pococha Border Tools

Pococha配信者向けの小規模な支援サイトです。現在は実装準備中です。

## MVPで予定している機能

- ランクボーダーの履歴表示とグラフ化
- ボーダーまでに必要な花火数を求める計算ツール
- 根拠と不確実性を示した参考予測（ベータ）

## 公開方針

このリポジトリには、GitHub Pagesで公開してよいフロントエンドと、検証済みの公開用データだけを置きます。取得処理、内部運用資料、質問台帳、非公開の設計判断は含めません。

公開用データは、構文・範囲・時系列整合性などの検証に合格した場合だけ更新します。検証できない値を推測して公開することはしません。

アクセス状況の把握には、Cookieを使用せず個人を追跡しないCloudflare Web Analyticsを利用します。

## 技術構成

- React / TypeScript（strict）/ Vite
- Chart.js
- CSS Modules
- Vitest / Testing Library / ESLint

## ローカル確認

Node.js 24 LTSとnpmを使用します。

```powershell
npm install
npm run check
npm run dev
```

`npm run check` はlint、型検査、テスト、production buildを順番に実行します。

## 現在の状態

静的MVPのフロントエンド基盤と、公開JSONを推測なしで検証する読み込み境界を準備しています。GitHub PagesとCloudflare Web Analyticsを有効化しています。

