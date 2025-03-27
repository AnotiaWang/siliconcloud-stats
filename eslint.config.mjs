// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import configPrettier from 'eslint-config-prettier'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default withNuxt(pluginPrettierRecommended, {
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    ...configPrettier.rules,
  },
})
