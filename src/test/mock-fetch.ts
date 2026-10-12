import { vi } from "vitest";

// Replaces the global fetch with one that answers `body` as JSON. Undo with vi.unstubAllGlobals().
export function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
