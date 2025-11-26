export const bubbleBase = {
  padding: "0.85rem 1rem",
  borderRadius: 12,
  fontSize: "0.95rem",
  lineHeight: 1.45,
  maxWidth: "88%",
  border: "1px solid transparent",
  transition: "all 160ms ease",
};

export const userBubble = {
  ...bubbleBase,
  background: "#eef2ff",
  alignSelf: "flex-start",
};

export const facilitatorBubble = {
  ...bubbleBase,
  background: "#f5f3ff",
  alignSelf: "flex-start",
};

export const focused = {
  border: "2px solid #f59e0b",
  background: "#fff7ed",
};

export const author = {
  fontWeight: 600,
};
