import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function visit(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`http://localhost${path}`, { headers }));
}

describe("proxy", () => {
  it("redirects / to the Accept-Language locale", () => {
    const res = visit("/", { "accept-language": "es-AR" });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/es$/);
  });

  it("keeps the query string and defaults to English", () => {
    const res = visit("/?lat=1&lon=2");
    expect(res.headers.get("location")).toMatch(/\/en\?lat=1&lon=2$/);
  });

  it("prefers the NEXT_LOCALE cookie and keeps the path", () => {
    const res = visit("/buenos-aires-3435910", {
      cookie: "NEXT_LOCALE=es",
      "accept-language": "en",
    });
    expect(res.headers.get("location")).toMatch(/\/es\/buenos-aires-3435910$/);
  });

  it("lets localized paths through", () => {
    expect(visit("/en/london-2643743").headers.get("location")).toBeNull();
    expect(visit("/es").headers.get("location")).toBeNull();
  });

  it("only counts the locale as a whole segment", () => {
    expect(visit("/english").headers.get("location")).toMatch(/\/en\/english$/);
  });
});
