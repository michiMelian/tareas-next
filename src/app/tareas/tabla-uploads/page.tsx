"use client";

import { useRef } from "react";
import { create } from "zustand";
import * as yup from "yup";
import Link from "next/link"; // ⬅️ botón de navegación

/* ========= Validación con Yup ========= */
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["application/pdf"];

const fileSchema = yup
  .object({
    name: yup.string().required(),
    size: yup.number().max(MAX_SIZE, "El archivo supera 5 MB").required(),
    type: yup.string().oneOf(ALLOWED, "Solo se permite PDF").required(),
  })
  .required();

/* ========= Tipos & utils ========= */
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

/* ========= Estado con Zustand (incluye mocks) ========= */
type UploadsState = {
  rows: Row[];
  replaceFile: (rowId: string, file: UploadedFile) => void;
  removeFile: (rowId: string) => void;
  setError: (rowId: string, msg: string | null) => void;
  renameLabel: (rowId: string, label: string) => void;
};

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
}));

/* ========= Página: tabla editable con columna de uploads ========= */
export default function TablaUploadsPage() {
  const { rows, replaceFile, removeFile, setError, renameLabel } =
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
    <main className="p-6 space-y-4">
      {/* Header con botón "Estado" */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Tabla editable con columna de subida (PDF)
          </h1>
          <p className="opacity-80">
            Sube <strong>PDF (máx. 5 MB)</strong>, verás el{" "}
            <strong>nombre del archivo</strong> y podrás
            <strong> reemplazar</strong> o <strong>eliminar</strong>.
          </p>
        </div>

        {/* Botón que redirige a la vista de estados */}
        <Link
          href="/tareas/tabla-estados"
          className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
        >
          Estado
        </Link>
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
              <tr key={r.id} className="border-t">
                <td className="p-3 align-top">{idx + 1}</td>
                <td className="p-3 align-top">
                  <input
                    value={r.label}
                    onChange={(e) => renameLabel(r.id, e.target.value)}
                    className="w-full rounded border px-2 py-1"
                  />
                </td>
                <td className="p-3 align-top">
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
                    <div className="text-red-600 text-xs mt-1">{r.error}</div>
                  )}
                </td>
                <td className="p-3 align-top">
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
                    ref={(el) => (inputRefs.current[r.id] = el)}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => onPick(r.id, e.target.files)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-3 text-xs opacity-80">
        <p>
          <strong>Validación:</strong> Yup (solo PDF, máx. 5 MB).{" "}
          <strong>Estado:</strong> Zustand con datos simulados.
        </p>
      </div>
    </main>
  );
}
