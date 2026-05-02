const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

// Force RTL for iOS
const withForcedRTLiOS = (config) => {
  return withInfoPlist(config, (config) => {
    // Force RTL layout
    config.modResults.UIUserInterfaceLayoutDirection = 'rightToLeft';
    // Set development region to Hebrew
    config.modResults.CFBundleDevelopmentRegion = 'he';
    // Allow mixed localizations
    config.modResults.CFBundleAllowMixedLocalizations = true;
    return config;
  });
};

// Force RTL for Android
const withForcedRTLAndroid = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:supportsRtl'] = 'true';
    }
    return config;
  });
};

// Combined plugin
module.exports = function withForcedRTL(config) {
  config = withForcedRTLiOS(config);
  config = withForcedRTLAndroid(config);
  return config;
};
