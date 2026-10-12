import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ProvenanceTag } from "@/ui/domain/ProvenanceTag";

describe("ProvenanceTag Component", () => {
  it("renders Grounded evidence with solid border and no advisory notice", () => {
    render(<ProvenanceTag isGrounded={true} source="docstring_anchor" />);
    const tag = screen.getByTestId("provenance-tag");

    expect(tag.dataset.grounded).toBe("true");
    expect(tag.style.border).toContain("solid");
    expect(screen.queryByTestId("advisory-notice")).toBeNull();
  });

  it("renders Advisory evidence with dashed border and explicit 'không vào aggregator' notice", () => {
    render(<ProvenanceTag isGrounded={false} source="llm_interpreter" />);
    const tag = screen.getByTestId("provenance-tag");
    const notice = screen.getByTestId("advisory-notice");

    expect(tag.dataset.grounded).toBe("false");
    expect(tag.style.border).toContain("dashed");
    expect(notice).not.toBeNull();
    expect(notice.textContent).toBe("không vào aggregator");
  });
});
