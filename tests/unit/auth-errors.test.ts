import { describe, expect, it } from "vitest";
import { loginErrorMessage, oauthErrorCode, safeNextPath } from "@/lib/auth-errors";

describe("Google login error handling", () => {
  it("recognises 'sign-ups disabled' (unregistered Google account)", () => {
    expect(oauthErrorCode("access_denied", "Signups not allowed for this instance")).toBe("not_registered");
    expect(oauthErrorCode("signup_disabled", null)).toBe("not_registered");
  });
  it("recognises a cancelled consent screen", () => {
    expect(oauthErrorCode("access_denied", "The user denied the request")).toBe("cancelled");
  });
  it("falls back to a generic failure", () => {
    expect(oauthErrorCode("server_error", "boom")).toBe("oauth_failed");
    expect(oauthErrorCode(null, null)).toBe("oauth_failed");
  });
  it("has a message for every code and none for unknown input", () => {
    for (const c of ["not_registered", "cancelled", "oauth_failed"]) expect(loginErrorMessage(c)).toBeTruthy();
    expect(loginErrorMessage(undefined)).toBeNull();
    expect(loginErrorMessage("<script>")).toBeNull();
  });
  it("only redirects to same-site paths after login", () => {
    expect(safeNextPath("/budget")).toBe("/budget");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });
});
