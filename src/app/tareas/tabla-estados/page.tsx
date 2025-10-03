"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import clsx from "clsx";
import { useMemo } from "react";

/* =========================
   Configuración / Tipos
========================= */
type Estado = "Pendiente" | "Aprobado" | "Rechazado";

const ESTADOS_PERMITIDOS: Estado[] = [
  "Pendiente",
  "Aprobado",
  "Rechazado",
] as const;

type Row = {
  id: string;
  documento: string;
  estado: Estado;
  error?: string | null;
};

/* =========================
   Utilidades
========================= */
function esEstadoValido(value: string): value is Estado {
  return (ESTADOS_PERMITIDOS as readonly string[]).includes(value);
}

function badgeClasses(estado: Estado) {
  return clsx(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
    estado === "Pendiente" && "bg-yellow-100 text-yellow-800 border-yellow-300",
    estado === "Aprobado" && "bg-green-100 text-green-800 border-green-300",
    estado === "Rechazado" && "bg-red-100 text-red-800 border-red-300"
  );
}

/* =========================
   Estado (Zustand + persist)
========================= */
type Store = {
  rows: Row[];
  setEstado: (id: string, estado: string) => void; // valida y setea
  clearError: (id: string) => void;
  reset: () => void;
};

// Datos simulados (mock)
const initialRows: Row[] = [
  { id: "1", documento: "Contrato de servicio", estado: "Pendiente" },
  { id: "2", documento: "Manual de usuario", estado: "Aprobado" },
  { id: "3", documento: "Política de privacidad", estado: "Rechazado" },
];

const useTablaStore = create<Store>()(
  persist(
    (set, get) => ({
      rows: initialRows,
      setEstado: (id, estadoStr) => {
        if (!esEstadoValido(estadoStr)) {
          set((s) => ({
            rows: s.rows.map((r) =>
              r.id === id
                ? {
                    ...r,
                    error:
                      "Estado no válido. Usa Pendiente, Aprobado o Rechazado.",
                  }
                : r
            ),
          }));
          return;
        }
        set((s) => ({
          rows: s.rows.map((r) =>
            r.id === id ? { ...r, estado: estadoStr, error: null } : r
          ),
        }));
      },
      clearError: (id) =>
        set((s) => ({
          rows: s.rows.map((r) => (r.id === id ? { ...r, error: null } : r)),
        })),
      reset: () => set({ rows: initialRows }),
    }),
    {
      name: "tabla-estados", // clave en localStorage
      version: 1,
      partialize: (state) => ({ rows: state.rows }), // sólo persistimos rows
    }
  )
);

/* =========================
   Página
========================= */
export default function TablaEstadosPage() {
  const { rows, setEstado, clearError, reset } = useTablaStore();

  const opciones = useMemo(() => ESTADOS_PERMITIDOS, []);

  return (
    <main className="p-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabla dinámica con estados</h1>
          <p className="opacity-80">
            Estados permitidos: <strong>Pendiente</strong>,{" "}
            <strong>Aprobado</strong>, <strong>Rechazado</strong>.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
          title="Restaurar datos simulados"
        >
          Restaurar mock
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">{r.documento}</td>
                <td className="p-3">
                  <span className={badgeClasses(r.estado)}>{r.estado}</span>
                  {r.error && (
                    <div className="mt-1 text-xs text-red-600">{r.error}</div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded border px-2 py-1"
                      value={r.estado}
                      onChange={(e) => {
                        // limpiamos error previo y validamos el nuevo estado
                        clearError(r.id);
                        setEstado(r.id, e.target.value);
                      }}
                    >
                      {opciones.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                      {/* Nota: si alguien inyecta un valor no permitido, el setEstado lo rechazará y mostrará error */}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border p-3 text-xs opacity-80">
        <p>
          <strong>Validación:</strong> solo estados permitidos (
          {ESTADOS_PERMITIDOS.join(", ")}). <strong>Persistencia:</strong>{" "}
          Zustand + <code>localStorage</code>.{" "}
          <strong>Colores dinámicos:</strong> Tailwind + <code>clsx</code> según
          el estado.
        </p>
      </section>
    </main>
  );
}
