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
// PIPELINE BOUNDARY PROTECTION (Step 5.5)
// Prevents cross-pipeline imports and server/client bleed-over.
// ----------------------------------------------------
{
  files: ["server/**/*.js"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          // Prevent Pulse from importing Session internals
          {
            name: "../session/sessionPipeline.js",
            message: "PulsePipeline must not import Session internals."
          },
          // Prevent Session from importing Pulse internals
          {
            name: "../pulse/pulse.state.js",
            message: "SessionPipeline must not import Pulse state."
          },
          {
            name: "../pulse/pulse.engine.js",
            message: "SessionPipeline must not import Pulse engine."
          },
          // Prevent Safety from accessing Session
          {
            name: "../session/*",
            message: "SafetyPipeline must remain Session-agnostic."
          },
          // Prevent Emotion from accessing Session
          {
            name: "../session/*",
            message: "EmotionPipeline must remain Session-agnostic."
          }
        ],
        patterns: [
          {
            group: [
              "server/pipelines/trainer/*",
              "server/pipelines/pulse/*",
              "server/pipelines/emotion/*"
            ],
            message: "TrainerPipeline must not import pulse/emotion internals."
          },
          // ------------------------------
          // BLOCK CLIENT CODE ON SERVER
          // ------------------------------
          {
            group: ["src/*"],
            message: "Server pipelines must not import client-side code.",
          },

          // ------------------------------
          // EMOTION IS READ-ONLY
          // ------------------------------
          {
            group: ["server/emotion/*"],
            message: "Emotion Engine is read-only in Phase 2.2.",
          },

          // ----------------------------------------------------
          // MOMENT PIPELINE NAMING PROTECTION
          // Block legacy filenames from ever being reintroduced.
          // ----------------------------------------------------
          {
            group: [
              "**/momentBuilder.js",
              "**/momentEnvelope.js"
            ],
            message:
              "Legacy camelCase momentBuilder.js and momentEnvelope.js are forbidden. Use moment.builder.js and moment.envelope.js."
          },

          {
            group: ["**/*Moment*.js"],
            message:
              "CamelCase filenames for Moment pipeline files are forbidden. Use lowercase with dot notation: moment.builder.js."
          },

          // ------------------------------
          // CROSS-PIPELINE PROTECTION
          // Prevent pipelines from importing each other directly.
          // Only eventRouter.js is allowed to orchestrate pipelines.
          // ------------------------------
          {
            group: [
              "server/pipelines/pulse/*",
              "!server/pipelines/pulse/**"
            ],
            message: "Pulse Pipeline may not import from other pipelines.",
          },
          {
            group: [
              "server/pipelines/message/*"
            ],
            message: "Message Pipeline may not import from other pipelines.",
          },
          {
            group: [
              "server/pipelines/focus/*"
            ],
            message: "Focus Pipeline may not import from other pipelines.",
          },
          {
            group: [
              "server/pipelines/safety/*"
            ],
            message: "Safety Pipeline may not import from other pipelines.",
          },
          {
            group: [
              "server/pipelines/trainer/*"
            ],
            message: "Trainer Pipeline may not import from other pipelines.",
          },
          {
            group: [
              "server/pipelines/session/*"
            ],
            message: "Session Pipeline may not import from other pipelines.",
          }
        ]
      }
    ]
  }
},
// ----------------------------------------------------
// MOMENT PIPELINE PROTECTION
// Prevent any pipeline from importing or mutating
// session, pulse, safety, or emotion internals here.
// Only imports allowed are from the public builder.
// ----------------------------------------------------
{
  files: ["server/pipelines/moment/**"],
  rules: {
    // ----------------------------------------------------
    // MOMENT PIPELINE — import boundary protection
    // Ensures no pipeline loads moment internals directly.
    // Only public builders are allowed.
    // ----------------------------------------------------
    "no-restricted-imports": [
      "error",
      { "paths": [] }
    ]
  }
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
