import React, { useEffect } from 'react';
import { useSocket } from '../socket/SocketContext.jsx';
import { useSessionState } from '../hooks/useSessionState.js';
import { useStageState } from '../hooks/useStageState.js';
import StageHeader from '../components/stage/StageHeader.jsx';
import UnifiedCueStackPanel from '../components/stage/UnifiedCueStackPanel.jsx';
import ReadinessPanel from '../components/stage/ReadinessPanel.jsx';
import ReadOnlyOverlay from '../components/stage/ReadOnlyOverlay.jsx';
import StageLivePreviewPanel from '../components/stage/StageLivePreviewPanel.jsx';
import './StageView.css';

export default function StageView() {
  const { socket, emit, onEvent, offEvent, connectionStatus } = useSocket();
  const { sessionId } = useSessionState({ socket, emit, onEvent, offEvent });

  // Ensure this client is registered as a trainer (required for stage:* operations)
  useEffect(() => {
    if (!socket?.connected) return;
    emit("session:join", {
      role: "trainer",
      name: "Trainer",
      metadata: { client: "stage_view" },
    });
  }, [socket?.connected, emit]);

  const {
    stagingState,
    sessionState,
    readinessState,
    isReadOnly,
    isLoading,
    error,
    // Legacy operations (backward compatibility)
    createFocusCue,
    editFocusCue,
    deleteFocusCue,
    reorderFocusCues,
    setDefaultFocusCue,
    createMediaCue,
    editMediaCue,
    deleteMediaCue,
    validateMediaCue,
    // Unified stack operations
    createCue,
    editCue,
    deleteCue,
    reorderCues,
    advancePosition,
    rewindPosition,
    updateEntryState,
    updateRequirements,
    requestValidation,
    refetch,
  } = useStageState({
    sessionId,
    socket,
    emit,
    onEvent,
    offEvent,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="stage-page">
        <div className="stage-loading">
          <p>Loading staging state...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !stagingState) {
    return (
      <div className="stage-page">
        <div className="stage-error">
          <p>Error loading staging state: {error}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      </div>
    );
  }

  // Show message if no sessionId
  if (!sessionId) {
    return (
      <div className="stage-page">
        <div className="stage-error">
          <p>No session ID available. Please join a session first.</p>
        </div>
      </div>
    );
  }

  const resolvedCues = (stagingState?.cues || []).map((cue) => {
    if (!cue || (cue.type !== 'media' && cue.type !== 'presentation')) {
      return cue;
    }

    const validationFromSummary = stagingState?.validation?.media?.[cue.id];
    if (!validationFromSummary) {
      return cue;
    }

    return {
      ...cue,
      data: {
        ...cue.data,
        validation: validationFromSummary,
      },
    };
  });

  const shouldShowReadinessDetails = (() => {
    const validation = stagingState?.validation;
    const requirements = stagingState?.requirements;

    const executorStatus = validation?.executor?.status;
    const slideStatus = validation?.slideControl?.status;

    const executorReady = executorStatus === 'ready';
    const slideRequired = !!requirements?.slideControlRequired;
    const slideReady = slideStatus === 'ready';

    // Show details when executor is not ready/unvalidated, or when slide control is required but not ready/unvalidated.
    if (!executorReady) return true;
    if (slideRequired && !slideReady) return true;
    return false;
  })();

  return (
    <div className="stage-page">
      <ReadOnlyOverlay isVisible={isReadOnly} sessionId={sessionId} />

      <StageHeader
        sessionState={sessionState}
        readinessState={readinessState}
        validationSummary={stagingState?.validation}
        requirements={stagingState?.requirements}
        isReadOnly={isReadOnly}
        onValidateAll={() => requestValidation('all')}
        onToggleSlideControlRequired={(slideControlRequired) =>
          updateRequirements({ slideControlRequired })
        }
      />

      <div className="stage-content">
        <div className="stage-main-panels">
          <UnifiedCueStackPanel
            cues={resolvedCues}
            currentPosition={stagingState?.currentPosition !== undefined ? stagingState.currentPosition : -1}
            defaultFocusCueId={stagingState?.entryState?.defaultFocusCueId}
            validation={stagingState?.validation}
            isReadOnly={isReadOnly}
            onCreate={(type, data, position) => createCue(type, data, position)}
            onEdit={(cueId, data) => editCue(cueId, data)}
            onDelete={deleteCue}
            onReorder={reorderCues}
            onSetDefault={(cueId) => {
              setDefaultFocusCue(cueId);
            }}
          />
        </div>

        <div className="stage-config-panels">
          <StageLivePreviewPanel
            cues={stagingState?.cues || []}
            defaultFocusCueId={stagingState?.entryState?.defaultFocusCueId}
          />

          {shouldShowReadinessDetails && (
            <ReadinessPanel validation={stagingState?.validation || {}} />
          )}
        </div>
      </div>

      {error && (
        <div className="stage-error-banner">
          <p>Error: {error}</p>
          <button onClick={() => {}}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
