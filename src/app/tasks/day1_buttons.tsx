"use client";
import Image from "next/image";
import { useState } from "react";

export default function Dia01Botones() {
  const [count, setCount] = useState(0);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">
        Pantalla con texto, imagen y botón
      </h2>
      <p className="opacity-80">Ejemplo simple: texto + imagen + botón.</p>

      <div className="flex items-start gap-4">
        <Image
          src="/tareas/dia-01-botones/sample.png"
          alt="Ejemplo"
          width={160}
          height={160}
          className="rounded-lg border"
        />
        <button
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg border px-4 py-2 hover:bg-black/5"
        >
          Clicks: {count}
        </button>
      </div>
    </section>
  );
}
