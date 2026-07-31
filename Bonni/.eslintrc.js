module.exports = {
  root: true,
  // 'plugin:prettier/recommended' wires eslint-plugin-prettier so `eslint`
  // reports Prettier violations as errors (reading .prettierrc.js), and applies
  // eslint-config-prettier to disable ESLint's conflicting formatting rules.
  // This mirrors the SDK's root eslintConfig; no separate prettier --check needed.
  // (Prettier now owns semicolons, so the old `semi` rule is dropped.)
  extends: ['@react-native', 'plugin:prettier/recommended'],
}
