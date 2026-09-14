// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n";
import type { LocalImage } from "../types";
import ABCompareView from "./ABCompareView";
import MultiCompareView from "./MultiCompareView";

const images: LocalImage[] = [
  { id: "one", name: "first.png", url: "blob:first" },
  { id: "two", name: "second.png", url: "blob:second" },
  { id: "three", name: "third.png", url: "blob:third" },
];

function addToolbarTargets() {
  const center = document.createElement("div");
  center.id = "viewer-toolbar-center";
  document.body.append(center);

  const actions = document.createElement("div");
  actions.id = "viewer-toolbar-actions";
  document.body.append(actions);
}

describe("comparison keyboard controls", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
    addToolbarTargets();
  });

  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it("controls and resets the current A/B operation target", async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <ABCompareView imageA={images[0]} imageB={images[1]} />
      </I18nProvider>,
    );

    const currentZoom = screen.getByRole("button", {
      name: "Zoom level of current target",
    });

    await user.keyboard("+");
    expect(currentZoom.textContent).toContain("110%");

    await user.click(
      screen.getByRole("button", {
        name: "Rotate current target clockwise by 90°",
      }),
    );
    expect(screen.getByRole("img", { name: "first.png" }).style.transform).toContain(
      "rotate(90deg)",
    );
    expect(screen.getByRole("img", { name: "second.png" }).style.transform).toContain(
      "rotate(90deg)",
    );

    await user.keyboard("0");
    expect(currentZoom.textContent).toContain("100%");
    expect(screen.getByRole("img", { name: "first.png" }).style.transform).toContain(
      "rotate(0deg)",
    );

    await user.click(screen.getByRole("button", { name: "Adjust A" }));
    await user.keyboard("r");
    expect(screen.getByRole("img", { name: "first.png" }).style.transform).toContain(
      "rotate(90deg)",
    );
    expect(screen.getByRole("img", { name: "second.png" }).style.transform).toContain(
      "rotate(0deg)",
    );
  });

  it("controls and resets every image in grid mode", async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <MultiCompareView images={images} />
      </I18nProvider>,
    );

    const globalZoom = screen.getByRole("button", {
      name: "Synchronized zoom level",
    });

    await user.keyboard("+");
    expect(globalZoom.textContent).toContain("110%");

    await user.click(
      screen.getByRole("button", {
        name: "Rotate all images clockwise by 90°",
      }),
    );
    for (const image of screen.getAllByRole("img")) {
      expect(image.style.transform).toContain("rotate(90deg)");
    }

    await user.keyboard("0");
    expect(globalZoom.textContent).toContain("100%");
    for (const image of screen.getAllByRole("img")) {
      expect(image.style.transform).toContain("rotate(0deg)");
    }
  });
});
