import Link from "next/link";
import { tasks } from "@/app/tasks/registry";
import { redirect } from "next/navigation";

export default function TareasIndex() {
  redirect("/tareas/tabla-uploads");
  const sorted = tasks.slice().sort((a, b) => a.date.localeCompare(b.date));
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Tareas</h1>
      <ul className="mt-6 space-y-3">
        {sorted.map((t) => (
          <li key={t.slug} className="rounded border p-4 hover:shadow">
            <Link href={`/tareas/${t.slug}`} className="font-medium">
              {t.title}
            </Link>
            <div className="text-sm opacity-70">
              {new Date(t.date).toLocaleDateString("es-ES")}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
