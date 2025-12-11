# JS/TS ParticipantsID

ブラウザの `localStorage` を使用して、被験者ID (`browser_id`) やその他の属性 (`attributes`) を管理するためのライブラリです。

## インストール

### npm / yarn / pnpm (Next.js, Vue, Angular, etc.)
GitHubリポジトリから直接インストールします。

```shell
npm install git+https://github.com/miyamoto-hai-lab/participants-id.git#subdirectory=js-ts
```
または
```shell
yarn add git+https://github.com/miyamoto-hai-lab/participants-id.git#subdirectory=js-ts
```
または
```shell
pnpm add git+https://github.com/miyamoto-hai-lab/participants-id.git#subdirectory=js-ts
```

### Vanilla JS (HTML + JS)
[最新のリリース](https://github.com/miyamoto-hai-lab/participants-id/releases/latest) ページから `participants-id.global.js` をダウンロードし、プロジェクトに配置してください。

## 使い方

### Vanilla JS (HTML + Script Tag)

ダウンロードした `participants-id.global.js` を読み込みます。
`ParticipantsIdLib` というグローバル変数経由でアクセスできます。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Experiment</title>
    <script src="participants-id.global.js"></script>
</head>
<body>
    <div id="id-display"></div>
    <script>
        // インスタンス化 (アプリ名を指定)
        const participant = new ParticipantsIdLib.Participant("my_experiment_app");

        // browser_id の取得
        const browserId = participant.browser_id;
        document.getElementById("id-display").innerText = "ID: " + browserId;

        // 属性の保存
        participant.set_attribute("condition", "A");
    </script>
</body>
</html>
```

### Next.js / React

```tsx
"use client"; // Next.js App Routerの場合

import { useEffect, useState } from 'react';
import { Participant } from 'participants-id'; // パッケージ名は package.json の name に依存しますが、git install の場合はそのエイリアスになります

export default function Page() {
  const [browserId, setBrowserId] = useState<string | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ実行
    const participant = new Participant("my_nextjs_app");
    setBrowserId(participant.browser_id);
    
    // 属性の保存
    participant.set_attribute("visited_at", new Date().toISOString());
  }, []);

  return <div>Your ID: {browserId}</div>;
}
```

### Vue.js

```typescript
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Participant } from 'participants-id';

const browserId = ref<string | null>(null);

onMounted(() => {
  const participant = new Participant("my_vue_app");
  browserId.value = participant.browser_id;
});
</script>

<template>
  <div>Your ID: {{ browserId }}</div>
</template>
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { Participant } from 'participants-id';

@Component({
  selector: 'app-root',
  template: `<div>Your ID: {{ browserId }}</div>`,
  standalone: true
})
export class AppComponent implements OnInit {
  browserId: string | null = null;

  ngOnInit() {
    const participant = new Participant("my_angular_app");
    this.browserId = participant.browser_id;
  }
}
```

## API

### Particiapntオブジェクトを生成する
```typescript
Participant(app_name: string, prefix?: string)
```
- `app_name`: アプリケーション名。[属性データの保存]()キーに含まれます。例：`"my_experiment_app"`
- `prefix`: ストレージキーのプレフィックス。デフォルトは `"participants_id"`。

### 被験者を識別するためのブラウザ固有のIDを取得する
各ブラウザで生成されたUUIDを取得するには、`browser_id`プロパティを用います。
```typescript
participant.browser_id
```
上記を実行すると、各ブラウザのローカルストレージ（SharedPreferences）に保存されたUUID (v7) が取得できます。
被験者が初めて実験ページにアクセスし、まだローカルストレージにIDがない場合には、新たにUUIDを生成して保存し、返します。

v7の生成に失敗した場合はv4を使用してbrowser_idを生成します。

### 被験者に関する他の情報を保存・取得する
このライブラリでは、ブラウザIDだけでなく、被験者のクラウドソーシングIDや年齢、性別など他の情報も保存・取得することができます。
```typescript
participant.set_attribute(field: string, value: any)
participant.get_attribute(field: string, defaultValue?: any)
```
上記を実行すると、ローカルストレージにクラウドワーカーIDを保存・取得できます。

例えば、[クラウドワークス](https://crowdworks.jp/)上で実験を実施する場合、各被験者のクラウドワークスIDを訊いてattributeとして保存しておくことで、ブラウザを変えて被験者が実験に複数回参加しようとした場合に同一被験者を識別することができます。
