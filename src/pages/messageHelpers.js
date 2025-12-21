function buildFallbackType(payload, content) {
  if (typeof content.type === "string") {
    return content.type;
  }

  if (typeof payload.type === "string") {
    return payload.type;
  }

  return "message";
}

function extractText(payload, content, fallbackType) {
  if (typeof content.text === "string") {
    return content.text;
  }

  if (typeof payload.text === "string") {
    return payload.text;
  }

  return `[${fallbackType}]`;
}

export function adaptMessage(message = {}) {
  const envelope = message?.envelope;
  if (!envelope?.messageId) {
    return null;
  }

  const payload = message.payload ?? {};
  const content = payload.content ?? {};
  const fallbackType = buildFallbackType(payload, content);
  const text = extractText(payload, content, fallbackType);

  const rawTimestamp =
    envelope.timestamp ?? payload.ts ?? payload.timestamp ?? Date.now();
  const createdAt = new Date(rawTimestamp).toISOString();

  const actorRole =
    typeof envelope.authorRole === "string"
      ? envelope.authorRole
      : "audience";

  return {
    id: envelope.messageId,
    messageId: envelope.messageId,
    text,
    actorRole,
    createdAt,
    parentMessageId:
      envelope.parentMessageId ?? payload.parentMessageId ?? undefined,
    envelope,
    payload,
  };
}
