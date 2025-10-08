"use client";

import { useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** ========================
 *  Tipos y mocks
 *  ======================== */
type Role = "admin" | "user";
type Row = { id: string; title: string; description?: string };
type Action = "view" | "edit" | "delete" | null;

type LogEntry = {
  id: string;
  action: Exclude<Action, null>;
  at: number;
  userRole: Role;
  extra?: string;
};

const mockRows: Row[] = [
  {
    id: "1",
    title: "Contrato de servicio",
    description: "Documento legal del cliente ACME.",
  },
  {
    id: "2",
    title: "Manual de usuario",
    description: "Versión 1.2 - área de soporte.",
  },
  {
    id: "3",
    title: "Política de privacidad",
    description: "Documento público de cumplimiento.",
  },
];

/** ========================
 *  Store (Zustand + persist)
 *  ======================== */
type Store = {
  role: Role;
  rows: Row[];
  activeAction: Action;
  activeRow: Row | null;
  actionLog: LogEntry[];

  setRole: (r: Role) => void;
  openAction: (a: Exclude<Action, null>, row: Row) => void;
  closeAction: () => void;

  updateRow: (id: string, patch: Partial<Row>) => void;
  deleteRow: (id: string) => void;

  log: (entry: LogEntry) => void;
  resetMocks: () => void;
};

const useTableStore = create<Store>()(
  persist(
    (set, get) => ({
      role: "admin",
      rows: mockRows,
      activeAction: null,
      activeRow: null,
      actionLog: [],

      setRole: (r) => set({ role: r }),
      openAction: (a, row) => set({ activeAction: a, activeRow: row }),
      closeAction: () => set({ activeAction: null, activeRow: null }),

      updateRow: (id, patch) =>
        set((s) => ({
          rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRow: (id) =>
        set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),

      log: (entry) =>
        set((s) => ({
          actionLog: [{ ...entry }, ...s.actionLog].slice(0, 20),
        })),

      resetMocks: () => set({ rows: mockRows, actionLog: [] }),
    }),
    {
      name: "tabla-menu-store",
      version: 1,
      partialize: (s) => ({
        role: s.role,
        rows: s.rows,
        actionLog: s.actionLog,
      }),
    }
  )
);

/** ========================
 *  Utilidades / UI mínima
 *  ======================== */
function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  destructive?: boolean;
  hideFooter?: boolean;
}) {
  const {
    open,
    title,
    children,
    onClose,
    onConfirm,
    confirmText = "Confirm",
    destructive,
    hideFooter,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      {/* ★ CAMBIO: añadí text-black para forzar texto negro dentro del modal */}
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl text-black">
        <div className="mb-3 text-lg font-semibold">{title}</div>
        <div className="mb-4 text-sm">{children}</div>
        {!hideFooter && (
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 hover:bg-black/5"
            >
              Cancel
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={
                  destructive
                    ? "rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                    : "rounded-lg border px-3 py-1.5 hover:bg-black/5"
                }
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RowMenu({ row, disabled }: { row: Row; disabled: boolean }) {
  const { openAction } = useTableStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="rounded-lg border px-2 py-1 text-sm hover:bg-black/5"
        onClick={() => setOpen((o) => !o)}
      >
        Menú ▾
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border bg-white shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="block w-full px-3 py-2 text-left text-black text-sm hover:bg-black/5"
            onClick={() => {
              openAction("view", row);
              setOpen(false);
            }}
          >
            Ver
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-black/5 text-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                openAction("edit", row);
                setOpen(false);
              }
            }}
          >
            Editar
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-black/5 text-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                openAction("delete", row);
                setOpen(false);
              }
            }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/** ========================
 *  Página principal
 *  ======================== */
export default function TablaMenuPage() {
  const {
    role,
    setRole,
    rows,
    activeAction,
    activeRow,
    closeAction,
    updateRow,
    deleteRow,
    log,
    resetMocks,
  } = useTableStore();

  const isAdmin = role === "admin";
  const [editTitle, setEditTitle] = useState("");

  const editableTitle = useMemo(
    () => (activeAction === "edit" && activeRow ? activeRow.title : ""),
    [activeAction, activeRow]
  );
  useMemo(() => setEditTitle(editableTitle), [editableTitle]);

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tabla con menú contextual</h1>
          <p className="opacity-80">
            Ver, Editar y Eliminar por fila. Eliminar pide confirmación.
            Editar/Eliminar solo para <strong>admin</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-80">Rol:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <button
            onClick={resetMocks}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
          >
            Restaurar mock
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Descripción</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">{r.title}</td>
                <td className="p-3">
                  {r.description ?? <span className="opacity-60">—</span>}
                </td>
                <td className="p-3">
                  <RowMenu row={r} disabled={!isAdmin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border p-3">
        <h2 className="text-base font-semibold">Últimas acciones</h2>
        <ul className="mt-2 space-y-1 text-xs">
          {useTableStore.getState().actionLog.length === 0 && (
            <li className="opacity-60">Sin acciones registradas.</li>
          )}
          {useTableStore.getState().actionLog.map((a, i) => (
            <li key={i}>
              <span className="font-medium">{a.action.toUpperCase()}</span> —
              doc #{a.id} — {fmt(a.at)} — role: {a.userRole}
              {a.extra ? ` — ${a.extra}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {/* Ver */}
      <Modal
        open={activeAction === "view" && !!activeRow}
        title="Detalle del documento"
        onClose={closeAction}
        hideFooter
      >
        {activeRow && (
          <div className="space-y-1 text-black">
            <div>
              {}
              <span className="font-medium text-black">ID:</span> {activeRow.id}
            </div>
            <div>
              <span className="font-medium">Título:</span> {activeRow.title}
            </div>
            <div>
              <span className="font-medium">Descripción:</span>{" "}
              {activeRow.description ?? "—"}
            </div>
          </div>
        )}
      </Modal>

      {/* Editar (solo admin) */}
      <Modal
        open={activeAction === "edit" && !!activeRow}
        title="Editar documento"
        onClose={closeAction}
        onConfirm={() => {
          if (!activeRow) return;
          updateRow(activeRow.id, { title: editTitle });
          log({
            id: activeRow.id,
            action: "edit",
            at: Date.now(),
            userRole: role,
            extra: `title -> "${editTitle}"`,
          });
          closeAction();
        }}
        confirmText="Guardar"
      >
        {activeRow && (
          <div className="space-y-3 text-black">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Título</span>
              <input
                className="w-full rounded border px-2 py-1 text-black placeholder:text-gray-500" // ★ CAMBIO: input con texto negro
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
            <p className="text-xs opacity-70">
              Solo el rol <strong>admin</strong> puede guardar cambios.
            </p>
          </div>
        )}
      </Modal>

      {/* Eliminar (confirmación obligatoria, solo admin) */}
      <Modal
        open={activeAction === "delete" && !!activeRow}
        title="Confirmar eliminación"
        onClose={closeAction}
        onConfirm={() => {
          if (!activeRow) return;
          deleteRow(activeRow.id);
          log({
            id: activeRow.id,
            action: "delete",
            at: Date.now(),
            userRole: role,
          });
          closeAction();
        }}
        confirmText="Eliminar"
        destructive
      >
        {activeRow && (
          <p className="text-sm text-black">
            ¿Seguro que quieres eliminar{" "}
            <span className="font-medium">“{activeRow.title}”</span>? Esta
            acción no se puede deshacer.
          </p>
        )}
      </Modal>
    </main>
  );
}
