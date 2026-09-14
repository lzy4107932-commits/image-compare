// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n";
import StatusBar from "./StatusBar";

describe("StatusBar responsive help", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
  });

  afterEach(cleanup);

  it("provides full and compact help without losing the full tooltip", () => {
    const fullHelp =
      "Wheel: Scroll page | Ctrl/Cmd + Wheel: Zoom all images | Alt + Drag: Pan one image";
    const compactHelp = "+/- zoom all · 0 reset all · R rotate all";

    render(
      <I18nProvider>
        <StatusBar
          imageCount={6}
          viewMode="grid"
          rotation={0}
          zoom={100}
          help={fullHelp}
          compactHelp={compactHelp}
        />
      </I18nProvider>,
    );

    const helpRegion = screen.getByTitle(fullHelp);

    expect(helpRegion.querySelector(".statusbar-help-full")?.textContent).toBe(
      fullHelp,
    );
    expect(
      helpRegion.querySelector(".statusbar-help-compact")?.textContent,
    ).toBe(compactHelp);
    expect(document.querySelector(".statusbar-meta-full")?.textContent).toBe(
      "Grid mode: supports synchronized transforms and individual calibration",
    );
    expect(document.querySelector(".statusbar-meta-compact")?.textContent).toBe(
      "Grid",
    );
  });
});
