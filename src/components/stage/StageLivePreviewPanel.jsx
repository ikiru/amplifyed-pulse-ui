import React, { useMemo } from 'react';

function getGoogleSlidesPresentationId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/https?:\/\/(?:docs\.)?google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}

function toGoogleSlidesEmbedUrl(url) {
  const id = getGoogleSlidesPresentationId(url);
  if (!id) return null;
  // Best-effort: request minimal chrome. Some decks may still render a small control bar.
  return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&rm=minimal`;
}

export default function StageLivePreviewPanel({
  cues = [],
  defaultFocusCueId,
  focusCueId,
  presentationCueId,
}) {
  const { focusText, presentationCue } = useMemo(() => {
    const effectiveFocusCueId = focusCueId || defaultFocusCueId || null;
    const focusCue =
      effectiveFocusCueId
        ? cues.find((c) => c?.type === 'focus' && c.id === effectiveFocusCueId)
        : null;
    const focusTextResolved = focusCue?.data?.text || focusCue?.text || 'Open Conversation';

    const selectedPresentation =
      presentationCueId
        ? cues.find((c) => c?.type === 'presentation' && c.id === presentationCueId)
        : null;

    const firstPresentation = [...cues]
      .filter((c) => c?.type === 'presentation' && typeof c.position === 'number')
      .sort((a, b) => a.position - b.position)[0];

    return {
      focusText: focusTextResolved,
      presentationCue: selectedPresentation || firstPresentation || null,
    };
  }, [cues, defaultFocusCueId, focusCueId, presentationCueId]);

  const slides = useMemo(() => {
    if (!presentationCue) {
      return { kind: 'empty' };
    }

    const source = presentationCue?.data?.source;
    const sourceType = source?.type;

    if (sourceType === 'googleslides' && source?.url) {
      const embedUrl = toGoogleSlidesEmbedUrl(source.url);
      if (!embedUrl) {
        return {
          kind: 'unavailable',
          label: 'Google Slides URL could not be parsed',
          detail: source.url,
          provider: 'googleslides',
        };
      }
      return {
        kind: 'embed',
        embedUrl,
        label: presentationCue.data?.label || 'Presentation',
        detail: source.url,
        provider: 'googleslides',
      };
    }

    if (sourceType === 'powerpoint') {
      // Best-effort: some providers will block iframe embedding. We still surface the URL/path.
      if (source?.url) {
        return {
          kind: 'embed',
          embedUrl: source.url,
          label: presentationCue.data?.label || 'Presentation',
          detail: source.url,
          provider: 'powerpoint',
        };
      }
      if (source?.filePath) {
        return {
          kind: 'unavailable',
          label: 'PowerPoint file selected (preview not available)',
          detail: source.filePath,
          provider: 'powerpoint',
        };
      }
    }

    return {
      kind: 'unavailable',
      label: 'Presentation preview not available for this source',
      detail: source?.url || source?.filePath || '',
      provider: 'unknown',
    };
  }, [presentationCue]);

  return (
    <div className="stage-live-preview">
      <div className="panel-header">
        <h2>Live Preview</h2>
        <p className="panel-description">What participants will see at join (best-effort)</p>
      </div>

      <div className="stage-live-preview-focus">
        <div className="stage-live-preview-focus-label">CURRENT FOCUS</div>
        <div className="stage-live-preview-focus-text">{focusText}</div>
      </div>

      <div className="stage-live-preview-slides">
        {slides.kind === 'empty' ? (
          <div className="stage-live-preview-placeholder">
            <div className="stage-live-preview-placeholder-title">Slides</div>
            <div className="stage-live-preview-placeholder-subtle">
              Add a Presentation cue to preview slide 1.
            </div>
          </div>
        ) : slides.kind === 'unavailable' ? (
          <div className="stage-live-preview-placeholder">
            <div className="stage-live-preview-placeholder-title">Slides</div>
            <div className="stage-live-preview-placeholder-subtle">{slides.label}</div>
            {slides.detail ? (
              <div className="stage-live-preview-source" title={slides.detail}>
                {slides.detail}
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={`stage-live-preview-embed-shell${
              slides.provider === 'googleslides' ? ' stage-live-preview-embed-shell--googleslides' : ''
            }`}
            title={slides.detail || undefined}
          >
            <iframe
              className="stage-live-preview-embed"
              src={slides.embedUrl}
              title={slides.label}
              allow="fullscreen"
            />
            <div className="stage-live-preview-embed-overlay" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

