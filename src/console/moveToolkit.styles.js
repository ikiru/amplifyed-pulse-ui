// src/console/moveToolkit.styles.js
import styled from "styled-components";

export const ToolkitContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

/* This is the missing export */
export const MoveButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, border 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  &:active {
    background: rgba(255, 255, 255, 0.25);
  }
`;
