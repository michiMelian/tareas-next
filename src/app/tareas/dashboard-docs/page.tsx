"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// --------- Tipos
type Category = "Legal" | "Tech" | "Marketing" | "Finance";
type Doc = {
  id: string;
  title: string;
  category: Category;
  sizeKB: number;
  createdAt: string; // ISO
};
type Stats = { category: Category; count: number };

type Store = {
  docs: Doc[];
  stats: Stats[];
  loading: boolean;
  error?: string | null;
  fetchDocs: () => Promise<void>;
  computeStats: () => void;
  clear: () => void;
};

// --------- Validación de datos (estructura)
function isValidDoc(x: any): x is Doc {
  const catSet = new Set(["Legal", "Tech", "Marketing", "Finance"]);
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    catSet.has(x.category) &&
    typeof x.sizeKB === "number" &&
    typeof x.createdAt === "string" &&
    !Number.isNaN(Date.parse(x.createdAt))
  );
}

// --------- Zustand (persist)
const useDocsStore = create<Store>()(
  persist(
    (set, get) => ({
      docs: [],
      stats: [],
      loading: false,
      error: null,
      fetchDocs: async () => {
        set({ loading: true, error: null });
        try {
          const res = await axios.get("/api/docs");
          const raw = res.data?.data ?? [];
          // Validación: filtrar y marcar error si hay descartes
          const valid = raw.filter(isValidDoc);
          if (!Array.isArray(raw) || valid.length !== raw.length) {
            set({
              error:
                "Algunos registros fueron descartados por formato inválido.",
            });
          }
          set({ docs: valid, loading: false });
          get().computeStats();
        } catch (e: any) {
          set({
            loading: false,
            error: "No fue posible obtener los documentos.",
          });
        }
      },
      computeStats: () => {
        const counts = new Map<Category, number>([
          ["Legal", 0],
          ["Tech", 0],
          ["Marketing", 0],
          ["Finance", 0],
        ]);
        for (const d of get().docs)
          counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
        const stats: Stats[] = Array.from(counts.entries()).map(
          ([category, count]) => ({ category, count })
        );
        set({ stats });
      },
      clear: () => set({ docs: [], stats: [], error: null }),
    }),
    {
      name: "docs-dashboard",
      version: 1,
      partialize: (s) => ({ docs: s.docs, stats: s.stats }),
    }
  )
);

// --------- Gráfico de barras (SVG)
function Bars({ data }: { data: Stats[] }) {
  // Validación para graficar: ¿hay al menos 1 doc?
  const total = data.reduce((acc, s) => acc + s.count, 0);
  if (total === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm">
        No hay suficientes datos para generar estadísticas.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count));
  const barW = 60;
  const gap = 24;
  const height = 160;
  const width = data.length * barW + (data.length - 1) * gap + 32;

  const palette: Record<Category, string> = {
    Legal: "#1f77b4",
    Tech: "#2ca02c",
    Marketing: "#ff7f0e",
    Finance: "#d62728",
  };

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height + 40}
        role="img"
        aria-label="Documents by category bar chart"
      >
        {/* Eje X labels */}
        {data.map((d, i) => {
          const x = 16 + i * (barW + gap);
          const barH = max === 0 ? 0 : Math.round((d.count / max) * height);
          const y = height - barH + 10;
          return (
            <g key={d.category}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={8}
                fill={palette[d.category]}
              />
              <text
                x={x + barW / 2}
                y={height + 28}
                textAnchor="middle"
                className="text-[12px] fill-black"
              >
                {d.category}
              </text>
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[12px] fill-black"
              >
                {d.count}
              </text>
            </g>
          );
        })}
        {/* Línea base */}
        <line
          x1={8}
          y1={height + 10}
          x2={width - 8}
          y2={height + 10}
          stroke="#ccc"
        />
      </svg>
    </div>
  );
}

// --------- Página
export default function DashboardDocsPage() {
  const { docs, stats, loading, error, fetchDocs, clear } = useDocsStore();
  const [mounted, setMounted] = useState(false); // para evitar hydration mismatch con persist

  useEffect(() => {
    setMounted(true);
    if (useDocsStore.getState().docs.length === 0) {
      fetchDocs();
    }
  }, [fetchDocs]);

  const totalKB = useMemo(() => docs.reduce((a, d) => a + d.sizeKB, 0), [docs]);

  if (!mounted) return null;

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents Dashboard</h1>
          <p className="opacity-80 text-sm">
            Tabla principal + gráfico de barras por categoría. Datos simulados
            vía API.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDocs}
            className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
            disabled={loading}
            title="Refrescar datos"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={clear}
            className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
            title="Limpiar"
          >
            Clear
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Documents</div>
          <div className="text-2xl font-semibold">{docs.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Total Size (KB)</div>
          <div className="text-2xl font-semibold">{totalKB}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Categories</div>
          <div className="text-2xl font-semibold">
            {stats.filter((s) => s.count > 0).length}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm opacity-70">Last Updated</div>
          <div className="text-2xl font-semibold">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </section>

      {/* Layout responsivo: gráfico arriba en mobile, al lado de la tabla en desktop */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Stats by Category</h2>
          </div>
          {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
          <Bars data={stats} />
        </div>

        <div className="lg:col-span-3 rounded-lg border p-4 overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <span className="text-xs opacity-70">{docs.length} items</span>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Size (KB)</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{d.title}</td>
                  <td className="p-3">{d.category}</td>
                  <td className="p-3">{d.sizeKB}</td>
                  <td className="p-3">
                    {new Date(d.createdAt).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={5}>
                    <span className="text-sm opacity-70">
                      No documents available.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
