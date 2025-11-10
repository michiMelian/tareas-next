"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export type FieldSelector<T> = keyof T | ((row: T) => string);

export type UseSearchOptions<T> = {
  data: T[];
  fields: FieldSelector<T>[];
  debounceMs?: number; // default 200
  minQueryLength?: number; // default 1
  mode?: "fuzzy" | "strict"; // default "fuzzy"
  returnAllWhenEmpty?: boolean; // default true
  normalizer?: (s: string) => string; // default: toLower + trim + spaces colapsados
};

export type UseSearchState<T> = {
  query: string;
  setQuery: (q: string) => void;
  results: T[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  reset: () => void;
};

/** Normaliza texto para comparar */
function defaultNormalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Devuelve una cadena acumulando los campos indicados */
function extractSearchText<T>(
  row: T,
  fields: FieldSelector<T>[],
  normalize: (s: string) => string
): string {
  const parts: string[] = [];
  for (const f of fields) {
    let v: unknown;
    if (typeof f === "function") v = f(row);
    else v = (row as any)[f];

    if (v == null) continue;
    const s = String(v);
    parts.push(s);
  }
  return normalize(parts.join(" "));
}

/** Strict: incluye substring */
function strictMatch(hay: string, needle: string) {
  return hay.includes(needle) ? 1 : 0;
}

/** Fuzzy: subsequence scoring (simple, rápida, sin libs) */
function fuzzyScore(hay: string, needle: string): number {
  if (needle.length === 0) return 0;
  let score = 0;
  let j = 0;
  let streak = 0; // bonifica coincidencias consecutivas
  for (let i = 0; i < hay.length && j < needle.length; i++) {
    if (hay[i] === needle[j]) {
      j++;
      streak++;
      score += 2 * streak;
    } else {
      streak = 0;
    }
  }
  return j === needle.length ? score : 0;
}

export function useSearch<T>(opts: UseSearchOptions<T>): UseSearchState<T> {
  const {
    data,
    fields,
    debounceMs = 200,
    minQueryLength = 1,
    mode = "fuzzy",
    returnAllWhenEmpty = true,
    normalizer = defaultNormalize,
  } = opts;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>(returnAllWhenEmpty ? data : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Índice normalizado (evita normalizar en cada tecleo)
  const indexRef = useRef<string[]>([]);
  const dataRef = useRef<T[]>(data);
  const fieldsRef = useRef<FieldSelector<T>[]>(fields);

  // (re)construye índice cuando cambian datos o campos
  useEffect(() => {
    try {
      indexRef.current = data.map((row) =>
        extractSearchText(row, fields, normalizer)
      );
      dataRef.current = data;
      fieldsRef.current = fields;
      setError(null);
      // si no hay query, mantener resultados según flag
      if (query.length === 0) {
        setResults(returnAllWhenEmpty ? data : []);
      }
    } catch (e: any) {
      setError("Invalid field selector(s).");
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, fields, normalizer]);

  // Búsqueda con debounce
  useEffect(() => {
    let cancelled = false;

    if (query.length === 0) {
      setLoading(false);
      setResults(returnAllWhenEmpty ? dataRef.current : []);
      return;
    }

    if (query.length < minQueryLength) {
      setLoading(false);
      setResults([]);
      return;
    }

    setLoading(true);
    const t = setTimeout(() => {
      const q = normalizer(query);
      const idx = indexRef.current;
      const rows = dataRef.current;

      try {
        let pairs: Array<{ row: T; score: number }> = [];

        if (mode === "strict") {
          for (let i = 0; i < idx.length; i++) {
            const s = strictMatch(idx[i], q);
            if (s > 0) pairs.push({ row: rows[i], score: s });
          }
        } else {
          for (let i = 0; i < idx.length; i++) {
            const s = fuzzyScore(idx[i], q);
            if (s > 0) pairs.push({ row: rows[i], score: s });
          }
        }

        // ordena por score desc (más relevante primero)
        pairs.sort((a, b) => b.score - a.score);
        if (!cancelled) {
          setResults(pairs.map((p) => p.row));
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Search failed.");
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debounceMs, minQueryLength, mode, normalizer]);

  const isEmpty = useMemo(
    () => !loading && error == null && results.length === 0,
    [loading, error, results.length]
  );

  const reset = () => {
    setQuery("");
    setResults(returnAllWhenEmpty ? dataRef.current : []);
    setLoading(false);
    setError(null);
  };

  return { query, setQuery, results, loading, error, isEmpty, reset };
}

export default useSearch;
