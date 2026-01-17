import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ThreadItem } from "../components/messages/ThreadItem.jsx";

describe("ThreadItem defaultCollapsed", () => {
  it("hides replies by default for root threads when defaultCollapsed is true, and reveals on toggle", () => {
    const node = {
      messageId: "root",
      text: "Root message",
      replies: [
        {
          messageId: "child",
          parentMessageId: "root",
          text: "Child reply",
          replies: [],
        },
      ],
    };

    render(
      <ThreadItem
        node={node}
        depth={0}
        defaultCollapsed={true}
        // Keep props minimal; collapse behavior should be independent
        showVoteControls={false}
        showVoteTotals={false}
        showReplyControls={false}
      />
    );

    expect(screen.getByText("Root message")).toBeInTheDocument();
    expect(screen.queryByText("Child reply")).not.toBeInTheDocument();

    // Expand
    const toggle = screen.getByRole("button", { name: /show replies/i });
    fireEvent.click(toggle);
    expect(screen.getByText("Child reply")).toBeInTheDocument();
  });
});

