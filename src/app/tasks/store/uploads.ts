"use client";
import { create } from "zustand";

export type UploadedFile = {
  name: string;
  size: number;
  type: string;
  mock?: boolean;
};

export type Row = {
  id: string;
  label: string;
  file?: UploadedFile | null;
  error?: string | null;
};

type UploadsState = {
  rows: Row[];
  replaceFile: (rowId: string, file: UploadedFile) => void;
  removeFile: (rowId: string) => void;
  setError: (rowId: string, msg: string | null) => void;
  hydrate: (rows: Row[]) => void;
};

export const useUploadsStore = create<UploadsState>((set) => ({
  rows: [],
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
  hydrate: (rows) => set({ rows }),
}));
