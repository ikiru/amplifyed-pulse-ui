/**
 * Thread Utilities
 * 
 * Utility functions for thread coloring and navigation.
 */

// §3.1 Color Is Idea-Bound; §3.3 Thread Color Assignment & Lifecycle
// Use a calibrated palette of clearly separated hues so each root thread 
// retains a stable, idea-bound tone for the lineage visuals.
export const THREAD_COLOR_PALETTE = [
  "#e63946", // red
  "#f4d35e", // yellow
  "#52b788", // green
  "#48bfe3", // cyan
  "#4361ee", // blue
  "#9d4edd", // magenta
];

/**
 * Assigns unique colors to thread roots from the palette
 * Avoids assigning same color to adjacent threads for visual separability
 * @param {Array} roots - Array of root message objects
 * @returns {Map} - Map of messageId -> color hex string
 */
export function assignThreadColors(roots = []) {
  const assignments = new Map();
  const paletteLength = THREAD_COLOR_PALETTE.length;
  if (paletteLength === 0) {
    return assignments;
  }

  let previousColor = null;
  let paletteIndex = 0;

  roots.forEach((root) => {
    if (!root || typeof root.messageId !== "string") {
      return;
    }
    let candidate = THREAD_COLOR_PALETTE[paletteIndex];
    // Avoid assigning the same hue as the immediately preceding root to keep adjacent threads visually separable.
    if (candidate === previousColor) {
      paletteIndex = (paletteIndex + 1) % paletteLength;
      candidate = THREAD_COLOR_PALETTE[paletteIndex];
    }
    assignments.set(root.messageId, candidate);
    previousColor = candidate;
    paletteIndex = (paletteIndex + 1) % paletteLength;
    // Palette reuse is tolerated after a different hue appears so we keep the set concise yet consistent.
  });

  return assignments;
}

/**
 * Scrolls to a thread root element in the DOM
 * Tries to scroll within the scrollable container first, otherwise scrolls the viewport
 * @param {string} rootMessageId - The message ID of the thread root
 */
export function scrollToThreadRoot(rootMessageId) {
  // #region agent log
  if(typeof window!=='undefined'&&typeof fetch!=='undefined'){fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'threadUtils.js:58',message:'scrollToThreadRoot called',data:{rootMessageId,hasDocument:typeof document!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});}
  // #endregion
  if (!rootMessageId) return;
  if (typeof document === "undefined") return;
  const targetId = `thread-root-${rootMessageId}`;
  const target = document.getElementById(targetId);
  // #region agent log
  if(typeof window!=='undefined'&&typeof fetch!=='undefined'){fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'threadUtils.js:62',message:'target element lookup',data:{targetId,found:!!target},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});}
  // #endregion
  if (!target) return;

  // Find the scrollable container (either .liveview-message-list or .trainer-message-scroller)
  let scrollableContainer = target.closest('.liveview-message-list') || target.closest('.trainer-message-scroller');
  
  if (scrollableContainer) {
    // Scroll within the container
    const containerRect = scrollableContainer.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    // Calculate the scroll position: target's position relative to container + current scroll
    const scrollTop = scrollableContainer.scrollTop + (targetRect.top - containerRect.top) - 20; // 20px offset from top
    
    // #region agent log
    if(typeof window!=='undefined'&&typeof fetch!=='undefined'){fetch('http://127.0.0.1:7242/ingest/4231279e-6952-4b85-bc1a-061d94f40485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'threadUtils.js:74',message:'scrolling within container',data:{containerClass:scrollableContainer.className,scrollTop,hasContainer:!!scrollableContainer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});}
    // #endregion
    
    scrollableContainer.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    });
  } else {
    // Fallback: scroll the viewport (for TrainerView when no container found)
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
