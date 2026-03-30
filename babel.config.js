/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  presets: [
    ['@babel/preset-typescript', { allExtensions: true }],
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
  ],
};
