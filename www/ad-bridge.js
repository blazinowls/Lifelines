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
    banner:       'ca-app-pub-4441564159986722/7273777284', // Google test IDs
    interstitial: 'ca-app-pub-4441564159986722/1100707444',
    rewarded:     'ca-app-pub-4441564159986722/9909135757'
  };
  // =======================================================================

  var ready = false, started = false, gotSize = false;

  // Leave a blank strip at the bottom of the game for the banner ad.
  var st = document.createElement('style');
  st.textContent = '#app{padding-bottom:var(--ad,0px) !important}' +
    '.modal{align-items:center !important;padding:16px 12px calc(var(--ad,0px) + 16px) !important}' +
    '.sheet{border-radius:22px !important;max-height:calc(100vh - var(--ad,0px) - 48px) !important}';
  document.head.appendChild(st);
  function toast(msg) {
    var d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(var(--ad,0px) + 20px);z-index:99;background:#222;color:#fff;padding:12px 14px;border-radius:12px;font:14px system-ui,sans-serif;text-align:center';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 8000);
  }
  var initErr = '';
  function why(e) { return String((e && (e.message || e.errorMessage || e.code)) || e || 'unknown'); }
  function setAd(h) { document.documentElement.style.setProperty('--ad', Math.ceil(h) + 'px'); }

  AdMob.addListener('bannerAdSizeChanged', function (s) { if (s && s.height) { gotSize = true; setAd(Math.max(s.height + 16, 64)); } });
  AdMob.addListener('bannerAdFailedToLoad', function () { setAd(0); });

  async function init() {
    if (started) return;
    started = true;
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
      await AdMob.showBanner({
        adId: IDS.banner,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: TESTING
      });
      if (!gotSize) setAd(90); // fallback until the real banner size arrives
      preloadInterstitial();
    } catch (e) { initErr = why(e); console.warn('AdMob init failed', e); }
  }

  function preloadInterstitial() {
    AdMob.prepareInterstitial({ adId: IDS.interstitial, isTesting: TESTING }).catch(function () {});
  }

  window.AdBridge = {
    native: true,

    showRewarded: function (cb) {
      if (!ready) { toast('Ads are not ready yet. ' + (initErr ? 'Error: ' + initErr : 'Try again in a few seconds.')); cb(false); return; }
      var earned = false, handles = [], finished = false, reason = '';
      function finish() {
        if (finished) return;
        finished = true;
        handles.forEach(function (h) { try { h.remove(); } catch (e) {} });
        if (!earned) toast('The ad could not be shown. ' + (reason ? 'Reason: ' + reason : 'Try again in a moment.'));
        cb(earned);
        preloadInterstitial();
      }
      function got() { earned = true; setTimeout(finish, 300); }
      function on(name, fn) { AdMob.addListener(name, fn).then(function (h) { handles.push(h); }); }
      on('onRewardedVideoAdReward', got);
      on('onRewardedVideoAdDismissed', function () { setTimeout(finish, 300); });
      on('onRewardedVideoAdFailedToLoad', function (e) { reason = why(e); finish(); });
      AdMob.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING })
        .then(function () { return AdMob.showRewardVideoAd(); })
        .then(function (r) { if (r) got(); })
        .catch(function (e) { reason = why(e); finish(); });
    },

    showInterstitial: function () {
      if (!ready) return;
      AdMob.showInterstitial().then(preloadInterstitial).catch(preloadInterstitial);
    }
  };

  document.addEventListener('deviceready', init);
  init();
})();
