# JS/TS ParticipantID

ブラウザの `localStorage` を使用して、被験者ID (`browser_id`) やその他の属性 (`attributes`) を管理するためのライブラリです。
Python (Flet) 版の `participant_id` ライブラリと互換性のあるデータ構造を使用しています。

## インストール

### npm / yarn / pnpm (Next.js, Vue, Angular, etc.)
GitHubリポジトリから直接インストールします。

```bash
npm install git+https://github.com/miyamoto-hai-lab/participant-id.git#subdirectory=js-ts
```

### Vanilla JS (HTML + JS)
[Releases](https://github.com/miyamoto-hai-lab/participant-id/releases) ページから `participant-id.global.js` をダウンロードし、プロジェクトに配置してください。

## 使い方

### Vanilla JS (HTML + Script Tag)

ダウンロードした `participant-id.global.js` を読み込みます。
`ParticipantIdLib` というグローバル変数経由でアクセスできます。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Experiment</title>
    <script src="participant-id.global.js"></script>
</head>
<body>
    <div id="id-display"></div>
    <script>
        // インスタンス化 (アプリ名を指定)
        const participant = new ParticipantIdLib.Participant("my_experiment_app");

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
import { Participant } from 'participant-id'; // パッケージ名は package.json の name に依存しますが、git install の場合はそのエイリアスになります

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

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Participant } from 'participant-id';

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
import { Participant } from 'participant-id';

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

### `new Participant(app_name: string, prefix?: string)`
- `app_name`: アプリケーション名。属性データの保存キーに含まれます。
- `prefix`: ストレージキーのプレフィックス。デフォルトは `"participant_id"`。

### `browser_id: string | null`
- ブラウザ固有のUUID (v7) を取得します。v7の生成に失敗した場合はv4を使用します。存在しない場合は自動生成して保存します。

### `set_attribute(field: string, value: any): void`
- 指定したフィールドに値を保存します。
- 保存先キー: `participant_id.<app_name>.<field>`

### `get_attribute(field: string, defaultValue?: any): any`
- 指定したフィールドの値を取得します。

### `delete_attribute(field: string): void`
- 指定したフィールドの値を削除します。
