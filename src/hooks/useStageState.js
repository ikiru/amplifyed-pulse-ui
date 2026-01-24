import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing staging state (Stage page)
 * 
 * Manages pre-session authoring state: Focus Cues, Media Cues, Entry State, Requirements.
 * Handles all stage:* socket events and state synchronization.
 * 
 * @param {Object} params
 * @param {string} params.sessionId - Session identifier (required - session must exist first)
 * @param {Object} params.socket - Socket instance
 * @param {Function} params.emit - Socket emit function
 * @param {Function} params.onEvent - Socket event listener registration
 * @param {Function} params.offEvent - Socket event listener cleanup
 * @returns {Object} Staging state and operations
 */
export function useStageState({ sessionId, socket, emit, onEvent, offEvent }) {
  const [stagingState, setStagingState] = useState(null);
  const [sessionState, setSessionState] = useState('DRAFT'); // 'DRAFT' | 'STAGED' | 'LIVE'
  const [readinessState, setReadinessState] = useState('DRAFT');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track pending operations for optimistic updates
  const pendingOpsRef = useRef(new Map()); // opId → { type, optimisticState }

  // Derive isReadOnly from sessionState
  const isReadOnly = sessionState === 'LIVE';

  /**
   * Fetch staging state from server
   */
  const fetchStagingState = useCallback(() => {
    if (!sessionId || !emit) return;

    setIsLoading(true);
    setError(null);

    emit('session:state:get', { sessionId });
  }, [sessionId, emit]);

  /**
   * Handle session:state:response
   */
  useEffect(() => {
    if (!sessionId) return;

    const handleStateResponse = (payload) => {
      if (payload.sessionId !== sessionId) return;

      setIsLoading(false);

      if (payload.error) {
        setError(payload.error);
        return;
      }

      setSessionState(payload.state || 'DRAFT');

      if (payload.stagingPayload) {
        const newStagingState = {
          focusCues: payload.stagingPayload.focusCues || [],
          mediaCues: payload.stagingPayload.mediaCues || [],
          entryState: payload.stagingPayload.entryState || {},
          requirements: payload.stagingPayload.requirements || {},
          validation: payload.stagingPayload.validation || {},
        };
        setStagingState(newStagingState);
        setReadinessState(payload.stagingPayload.readinessState || 'DRAFT');
        
        // Auto-validate on load if validation is missing or incomplete
        const validation = newStagingState.validation || {};
        const needsValidation = !validation.executor || !validation.slideControl || 
          !validation.executor.status || !validation.slideControl.status ||
          validation.executor.status === 'unvalidated' || validation.slideControl.status === 'unvalidated';
        
        if (needsValidation && emit) {
          // Small delay to ensure state is set before validation
          setTimeout(() => {
            emit('stage:validate:request', { sessionId, subsystem: 'all' });
          }, 100);
        }
      } else {
        // LIVE state - staging payload not available
        setStagingState(null);
      }
    };

    onEvent('session:state:response', handleStateResponse);

    return () => {
      offEvent('session:state:response', handleStateResponse);
    };
  }, [sessionId, onEvent, offEvent, emit]);

  /**
   * Handle session:state:update (broadcast when state changes)
   */
  useEffect(() => {
    const handleStateUpdate = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const newState = payload.state;
      setSessionState(newState);

      // If going LIVE, staging state becomes read-only
      if (newState === 'LIVE') {
        // Staging state is no longer accessible
        setStagingState(null);
      }
    };

    onEvent('session:state:update', handleStateUpdate);

    return () => {
      offEvent('session:state:update', handleStateUpdate);
    };
  }, [sessionId, onEvent, offEvent]);

  /**
   * Handle ACK responses for stage operations
   */
  useEffect(() => {
    const handleFocusAck = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      // Update state from server response
      if (payload.focusCues_staging) {
        setStagingState((prev) => ({
          ...prev,
          focusCues: payload.focusCues_staging,
          entryState: payload.entryState_staging || prev?.entryState,
        }));
      }

      if (payload.readinessState) {
        setReadinessState(payload.readinessState);
      }

      // Clear pending operation
      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleFocusError = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      setError(payload.message || payload.code);

      // Rollback optimistic update if any
      if (pending?.optimisticState) {
        setStagingState(pending.optimisticState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleMediaAck = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      if (payload.mediaCues_staging) {
        setStagingState((prev) => ({
          ...prev,
          mediaCues: payload.mediaCues_staging,
          validation: payload.validation_staging || prev?.validation,
        }));
      }

      if (payload.readinessState) {
        setReadinessState(payload.readinessState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleMediaError = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      setError(payload.message || payload.code);

      if (pending?.optimisticState) {
        setStagingState(pending.optimisticState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleEntryAck = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      if (payload.entryState_staging) {
        setStagingState((prev) => ({
          ...prev,
          entryState: payload.entryState_staging,
        }));
      }

      if (payload.readinessState) {
        setReadinessState(payload.readinessState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleEntryError = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      setError(payload.message || payload.code);

      if (pending?.optimisticState) {
        setStagingState(pending.optimisticState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleRequirementsAck = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      if (payload.requirements_staging) {
        setStagingState((prev) => ({
          ...prev,
          requirements: payload.requirements_staging,
        }));
      }

      if (payload.readinessState) {
        setReadinessState(payload.readinessState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    const handleRequirementsError = (payload) => {
      if (payload.sessionId !== sessionId) return;

      const opId = payload.opId;
      const pending = pendingOpsRef.current.get(opId);

      setError(payload.message || payload.code);

      if (pending?.optimisticState) {
        setStagingState(pending.optimisticState);
      }

      if (pending) {
        pendingOpsRef.current.delete(opId);
      }
    };

    onEvent('stage:focus:ack', handleFocusAck);
    onEvent('stage:focus:error', handleFocusError);
    onEvent('stage:media:ack', handleMediaAck);
    onEvent('stage:media:error', handleMediaError);
    onEvent('stage:entry:ack', handleEntryAck);
    onEvent('stage:entry:error', handleEntryError);
    onEvent('stage:requirements:ack', handleRequirementsAck);
    onEvent('stage:requirements:error', handleRequirementsError);

    return () => {
      offEvent('stage:focus:ack', handleFocusAck);
      offEvent('stage:focus:error', handleFocusError);
      offEvent('stage:media:ack', handleMediaAck);
      offEvent('stage:media:error', handleMediaError);
      offEvent('stage:entry:ack', handleEntryAck);
      offEvent('stage:entry:error', handleEntryError);
      offEvent('stage:requirements:ack', handleRequirementsAck);
      offEvent('stage:requirements:error', handleRequirementsError);
    };
  }, [sessionId, onEvent, offEvent]);

  /**
   * Handle validation results
   */
  useEffect(() => {
    const handleValidateResult = (payload) => {
      if (payload.sessionId !== sessionId) return;

      console.log('[useStageState] Validation result received:', payload);
      setStagingState((prev) => {
        if (!prev) return prev;

        const updated = { ...prev };
        if (!updated.validation) {
          updated.validation = {};
        }

        if (payload.subsystem === 'executor' || payload.subsystem === 'obs') {
          // Normalize 'obs' to 'executor' for backward compat or just overwrite
          updated.validation.executor = payload.details || {
            status: payload.status,
            reasons: payload.reasons,
          };
        } else if (payload.subsystem === 'slideControl') {
          updated.validation.slideControl = payload.details || {
            status: payload.status,
            reasons: payload.reasons,
          };
        } else if (payload.subsystem === 'media' && payload.cueId) {
          if (!updated.validation.media) {
            updated.validation.media = {};
          }
          updated.validation.media[payload.cueId] = payload.details || {
            status: payload.status,
            reasons: payload.reasons,
          };
        }

        return updated;
      });
    };

    const handleValidateComplete = (payload) => {
      if (payload.sessionId !== sessionId) return;

      console.log('[useStageState] Validation complete:', payload);
      if (payload.readinessState) {
        setReadinessState(payload.readinessState);
      }
    };

    const handleValidateError = (payload) => {
      if (payload.sessionId !== sessionId) return;

      console.error('[useStageState] Validation error:', payload);
      setError(payload.message || payload.code || 'Validation failed');
    };

    onEvent('stage:validate:result', handleValidateResult);
    onEvent('stage:validate:complete', handleValidateComplete);
    onEvent('stage:validate:error', handleValidateError);

    return () => {
      offEvent('stage:validate:result', handleValidateResult);
      offEvent('stage:validate:complete', handleValidateComplete);
      offEvent('stage:validate:error', handleValidateError);
    };
  }, [sessionId, onEvent, offEvent]);

  // Fetch staging state on mount and when sessionId changes
  useEffect(() => {
    if (sessionId && socket?.connected) {
      fetchStagingState();
    }
  }, [sessionId, socket?.connected, fetchStagingState]);

  /**
   * Generate operation ID
   */
  const generateOpId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  /**
   * Save current state for optimistic rollback
   */
  const saveStateForRollback = useCallback(() => {
    return stagingState ? JSON.parse(JSON.stringify(stagingState)) : null;
  }, [stagingState]);

  // Focus Cue operations
  const createFocusCue = useCallback((text, insertAfterCueId) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    const newCue = {
      id: `focus_temp_${Date.now()}`,
      text,
      order: stagingState?.focusCues?.length || 0,
      createdAt: new Date().toISOString(),
    };

    setStagingState((prev) => ({
      ...prev,
      focusCues: [...(prev?.focusCues || []), newCue],
    }));

    pendingOpsRef.current.set(opId, {
      type: 'focus:create',
      optimisticState: previousState,
    });

    emit('stage:focus:create', {
      sessionId,
      text,
      insertAfterCueId,
    });
  }, [sessionId, emit, isReadOnly, stagingState, generateOpId, saveStateForRollback]);

  const editFocusCue = useCallback((cueId, text, editMode = 'edit_in_place') => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      focusCues: (prev?.focusCues || []).map((cue) =>
        cue.id === cueId ? { ...cue, text } : cue
      ),
    }));

    pendingOpsRef.current.set(opId, {
      type: 'focus:edit',
      optimisticState: previousState,
    });

    emit('stage:focus:edit', {
      sessionId,
      cueId,
      text,
      editMode,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  const deleteFocusCue = useCallback((cueId) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      focusCues: (prev?.focusCues || []).filter((cue) => cue.id !== cueId),
    }));

    pendingOpsRef.current.set(opId, {
      type: 'focus:delete',
      optimisticState: previousState,
    });

    emit('stage:focus:delete', {
      sessionId,
      cueId,
      });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  const reorderFocusCues = useCallback((orderedIds) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => {
      const cueMap = new Map((prev?.focusCues || []).map((cue) => [cue.id, cue]));
      const reordered = orderedIds
        .map((id) => cueMap.get(id))
        .filter(Boolean)
        .map((cue, index) => ({ ...cue, order: index }));

      return {
        ...prev,
        focusCues: reordered,
      };
    });

    pendingOpsRef.current.set(opId, {
      type: 'focus:reorder',
      optimisticState: previousState,
    });

    emit('stage:focus:reorder', {
      sessionId,
      orderedCueIds: orderedIds,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  const setDefaultFocusCue = useCallback((cueId) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      entryState: {
        ...prev?.entryState,
        defaultFocusCueId: cueId,
      },
    }));

    pendingOpsRef.current.set(opId, {
      type: 'focus:set_default',
      optimisticState: previousState,
    });

    emit('stage:focus:set_default', {
      sessionId,
      defaultFocusCueId: cueId,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  // Media Cue operations
  const createMediaCue = useCallback((cueData) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    const newCue = {
      id: `media_temp_${Date.now()}`,
      label: cueData.label || 'Untitled Media',
      source: cueData.source || {},
      playback: cueData.playback || { audioMode: 'videoOnly' },
      binding: cueData.binding,
      validation: { status: 'unvalidated' },
      createdAt: new Date().toISOString(),
    };

    setStagingState((prev) => ({
      ...prev,
      mediaCues: [...(prev?.mediaCues || []), newCue],
    }));

    pendingOpsRef.current.set(opId, {
      type: 'media:create',
      optimisticState: previousState,
    });

    emit('stage:media:create', {
      sessionId,
      ...cueData,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  const editMediaCue = useCallback((cueId, updates) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      mediaCues: (prev?.mediaCues || []).map((cue) =>
        cue.id === cueId ? { ...cue, ...updates } : cue
      ),
    }));

    pendingOpsRef.current.set(opId, {
      type: 'media:edit',
      optimisticState: previousState,
    });

    emit('stage:media:edit', {
      sessionId,
      cueId,
      ...updates,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  const deleteMediaCue = useCallback((cueId) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      mediaCues: (prev?.mediaCues || []).filter((cue) => cue.id !== cueId),
    }));

    pendingOpsRef.current.set(opId, {
      type: 'media:delete',
      optimisticState: previousState,
    });

    emit('stage:media:delete', {
      sessionId,
      cueId,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  // Entry State operations
  const updateEntryState = useCallback((updates) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      entryState: {
        ...prev?.entryState,
        ...updates,
      },
    }));

    pendingOpsRef.current.set(opId, {
      type: 'entry:update',
      optimisticState: previousState,
    });

    emit('stage:entry:update', {
      sessionId,
      entry: updates,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  // Requirements operations
  const updateRequirements = useCallback((updates) => {
    if (!sessionId || !emit || isReadOnly) return;

    const opId = generateOpId();
    const previousState = saveStateForRollback();

    // Optimistic update
    setStagingState((prev) => ({
      ...prev,
      requirements: {
        ...prev?.requirements,
        ...updates,
      },
    }));

    pendingOpsRef.current.set(opId, {
      type: 'requirements:update',
      optimisticState: previousState,
    });

    emit('stage:requirements:update', {
      sessionId,
      requirements: updates,
    });
  }, [sessionId, emit, isReadOnly, generateOpId, saveStateForRollback]);

  // Validation operations
  const requestValidation = useCallback((subsystem = 'all') => {
    if (!sessionId || !emit) {
      console.warn('[useStageState] Cannot validate: missing sessionId or emit', { 
        sessionId, 
        hasEmit: !!emit 
      });
      return;
    }

    console.log('[useStageState] Requesting validation:', { sessionId, subsystem });
    emit('stage:validate:request', {
      sessionId,
      subsystem,
    });
  }, [sessionId, emit]);

  return {
    // State
    stagingState,
    sessionState,
    readinessState,
    isReadOnly,
    isLoading,
    error,

    // Focus Cue operations
    createFocusCue,
    editFocusCue,
    deleteFocusCue,
    reorderFocusCues,
    setDefaultFocusCue,

    // Media Cue operations
    createMediaCue,
    editMediaCue,
    deleteMediaCue,

    // Entry State operations
    updateEntryState,

    // Requirements operations
    updateRequirements,

    // Validation operations
    requestValidation,

    // Utility
    refetch: fetchStagingState,
  };
}
