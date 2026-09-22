import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useShortcuts } from "../shortcuts";

function Harness({
  onSpace,
  onN,
  modal,
}: {
  onSpace: () => void;
  onN: () => void;
  modal?: boolean;
}) {
  useShortcuts([
    { key: " ", description: "toggle", handler: onSpace },
    { key: "n", description: "new", handler: onN },
  ]);
  return (
    <div>
      <button type="button">Knopf</button>
      {modal && <div role="dialog" aria-modal="true" />}
    </div>
  );
}

describe("useShortcuts", () => {
  it("fires on the page body", () => {
    const onSpace = vi.fn<() => void>();
    render(<Harness onSpace={onSpace} onN={() => {}} />);
    fireEvent.keyDown(document.body, { key: " " });
    expect(onSpace).toHaveBeenCalledTimes(1);
  });

  it("leaves Space to a focused button and ignores key repeat", () => {
    const onSpace = vi.fn<() => void>();
    render(<Harness onSpace={onSpace} onN={() => {}} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    fireEvent.keyDown(document.body, { key: " ", repeat: true });
    expect(onSpace).not.toHaveBeenCalled();
  });

  it("is inert while a modal dialog is open", () => {
    const onN = vi.fn<() => void>();
    render(<Harness onSpace={() => {}} onN={onN} modal />);
    fireEvent.keyDown(document.body, { key: "n" });
    expect(onN).not.toHaveBeenCalled();
  });
});
