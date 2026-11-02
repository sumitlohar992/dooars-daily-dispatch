# Building the Dooars Khabar APK

Requires a computer with Node.js (or Bun), Git and Android Studio.

1. Export this project to GitHub (Lovable: GitHub button), then `git clone` it.
2. `npm install`
3. `npx cap add android`
4. `npx cap sync android`
5. `npx cap open android` — Android Studio opens.
6. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s).
   The file appears in `android/app/build/outputs/apk/debug/app-debug.apk`.
7. For the Play Store use Build → Generate Signed Bundle / APK.

The app loads the published site, so publish in Lovable before building.
