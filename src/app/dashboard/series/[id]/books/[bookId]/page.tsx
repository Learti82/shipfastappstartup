import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ExtractButton from "./extract-button";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string; bookId: string }>;
}) {
  const { id, bookId } = await params;
  const user = await requireUser();
  const book = await db.book.findFirst({
    where: { id: bookId, series: { id, userId: user.id } },
    include: {
      series: true,
      facts: {
        include: { entity: true },
        orderBy: [{ entity: { name: "asc" } }, { attribute: "asc" }],
      },
    },
  });
  if (!book) notFound();

  const grouped = new Map<string, typeof book.facts>();
  for (const f of book.facts) {
    const key = f.entity.name;
    const arr = grouped.get(key) ?? [];
    arr.push(f);
    grouped.set(key, arr);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard/series/${id}`} className="text-sm text-ink-900/60 hover:text-accent">
          ← {book.series.title}
        </Link>
        <h1 className="font-display mt-2 text-4xl font-semibold">{book.title}</h1>
        <div className="text-ink-900/60 text-sm">
          {book.wordCount.toLocaleString()} words · {book.status}
          {book.extractedAt && ` · last extracted ${new Date(book.extractedAt).toLocaleString()}`}
        </div>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <div className="font-display text-xl">Extract entities &amp; facts</div>
          <p className="text-sm text-ink-900/60">
            Plotline reads the manuscript, builds the series bible, and updates continuity issues.
          </p>
        </div>
        <ExtractButton bookId={book.id} />
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Facts pulled from this book ({book.facts.length})
        </h2>
        {grouped.size === 0 ? (
          <p className="text-ink-900/60 text-sm">No facts yet. Run extraction above.</p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([name, facts]) => (
              <div key={name} className="card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">{name}</h3>
                  <span className="text-xs uppercase tracking-wider text-ink-900/50">
                    {facts[0].entity.type}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {facts.map((f) => (
                    <li key={f.id} className="flex gap-2">
                      <span className="text-ink-900/50 min-w-[160px]">{f.attribute}</span>
                      <span className="font-medium">{f.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
