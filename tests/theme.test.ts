import { describe, it, expect } from "vitest";
import { resolveInitialTheme, nextTheme, THEME_KEY } from "../src/lib/theme";

describe("resolveInitialTheme", () => {
  it("honors a stored light choice over system preference", () => {
    expect(resolveInitialTheme("light", true)).toBe("light");
  });
  it("honors a stored dark choice over system preference", () => {
    expect(resolveInitialTheme("dark", false)).toBe("dark");
  });
  it("uses system preference when nothing is stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(null, false)).toBe("light");
  });
  it("ignores an invalid stored value and falls back to system", () => {
    expect(resolveInitialTheme("banana", true)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("THEME_KEY", () => {
  it("is a stable localStorage key", () => {
    expect(THEME_KEY).toBe("agentprep-theme");
  });
});
