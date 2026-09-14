// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppErrorBoundary from "./AppErrorBoundary";

function BrokenView(): never {
  throw new Error("private technical detail");
}

describe("AppErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a safe recovery screen without exposing error details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onReload = vi.fn();
    const user = userEvent.setup();

    render(
      <AppErrorBoundary onReload={onReload}>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert").textContent).not.toContain(
      "private technical detail",
    );
    expect(screen.getByText("应用遇到问题")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "重新加载 / Reload" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
