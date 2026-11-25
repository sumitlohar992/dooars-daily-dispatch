# Building the Dooars Khabar APK

Requires a computer with Node.js (or Bun), Git and Android Studio.

1. Export this project to GitHub (Lovable: GitHub button), then `git clone` it.
2. `npm install`
3. `npx cap add android`
4. In `android/app/src/main/AndroidManifest.xml`, add these permissions directly inside `<manifest>` and before `<application>`:

   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   ```

5. `npx cap sync android`
6. `npx cap open android` — Android Studio opens.
7. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s).
   The file appears in `android/app/build/outputs/apk/debug/app-debug.apk`.
8. For the Play Store use Build → Generate Signed Bundle / APK.

The app loads the published site, so publish in Lovable before building.
