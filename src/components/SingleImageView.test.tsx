// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LocalImage } from "../types";
import SingleImageView from "./SingleImageView";

const image: LocalImage = {
  id: "one",
  name: "a-very-long-file-name-for-comparison.png",
  url: "blob:single",
  size: 1024,
};

describe("SingleImageView", () => {
  afterEach(cleanup);

  it("shows the file name inside the single-image viewport", () => {
    render(
      <SingleImageView
        image={image}
        showFileName={true}
        rotation={0}
        transform="translate(0px, 0px) scale(1) rotate(0deg)"
      />,
    );

    const fileName = screen.getByTitle(image.name);
    const displayedImage = screen.getByRole("img", { name: image.name });

    expect(fileName.classList.contains("single-file-name")).toBe(true);
    expect(fileName.closest(".single-view")).not.toBeNull();
    expect(displayedImage.classList.contains("single-view-image")).toBe(true);
  });

  it("removes the overlay without removing the image", () => {
    render(
      <SingleImageView
        image={image}
        showFileName={false}
        rotation={0}
        transform="translate(0px, 0px) scale(1) rotate(0deg)"
      />,
    );

    expect(screen.queryByTitle(image.name)).toBeNull();
    expect(screen.getByRole("img", { name: image.name })).toBeDefined();
  });

  it("swaps the fit constraints for quarter-turn rotations", () => {
    render(
      <SingleImageView
        image={image}
        showFileName={true}
        rotation={90}
        transform="translate(0px, 0px) scale(1) rotate(90deg)"
      />,
    );

    expect(
      screen
        .getByRole("img", { name: image.name })
        .classList.contains("is-quarter-turn"),
    ).toBe(true);
  });
});
