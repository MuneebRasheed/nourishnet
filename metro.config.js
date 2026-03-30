const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Avoid Watchman when macOS blocks it (e.g. Desktop folder TCC) — use Node file crawling instead.
config.resolver = {
  ...config.resolver,
  useWatchman: false,
};

module.exports = config;
