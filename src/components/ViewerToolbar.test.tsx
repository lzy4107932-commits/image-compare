// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n";
import ViewerToolbar from "./ViewerToolbar";

describe("ViewerToolbar transform actions", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
  });

  afterEach(() => {
    cleanup();
  });

  it("visually and semantically distinguishes rotate from reset", async () => {
    const user = userEvent.setup();
    const onRotate = vi.fn();
    const onReset = vi.fn();

    render(
      <I18nProvider>
        <ViewerToolbar
          viewMode="single"
          zoom={125}
          onZoomOut={vi.fn()}
          onZoomIn={vi.fn()}
          onReset={onReset}
          onRotate={onRotate}
        />
      </I18nProvider>,
    );

    const rotate = screen.getByRole("button", {
      name: "Rotate clockwise 90°",
    });
    const reset = screen.getAllByRole("button", { name: "Reset" }).at(-1);

    expect(rotate.classList.contains("transform-rotate-button")).toBe(true);
    expect(rotate.textContent).toContain("Rotate 90°");
    expect(reset?.classList.contains("transform-reset-button")).toBe(true);
    expect(reset?.textContent).toContain("Reset");

    await user.click(rotate);
    if (reset) {
      await user.click(reset);
    }

    expect(onRotate).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
