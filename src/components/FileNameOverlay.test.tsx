// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FileNameOverlay from "./FileNameOverlay";

describe("FileNameOverlay", () => {
  afterEach(cleanup);

  it("separates the extension so it can remain visible", () => {
    render(<FileNameOverlay fileName="long.comparison.image.png" />);

    expect(screen.getByText("long.comparison.image").className).toBe(
      "file-name-stem",
    );
    expect(screen.getByText(".png").className).toBe("file-name-extension");
  });

  it("keeps extensionless and dot-prefixed names intact", () => {
    const { rerender } = render(<FileNameOverlay fileName="README" />);

    expect(screen.getByText("README").className).toBe("file-name-stem");
    expect(document.querySelector(".file-name-extension")).toBeNull();

    rerender(<FileNameOverlay fileName=".preview" />);
    expect(screen.getByText(".preview").className).toBe("file-name-stem");
    expect(document.querySelector(".file-name-extension")).toBeNull();
  });
});
