import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/i18n/en";
import type { Place } from "@/lib/weather/types";
import { SearchOverlay } from "./SearchOverlay";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const cordoba: Place = {
  id: 3860259,
  name: "Córdoba",
  region: "Córdoba",
  country: "Argentina",
  latitude: -31.4135,
  longitude: -64.18105,
};
const corrientes: Place = { ...cordoba, id: 3435217, name: "Corrientes" };

type Call = {
  url: string;
  signal: AbortSignal | null | undefined;
  respond: (body: unknown, status?: number) => Promise<void>;
};

// A fetch whose responses the test sends by hand, in any order.
function stubFetch(): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(
      (input, init) =>
        new Promise((resolve) => {
          calls.push({
            url: String(input),
            signal: init?.signal,
            respond: (body, status = 200) =>
              act(async () => {
                resolve(Response.json(body, { status }));
                // A real macrotask lets the response body and state updates settle.
                await new Promise((done) => setImmediate(done));
              }),
          });
        }),
    ),
  );
  return calls;
}

const wait = (ms: number) => act(async () => vi.advanceTimersByTime(ms));

// fireEvent, not userEvent: userEvent waits on a setTimeout that fake timers freeze.
function setup() {
  const onClose = vi.fn();
  render(<SearchOverlay open onClose={onClose} locale="en" dict={en} />);
  const input = screen.getByRole("combobox");
  return {
    onClose,
    input,
    type: (value: string) => fireEvent.change(input, { target: { value } }),
    press: (key: string) => fireEvent.keyDown(input, { key }),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  push.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SearchOverlay", () => {
  it("searches once, 300 ms after the last keystroke", async () => {
    const calls = stubFetch();
    const { type } = setup();

    type("c");
    await wait(200);
    type("co");
    await wait(299);
    expect(calls).toHaveLength(0);
    await wait(1);
    expect(calls.map((call) => call.url)).toEqual(["/api/search?q=co&lang=en"]);
  });

  it("shows only the latest query's results when responses arrive out of order", async () => {
    const calls = stubFetch();
    const { type } = setup();

    type("cor");
    await wait(300);
    type("cord");
    await wait(300);
    const [cor, cord] = calls;
    if (!cor || !cord) throw new Error("Expected two requests");

    await cord.respond({ results: [cordoba] });
    await cor.respond({ results: [corrientes] });

    expect(cor.signal?.aborted).toBe(true);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Córdoba, Córdoba, Argentina",
    ]);
  });

  it("navigates to the highlighted city on Enter", async () => {
    const calls = stubFetch();
    const { type, press, onClose } = setup();

    type("cor");
    await wait(300);
    await calls[0]?.respond({ results: [cordoba, corrientes] });
    press("ArrowDown");
    press("Enter");

    expect(push).toHaveBeenCalledWith("/en/cordoba-3860259");
    expect(onClose).toHaveBeenCalled();
  });

  it("says when nothing matches and when search is down", async () => {
    const calls = stubFetch();
    const { type } = setup();

    type("zzqq");
    await wait(300);
    await calls[0]?.respond({ results: [] });
    expect(screen.getByText("We couldn't find that city")).toBeInTheDocument();

    type("zzqqx");
    await wait(300);
    await calls[1]?.respond({ error: "upstream" }, 502);
    expect(
      screen.getByText("Search is unavailable right now"),
    ).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    stubFetch();
    const { press, onClose } = setup();
    press("Escape");
    expect(onClose).toHaveBeenCalled();
  });
});
