# participant-id
学術実験・クラウドソーシング実験向けの参加者ID管理ライブラリです。
このリポジトリは、異なるフロントエンド技術（JavaScript/TypeScript, Flutter/Dart, Flet/Pythonなど）に対応するため、各環境向けのライブラリを個別に提供します。同一ドメイン内であれば、LocalStorageやそれに類するストレージ機能を利用して、参加者ごとに一意のIDを永続的に保持・管理します。

## 目的
- 複数の実験ページを跨いで同一の参加者を識別する。
- 実験参加者がブラウザをリロード・再アクセスしても同じIDを保持し続ける。
- サーバーサイドでの参加資格チェック（2回目参加の防止など）の基盤を提供する。

## 対応環境
| 環境 | 言語 | 格納ディレクトリ | 使用技術/パッケージ |
| --- | --- | --- | --- |
| Web (Vanilla JS, Next.js, React, Vue, Svelte) | JavaScript / TypeScript | /js-ts | LocalStorage API |
| Flutter (Mobile, Web, Desktop) | Dart | /flutter | shared_preferences パッケージ |
| Flet (Web, Desktop, Mobile) | Python | /flet | page.client_storage |

## 使い方
各環境のディレクトリ内に、詳細な導入手順と使用例を記載した `README.md` があります。

### Web向けライブラリ (JS/TS)
主に localStorage を使用します。[Next.js](https://nextjs.org/)や各種モダンフレームワークでの利用方法を記載しています。

### Flutter向けライブラリ
主に [shared_preferences](https://pub.dev/packages/shared_preferences) パッケージを使用します。

### Flet向けライブラリ
主に [Client Storage](https://flet.dev/docs/cookbook/client-storage/) を使用します。


## 仕様
ブラウザの[ローカルストレージ](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage)に以下のようなJSONオブジェクトを保存します。
```json
{
    "participant_id": "<ブラウザを一意に識別するID>",
    "created_at": "<参加者の参加日時>",
    "updated_at": "<参加者の最終更新日時>"
}
```
`participant_id`は[UUID v7](https://tex2e.github.io/rfc-translater/html/rfc9562.html#5-7--UUID-Version-7)を採用しています。
（例： `019ad3fd-8a80-7c0f-b719-ee5d8c6d6cf6`）

`created_at`と`updated_at`はISO 8601形式のUTCタイムスタンプです。  
（例： `2025-11-30T09:00:00.000Z`）

## コードの公開について
このリポジトリのコードには特に機密情報は含まれていませんが、宮本研究室で実施される学術実験やクラウドソーシング実験のための参加者ID管理の基盤となるものです。
特別な理由がない限り、このリポジトリは非公開のまま維持することをお勧めします。
