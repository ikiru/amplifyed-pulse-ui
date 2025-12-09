/**
 * Safety Pipeline (Step 6.4 — Scaffold Only)
 * No behavior. No state. No socket emits.
 * Logic will be migrated in Step 7.
 */

// Phase 2.3.4 — Safety now contributes to the Multi-Signal moment builder
export function createSafetyPipeline(io, momentBuilder = null) {
  return {
    handleSoftFlag() {
      // placeholder — activation will occur in Step 7
    },

    handlePattern() {
      // placeholder — activation will occur in Step 7
    }
  };
}
