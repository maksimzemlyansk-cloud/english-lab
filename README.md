# English Lab

A personal English-learning web app. The current lesson and vocabulary are saved locally; optional Google Drive sync stores one JSON progress file in the signed-in user's Drive.

## Files

- `index.html` — the application and Drive sync client.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA metadata, offline shell, and icon.
- `english-lab-progress.json` — created in the user's Google Drive after sync is enabled; it is not part of this repository.

## Local use

Open `index.html` in a browser. Lesson progress, answers, settings, and vocabulary are stored in that browser's local storage. Export/import remains available as a manual backup.

Google Drive sync uses an OAuth web client configured for the GitHub Pages origin. OAuth requires HTTPS; a `file://` launch cannot sync. There is no server or paid AI API in this project.

## Google Drive setup

1. Google Drive API is enabled in the English Lab Cloud project, with OAuth set to **Testing** and your Google account on the test-user list.
2. The OAuth client type is **Web application**, authorized for `https://maksimzemlyansk-cloud.github.io`.
3. GitHub Pages publishes from `main` at `/ (root)`. The public app is `https://maksimzemlyansk-cloud.github.io/english-lab/`.
4. Press **Подключить Google Диск** in Settings on each device. Google will ask for consent on each device/browser.

The OAuth scope is `drive.file`, not full Drive access. The app creates and updates `english-lab-progress.json`; it does not read or modify unrelated Drive files. OAuth tokens stay in memory and are not written to local storage.

## GitHub Pages

The source repository and hosted app are public; do not add progress backups, credentials, passwords, or private data to this repository. Google Drive progress is separate and private to the account that authorizes the app.

## Costs and limits

This app does not require a paid AI API. Drive API requests are subject to Google's quotas and account terms. The Google Cloud project should remain without billing enabled for this use; do not activate a free trial or create paid resources.
