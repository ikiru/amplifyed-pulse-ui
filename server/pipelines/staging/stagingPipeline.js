/**
 * Staging Pipeline
 * 
 * Handles all stage:* socket events for pre-session authoring.
 * Implements Stage Page Contract specifications.
 */

import * as StagingState from '../../staging/staging.state.js';
import { validateAll, validateMediaCue } from '../../staging/validation.js';
import * as SessionState from '../session/session.state.js';
import * as Snapshot from '../../staging/snapshot.js';
import { randomUUID } from 'crypto';
import fs from 'fs';

/**
 * Create staging pipeline
 * 
 * @param {Object} io - Socket.IO server instance
 * @param {Object} dependencies - Pipeline dependencies
 * @param {Object} dependencies.sessionPipeline - Session pipeline (for checking session state)
 * @param {Object} dependencies.stageEnginePipeline - Stage Engine pipeline (for validation)
 * @param {Object} dependencies.slideControlPipeline - Slide control pipeline (for validation)
 * @returns {Object} Staging pipeline API
 */
export function createStagingPipeline(io, { sessionPipeline, stageEnginePipeline, slideControlPipeline } = {}) {
  
  /**
   * Check if session is LIVE (server-side enforcement)
   * 
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if session is LIVE
   */
  function isSessionLive(sessionId) {
    if (!sessionId) return false;
    
    // Check session state directly
    const sessionState = SessionState.getSessionState(sessionId);
    return sessionState === 'LIVE';
  }

  /**
   * Generate operation ID for tracking
   * 
   * @returns {string} Operation ID
   */
  function generateOpId() {
    return `op_${Date.now()}_${randomUUID().slice(0, 8)}`;
  }

  /**
   * Emit ACK response to client
   * 
   * @param {Object} socket - Socket instance
   * @param {string} event - Event name (e.g., 'stage:focus:ack')
   * @param {Object} payload - ACK payload
   */
  function emitAck(socket, event, payload) {
    socket.emit(event, payload);
  }

  /**
   * Emit error response to client
   * 
   * @param {Object} socket - Socket instance
   * @param {string} event - Event name (e.g., 'stage:focus:error')
   * @param {Object} payload - Error payload
   */
  function emitError(socket, event, payload) {
    socket.emit(event, payload);
  }

  /**
   * Handle Focus Cue Create
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.text - Focus Cue text
   * @param {string} params.insertAfterCueId - Optional: insert after this cue ID
   */
  function handleFocusCueCreate({ socket, sessionId, text, insertAfterCueId } = {}) {
    const opId = generateOpId();

    try {
      // Check if session is LIVE
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot create Focus Cue: Session is Live',
        });
        return;
      }

      // Get or create staging state
      const stagingState = StagingState.getOrCreateStagingState(sessionId);
      const stagingId = stagingState.stagingId;

      // Validate text
      const trimmed = typeof text === 'string' ? text.trim() : '';
      if (!trimmed) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'INVALID_INPUT',
          message: 'Focus Cue text is required',
        });
        return;
      }

      // Create new Focus Cue
      const newCue = {
        id: `focus_${Date.now()}_${randomUUID().slice(0, 8)}`,
        text: trimmed,
        order: stagingState.focusCues.length,
        createdAt: new Date().toISOString(),
        isSystemDefault: false,
      };

      // Insert at position
      let updatedFocusCues;
      if (insertAfterCueId) {
        const insertIndex = stagingState.focusCues.findIndex((c) => c.id === insertAfterCueId);
        if (insertIndex >= 0) {
          updatedFocusCues = [...stagingState.focusCues];
          updatedFocusCues.splice(insertIndex + 1, 0, newCue);
          // Reorder
          updatedFocusCues.forEach((cue, index) => {
            cue.order = index;
          });
        } else {
          updatedFocusCues = [...stagingState.focusCues, newCue];
        }
      } else {
        updatedFocusCues = [...stagingState.focusCues, newCue];
        newCue.order = updatedFocusCues.length - 1;
      }

      // Update staging state
      const updated = StagingState.updateStagingState(stagingId, {
        focusCues: updatedFocusCues,
      });

      // Calculate readiness
      const readinessState = StagingState.calculateReadiness(updated);

      // Emit ACK
      emitAck(socket, 'stage:focus:ack', {
        sessionId,
        opId,
        focusCues_staging: updated.focusCues,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error creating Focus Cue: ${err.message}`);
      emitError(socket, 'stage:focus:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Focus Cue Edit
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Focus Cue ID
   * @param {string} params.text - New text
   * @param {string} params.editMode - 'edit_in_place' or 'revise_by_new'
   */
  function handleFocusCueEdit({ socket, sessionId, cueId, text, editMode = 'edit_in_place' } = {}) {
    const opId = generateOpId();

    try {
      // Check if session is LIVE
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot edit Focus Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const trimmed = typeof text === 'string' ? text.trim() : '';
      if (!trimmed) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'INVALID_INPUT',
          message: 'Focus Cue text is required',
        });
        return;
      }

      let updatedFocusCues;
      if (editMode === 'revise_by_new') {
        // Create new cue, mark old as revised
        const oldCue = stagingState.focusCues.find((c) => c.id === cueId);
        if (!oldCue) {
          emitError(socket, 'stage:focus:error', {
            sessionId,
            opId,
            code: 'CUE_NOT_FOUND',
            message: 'Focus Cue not found',
          });
          return;
        }

        const newCue = {
          id: `focus_${Date.now()}_${randomUUID().slice(0, 8)}`,
          text: trimmed,
          order: oldCue.order,
          createdAt: new Date().toISOString(),
          isSystemDefault: false,
          revisedFromCueId: cueId,
        };

        updatedFocusCues = stagingState.focusCues.map((c) => {
          if (c.id === cueId) {
            return { ...c, revisedByCueId: newCue.id };
          }
          return c;
        });

        // Replace old cue with new at same position
        const index = updatedFocusCues.findIndex((c) => c.id === cueId);
        updatedFocusCues[index] = newCue;
      } else {
        // Edit in place
        updatedFocusCues = stagingState.focusCues.map((c) => {
          if (c.id === cueId) {
            return { ...c, text: trimmed };
          }
          return c;
        });
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        focusCues: updatedFocusCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:focus:ack', {
        sessionId,
        opId,
        focusCues_staging: updated.focusCues,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error editing Focus Cue: ${err.message}`);
      emitError(socket, 'stage:focus:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Focus Cue Delete
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Focus Cue ID
   */
  function handleFocusCueDelete({ socket, sessionId, cueId } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot delete Focus Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Prevent deleting if it's the default
      if (stagingState.entryState.defaultFocusCueId === cueId) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'CANNOT_DELETE_DEFAULT',
          message: 'Cannot delete default Focus Cue',
        });
        return;
      }

      const updatedFocusCues = stagingState.focusCues.filter((c) => c.id !== cueId);
      
      // Reorder
      updatedFocusCues.forEach((cue, index) => {
        cue.order = index;
      });

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        focusCues: updatedFocusCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:focus:ack', {
        sessionId,
        opId,
        focusCues_staging: updated.focusCues,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error deleting Focus Cue: ${err.message}`);
      emitError(socket, 'stage:focus:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Focus Cue Reorder
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string[]} params.orderedCueIds - Ordered array of Focus Cue IDs
   */
  function handleFocusCueReorder({ socket, sessionId, orderedCueIds } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot reorder Focus Cues: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      if (!Array.isArray(orderedCueIds) || orderedCueIds.length === 0) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'INVALID_INPUT',
          message: 'orderedCueIds must be a non-empty array',
        });
        return;
      }

      // Reorder cues
      const cueMap = new Map(stagingState.focusCues.map((c) => [c.id, c]));
      const reordered = [];
      
      orderedCueIds.forEach((id, index) => {
        const cue = cueMap.get(id);
        if (cue) {
          reordered.push({ ...cue, order: index });
        }
      });

      // Add any cues not in the ordered list (shouldn't happen, but defensive)
      stagingState.focusCues.forEach((cue) => {
        if (!orderedCueIds.includes(cue.id)) {
          reordered.push({ ...cue, order: reordered.length });
        }
      });

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        focusCues: reordered,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:focus:ack', {
        sessionId,
        opId,
        focusCues_staging: updated.focusCues,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error reordering Focus Cues: ${err.message}`);
      emitError(socket, 'stage:focus:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Set Default Focus Cue
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.defaultFocusCueId - Focus Cue ID to set as default
   */
  function handleFocusCueSetDefault({ socket, sessionId, defaultFocusCueId } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot set default Focus Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Verify cue exists
      const cueExists = stagingState.focusCues.some((c) => c.id === defaultFocusCueId);
      if (!cueExists) {
        emitError(socket, 'stage:focus:error', {
          sessionId,
          opId,
          code: 'CUE_NOT_FOUND',
          message: 'Focus Cue not found',
        });
        return;
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        entryState: {
          ...stagingState.entryState,
          defaultFocusCueId,
        },
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:focus:ack', {
        sessionId,
        opId,
        focusCues_staging: updated.focusCues,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error setting default Focus Cue: ${err.message}`);
      emitError(socket, 'stage:focus:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Media Cue Create
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {Object} params.cueData - Media Cue data
   */
  async function handleMediaCueCreate({ socket, sessionId, cueData } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot create Media Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Validate Media Cue (now async - checks reachability)
      const validation = await validateMediaCue(cueData);
      
      // Create Media Cue
      const newCue = {
        id: `media_${Date.now()}_${randomUUID().slice(0, 8)}`,
        label: cueData.label || 'Untitled Media',
        source: cueData.source || {},
        playback: cueData.playback || { audioMode: 'videoOnly' },
        binding: cueData.binding,
        validation: {
          status: validation.status,
          reasons: validation.reasons || [],
        },
        createdAt: new Date().toISOString(),
      };

      const updatedMediaCues = [...stagingState.mediaCues, newCue];

      // Update validation for this cue
      const updatedValidation = {
        ...stagingState.validation,
        media: {
          ...stagingState.validation.media,
          [newCue.id]: {
            status: validation.status,
            reasons: validation.reasons || [],
            lastChecked: new Date().toISOString(),
          },
        },
      };

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        mediaCues: updatedMediaCues,
        validation: updatedValidation,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:media:ack', {
        sessionId,
        opId,
        mediaCues_staging: updated.mediaCues,
        validation_staging: updated.validation,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error creating Media Cue: ${err.message}`);
      emitError(socket, 'stage:media:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Media Cue Edit
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Media Cue ID
   * @param {Object} params.updates - Partial Media Cue updates
   */
  async function handleMediaCueEdit({ socket, sessionId, cueId, updates } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot edit Media Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const cueIndex = stagingState.mediaCues.findIndex((c) => c.id === cueId);
      if (cueIndex < 0) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'CUE_NOT_FOUND',
          message: 'Media Cue not found',
        });
        return;
      }

      // Merge updates
      const updatedCue = {
        ...stagingState.mediaCues[cueIndex],
        ...updates,
      };

      // Re-validate if source changed (now async - checks reachability)
      if (updates.source) {
        const validation = await validateMediaCue(updatedCue);
        updatedCue.validation = {
          status: validation.status,
          reasons: validation.reasons || [],
        };

        // Update validation state
        const updatedValidation = {
          ...stagingState.validation,
          media: {
            ...stagingState.validation.media,
            [cueId]: {
              status: validation.status,
              reasons: validation.reasons || [],
              lastChecked: new Date().toISOString(),
            },
          },
        };

        const updatedMediaCues = [...stagingState.mediaCues];
        updatedMediaCues[cueIndex] = updatedCue;

        const updated = StagingState.updateStagingState(stagingState.stagingId, {
          mediaCues: updatedMediaCues,
          validation: updatedValidation,
        });

        const readinessState = StagingState.calculateReadiness(updated);

        emitAck(socket, 'stage:media:ack', {
          sessionId,
          opId,
          mediaCues_staging: updated.mediaCues,
          validation_staging: updated.validation,
          readinessState,
        });
      } else {
        // No source change, just update cue
        const updatedMediaCues = [...stagingState.mediaCues];
        updatedMediaCues[cueIndex] = updatedCue;

        const updated = StagingState.updateStagingState(stagingState.stagingId, {
          mediaCues: updatedMediaCues,
        });

        const readinessState = StagingState.calculateReadiness(updated);

        emitAck(socket, 'stage:media:ack', {
          sessionId,
          opId,
          mediaCues_staging: updated.mediaCues,
          validation_staging: updated.validation,
          readinessState,
        });
      }
    } catch (err) {
      console.error(`[stagingPipeline] Error editing Media Cue: ${err.message}`);
      emitError(socket, 'stage:media:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Media Cue Delete
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Media Cue ID
   */
  function handleMediaCueDelete({ socket, sessionId, cueId } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot delete Media Cue: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const updatedMediaCues = stagingState.mediaCues.filter((c) => c.id !== cueId);

      // Remove from validation
      const updatedValidation = { ...stagingState.validation };
      if (updatedValidation.media[cueId]) {
        delete updatedValidation.media[cueId];
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        mediaCues: updatedMediaCues,
        validation: updatedValidation,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:media:ack', {
        sessionId,
        opId,
        mediaCues_staging: updated.mediaCues,
        validation_staging: updated.validation,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error deleting Media Cue: ${err.message}`);
      emitError(socket, 'stage:media:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Media Cue Validate
   * 
   * Validates a single media cue's reachability
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Media Cue ID
   */
  async function handleMediaCueValidate({ socket, sessionId, cueId } = {}) {
    const opId = generateOpId();

    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Check unified stack first, then legacy array
      let cue = null;
      let cueFromUnifiedStack = null;
      
      if (stagingState.cues && Array.isArray(stagingState.cues)) {
        // Support both media and presentation cues
        cueFromUnifiedStack = stagingState.cues.find((c) => (c.type === 'media' || c.type === 'presentation') && c.id === cueId);
      }
      
      if (cueFromUnifiedStack) {
        // Convert unified stack format to legacy format for validateMediaCue
        cue = {
          id: cueFromUnifiedStack.id,
          label: cueFromUnifiedStack.data.label,
          source: cueFromUnifiedStack.data.source,
          playback: cueFromUnifiedStack.data.playback,
          binding: cueFromUnifiedStack.data.binding,
          validation: cueFromUnifiedStack.data.validation,
        };
      } else {
        // Fallback to legacy array
        cue = stagingState.mediaCues?.find((c) => c.id === cueId);
      }

      if (!cue) {
        emitError(socket, 'stage:media:error', {
          sessionId,
          opId,
          code: 'CUE_NOT_FOUND',
          message: 'Media or Presentation Cue not found',
        });
        return;
      }

      // Validate the media cue (checks reachability)
      console.log(`[stagingPipeline] Validating media cue ${cueId}:`, cue.source?.url);
      const validation = await validateMediaCue(cue);
      console.log(`[stagingPipeline] Validation result for ${cueId}:`, validation);

      // Update validation state
      const updatedValidation = {
        ...stagingState.validation,
        media: {
          ...(stagingState.validation?.media || {}),
          [cueId]: {
            status: validation.status,
            reasons: validation.reasons || [],
            lastChecked: new Date().toISOString(),
          },
        },
      };

      // Update unified stack if cue came from there
      let updatedCues = stagingState.cues;
      if (cueFromUnifiedStack && stagingState.cues) {
        updatedCues = stagingState.cues.map((c) => {
          if (c.id === cueId && c.type === 'media') {
            return {
              ...c,
              data: {
                ...c.data,
                validation: {
                  status: validation.status,
                  reasons: validation.reasons || [],
                },
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
      }

      // Update legacy mediaCues array if needed
      let updatedMediaCues = stagingState.mediaCues;
      if (updatedMediaCues) {
        updatedMediaCues = updatedMediaCues.map((c) => {
          if (c.id === cueId) {
            return {
              ...c,
              validation: {
                status: validation.status,
                reasons: validation.reasons || [],
              },
            };
          }
          return c;
        });
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        validation: updatedValidation,
        cues: updatedCues,
        mediaCues: updatedMediaCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:media:ack', {
        sessionId,
        opId,
        mediaCues_staging: updated.mediaCues,
        validation_staging: updated.validation,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error validating Media Cue: ${err.message}`);
      emitError(socket, 'stage:media:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Entry State Update
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {Object} params.entry - Partial entry state updates
   */
  function handleEntryStateUpdate({ socket, sessionId, entry } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:entry:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot update entry state: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:entry:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Validate defaultFocusCueId if provided
      if (entry.defaultFocusCueId) {
        const cueExists = stagingState.focusCues.some((c) => c.id === entry.defaultFocusCueId);
        if (!cueExists) {
          emitError(socket, 'stage:entry:error', {
            sessionId,
            opId,
            code: 'INVALID_DEFAULT_FOCUS_CUE',
            message: 'Default Focus Cue not found',
          });
          return;
        }
      }

      // Anonymity is always ON and cannot be configured
      // Remove anonymityDefault from entry updates if provided (should not be sent from client)
      const { anonymityDefault, ...entryUpdates } = entry;
      if (anonymityDefault !== undefined && anonymityDefault !== 'on') {
        console.warn(`[stagingPipeline] Attempted to set anonymityDefault to '${anonymityDefault}'. Anonymity is always ON and cannot be changed.`);
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        entryState: {
          ...stagingState.entryState,
          ...entryUpdates,
          // Always ensure anonymity is ON (not configurable)
          anonymityDefault: 'on',
        },
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:entry:ack', {
        sessionId,
        opId,
        entryState_staging: updated.entryState,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error updating entry state: ${err.message}`);
      emitError(socket, 'stage:entry:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Requirements Update
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {Object} params.requirements - Partial requirements updates
   */
  function handleRequirementsUpdate({ socket, sessionId, requirements } = {}) {
    const opId = generateOpId();

    try {
      if (isSessionLive(sessionId)) {
        emitError(socket, 'stage:requirements:error', {
          sessionId,
          opId,
          code: 'SESSION_IS_LIVE',
          message: 'Cannot update requirements: Session is Live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'stage:requirements:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        requirements: {
          ...stagingState.requirements,
          ...requirements,
        },
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'stage:requirements:ack', {
        sessionId,
        opId,
        requirements_staging: updated.requirements,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error updating requirements: ${err.message}`);
      emitError(socket, 'stage:requirements:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Validation Request
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.subsystem - Optional: 'media' | 'executor' | 'slideControl' | 'all'
   */
  async function handleValidationRequest({ socket, sessionId, subsystem = 'all' } = {}) {
    console.log(`[stagingPipeline] Validation request received:`, { sessionId, subsystem });
    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        console.warn(`[stagingPipeline] Staging state not found for session: ${sessionId}`);
        socket.emit('stage:validate:error', {
          sessionId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found. Please ensure you have created a session first.',
        });
        return;
      }

      console.log(`[stagingPipeline] Staging state found, running validation...`);
      // Run validation (now async - checks reachability for all media cues)
      const validationResults = await validateAll({
        stageEnginePipeline,
        slideControlPipeline,
        sessionId,
        mediaCues: stagingState.mediaCues,
      });

      // Update staging state with validation results
      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        validation: validationResults,
      });

      // Calculate readiness
      const readinessState = StagingState.calculateReadiness(updated);

      // Update staging state field
      const finalState = StagingState.updateStagingState(stagingState.stagingId, {
        state: readinessState,
      });

      // Emit validation results
      if (subsystem === 'all' || subsystem === 'executor') {
        socket.emit('stage:validate:result', {
          sessionId,
          subsystem: 'executor',
          status: validationResults.executor.status,
          reasons: validationResults.executor.reasons,
          details: validationResults.executor,
        });
      }

      if (subsystem === 'all' || subsystem === 'slideControl') {
        socket.emit('stage:validate:result', {
          sessionId,
          subsystem: 'slideControl',
          status: validationResults.slideControl.status,
          reasons: validationResults.slideControl.reasons,
          details: validationResults.slideControl,
        });
      }

      if (subsystem === 'all' || subsystem === 'media') {
        Object.entries(validationResults.media).forEach(([cueId, result]) => {
          socket.emit('stage:validate:result', {
            sessionId,
            subsystem: 'media',
            cueId,
            status: result.status,
            reasons: result.reasons,
            details: result,
          });
        });
      }

      // Emit completion
      console.log(`[stagingPipeline] Validation complete:`, {
        sessionId,
        readinessState: finalState.state,
        executorStatus: validationResults.executor.status,
        slideControlStatus: validationResults.slideControl.status,
        mediaCuesCount: Object.keys(validationResults.media).length,
      });
      socket.emit('stage:validate:complete', {
        sessionId,
        readinessState: finalState.state,
        validationSummary: validationResults,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error validating: ${err.message}`, err);
      socket.emit('stage:validate:error', {
        sessionId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Stack Get
   * Fetch unified cue stack
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   */
  function handleCueStackGet({ socket, sessionId } = {}) {
    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        socket.emit('cue:stack:error', {
          sessionId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Ensure unified stack format
      if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
        socket.emit('cue:stack:error', {
          sessionId,
          code: 'INVALID_STATE',
          message: 'Staging state does not have unified stack format',
        });
        return;
      }

      socket.emit('cue:stack:response', {
        sessionId,
        cues: stagingState.cues,
        currentPosition: stagingState.currentPosition !== undefined ? stagingState.currentPosition : -1,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error getting cue stack: ${err.message}`);
      socket.emit('cue:stack:error', {
        sessionId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Create
   * Create new cue (type-aware: focus or media)
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.type - Cue type: 'focus' | 'media'
   * @param {Object} params.data - Cue data (type-specific)
   * @param {number} params.position - Optional: position to insert at (default: end)
   */
  async function handleCueCreate({ socket, sessionId, type, data, position } = {}) {
    const opId = generateOpId();

    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Ensure unified stack format
      if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'INVALID_STATE',
          message: 'Staging state does not have unified stack format',
        });
        return;
      }

      // Validate type
      if (type !== 'focus' && type !== 'media' && type !== 'presentation') {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'INVALID_TYPE',
          message: 'Cue type must be "focus", "media", or "presentation"',
        });
        return;
      }

      // Validate data based on type
      if (type === 'focus') {
        if (!data || !data.text || typeof data.text !== 'string' || !data.text.trim()) {
          emitError(socket, 'cue:error', {
            sessionId,
            opId,
            code: 'INVALID_INPUT',
            message: 'Focus cue requires text',
          });
          return;
        }
      } else if (type === 'media' || type === 'presentation') {
        if (!data || !data.label || !data.source) {
          emitError(socket, 'cue:error', {
            sessionId,
            opId,
            code: 'INVALID_INPUT',
            message: `${type === 'presentation' ? 'Presentation' : 'Media'} cue requires label and source`,
          });
          return;
        }
      }

      // Determine insertion position
      let insertPosition = stagingState.cues.length;
      if (typeof position === 'number' && position >= 0 && position <= stagingState.cues.length) {
        insertPosition = position;
      }

      // Create new cue
      const newCue = {
        id: `${type}_${Date.now()}_${randomUUID().slice(0, 8)}`,
        type,
        position: insertPosition,
        data: type === 'focus' 
          ? { text: data.text.trim(), isDefault: data.isDefault || false }
          : {
              label: data.label,
              source: data.source,
              playback: data.playback || { audioMode: 'videoOnly' },
              binding: data.binding,
              validation: { status: 'unvalidated' },
            },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate media/presentation cue if type is media or presentation
      if (type === 'media' || type === 'presentation') {
        const validation = await validateMediaCue({
          label: newCue.data.label,
          source: newCue.data.source,
          playback: newCue.data.playback,
          binding: newCue.data.binding,
        });
        newCue.data.validation = {
          status: validation.status,
          reasons: validation.reasons || [],
        };
      }

      // Insert cue at position
      const updatedCues = [...stagingState.cues];
      updatedCues.splice(insertPosition, 0, newCue);
      
      // Re-index positions
      updatedCues.forEach((cue, index) => {
        cue.position = index;
      });

      // Update legacy arrays for backward compatibility
      let updatedFocusCues = stagingState.focusCues || [];
      let updatedMediaCues = stagingState.mediaCues || [];

      if (type === 'focus') {
        const legacyFocusCue = {
          id: newCue.id,
          text: newCue.data.text,
          order: newCue.position,
          createdAt: newCue.createdAt,
          isSystemDefault: newCue.data.isDefault,
        };
        updatedFocusCues = [...updatedFocusCues, legacyFocusCue];
      } else if (type === 'media' || type === 'presentation') {
        // Presentations are stored in mediaCues array for backward compatibility
        const legacyMediaCue = {
          id: newCue.id,
          label: newCue.data.label,
          source: newCue.data.source,
          playback: newCue.data.playback,
          binding: newCue.data.binding,
          validation: newCue.data.validation,
          createdAt: newCue.createdAt,
        };
        updatedMediaCues = [...updatedMediaCues, legacyMediaCue];
      }

      // Update staging state with both unified stack and legacy arrays
      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        cues: updatedCues,
        focusCues: updatedFocusCues,
        mediaCues: updatedMediaCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      // Emit ACK
      emitAck(socket, 'cue:ack', {
        sessionId,
        opId,
        cues: updated.cues,
        currentPosition: updated.currentPosition,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error creating cue: ${err.message}`);
      emitError(socket, 'cue:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Edit
   * Edit existing cue (if allowed per contract rules)
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Cue ID
   * @param {Object} params.data - Updated cue data
   */
  async function handleCueEdit({ socket, sessionId, cueId, data } = {}) {
    const opId = generateOpId();

    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'INVALID_STATE',
          message: 'Staging state does not have unified stack format',
        });
        return;
      }

      const cueIndex = stagingState.cues.findIndex(c => c.id === cueId);
      if (cueIndex < 0) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'CUE_NOT_FOUND',
          message: 'Cue not found',
        });
        return;
      }

      const cue = stagingState.cues[cueIndex];
      const isLive = isSessionLive(sessionId);

      // Check editing rules per contract
      if (isLive) {
        // Live: Focus cues editable if unexecuted, Media/Presentation cues editable only if unvalidated
        if (cue.type === 'focus') {
          // Check if executed (position <= currentPosition)
          if (stagingState.currentPosition >= 0 && cue.position <= stagingState.currentPosition) {
            emitError(socket, 'cue:error', {
              sessionId,
              opId,
              code: 'CUE_EXECUTED',
              message: 'Cannot edit executed focus cue',
            });
            return;
          }
        } else if (cue.type === 'media' || cue.type === 'presentation') {
          // Media/Presentation cues immutable once validated
          if (cue.data.validation && cue.data.validation.status !== 'unvalidated') {
            emitError(socket, 'cue:error', {
              sessionId,
              opId,
              code: 'CUE_VALIDATED',
              message: `Cannot edit validated ${cue.type} cue`,
            });
            return;
          }
        }
      }

      // Update cue data
      const updatedCue = {
        ...cue,
        data: {
          ...cue.data,
          ...data,
        },
        updatedAt: new Date().toISOString(),
      };

      // Re-validate media/presentation cue if source changed
      if ((cue.type === 'media' || cue.type === 'presentation') && data.source) {
        const validation = await validateMediaCue({
          label: updatedCue.data.label,
          source: updatedCue.data.source,
          playback: updatedCue.data.playback,
          binding: updatedCue.data.binding,
        });
        updatedCue.data.validation = {
          status: validation.status,
          reasons: validation.reasons || [],
        };
      }

      // Update cues array
      const updatedCues = [...stagingState.cues];
      updatedCues[cueIndex] = updatedCue;

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        cues: updatedCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'cue:ack', {
        sessionId,
        opId,
        cues: updated.cues,
        currentPosition: updated.currentPosition,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error editing cue: ${err.message}`);
      emitError(socket, 'cue:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Delete
   * Delete cue (if allowed per contract rules)
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string} params.cueId - Cue ID
   */
  function handleCueDelete({ socket, sessionId, cueId } = {}) {
    const opId = generateOpId();

    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'INVALID_STATE',
          message: 'Staging state does not have unified stack format',
        });
        return;
      }

      const cueIndex = stagingState.cues.findIndex(c => c.id === cueId);
      if (cueIndex < 0) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'CUE_NOT_FOUND',
          message: 'Cue not found',
        });
        return;
      }

      const cue = stagingState.cues[cueIndex];
      const isLive = isSessionLive(sessionId);

      // Check deletion rules per contract
      if (isLive) {
        // Cannot delete executed cues
        if (stagingState.currentPosition >= 0 && cue.position <= stagingState.currentPosition) {
          emitError(socket, 'cue:error', {
            sessionId,
            opId,
            code: 'CUE_EXECUTED',
            message: 'Cannot delete executed cue',
          });
          return;
        }
      }

      // Prevent deleting default focus cue
      if (cue.type === 'focus' && cue.data.isDefault) {
        emitError(socket, 'cue:error', {
          sessionId,
          opId,
          code: 'CANNOT_DELETE_DEFAULT',
          message: 'Cannot delete default focus cue',
        });
        return;
      }

      // Remove cue
      const updatedCues = stagingState.cues.filter(c => c.id !== cueId);
      
      // Re-index positions
      updatedCues.forEach((c, index) => {
        c.position = index;
      });

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        cues: updatedCues,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'cue:ack', {
        sessionId,
        opId,
        cues: updated.cues,
        currentPosition: updated.currentPosition,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error deleting cue: ${err.message}`);
      emitError(socket, 'cue:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Stack Update (Reorder)
   * Update entire stack order
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   * @param {string[]} params.orderedCueIds - Ordered array of cue IDs
   */
  function handleCueStackUpdate({ socket, sessionId, orderedCueIds } = {}) {
    const opId = generateOpId();

    try {
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:stack:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      if (!stagingState.cues || !Array.isArray(stagingState.cues)) {
        emitError(socket, 'cue:stack:error', {
          sessionId,
          opId,
          code: 'INVALID_STATE',
          message: 'Staging state does not have unified stack format',
        });
        return;
      }

      if (!Array.isArray(orderedCueIds) || orderedCueIds.length === 0) {
        emitError(socket, 'cue:stack:error', {
          sessionId,
          opId,
          code: 'INVALID_INPUT',
          message: 'orderedCueIds must be a non-empty array',
        });
        return;
      }

      const isLive = isSessionLive(sessionId);
      const currentPosition = stagingState.currentPosition || -1;

      // Build cue map
      const cueMap = new Map(stagingState.cues.map(c => [c.id, c]));
      const reordered = [];

      // Reorder cues
      orderedCueIds.forEach((id, index) => {
        const cue = cueMap.get(id);
        if (cue) {
          // Check if reordering is allowed (only unexecuted cues)
          if (isLive && currentPosition >= 0 && cue.position <= currentPosition) {
            // Cannot reorder executed cues
            return;
          }
          reordered.push({
            ...cue,
            position: index,
          });
        }
      });

      // Add any cues not in ordered list (shouldn't happen, but defensive)
      stagingState.cues.forEach(cue => {
        if (!orderedCueIds.includes(cue.id)) {
          reordered.push({
            ...cue,
            position: reordered.length,
          });
        }
      });

      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        cues: reordered,
      });

      const readinessState = StagingState.calculateReadiness(updated);

      emitAck(socket, 'cue:stack:ack', {
        sessionId,
        opId,
        cues: updated.cues,
        currentPosition: updated.currentPosition,
        readinessState,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error updating cue stack: ${err.message}`);
      emitError(socket, 'cue:stack:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Stack Position Advance
   * Advance execution position
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   */
  function handleCueStackPositionAdvance({ socket, sessionId } = {}) {
    const opId = generateOpId();

    try {
      if (!isSessionLive(sessionId)) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'SESSION_NOT_LIVE',
          message: 'Cannot advance position: Session is not live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const currentPosition = stagingState.currentPosition !== undefined ? stagingState.currentPosition : -1;
      const maxPosition = stagingState.cues ? stagingState.cues.length - 1 : -1;

      if (currentPosition >= maxPosition) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'ALREADY_AT_END',
          message: 'Already at end of cue stack',
        });
        return;
      }

      const newPosition = currentPosition + 1;
      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        currentPosition: newPosition,
      });

      emitAck(socket, 'cue:stack:position:ack', {
        sessionId,
        opId,
        currentPosition: newPosition,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error advancing position: ${err.message}`);
      emitError(socket, 'cue:stack:position:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  /**
   * Handle Cue Stack Position Rewind
   * Rewind execution position
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   */
  function handleCueStackPositionRewind({ socket, sessionId } = {}) {
    const opId = generateOpId();

    try {
      if (!isSessionLive(sessionId)) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'SESSION_NOT_LIVE',
          message: 'Cannot rewind position: Session is not live',
        });
        return;
      }

      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      const currentPosition = stagingState.currentPosition !== undefined ? stagingState.currentPosition : -1;

      if (currentPosition <= -1) {
        emitError(socket, 'cue:stack:position:error', {
          sessionId,
          opId,
          code: 'ALREADY_AT_START',
          message: 'Already at start of cue stack',
        });
        return;
      }

      const newPosition = currentPosition - 1;
      const updated = StagingState.updateStagingState(stagingState.stagingId, {
        currentPosition: newPosition,
      });

      emitAck(socket, 'cue:stack:position:ack', {
        sessionId,
        opId,
        currentPosition: newPosition,
      });
    } catch (err) {
      console.error(`[stagingPipeline] Error rewinding position: ${err.message}`);
      emitError(socket, 'cue:stack:position:error', {
        sessionId,
        opId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  return {
    // Legacy handlers (backward compatibility)
    handleFocusCueCreate,
    handleFocusCueEdit,
    handleFocusCueDelete,
    handleFocusCueReorder,
    handleFocusCueSetDefault,
    handleMediaCueCreate,
    handleMediaCueEdit,
    handleMediaCueDelete,
    handleMediaCueValidate,
    handleEntryStateUpdate,
    handleRequirementsUpdate,
    handleValidationRequest,
    // Unified stack handlers
    handleCueStackGet,
    handleCueCreate,
    handleCueEdit,
    handleCueDelete,
    handleCueStackUpdate,
    handleCueStackPositionAdvance,
    handleCueStackPositionRewind,
  };
}
