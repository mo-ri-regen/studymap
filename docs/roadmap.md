# StudyMap 開発の手順

最終更新: 2026-10-31

「計算 → データ保存 → 画面」の順に、小さく作っては公開していく。手順1つにつき、プルリクエストを1つ出す。

各手順の詳しい内容と完了の条件は、GitHub の Issue（マイルストーン「MVP」）に書いている。

## 手順

| 段階                                | 手順 | やること                                                       | できあがるもの                          | Issue                                                    |
| ----------------------------------- | ---- | -------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| 1. 土台づくり                       | ①    | Next.js・TypeScript・Tailwind でプロジェクトを作る             | 「Hello」と表示されるだけのアプリ       | [#2](https://github.com/mo-ri-regen/studymap/issues/2)   |
|                                     | ②    | テスト（Vitest・Playwright）とコードチェックを使えるようにする | テストを実行する仕組み                  | [#3](https://github.com/mo-ri-regen/studymap/issues/3)   |
|                                     | ③    | CI と Vercel での公開を設定する                                | プルリクエストごとの自動テストと公開URL | [#4](https://github.com/mo-ri-regen/studymap/issues/4)   |
| 2. 計算部分（画面なし・テスト中心） | ④    | 勉強できる日の数え方（曜日・休み・予備日）                     | 計算の部品とテスト                      | [#5](https://github.com/mo-ri-regen/studymap/issues/5)   |
|                                     | ⑤    | 計画の計算（モードA・B、余りの配り方）                         | 同上                                    | [#6](https://github.com/mo-ri-regen/studymap/issues/6)   |
|                                     | ⑥    | 立て直しの計算（遅れたら増やし、進んでも減らさない）           | 同上                                    | [#7](https://github.com/mo-ri-regen/studymap/issues/7)   |
|                                     | ⑦    | 入力チェックのルール                                           | 同上                                    | [#8](https://github.com/mo-ri-regen/studymap/issues/8)   |
| 3. データ保存                       | ⑧    | ブラウザへの保存、書き出し・読み込み、サンプルデータ           | 保存の仕組みとテスト                    | [#9](https://github.com/mo-ri-regen/studymap/issues/9)   |
| 4. 画面設計                         | ⑨    | 画面のラフと、色・雰囲気を決める                               | 画面のラフ（コードなし）                | [#10](https://github.com/mo-ri-regen/studymap/issues/10) |
| 5. 画面づくり                       | ⑩    | 計画の作成画面と計算結果の画面                                 | 計画を作れる                            | [#11](https://github.com/mo-ri-regen/studymap/issues/11) |
|                                     | ⑪    | トップ画面と記録画面                                           | 毎日の記録ができる                      | [#12](https://github.com/mo-ri-regen/studymap/issues/12) |
|                                     | ⑫    | 進捗グラフ・設定画面・完了画面                                 | 最初のバージョンの機能がそろう          | [#13](https://github.com/mo-ri-regen/studymap/issues/13) |
| 6. 仕上げ                           | ⑬    | 画面操作の自動テストと品質チェック（Lighthouse）               | 品質の確認                              | [#14](https://github.com/mo-ri-regen/studymap/issues/14) |
|                                     | ⑭    | README を書く                                                  | ポートフォリオとして見せられる状態      | [#15](https://github.com/mo-ri-regen/studymap/issues/15) |

## この順番にした理由

- **計算部分を先に作る**: いちばん間違えやすく大事な部分なので、画面がない段階でテストを使って正しさを確かめる
- **公開の設定を最初にする**: 後から設定するとつまずいたときに原因を探しにくい。最初に公開URLがあれば途中でも見せられる
- **画面設計は画面づくりの直前にする**: 計算と保存を作る間に、画面に出す内容がはっきりする。⑨は②〜⑧と同時に進めてもよい

## 作業のルール

- 手順ごとにブランチを作り、プルリクエストで main にまとめる
- プルリクエストの説明に `Closes #番号` を書き、取り込んだときに Issue が閉じるようにする
