"use client";

import { useRef } from "react";
import { create } from "zustand";
import * as yup from "yup";

/* ---------- Validación (Yup) ---------- */
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["application/pdf"];

const fileSchema = yup
  .object({
    name: yup.string().required(),
    size: yup.number().max(MAX_SIZE, "El archivo supera 5 MB").required(),
    type: yup.string().oneOf(ALLOWED, "Solo se permite PDF").required(),
  })
  .required();

/* ---------- Tipos / utils ---------- */
type UploadedFile = {
  name: string;
  size: number;
  type: string;
  mock?: boolean;
};
type Row = {
  id: string;
  label: string;
  file?: UploadedFile | null;
  error?: string | null;
};

function formatBytes(b: number) {
  if (!b) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/* ---------- Mocks + Zustand ---------- */
const mockRows: Row[] = [
  {
    id: "1",
    label: "Contrato de servicio",
    file: {
      name: "contrato_v1.pdf",
      size: 256_000,
      type: "application/pdf",
      mock: true,
    },
  },
  { id: "2", label: "Manual de usuario", file: null },
  {
    id: "3",
    label: "Política de privacidad",
    file: {
      name: "privacidad.pdf",
      size: 1_024_000,
      type: "application/pdf",
      mock: true,
    },
  },
];

type UploadsState = {
  rows: Row[];
  replaceFile: (rowId: string, file: UploadedFile) => void;
  removeFile: (rowId: string) => void;
  setError: (rowId: string, msg: string | null) => void;
  renameLabel: (rowId: string, label: string) => void;
  reset: () => void;
};

const useUploadsStore = create<UploadsState>((set) => ({
  rows: mockRows,
  replaceFile: (rowId, file) =>
    set((s) => ({
      rows: s.rows.map((r) =>
        r.id === rowId ? { ...r, file, error: null } : r
      ),
    })),
  removeFile: (rowId) =>
    set((s) => ({
      rows: s.rows.map((r) =>
        r.id === rowId ? { ...r, file: null, error: null } : r
      ),
    })),
  setError: (rowId, msg) =>
    set((s) => ({
      rows: s.rows.map((r) => (r.id === rowId ? { ...r, error: msg } : r)),
    })),
  renameLabel: (rowId, label) =>
    set((s) => ({
      rows: s.rows.map((r) => (r.id === rowId ? { ...r, label } : r)),
    })),
  reset: () => set({ rows: mockRows }),
}));

/* ---------- Página ---------- */
export default function TablaUploadsV2Page() {
  const { rows, replaceFile, removeFile, setError, renameLabel, reset } =
    useUploadsStore();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const openPicker = (rowId: string) => inputRefs.current[rowId]?.click();

  async function onPick(rowId: string, list: FileList | null) {
    if (!list || list.length === 0) return;
    const f = list[0];
    const fileLike: UploadedFile = {
      name: f.name,
      size: f.size,
      type: f.type,
      mock: false,
    };

    try {
      await fileSchema.validate(fileLike);
      replaceFile(rowId, fileLike);
    } catch (err: any) {
      setError(rowId, err?.message ?? "Archivo inválido");
    } finally {
      if (inputRefs.current[rowId]) inputRefs.current[rowId]!.value = "";
    }
  }

  return (
    <main className="p-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Tabla editable con subida de PDF
          </h1>
          <p className="opacity-80 text-sm">
            Sube <strong>PDF (máx. 5 MB)</strong>, verás el nombre, y podrás{" "}
            <strong>reemplazar</strong> o <strong>eliminar</strong>.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
        >
          Restaurar mock
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Documento (editable)</th>
              <th className="p-3 text-left">Archivo</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">
                  <input
                    value={r.label}
                    onChange={(e) => renameLabel(r.id, e.target.value)}
                    className="w-full rounded border px-2 py-1"
                  />
                </td>
                <td className="p-3">
                  {r.file ? (
                    <div className="space-y-1">
                      <div className="font-medium">{r.file.name}</div>
                      <div className="text-xs opacity-70">
                        {r.file.type} • {formatBytes(r.file.size)}{" "}
                        {r.file.mock ? "• (simulado)" : ""}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs opacity-70">Sin archivo</span>
                  )}
                  {r.error && (
                    <div className="text-xs text-red-600 mt-1">{r.error}</div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPicker(r.id)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
                    >
                      {r.file ? "Reemplazar" : "Subir"}
                    </button>
                    {r.file && (
                      <button
                        onClick={() => removeFile(r.id)}
                        className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  {/* input oculto por fila */}
                  <input
                    ref={(el) => {
                      inputRefs.current[r.id] = el;
                    }}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => onPick(r.id, e.target.files)}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  <span className="text-sm opacity-70">
                    Sin filas disponibles.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-3 text-xs opacity-80">
        <p>
          <strong>Validación:</strong> Yup (solo PDF, máx. 5 MB).{" "}
          <strong>Estado:</strong> Zustand con mocks.
        </p>
      </div>
    </main>
  );
}
