"use client";
import useSearch from "@/hooks/useSearch";

type Doc = { id: string; title: string; category: string };

const MOCK: Doc[] = [
  { id: "1", title: "Contrato ACME", category: "Legal" },
  { id: "2", title: "Checklist Deploy", category: "Tech" },
  { id: "3", title: "Plan Q4", category: "Marketing" },
];

export default function DemoSearch() {
  const { query, setQuery, results, loading, error, isEmpty, reset } =
    useSearch<Doc>({
      data: MOCK,
      fields: ["title", "category"],
      debounceMs: 250,
      mode: "fuzzy",
    });

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Demo: useSearch</h1>
      <div className="flex gap-2">
        <input
          className="rounded border px-3 py-1.5"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="rounded border px-3 py-1.5" onClick={reset}>
          Reset
        </button>
      </div>

      {loading && <div className="text-sm opacity-70">Buscando…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {isEmpty && <div className="text-sm opacity-70">Sin resultados</div>}

      <ul className="list-disc pl-6">
        {results.map((r) => (
          <li key={r.id}>
            {r.title} — {r.category}
          </li>
        ))}
      </ul>
    </main>
  );
}
