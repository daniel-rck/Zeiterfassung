import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfirmProvider, useConfirm } from "../Confirm";

function Opener() {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => void confirm.confirm({ title: "Sicher?", tone: "danger" })}
    >
      Löschen
    </button>
  );
}

describe("Confirm", () => {
  it("starts destructive dialogs on Abbrechen and returns focus to the opener", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Opener />
      </ConfirmProvider>,
    );
    const opener = screen.getByRole("button", { name: "Löschen" });
    await user.click(opener);
    expect(screen.getByRole("button", { name: "Abbrechen" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
});
