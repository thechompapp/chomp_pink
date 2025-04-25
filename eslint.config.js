// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
// Import prettier config LAST
import eslintConfigPrettier from "eslint-config-prettier";
// Optionally import prettier plugin if you want prettier rules run via eslint
// import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReactConfig,
  {
      rules: {
           // Your custom rules here
           "react/react-in-jsx-scope": "off", // Often needed with modern React/Vite
           "react/prop-types": "off", // Disable if not using prop-types
           // Add other rules...
      }
  },
  // Add prettier config LAST to override conflicting style rules
  eslintConfigPrettier,
  // Optionally add prettier plugin rules
  // eslintPluginPrettierRecommended,
];