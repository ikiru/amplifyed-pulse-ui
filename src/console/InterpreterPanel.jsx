// Phase 3 — Part 3B: UI displays cooldown + focus. No interpreter logic allowed.
import React from "react";
import {
  Panel,
  Title,
  Section,
  SectionLabel,
  Placeholder,
  PlaceholderBox,
  SmallText,
} from "./interpreterPanel.styles.js";

export default function InterpreterPanel({
  cooldown = { ready: true, remainingMs: 0 },
  focusedMessageId = null,
}) {
  return (
    <Panel>
      <Title>Interpreter (UI Only)</Title>

      <Section>
        <SectionLabel>Status</SectionLabel>
        <Placeholder>— engine not connected —</Placeholder>
      </Section>

      <Section>
        <SectionLabel>Recommended Move</SectionLabel>
        <Placeholder>No move (UI placeholder)</Placeholder>
      </Section>

      <Section>
        <SectionLabel>Signals</SectionLabel>
        <PlaceholderBox>
          <SmallText>Signal list goes here</SmallText>
        </PlaceholderBox>
      </Section>

      <Section>
        <SectionLabel>Realtime Status</SectionLabel>
        <PlaceholderBox>
          <SmallText>Cooldown ready: {cooldown.ready ? "Yes" : "No"}</SmallText>
          <SmallText>Remaining: {cooldown.remainingMs ?? 0}ms</SmallText>
          <SmallText>Focused message: {focusedMessageId ?? "—"}</SmallText>
        </PlaceholderBox>
      </Section>
    </Panel>
  );
}
