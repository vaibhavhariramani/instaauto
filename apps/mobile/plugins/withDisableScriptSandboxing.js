const { withXcodeProject } = require('@expo/config-plugins');

// Xcode's "User Script Sandboxing" (default ON since Xcode 15) blocks the Metro bundler's
// "Bundle React Native code and images" build phase from writing ip.txt into the app bundle,
// failing every device build with "Sandbox: bash deny file-write-data ... ip.txt". Prebuild
// regenerates the Xcode project from scratch each time, silently reintroducing this, so it's
// disabled here rather than hand-edited in ios/ after the fact.
module.exports = function withDisableScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const entry = configurations[key];
      if (entry?.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return config;
  });
};
