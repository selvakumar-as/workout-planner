/** @type {import('jest').Config} */
module.exports = {
  // babel-jest is available (bundled with jest 30) and @babel/preset-typescript is installed.
  // ts-jest is NOT installed — using babel-jest + @babel/preset-typescript instead.
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        configFile: './babel.config.js',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
