import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    rules: {
      'no-console': ['warn', { allow: ['log'] }],
      'no-unused-vars': ['warn', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_',
      }],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
  },
)
