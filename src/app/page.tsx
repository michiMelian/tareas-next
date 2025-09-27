// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Proyecto de Tareas</h1>
        <p className="opacity-80">
          Colección de tareas con rutas por ejercicio.
        </p>
        <Link
          href="/tareas"
          className="inline-block rounded-lg border px-4 py-2 hover:bg-black/5"
        >
          Ver tareas →
        </Link>
      </div>
    </main>
  );
}
