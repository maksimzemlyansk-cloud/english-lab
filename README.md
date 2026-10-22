# English Lab

A personal English-learning web app. The current lesson and vocabulary are saved locally; optional Google Drive sync stores one JSON progress file in the signed-in user's Drive.

## Files

- `index.html` — the application and Drive sync client.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA metadata, offline shell, and icon.
- `english-lab-progress.json` — created in the user's Google Drive after sync is enabled; it is not part of this repository.

## Local use

Open `index.html` in a browser. Lesson progress, answers, settings, and vocabulary are stored in that browser's local storage. Export/import remains available as a manual backup.

Google Drive sync is disabled until a Google OAuth web client is configured. OAuth requires an HTTPS origin; a `file://` launch cannot sync. There is no server or paid AI API in this project.

## Google Drive setup

1. In the Google Cloud project, enable the Google Drive API and configure Google Auth Platform consent/branding.
2. Create an OAuth client of type **Web application**. Add the deployed site origin under **Authorized JavaScript origins** (for GitHub Pages, `https://maksimzemlyansk-cloud.github.io`).
3. Put the OAuth Client ID in `GOOGLE_CLIENT_ID` near the top of the inline script in `index.html`.
4. Publish the site over HTTPS and press **Connect Google Drive** in Settings on each device. Google will request consent once.

The OAuth scope is `drive.file`, not full Drive access. The app creates and updates `english-lab-progress.json`; it does not read or modify unrelated Drive files. OAuth tokens stay in memory and are not written to local storage.

## GitHub Pages

In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. The source repository and hosted app are public; do not add progress backups, credentials, passwords, or private data to this repository. Google Drive progress is separate and private to the account that authorizes the app.

## Costs and limits

This app does not require a paid AI API. Drive API requests are subject to Google's quotas and account terms. The Google Cloud project should remain without billing enabled for this use; do not activate a free trial or create paid resources.
