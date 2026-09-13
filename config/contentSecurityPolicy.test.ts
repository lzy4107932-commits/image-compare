import { describe, expect, it } from "vitest";
import { getContentSecurityPolicy } from "./contentSecurityPolicy";

describe("content security policy", () => {
  it("keeps production disconnected from local services and file URLs", () => {
    const policy = getContentSecurityPolicy(false);

    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).not.toContain("localhost");
    expect(policy).not.toContain("127.0.0.1");
    expect(policy).not.toContain("file:");
    expect(policy).not.toContain("ws:");
  });

  it("allows only the fixed Vite websocket during development", () => {
    const policy = getContentSecurityPolicy(true);

    expect(policy).toContain("ws://127.0.0.1:5173");
    expect(policy).not.toContain("localhost:*");
  });
});
