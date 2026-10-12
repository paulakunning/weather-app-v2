import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));

function renderError(lang: string) {
  vi.mocked(useParams).mockReturnValue({ lang });
  const retry = vi.fn();
  render(<ErrorPage error={new Error("upstream")} retry={retry} />);
  return retry;
}

describe("error page", () => {
  it("shows the message in the route's language and retries on click", async () => {
    const retry = renderError("es");
    expect(
      screen.getByRole("heading", { name: "No pudimos cargar el clima" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("falls back to English for an unknown language", () => {
    renderError("fr");
    expect(
      screen.getByRole("heading", { name: "We couldn't load the weather" }),
    ).toBeInTheDocument();
  });
});
