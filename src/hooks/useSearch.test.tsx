import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useSearch from "./useSearch";

type Doc = { id: string; title: string; category: string };

const DATA: Doc[] = [
  { id: "1", title: "Contrato ACME", category: "Legal" },
  { id: "2", title: "Checklist Deploy", category: "Tech" },
  { id: "3", title: "Plan Q4", category: "Marketing" },
];

describe("useSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve todos los datos cuando query vacía (returnAllWhenEmpty=true)", () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({
        data: DATA,
        fields: ["title"],
        returnAllWhenEmpty: true,
      })
    );
    expect(result.current.results.length).toBe(3);
  });

  it("strict match filtra por substring", async () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({
        data: DATA,
        fields: ["title"],
        mode: "strict",
        debounceMs: 1,
      })
    );
    act(() => result.current.setQuery("Plan"));
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    expect(result.current.results.map((r) => r.title)).toEqual(["Plan Q4"]);
  });

  it("fuzzy match encuentra coincidencias aproximadas", async () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({
        data: DATA,
        fields: ["title"],
        mode: "fuzzy",
        debounceMs: 1,
      })
    );
    act(() => result.current.setQuery("Cnt AC")); // subsequences de "Contrato ACME"
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    expect(result.current.results[0].title).toBe("Contrato ACME");
  });

  it("muestra vacío si query por debajo de minQueryLength", async () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({
        data: DATA,
        fields: ["title"],
        minQueryLength: 3,
        debounceMs: 1,
        returnAllWhenEmpty: false,
      })
    );
    act(() => result.current.setQuery("Pl"));
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    expect(result.current.results.length).toBe(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it("loading alterna correctamente con debounce", async () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({ data: DATA, fields: ["title"], debounceMs: 50 })
    );
    act(() => result.current.setQuery("Plan"));
    expect(result.current.loading).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(60);
    });
    expect(result.current.loading).toBe(false);
  });

  it("reset limpia query y resultados", async () => {
    const { result } = renderHook(() =>
      useSearch<Doc>({
        data: DATA,
        fields: ["title"],
        returnAllWhenEmpty: false,
        debounceMs: 1,
      })
    );
    act(() => result.current.setQuery("Plan"));
    await act(async () => {
      vi.advanceTimersByTime(5);
    });
    expect(result.current.results.length).toBe(1);
    act(() => result.current.reset());
    expect(result.current.query).toBe("");
    expect(result.current.results.length).toBe(0);
  });
});
