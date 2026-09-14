// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n";
import type { LocalImage } from "../types";
import ImageSidebar from "./ImageSidebar";

const images: LocalImage[] = [
  { id: "one", name: "first.png", url: "blob:first", size: 1024 },
  { id: "two", name: "second.png", url: "blob:second", size: 1024 },
];

function renderSidebar(overrides: Partial<Parameters<typeof ImageSidebar>[0]> = {}) {
  const props = {
    images,
    selectedImageId: "one",
    compareAId: "one",
    compareBId: "two",
    onSelect: vi.fn(),
    onSetAsA: vi.fn(),
    onSetAsB: vi.fn(),
    onReorder: vi.fn(),
    onDelete: vi.fn(),
    onImageLoadError: vi.fn(),
    ...overrides,
  };

  render(
    <I18nProvider>
      <ImageSidebar {...props} />
    </I18nProvider>,
  );

  return props;
}

describe("ImageSidebar", () => {
  beforeEach(() => {
    localStorage.setItem("image-viewer-language", "en");
  });

  afterEach(() => {
    cleanup();
  });

  it("selects an image with the keyboard", async () => {
    const user = userEvent.setup();
    const props = renderSidebar();
    const selectButton = screen.getByRole("button", {
      name: "Select image: second.png",
    });

    selectButton.focus();
    await user.keyboard("{Enter}");

    expect(props.onSelect).toHaveBeenCalledWith("two");
  });

  it("keeps image role and delete controls independent", async () => {
    const user = userEvent.setup();
    const props = renderSidebar();

    await user.click(
      screen.getByRole("button", { name: "Set as image A: second.png" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Delete: second.png" }),
    );

    expect(props.onSetAsA).toHaveBeenCalledWith("two");
    expect(props.onDelete).toHaveBeenCalledWith("two");
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it("reports thumbnail decoding failures", () => {
    const props = renderSidebar();
    const thumbnail = screen.getByRole("img", { name: "first.png" });

    expect(thumbnail.getAttribute("loading")).toBe("lazy");
    expect(thumbnail.getAttribute("decoding")).toBe("async");
    fireEvent.error(thumbnail);

    expect(props.onImageLoadError).toHaveBeenCalledWith("one");
  });

  it("reorders an image with the keyboard-accessible drag handle", () => {
    const props = renderSidebar();
    const handle = screen.getByRole("button", {
      name: /Reorder image: second\.png/,
    });

    fireEvent.keyDown(handle, { key: "ArrowUp" });

    expect(props.onReorder).toHaveBeenCalledWith("two", 0);
    expect(screen.getByRole("status").textContent).toBe(
      "Reorder complete: second.png, position 1",
    );
  });

  it("drops an image after the pointed list item", () => {
    const props = renderSidebar();
    const sourceHandle = screen.getByRole("button", {
      name: /Reorder image: first\.png/,
    });
    const targetItem = screen
      .getByRole("button", { name: "Select image: second.png" })
      .closest<HTMLElement>(".image-item");
    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn(() => "one"),
    };

    expect(targetItem).not.toBeNull();
    vi.spyOn(targetItem as HTMLElement, "getBoundingClientRect").mockReturnValue({
      top: 0,
      height: 88,
    } as DOMRect);

    fireEvent.dragStart(sourceHandle, { dataTransfer });
    fireEvent.dragOver(targetItem as HTMLElement, {
      clientY: 80,
      dataTransfer,
    });
    fireEvent.drop(targetItem as HTMLElement, { dataTransfer });

    expect(props.onReorder).toHaveBeenCalledWith("one", 2);
  });

});
