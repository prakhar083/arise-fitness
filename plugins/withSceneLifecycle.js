// iOS 27 refuses to launch apps without the UIScene life cycle. Expo SDK 57 ships
// `ExpoAppSceneDelegate` but its project template doesn't opt in (SDK 58's does).
// This backports SDK 58's template: the scene delegate creates the window and starts
// React Native, so the AppDelegate only builds the factory and exposes it.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const withSceneManifest = config =>
  withInfoPlist(config, cfg => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            // Objective-C name of Expo's ExpoAppSceneDelegate (SDK 58 subclasses it as SceneDelegate).
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

const withSceneAppDelegate = config =>
  withAppDelegate(config, cfg => {
    if (cfg.modResults.language !== 'swift') throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    }
    // The scene delegate now owns the window, so drop the app delegate's window + startReactNative.
    src = src.replace(
      /#if os\(iOS\) \|\| os\(tvOS\)\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?#endif\n/,
      '// The window is created and React Native is started by the scene delegate (iOS 27 scene life cycle).\n',
    );
    if (!src.includes('ExpoReactNativeFactoryProvider') || src.includes('UIScreen.main.bounds')) {
      throw new Error('withSceneLifecycle: AppDelegate template changed; update the plugin');
    }
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = config => withSceneAppDelegate(withSceneManifest(config));
