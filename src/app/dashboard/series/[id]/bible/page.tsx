import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const TYPE_LABEL: Record<string, string> = {
  CHARACTER: "Characters",
  LOCATION: "Locations",
  ITEM: "Items",
  ORGANIZATION: "Organizations",
  EVENT: "Events",
  CONCEPT: "Concepts",
};

export default async function BiblePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const series = await db.series.findFirst({ where: { id, userId: user.id } });
  if (!series) notFound();

  const entities = await db.entity.findMany({
    where: { seriesId: id },
    include: {
      facts: { include: { book: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const grouped = new Map<string, typeof entities>();
  for (const e of entities) {
    const arr = grouped.get(e.type) ?? [];
    arr.push(e);
    grouped.set(e.type, arr);
  }

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/dashboard/series/${id}`} className="text-sm text-ink-900/60 hover:text-accent">
          ← {series.title}
        </Link>
        <h1 className="font-display mt-2 text-4xl font-semibold">Series Bible</h1>
        <p className="text-ink-900/60">Auto-built from your manuscripts. Click any entity to view its profile.</p>
      </div>

      {Array.from(grouped.entries()).map(([type, list]) => (
        <section key={type}>
          <h2 className="font-display text-2xl font-semibold mb-4">
            {TYPE_LABEL[type] ?? type} <span className="text-ink-900/40">({list.length})</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((e) => {
              const attrs = new Map<string, string>();
              for (const f of e.facts) if (!attrs.has(f.attribute)) attrs.set(f.attribute, f.value);
              return (
                <div key={e.id} className="card">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-xl font-semibold">{e.name}</h3>
                    <span className="text-xs text-ink-900/40">{e.facts.length} facts</span>
                  </div>
                  {e.aliases.length > 0 && (
                    <div className="text-xs text-ink-900/60 mt-1">aka {e.aliases.join(", ")}</div>
                  )}
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {Array.from(attrs.entries()).slice(0, 8).map(([k, v]) => (
                      <li key={k} className="flex flex-col">
                        <span className="text-ink-900/50 text-xs">{k}</span>
                        <span className="font-medium truncate">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {entities.length === 0 && (
        <p className="text-ink-900/60">No entities yet. Add a book and run extraction.</p>
      )}
    </div>
  );
}
