const js = require("@eslint/js");

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  extends: [
    js.configs.recommended,
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
  ],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  settings: {
    react: {
      version: "detect",
    },
  },

  rules: {
    "react/prop-types": "off",
    "import/no-unresolved": "warn",
  },

  // ----------------------------------------------------------
  // PULSE PIPELINE PROTECTION OVERRIDE
  // Emotion must NEVER appear in pulse-handling files.
  // TrainerView and Emotional Engine files are explicitly exempt.
  // ----------------------------------------------------------
  overrides: [
    {
      files: [
        "server/registerPulseHandlers.js",
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
  ],
};
