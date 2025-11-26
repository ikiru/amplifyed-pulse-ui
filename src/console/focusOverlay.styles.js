import styled from "styled-components";

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
`;

export const HighlightGlow = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 3.2rem;

  /* Warm golden glow */
  background: radial-gradient(
    circle,
    rgba(255, 229, 153, 0.55) 0%,
    rgba(255, 229, 153, 0.18) 38%,
    rgba(255, 229, 153, 0.05) 55%,
    transparent 75%
  );

  border-radius: 12px;
  pointer-events: none;
  transition: top 0.22s ease-out, opacity 0.15s ease-out;
`;

export const EmotionTag = styled.div`
  position: absolute;
  right: -3.5rem;
  padding: 0.32rem 0.58rem;

  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;

  box-shadow:
    0px 1px 2px rgba(0, 0, 0, 0.08),
    0px 2px 6px rgba(0, 0, 0, 0.12);

  opacity: 0.92;
  pointer-events: none;
  transition: top 0.22s ease-out, opacity 0.2s ease-out;
`;

export const TagText = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  letter-spacing: 0.01em;
`;

