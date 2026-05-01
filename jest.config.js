/** @type {import('jest').Config} */
module.exports = {
  // babel-jest is available (bundled with jest 30) and @babel/preset-typescript is installed.
  // ts-jest is NOT installed — using babel-jest + @babel/preset-typescript instead.
  //
  // preset: 'react-native' provides the haste resolver, Platform mocks, and
  // asset transformer needed to render React Native components in tests.
  preset: 'react-native',
  transform: {
    '^.+\\.(js|ts|tsx)$': [
      'babel-jest',
      {
        configFile: './babel.config.js',
      },
    ],
  },
  // Allow babel-jest to transform react-native and expo packages that ship
  // ES modules / Flow syntax.
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@testing-library/react-native)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    'react-native-mmkv-storage': '<rootDir>/__mocks__/react-native-mmkv-storage.js',
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
