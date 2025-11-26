import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  gap: 0.75rem;
`;

export const TextInput = styled.textarea`
  flex: 1;
  min-height: 2.75rem;
  max-height: 6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  resize: none;
  font-size: 0.92rem;
  line-height: 1.4;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }
`;

export const SendButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 140ms ease;

  &:hover {
    background: #4f46e5;
  }

  &:disabled {
    background: #c7d2fe;
    cursor: not-allowed;
  }
`;
