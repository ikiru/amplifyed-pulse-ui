// eslint.config.js
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

export default [

  // ----------------------------------------------------
  // IGNORE DIRECTORIES
  // ----------------------------------------------------
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "archive/**",          // <-- IMPORTANT FIX
    ],
  },

  // ----------------------------------------------------
  // BASE JS RULES
  // ----------------------------------------------------
  {
    ...js.configs.recommended,
  },

  // ----------------------------------------------------
  // REACT / JSX CONFIG
  // ----------------------------------------------------
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "import/no-unresolved": "warn",
      "react/prop-types": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },

// ----------------------------------------------------
// PULSE PIPELINE PROTECTION
// Emotion must NEVER appear in pulse-handling files.
// ----------------------------------------------------
{
  files: [
    "src/state/usePulseStream.js",
    "src/hooks/usePulseFeed.js",
    "src/pages/AudienceInput.jsx",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Identifier[name='emotion']",
        message:
          "Pulse Pipeline must never reference 'emotion'. Use 'pulse' instead.",
      },
    ],
  },
},

];
