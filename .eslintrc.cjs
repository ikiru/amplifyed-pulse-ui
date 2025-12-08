module.exports = {
  rules: {
    // ❌ Emotion is banned in Pulse Pipeline
    "no-restricted-syntax": [
      "error",
      {
        selector: "Identifier[name='emotion']",
        message:
          "The Pulse Pipeline must never use 'emotion'. Use 'pulse' instead.",
      },
    ],
  },

  overrides: [
    {
      files: [
        "server/registerPulseHandlers.js",
        "src/state/usePulseStream.js",
        "src/pages/TrainerView.jsx",
        "src/pages/AudienceInput.jsx",
        "src/hooks/usePulseFeed.js",
      ],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "Identifier[name='emotion']",
            message:
              "Pulse Pipeline files must never reference 'emotion'.",
          },
        ],
      },
    },
  ],
};
