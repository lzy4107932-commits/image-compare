// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n";
import AppHeader from "./AppHeader";

describe("AppHeader view modes", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes the current mode and mode changes", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();

    render(
      <I18nProvider>
        <AppHeader
          theme="dark"
          viewMode="compare"
          onThemeChange={vi.fn()}
          onViewModeChange={onViewModeChange}
          onImport={vi.fn()}
          onClear={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole("group", { name: "View mode" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "A/B Compare" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Single" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");

    await user.click(screen.getByRole("button", { name: "Grid" }));

    expect(onViewModeChange).toHaveBeenCalledWith("grid");
  });
});
