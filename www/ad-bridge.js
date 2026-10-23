// Real AdMob bridge. Only activates inside the Android app; in a browser the
// game falls back to its built-in preview ads.
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var AdMob = C.Plugins && C.Plugins.AdMob;
  if (!AdMob) return;

  // ===== SET TO false AND PASTE YOUR REAL AD UNIT IDS BEFORE RELEASE =====
  var TESTING = true;
  var IDS = {
    banner:       'ca-app-pub-3940256099942544/9214589741', // Google test IDs
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded:     'ca-app-pub-3940256099942544/5224354917'
  };
  // =======================================================================

  var ready = false;

  async function init() {
    try {
      // Consent form (required for users in the EEA / UK)
      var info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        await AdMob.showConsentForm();
      }
    } catch (e) {}
    try {
      await AdMob.initialize({ initializeForTesting: TESTING });
      ready = true;
      document.body.style.paddingBottom = '60px'; // room for the banner
      await AdMob.showBanner({
        adId: IDS.banner,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: TESTING
      });
      preloadInterstitial();
    } catch (e) { console.warn('AdMob init failed', e); }
  }

  function preloadInterstitial() {
    AdMob.prepareInterstitial({ adId: IDS.interstitial, isTesting: TESTING }).catch(function () {});
  }

  window.AdBridge = {
    native: true,

    showRewarded: function (cb) {
      if (!ready) { cb(false); return; }
      var earned = false, handles = [], finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        handles.forEach(function (h) { h.remove(); });
        cb(earned);
      }
      function on(name, fn) { AdMob.addListener(name, fn).then(function (h) { handles.push(h); }); }
      on('onRewardedVideoAdReward', function () { earned = true; });
      on('onRewardedVideoAdDismissed', finish);
      on('onRewardedVideoAdFailedToLoad', finish);
      AdMob.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING })
        .then(function () { return AdMob.showRewardVideoAd(); })
        .catch(finish);
    },

    showInterstitial: function () {
      if (!ready) return;
      AdMob.showInterstitial().then(preloadInterstitial).catch(preloadInterstitial);
    }
  };

  document.addEventListener('deviceready', init);
  init();
})();
