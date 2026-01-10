# JS/TS BrowserIDLib

[日本語](README.md) | **English**

Library for managing browser-unique IDs (`browser_id`) and other attributes (`attributes`) using browser `localStorage`.

## Installation

### npm / yarn / pnpm (Next.js, Vue, Angular, etc.)
Install directly from GitHub repository.

```shell
npm install git+https://github.com/miyamoto-hai-lab/browser-id.git#subdirectory=js-ts
```
or
```shell
yarn add git+https://github.com/miyamoto-hai-lab/browser-id.git#subdirectory=js-ts
```
or
```shell
pnpm add git+https://github.com/miyamoto-hai-lab/browser-id.git#subdirectory=js-ts
```

### Vanilla JS (HTML + JS)
Download `browser-id.global.js` from the [latest release](https://github.com/miyamoto-hai-lab/browser-id/releases/latest) page and place it in your project.

## Usage

### Vanilla JS (HTML + Script Tag)

Load the downloaded `browser-id.global.js`.
It can be accessed via the global variable `BrowserIdLib`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Experiment</title>
    <script src="browser-id.global.js"></script>
</head>
<body>
    <div id="id-display"></div>
    <script>
        // Instantiate (specify app name)
        const browser = new BrowserIdLib.Browser("my_experiment_app");

        // Get browser_id
        const browserId = browser.id;
        document.getElementById("id-display").innerText = "ID: " + browserId;

        // Save attribute
        browser.set_attribute("condition", "A");
    </script>
</body>
</html>
```

### Next.js / React

```tsx
"use client"; // For Next.js App Router

import { useEffect, useState } from 'react';
import { Browser } from 'browser-id'; // Package name depends on name in package.json, but git install uses this alias

export default function Page() {
  const [browserId, setBrowserId] = useState<string | null>(null);

  useEffect(() => {
    // Run only on client side
    const browser = new Browser("my_nextjs_app");
    setBrowserId(browser.id);
    
    // Save attribute
    browser.set_attribute("visited_at", new Date().toISOString());
  }, []);

  return <div>Your ID: {browserId}</div>;
}
```

### Vue.js

```typescript
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Browser } from 'browser-id';

const browserId = ref<string | null>(null);

onMounted(() => {
  const browser = new Browser("my_vue_app");
  browserId.value = browser.id;
});
</script>

<template>
  <div>Your ID: {{ browserId }}</div>
</template>
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { Browser } from 'browser-id';

@Component({
  selector: 'app-root',
  template: `<div>Your ID: {{ browserId }}</div>`,
  standalone: true
})
export class AppComponent implements OnInit {
  browserId: string | null = null;

  ngOnInit() {
    const browser = new Browser("my_angular_app");
    this.browserId = browser.id;
  }
}
```

## API

### Create Browser Object
```typescript
Browser(app_name: string, prefix?: string)
```
- `app_name`: Application name. Included in the key for [Saving Attribute Data](#saving-and-retrieving-other-information-related-to-subjects). Example: `"my_experiment_app"`
- `prefix`: Storage key prefix. Default is `"browser_id_lib"`.

### Get Browser-Unique ID for Identifying Subjects
Use the `id` property to get the UUID generated for each browser.
```typescript
browser.id
```
Executing the above retrieves the UUID (v7) stored in each browser's local storage.
If the subject accesses the experiment page for the first time and there is no ID in local storage yet, a new UUID is generated, saved, and returned.

### Saving and Retrieving Other Information Related to Subjects
In this library, you can save and retrieve not only the browser ID but also validation data such as the subject's crowdsourcing ID, age, gender, etc.
```typescript
browser.set_attribute(field: string, value: any)
browser.get_attribute(field: string, defaultValue?: any)
```
Executing the above saves/retrieves the crowdworker ID to/from local storage.

For example, when conducting an experiment on [Crowdworks](https://crowdworks.jp/), by asking each subject for their Crowdworks ID and saving it as an attribute, you can identify the same subject if they try to participate in the experiment multiple times using different browsers.
