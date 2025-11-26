import styled from "styled-components";

export const Panel = styled.div`
  width: 100%;
  padding: 1.2rem 1.4rem;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
`;

export const Title = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const SectionLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
`;

export const Placeholder = styled.div`
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.86rem;
`;

export const PlaceholderBox = styled.div`
  padding: 0.6rem;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
`;

export const SmallText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;
