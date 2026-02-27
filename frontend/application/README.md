# Imovia Mobile Application (React Native)

## Overview

The Imovia mobile application is a cross-platform React Native app built
with Expo and Expo Router. It is part of the Imovia project, a rental
property management solution for property owners, real estate agencies,
and tenants. The application focuses on providing an intuitive and
secure mobile experience to access rental-related features such as
documents, incidents, property tracking, and communication workflows.

## Requirements

-   Node.js (recommended: latest LTS)
-   npm
-   Expo CLI (via `npx`)
-   Android Studio (optional)
-   Xcode (optional on macOS)

## Installation

``` bash
cd frontend/application
npm install
```

If needed:

``` bash
npx expo install
```

## creation .env

``` bash
EXPO_PUBLIC_SUPABASE_URL="url in the mail"
EXPO_PUBLIC_SUPABASE_ANON_KEY="key in the mail"
```
## Running the App

``` bash
npx expo start
```

Clear cache after switching branches:

``` bash
npx expo start -c
```
