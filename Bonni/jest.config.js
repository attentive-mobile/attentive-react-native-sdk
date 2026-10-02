module.exports = {
  preset: 'react-native',
  // The react-native preset ignores node_modules when transforming. Several of
  // our deps (e.g. @react-navigation/*) ship ES modules that Jest can't parse
  // as-is, so we allowlist them through Babel here.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
  ],
  // The SDK lives at the repo root (Bonni depends on it via `file:..`) and would
  // otherwise resolve the root's own react-native copy — a second, un-mocked
  // instance that throws "__fbBatchedBridgeConfig is not set" on import. Pin every
  // bare `react-native` import to Bonni's copy, which the preset has set up.
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
}
