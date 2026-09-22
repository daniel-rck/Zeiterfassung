import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Sheet } from "../Sheet";

function Harness({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    // Inline arrow on purpose: callers do this everywhere, so the identity
    // changes on every render.
    <Sheet open title="Test" onClose={() => onClose()}>
      <input
        // biome-ignore lint/a11y/noAutofocus: mirrors the project/tag sheets
        autoFocus
        aria-label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Sheet>
  );
}

describe("Sheet", () => {
  // jsdom has no layout, so every element reports offsetParent === null and
  // the Sheet would treat all controls as hidden. Pretend everything is laid
  // out, as in a browser — that is where the header close button stole focus.
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetParent");
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      configurable: true,
      get() {
        return (this as HTMLElement).parentElement;
      },
    });
  });
  afterAll(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, "offsetParent", original);
  });

  it("keeps focus in the field while typing (re-renders must not refocus)", async () => {
    const user = userEvent.setup();
    render(<Harness onClose={() => {}} />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveFocus();
    await user.type(input, "Kunde");
    expect(input).toHaveFocus();
    expect(input).toHaveValue("Kunde");
  });

  it("closes on Escape, but not when a nested popup handled it", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const handled = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    handled.preventDefault();
    window.dispatchEvent(handled);
    expect(onClose).not.toHaveBeenCalled();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
