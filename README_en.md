# Browser ID Library

[日本語](README.md) | **English**
&emsp;&emsp;
[![tests status](https://github.com/miyamoto-hai-lab/browser-id/actions/workflows/ci.yml/badge.svg)](https://github.com/miyamoto-hai-lab/browser-id/actions/workflows/ci.yml)

A participant ID management library for crowdsourcing experiments.

It persistently maintains and manages a unique ID for each participant (more precisely, for each browser) using LocalStorage or similar storage functions within the same domain.

This repository provides individual libraries for different frontend technologies (JavaScript / TypeScript, Flutter, Flet, etc.).


## Purpose
-   Identify the same participant across multiple experiment pages.
-   Keep the same ID even if the participant reloads or re-accesses the browser.
-   Provide a foundation for server-side eligibility checks (e.g., preventing duplicate participation).


## Supported Environments
| Environment | Language | Directory | Technology/Package |
| --- | --- | --- | --- |
| Web (Vanilla JS, Next.js, React, Vue, Svelte) | JavaScript / TypeScript | [js-ts/](js-ts/README_en.md) | LocalStorage API |
| Flutter (Mobile, Web, Desktop) | Dart | [flutter/](flutter/README_en.md) | shared_preferences package |
| Flet (Web, Desktop, Mobile) | Python | [flet/](flet/README_en.md) | page.client_storage |

## Usage
Detailed installation instructions and usage examples are provided in the `README.md` within each environment's directory.

### Web Library (JS/TS)
Mainly uses localStorage. Describes usage with [Next.js](https://nextjs.org/) and various modern frameworks.

### Flutter Library
Mainly uses the [shared_preferences](https://pub.dev/packages/shared_preferences) package.

### Flet Library
Mainly uses [Client Storage](https://flet.dev/docs/cookbook/client-storage/).


## Specifications
Stores the following information in the browser's [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

| Key | Example Value | Description |
| --- | --- | --- |
| browser_id_lib.browser_id | 019ad3fd-8a80-7c0f-b719-ee5d8c6d6cf6 | Unique ID identifying the browser (UUID v7) |
| browser_id_lib.created_at | 2025-11-30T09:00:00.000Z | Creation time of browser_id (ISO 8601 UTC timestamp) |
| browser_id_lib.updated_at | 2025-11-30T09:00:00.000Z | Last update time of browser_id (ISO 8601 UTC timestamp) |
| browser_id_lib.attributes.<app_name>.\<field\> | Any saveable value | Arbitrary values such as subject attribute data can be saved by the application. |

-   To avoid key collisions in local storage, all keys are prefixed with `browser_id_lib`.
-   When saving subject attribute data, the application name is also added to the prefix to avoid key name collisions between applications.
