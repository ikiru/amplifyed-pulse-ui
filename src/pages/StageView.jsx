import React, { useEffect } from 'react';
import { useSocket } from '../socket/SocketContext.jsx';
import { useSessionState } from '../hooks/useSessionState.js';
import { useStageState } from '../hooks/useStageState.js';
import StageHeader from '../components/stage/StageHeader.jsx';
import UnifiedCueStackPanel from '../components/stage/UnifiedCueStackPanel.jsx';
import EntryStatePanel from '../components/stage/EntryStatePanel.jsx';
import ReadinessPanel from '../components/stage/ReadinessPanel.jsx';
import ReadOnlyOverlay from '../components/stage/ReadOnlyOverlay.jsx';
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

  return (
    <div className="stage-page">
      <ReadOnlyOverlay isVisible={isReadOnly} sessionId={sessionId} />

      <StageHeader
        sessionState={sessionState}
        readinessState={readinessState}
        validationSummary={stagingState?.validation}
      />

      <div className="stage-content">
        <div className="stage-main-panels">
          <UnifiedCueStackPanel
            cues={stagingState?.cues || []}
            currentPosition={stagingState?.currentPosition !== undefined ? stagingState.currentPosition : -1}
            defaultFocusCueId={stagingState?.entryState?.defaultFocusCueId}
            validation={stagingState?.validation}
            isReadOnly={isReadOnly}
            onCreate={(type, data, position) => {
              if (type === 'focus') {
                createCue('focus', data, position);
              } else if (type === 'media') {
                createCue('media', data, position);
              } else if (type === 'presentation') {
                createCue('presentation', data, position);
              }
            }}
            onEdit={(cueId, data) => {
              editCue(cueId, data);
            }}
            onDelete={deleteCue}
            onReorder={reorderCues}
            onSetDefault={(cueId) => {
              setDefaultFocusCue(cueId);
            }}
          />
        </div>

        <div className="stage-config-panels">
          <EntryStatePanel
            entryState={stagingState?.entryState || {}}
            cues={stagingState?.cues || []}
            focusCues={stagingState?.focusCues || []}
            isReadOnly={isReadOnly}
            onUpdate={updateEntryState}
          />

          <ReadinessPanel
            validation={stagingState?.validation || {}}
            requirements={stagingState?.requirements || {}}
            cues={stagingState?.cues || []}
            mediaCues={stagingState?.mediaCues || []}
            isReadOnly={isReadOnly}
            onRequirementToggle={updateRequirements}
            onValidateRequest={requestValidation}
          />
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
