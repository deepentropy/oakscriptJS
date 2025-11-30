/**
 * Example Babel Configuration for OakScriptEngine
 *
 * Use this configuration in OakScriptEngine to enable
 * PineScript-style operators in transpiled code.
 */

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
        browsers: ['last 2 versions']
      }
    }],
    '@babel/preset-typescript'
  ],
  plugins: [
    // Add the PineScript operators plugin
    './node_modules/@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs',

    // Other plugins you might need
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
  ]
};
