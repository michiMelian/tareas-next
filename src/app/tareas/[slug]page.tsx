// src/app/tareas/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { tasks } from "@/app/tasks/registry";

export function generateStaticParams() {
  return tasks.map((t) => ({ slug: t.slug }));
}
export const dynamicParams = false;

export default function TaskPage({ params }: { params: { slug: string } }) {
  const task = tasks.find((t) => t.slug === params.slug);
  if (!task) notFound();
  const C = task.Component;
  return (
    <main className="p-6">
      <Link href="/tareas" className="text-sm opacity-80">
        ← Volver a tareas
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{task.title}</h1>
      <div className="mt-6">
        <C />
      </div>
    </main>
  );
}
