"use client";
import { useEffect, useRef } from "react";
import { useUploadsStore, type UploadedFile } from "./store/uploads";
import { mockRows } from "./mocks/uploads";
import { validateFileLike, formatBytes } from "./utils/validation";

export default function Dia02TablaUploads() {
  const { rows, hydrate, replaceFile, removeFile, setError } =
    useUploadsStore();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Hidratar con mocks la primera vez
  useEffect(() => {
    if (rows.length === 0) hydrate(mockRows);
  }, [rows.length, hydrate]);

  const openPicker = (rowId: string) => {
    inputRefs.current[rowId]?.click();
  };

  const onPick = async (rowId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const f = fileList[0];
    const fileLike: UploadedFile = {
      name: f.name,
      size: f.size,
      type: f.type,
      mock: false,
    };

    try {
      await validateFileLike(fileLike);
      replaceFile(rowId, fileLike);
    } catch (err: any) {
      setError(rowId, err?.message ?? "Archivo inválido");
    } finally {
      // limpiar el input para permitir volver a elegir el mismo archivo
      if (inputRefs.current[rowId]) inputRefs.current[rowId]!.value = "";
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">
        Tabla editable: documentos por fila
      </h2>
      <p className="opacity-80">
        Columna especial de <strong>subida de PDF</strong> con validación
        (tipo/tamaño), reemplazo y eliminación.
      </p>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Archivo</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 align-top">{idx + 1}</td>
                <td className="p-3 align-top">{r.label}</td>
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
          <strong>Notas:</strong> Tamaño máximo 5&nbsp;MB. Solo PDF. El estado
          persiste en memoria con Zustand y se inicia con datos simulados.
        </p>
      </div>
    </section>
  );
}
