// src/utils/guard.js
// North Star: Safety + Transparency
// Run a function with protection. Fail loudly in dev, silently in production.

export function guard(fn, context = "unknown") {
  try {
    return fn();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`🔥 Guarded error in ${context}:`, err);
    }
    return null;
  }
}

export default guard;
