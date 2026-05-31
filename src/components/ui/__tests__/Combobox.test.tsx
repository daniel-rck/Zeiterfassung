import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Combobox, type ComboOption } from "../Combobox";

const options: ComboOption[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "g", label: "Gamma" },
];

function open() {
  // The trigger button carries aria-haspopup="listbox".
  fireEvent.click(screen.getByRole("button", { name: "Auswählen" }));
}

describe("Combobox", () => {
  it("selects the highlighted match with Enter after filtering", () => {
    const onChange = vi.fn();
    render(
      <Combobox options={options} value={undefined} onChange={onChange} ariaLabel="Auswählen" />,
    );
    open();
    const search = screen.getByPlaceholderText("Suchen…");
    // Narrow to a single match. Before the highlight-reset fix the highlight
    // could point past the (now shorter) list, making Enter select nothing.
    fireEvent.change(search, { target: { value: "gam" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("g");
  });

  it("resets the highlight to the first match when the query changes", () => {
    const onChange = vi.fn();
    render(
      <Combobox options={options} value={undefined} onChange={onChange} ariaLabel="Auswählen" />,
    );
    open();
    const search = screen.getByPlaceholderText("Suchen…");
    // Move the highlight down to index 2 (Gamma)…
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    // …then type a query that yields a different single result.
    fireEvent.change(search, { target: { value: "bet" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
