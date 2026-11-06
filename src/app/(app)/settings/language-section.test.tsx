import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateSettings } from "./actions";
import { LanguageSection } from "./language-section";

vi.mock("./actions", () => ({ updateSettings: vi.fn(async () => ({ ok: true, data: null })) }));
vi.mock("@/components/toast", () => ({ toast: vi.fn(), toastResult: (result: unknown) => result }));

const reload = vi.fn();

beforeEach(() => {
  vi.mocked(updateSettings).mockClear();
  vi.mocked(updateSettings).mockResolvedValue({ ok: true, data: null });
  reload.mockClear();
  vi.stubGlobal("location", { ...window.location, reload });
});
afterEach(() => vi.unstubAllGlobals());

describe("Language settings", () => {
  it("offers French and English, each in its own words, with the one in use picked", () => {
    render(<LanguageSection initial="fr" />);
    expect(screen.getByRole("heading", { name: "Language" })).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Interface language" });
    expect(select).toHaveValue("fr");
    expect(Array.from((select as HTMLSelectElement).options).map((option) => option.textContent)).toEqual(["English", "Français"]);
  });

  it("saves the choice and loads the page again in the new language", async () => {
    const user = userEvent.setup();
    render(<LanguageSection initial="en" />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Interface language" }), "fr");
    expect(updateSettings).toHaveBeenCalledWith({ locale: "fr" });
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it("keeps the old language, and doesn't reload, when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(updateSettings).mockResolvedValue({ ok: false, error: "Nope." });
    render(<LanguageSection initial="en" />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Interface language" }), "fr");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Interface language" })).toHaveValue("en"));
    expect(reload).not.toHaveBeenCalled();
  });
});
