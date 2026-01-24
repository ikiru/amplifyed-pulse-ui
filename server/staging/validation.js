/**
 * Staging Validation Engine
 * 
 * Validates media accessibility, Stage Executor readiness, and slide control agent.
 * Returns status: 'ready' | 'warning' | 'blocked'
 */

import fs from 'fs';

/**
 * Check YouTube video reachability using oEmbed API
 * 
 * @param {string} url - YouTube URL
 * @param {string} videoId - Extracted video ID
 * @returns {Promise<Object>} Validation result with reachability status
 */
async function checkYouTubeReachability(url, videoId) {
  const VALIDATION_TIMEOUT_MS = 5000; // 5 second timeout
  
  try {
    // Use YouTube's oEmbed API to verify video exists and is embeddable
    // This is a public API that doesn't require authentication
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    
    console.log(`[validation] Checking reachability for video ${videoId}: ${url}`);
    
    // Check if fetch is available (Node.js 18+ has it globally, older versions need node-fetch)
    if (typeof fetch === 'undefined') {
      console.error('[validation] fetch is not available. Node.js 18+ required or install node-fetch');
      return {
        status: 'warning',
        reasons: ['Reachability check unavailable - fetch API not available'],
        videoId,
      };
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);
    
    try {
      const response = await fetch(oEmbedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AmplifyEd-Stage-Validator/1.0',
        },
      });
      
      console.log(`[validation] Response status for ${videoId}: ${response.status}`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // 404 means video doesn't exist, 403 might mean restricted
        if (response.status === 404) {
          return {
            status: 'blocked',
            reasons: ['Video not found - the YouTube URL does not exist or has been removed'],
            videoId,
          };
        }
        
        if (response.status === 403) {
          return {
            status: 'blocked',
            reasons: ['Video is restricted and cannot be embedded'],
            videoId,
          };
        }
        
        // Other errors - mark as warning
        return {
          status: 'warning',
          reasons: [`Unable to verify video reachability (HTTP ${response.status})`],
          videoId,
        };
      }
      
      let data;
      try {
        data = await response.json();
        console.log(`[validation] oEmbed response for ${videoId}:`, {
          hasData: !!data,
          hasHtml: !!(data && data.html),
          hasTitle: !!(data && data.title),
          keys: data ? Object.keys(data) : [],
        });
      } catch (jsonError) {
        console.error(`[validation] Failed to parse JSON for ${videoId}:`, jsonError);
        return {
          status: 'warning',
          reasons: ['Invalid response from YouTube - could not parse validation data'],
          videoId,
        };
      }
      
      // If we got valid JSON back, the video exists and is embeddable
      // YouTube oEmbed returns an object with html, title, author_name, etc.
      if (data && (data.html || data.title)) {
        console.log(`[validation] Video ${videoId} validated as READY`);
        return {
          status: 'ready',
          reasons: [],
          videoId,
        };
      }
      
      // Unexpected response format
      console.warn(`[validation] Unexpected oEmbed response format for ${videoId}:`, data);
      return {
        status: 'warning',
        reasons: ['Video exists but embeddability could not be confirmed'],
        videoId,
      };
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error(`[validation] Fetch error for ${videoId}:`, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        return {
          status: 'warning',
          reasons: ['Reachability check timed out - video may be accessible but verification failed'],
          videoId,
        };
      }
      
      // Network error or other fetch failure
      return {
        status: 'warning',
        reasons: [`Unable to verify reachability - ${fetchError.message || 'network error'}`],
        videoId,
      };
    }
    
  } catch (error) {
    // Fallback for any unexpected errors
    console.error(`[validation] Unexpected error for ${videoId}:`, error);
    return {
      status: 'warning',
      reasons: [`Reachability check failed - ${error.message || 'unknown error'}`],
      videoId,
    };
  }
}

/**
 * Validate YouTube URL format and reachability
 * 
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Validation result
 */
async function validateYouTubeUrl(url) {
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

  // Check reachability
  return await checkYouTubeReachability(url, videoId);
}

/**
 * Validate PowerPoint file path
 * 
 * @param {string} filePath - File path or filename
 * @returns {Object} Validation result
 */
function validatePowerPointPath(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return {
      status: 'blocked',
      reasons: ['PowerPoint file path is required'],
    };
  }

  // Validate file extension
  const validExtensions = ['.pptx', '.ppt'];
  const lowerPath = filePath.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => lowerPath.endsWith(ext));

  if (!hasValidExtension) {
    return {
      status: 'blocked',
      reasons: ['Invalid file extension. PowerPoint files must be .pptx or .ppt'],
    };
  }

  // Check if file exists (if path is accessible from server)
  // Note: Browser security limits full path access, so we can only validate format
  // In production, you may want to upload files to server or use server-side path resolution
  try {
    // Try to check if file exists (only works if path is server-accessible)
    if (fs.existsSync && typeof fs.existsSync === 'function') {
      // Only check if it's an absolute path (server-side)
      if (filePath.startsWith('/') || filePath.match(/^[A-Z]:\\/)) {
        if (fs.existsSync(filePath)) {
          return {
            status: 'ready',
            reasons: [],
          };
        } else {
          return {
            status: 'warning',
            reasons: ['File path not found. Ensure the file is accessible when executing this Media Cue.'],
          };
        }
      }
    }
  } catch (error) {
    // File check failed - mark as warning
    console.warn(`[validation] Could not check file existence for ${filePath}:`, error.message);
  }

  // If we can't verify file existence, mark as warning (file may be accessible at execution time)
  return {
    status: 'warning',
    reasons: ['File path format is valid, but accessibility cannot be verified. Ensure the file is accessible when executing this Media Cue.'],
  };
}

/**
 * Validate Google Slides URL
 * 
 * @param {string} url - Google Slides URL
 * @returns {Promise<Object>} Validation result
 */
async function validateGoogleSlidesUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return {
      status: 'blocked',
      reasons: ['Google Slides URL is required'],
    };
  }

  // Parse Google Slides URL patterns
  const patterns = [
    /^https?:\/\/(?:docs\.)?google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)\/edit/,
    /^https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)\/present/,
  ];

  let presentationId = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      presentationId = match[1];
      break;
    }
  }

  if (!presentationId) {
    return {
      status: 'blocked',
      reasons: ['Invalid Google Slides URL format. URL must be a Google Slides presentation link.'],
    };
  }

  // Basic reachability check (similar to YouTube)
  // Google Slides doesn't have a public oEmbed API, so we do a basic HEAD request
  const VALIDATION_TIMEOUT_MS = 5000;
  
  try {
    if (typeof fetch === 'undefined') {
      return {
        status: 'warning',
        reasons: ['Reachability check unavailable - fetch API not available'],
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

    try {
      // Try to fetch the presentation page (public view)
      const publicUrl = `https://docs.google.com/presentation/d/${presentationId}/preview`;
      const response = await fetch(publicUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AmplifyEd-Stage-Validator/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 302) {
        // Presentation exists (200 OK or redirect to login)
        return {
          status: 'ready',
          reasons: [],
        };
      } else if (response.status === 404) {
        return {
          status: 'blocked',
          reasons: ['Presentation not found - the Google Slides URL does not exist or has been removed'],
        };
      } else {
        return {
          status: 'warning',
          reasons: [`Unable to verify presentation reachability (HTTP ${response.status})`],
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return {
          status: 'warning',
          reasons: ['Reachability check timed out - presentation may be accessible but verification failed'],
        };
      }

      return {
        status: 'warning',
        reasons: [`Unable to verify reachability - ${fetchError.message || 'network error'}`],
      };
    }
  } catch (error) {
    return {
      status: 'warning',
      reasons: [`Reachability check failed - ${error.message || 'unknown error'}`],
    };
  }
}

/**
 * Validate Media Cue
 * 
 * @param {Object} mediaCue - Media Cue object
 * @returns {Promise<Object>} Validation result
 */
export async function validateMediaCue(mediaCue) {
  if (!mediaCue || !mediaCue.source) {
    return {
      status: 'blocked',
      reasons: ['Media Cue source is required'],
    };
  }

  const { type, url, filePath } = mediaCue.source;

  // Handle different source types
  if (type === 'youtube') {
    // Validate YouTube URL (includes reachability check)
    const urlValidation = await validateYouTubeUrl(url);
    
    // If URL is blocked, return blocked
    if (urlValidation.status === 'blocked') {
      return urlValidation;
    }

    // OBS bindings are optional and ignored by default Stage Engine
    // We do not fail validation if they are present or missing

    return urlValidation;
  } else if (type === 'powerpoint') {
    // Validate PowerPoint file path
    return validatePowerPointPath(filePath);
  } else if (type === 'googleslides') {
    // Validate Google Slides URL
    return await validateGoogleSlidesUrl(url);
  } else {
    // Unknown source type
    return {
      status: 'blocked',
      reasons: [`Unsupported source type: ${type}. Supported types are 'youtube', 'powerpoint', and 'googleslides'.`],
    };
  }
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
 * @returns {Promise<Object>} Validation results for all subsystems
 */
export async function validateAll({ stageEnginePipeline, slideControlPipeline, sessionId, mediaCues = [] }) {
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

  // Validate each Media Cue (now async)
  if (Array.isArray(mediaCues)) {
    const validationPromises = mediaCues
      .filter(cue => cue?.id)
      .map(cue => validateMediaCue(cue).then(validation => ({ id: cue.id, validation })));
    
    const validationResults = await Promise.all(validationPromises);
    
    validationResults.forEach(({ id, validation }) => {
      results.media[id] = validation;
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
