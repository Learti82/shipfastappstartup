import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordCount } from "@/lib/utils";
import { AlertTriangle, BookOpen, Layers, ScanLine } from "lucide-react";

async function addBook(formData: FormData) {
  "use server";
  const user = await requireUser();
  const seriesId = String(formData.get("seriesId"));
  const title = String(formData.get("title") ?? "").trim();
  const manuscript = String(formData.get("manuscript") ?? "");
  if (!title || !manuscript) throw new Error("Title and manuscript required");

  const series = await db.series.findFirst({ where: { id: seriesId, userId: user.id } });
  if (!series) throw new Error("Not found");

  const last = await db.book.findFirst({
    where: { seriesId },
    orderBy: { orderIndex: "desc" },
  });

  const book = await db.book.create({
    data: {
      seriesId,
      title,
      manuscript,
      wordCount: wordCount(manuscript),
      orderIndex: (last?.orderIndex ?? 0) + 1,
    },
  });
  redirect(`/dashboard/series/${seriesId}/books/${book.id}`);
}

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const series = await db.series.findFirst({
    where: { id, userId: user.id },
    include: {
      books: { orderBy: { orderIndex: "asc" } },
      _count: { select: { entities: true, continuityIssues: true } },
    },
  });
  if (!series) notFound();

  const openIssues = await db.continuityIssue.count({
    where: { seriesId: series.id, resolved: false },
  });

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard" className="text-sm text-ink-900/60 hover:text-accent">← All series</Link>
        <h1 className="font-display mt-2 text-4xl font-semibold">{series.title}</h1>
        {series.genre && <div className="text-ink-900/60">{series.genre}</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<BookOpen />} label="Books" value={series.books.length} />
        <StatCard icon={<Layers />} label="Entities in bible" value={series._count.entities} href={`/dashboard/series/${series.id}/bible`} />
        <StatCard
          icon={<AlertTriangle />}
          label="Open continuity issues"
          value={openIssues}
          href={`/dashboard/series/${series.id}/continuity`}
          alert={openIssues > 0}
        />
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">Books</h2>
        <div className="grid gap-3">
          {series.books.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/series/${series.id}/books/${b.id}`}
              className="card flex items-center justify-between hover:border-accent/50"
            >
              <div>
                <div className="font-display text-lg">#{b.orderIndex} · {b.title}</div>
                <div className="text-sm text-ink-900/60">
                  {b.wordCount.toLocaleString()} words ·{" "}
                  <span className="uppercase tracking-wide">{b.status}</span>
                </div>
              </div>
              <ScanLine className="text-ink-900/40" />
            </Link>
          ))}
          {series.books.length === 0 && (
            <p className="text-ink-900/60 text-sm">No books yet. Add your first manuscript below.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-semibold mb-4">Add a book</h2>
        <form action={addBook} className="space-y-4">
          <input type="hidden" name="seriesId" value={series.id} />
          <div>
            <label className="label">Book title</label>
            <input name="title" required className="input" placeholder="Book 1: The Hollow Crown" />
          </div>
          <div>
            <label className="label">Manuscript (paste full text)</label>
            <textarea
              name="manuscript"
              required
              rows={10}
              className="input font-mono text-xs"
              placeholder="Paste your manuscript here. DOCX/EPUB upload coming next."
            />
          </div>
          <button className="btn-accent">Add book</button>
        </form>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div className={`card ${alert ? "border-accent/50" : ""}`}>
      <div className={`${alert ? "text-accent" : "text-ink-900/60"}`}>{icon}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      <div className="text-sm text-ink-900/60">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
