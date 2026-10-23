# Lifelines: build the Android APK

I could not build the APK inside my sandbox (no Android toolchain or internet),
so this project builds it for you, either in the cloud (GitHub) or on a computer.
Nothing here has been run end to end yet, so expect to fix a small snag or two.

## Before you build
1. Open `capacitor.config.json` and change `appId` to your own, for example
   `com.yourname.lifelines`. It cannot change after you publish.
2. Host `privacy-policy.html` at a public URL (GitHub Pages works) after filling
   in your name and email. Play and Samsung both ask for this URL.

## Option A: build in the cloud with GitHub (no Android Studio)
1. Create a free GitHub repository and upload everything in this folder,
   keeping the `.github/workflows/build-apk.yml` path. (Uploading from a computer
   is much easier than from a phone.)
2. Open the repo's **Actions** tab, choose **Build Android APK**, tap **Run workflow**.
3. When it finishes (about 5-10 minutes), open the run and download
   **lifelines-debug-apk**. Install it on your phone to test (allow installs from
   unknown sources).
4. For a store-ready, signed APK, create a keystore once on a computer:

       keytool -genkeypair -v -keystore release.jks -alias lifelines -keyalg RSA -keysize 2048 -validity 10000

   Back it up safely. Losing it means you can never update the app. Then in the
   repo go to Settings > Secrets and variables > Actions and add:
   `KEYSTORE_BASE64` (run `base64 -w0 release.jks`), `KEYSTORE_PASSWORD`,
   `KEY_PASSWORD`, `KEY_ALIAS` (lifelines). Run the workflow again and download
   **lifelines-release-apk**.

## Option B: build on a computer
    npm install
    npx cap add android
    (add the AdMob meta-data from the workflow file to android/app/src/main/AndroidManifest.xml)
    npx cap sync android
    npx cap open android      # then Build > Generate Signed Bundle / APK

## Ads
`www/ad-bridge.js` uses Google's TEST ad IDs and `TESTING = true`.
Before release: create your AdMob app and 3 ad units (banner, interstitial,
rewarded), paste the IDs into `ad-bridge.js`, set `TESTING = false`, and replace
the test app ID in the manifest step of the workflow. Never tap your own live ads.
Check the AdMob plugin's README if an ad does not show, because event names and
options can change between plugin versions. `package.json` uses "latest" for the
Capacitor and AdMob packages. If the build complains about a version mismatch,
pin them to matching major versions.

## Still needed for the stores
App icon (512x512), screenshots, a feature graphic (Play only), and a content
rating. The default Capacitor icon is used until you add your own.
