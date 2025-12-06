// src/utils/pulse.js
// Guard barrel so accidental imports explode safely during dev.

export { default as usePulseIngestion } from "./usePulseIngestion";

// If anyone tries to import dead variants, fail loudly:
export const DO_NOT_USE_VARIANTS = {
  jsx: "❌ usePulseIngestion.jsx has been removed. Use usePulseIngestion.js.",
  old: "❌ usePulseIngestion.old.js has been removed.",
  copy: "❌ usePulseIngestion-copy.js has been removed.",
};
