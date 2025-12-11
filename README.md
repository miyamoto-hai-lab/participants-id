# participants-id
クラウドソーシング実験向けの参加者ID管理ライブラリです。

同一ドメイン内であれば、LocalStorageやそれに類するストレージ機能を利用して、参加者ごとに（正確にはブラウザごとに）一意のIDを永続的に保持・管理します。

このリポジトリは、異なるフロントエンド技術（JavaScript / TypeScript, Flutter, Fletなど）に対応するため、各環境向けのライブラリを個別に提供します。


## 目的
- 複数の実験ページを跨いで同一の参加者を識別する。
- 実験参加者がブラウザをリロード・再アクセスしても同じIDを保持し続ける。
- サーバーサイドでの参加資格チェック（2回目参加の防止など）の基盤を提供する。


## 対応環境
| 環境 | 言語 | 格納ディレクトリ | 使用技術/パッケージ |
| --- | --- | --- | --- |
| Web (Vanilla JS, Next.js, React, Vue, Svelte) | JavaScript / TypeScript | [js-ts/](js-ts/) | LocalStorage API |
| Flutter (Mobile, Web, Desktop) | Dart | [flutter/](flutter/) | shared_preferences パッケージ |
| Flet (Web, Desktop, Mobile) | Python | [flet/](flet/) | page.client_storage |

## 使い方
各環境のディレクトリ内に、詳細な導入手順と使用例を記載した `README.md` があります。

### Web向けライブラリ (JS/TS)
主に localStorage を使用します。[Next.js](https://nextjs.org/)や各種モダンフレームワークでの利用方法を記載しています。

### Flutter向けライブラリ
主に [shared_preferences](https://pub.dev/packages/shared_preferences) パッケージを使用します。

### Flet向けライブラリ
主に [Client Storage](https://flet.dev/docs/cookbook/client-storage/) を使用します。


## 仕様
ブラウザの[ローカルストレージ](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage)に以下のような情報を保存します。

| キー | 値の例 | 説明 |
| --- | --- | --- |
| participant_id.browser_id | 019ad3fd-8a80-7c0f-b719-ee5d8c6d6cf6 | ブラウザを識別する固有のID(UUID v7) |
| participant_id.created_at | 2025-11-30T09:00:00.000Z | browser_idの作成日時(ISO 8601形式のUTCタイムスタンプ) |
| participant_id.updated_at | 2025-11-30T09:00:00.000Z | browser_idの最終更新日時(ISO 8601形式のUTCタイムスタンプ) |
| participant_id.attributes.<app_name>.\<field\> | 保存可能な任意の値 | 被験者の属性データなど任意の値をアプリケーション側で保存できます。 |

- ローカルストレージ上でのキーの衝突を避けるため，全てのキーにはprefix `participant_id` が付与されます。
- 被験者の属性データの保存では，アプリケーション同士のキー名の衝突を避けるため，prefixに加えてアプリケーション名も付与されます。
