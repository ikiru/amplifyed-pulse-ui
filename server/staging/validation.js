/**
 * Staging Validation Engine
 * 
 * Validates media accessibility, Stage Executor readiness, and slide control agent.
 * Returns status: 'ready' | 'warning' | 'blocked'
 */

import fs from 'fs';

/**
 * Validate YouTube URL
 * 
 * @param {string} url - YouTube URL
 * @returns {Object} Validation result
 */
function validateYouTubeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return {
      status: 'blocked',
      reasons: ['URL is required'],
    };
  }

  // Parse YouTube URL patterns
  const patterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  let videoId = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    return {
      status: 'blocked',
      reasons: ['Invalid YouTube URL format'],
    };
  }

  // Basic validation passed
  // Note: Full reachability check would require network request
  // For v1, we mark as 'warning' if we can't verify reachability
  return {
    status: 'warning',
    reasons: ['Reachability unverified - will attempt to validate on execution'],
    videoId,
  };
}

/**
 * Validate Media Cue
 * 
 * @param {Object} mediaCue - Media Cue object
 * @returns {Object} Validation result
 */
export function validateMediaCue(mediaCue) {
  if (!mediaCue || !mediaCue.source) {
    return {
      status: 'blocked',
      reasons: ['Media Cue source is required'],
    };
  }

  const { type, url } = mediaCue.source;

  // v1 scope: YouTube only
  if (type !== 'youtube') {
    return {
      status: 'blocked',
      reasons: [`Unsupported source type: ${type}. Only 'youtube' is supported in v1.`],
    };
  }

  // Validate YouTube URL
  const urlValidation = validateYouTubeUrl(url);
  
  // If URL is blocked, return blocked
  if (urlValidation.status === 'blocked') {
    return urlValidation;
  }

  // OBS bindings are optional and ignored by default Stage Engine
  // We do not fail validation if they are present or missing

  return urlValidation;
}

/**
 * Validate Stage Executor Readiness
 * 
 * @param {Object} stageEnginePipeline - Stage Engine pipeline instance
 * @param {string} sessionId - Session identifier
 * @returns {Object} Validation result
 */
export function validateStageExecutor(stageEnginePipeline, sessionId) {
  // #region agent log
  try {
    fs.appendFileSync('/Users/jeffwinkler/Documents/GitHub/amplifyed-pulse-ui/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'1',location:'validation.js:validateStageExecutor',message:'Validating Stage Executor',data:{sessionId, hasPipeline: !!stageEnginePipeline},timestamp:Date.now()}) + '\n');
  } catch(e) {}
  // #endregion
  if (!stageEnginePipeline) {
    return {
      status: 'blocked',
      reasons: ['Stage Engine is not initialized'],
    };
  }

  // Check Stage Engine status
  // For Amplify Stage Engine, "ready" usually means the server is running and capable of emitting events
  // We might check if a LiveView has connected (optional) or if there are any system-level blocks
  const status = stageEnginePipeline.getStatus?.(sessionId) || 'idle';

  if (status === 'blocked' || status === 'error') {
     return {
       status: 'blocked',
       reasons: ['Stage Engine reports a system error or block.'],
     };
  }

  // "idle" is acceptable for Stage Engine (it just means nothing is playing/showing yet)
  // "ready" is good.
  
  return {
    status: 'ready',
    reasons: [],
  };
}

/**
 * Validate Slide Control Agent
 * 
 * @param {Object} slideControlPipeline - Slide control pipeline instance
 * @param {string} sessionId - Session identifier
 * @returns {Object} Validation result
 */
export function validateSlideControl(slideControlPipeline, sessionId) {
  // #region agent log
  try {
    fs.appendFileSync('/Users/jeffwinkler/Documents/GitHub/amplifyed-pulse-ui/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'3',location:'validation.js:validateSlideControl',message:'Validating Slide Control',data:{sessionId, hasPipeline: !!slideControlPipeline},timestamp:Date.now()}) + '\n');
  } catch(e) {}
  // #endregion
  if (!slideControlPipeline) {
    return {
      status: 'blocked',
      reasons: ['Slide control system is not available'],
    };
  }

  // Get agent status
  const agentStatus = slideControlPipeline.getAgentStatus?.(sessionId);
  
  if (!agentStatus || agentStatus === 'disconnected') {
    return {
      status: 'blocked',
      reasons: ['Slide control agent is not running. Start the agent application to enable slide control.'],
    };
  }

  if (agentStatus === 'connected') {
    // Agent is connected
    return {
      status: 'ready',
      reasons: [],
    };
  }

  // Unknown status
  return {
    status: 'warning',
    reasons: [`Slide control agent status is unclear: ${agentStatus}`],
  };
}

/**
 * Validate all subsystems
 * 
 * @param {Object} params - Validation parameters
 * @param {Object} params.stageEnginePipeline - Stage Engine pipeline instance
 * @param {Object} params.slideControlPipeline - Slide control pipeline instance
 * @param {string} params.sessionId - Session identifier
 * @param {Array} params.mediaCues - Media Cues to validate
 * @returns {Object} Validation results for all subsystems
 */
export function validateAll({ stageEnginePipeline, slideControlPipeline, sessionId, mediaCues = [] }) {
  // #region agent log
  try {
    fs.appendFileSync('/Users/jeffwinkler/Documents/GitHub/amplifyed-pulse-ui/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'1',location:'validation.js:validateAll',message:'Validating All',data:{sessionId, mediaCuesCount: mediaCues.length},timestamp:Date.now()}) + '\n');
  } catch(e) {}
  // #endregion
  const results = {
    executor: validateStageExecutor(stageEnginePipeline, sessionId),
    slideControl: validateSlideControl(slideControlPipeline, sessionId),
    media: {},
  };

  // Validate each Media Cue
  if (Array.isArray(mediaCues)) {
    mediaCues.forEach((cue) => {
      if (cue?.id) {
        results.media[cue.id] = validateMediaCue(cue);
      }
    });
  }

  // Update lastChecked timestamps
  const now = new Date().toISOString();
  results.executor.lastChecked = now;
  results.slideControl.lastChecked = now;
  Object.values(results.media).forEach((result) => {
    result.lastChecked = now;
  });

  return results;
}
