import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, Plus } from "lucide-react";

async function createSeries(formData: FormData) {
  "use server";
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim() || null;
  if (!title) throw new Error("Title required");
  const s = await db.series.create({ data: { userId: user.id, title, genre } });
  redirect(`/dashboard/series/${s.id}`);
}

export default async function DashboardHome() {
  const user = await requireUser();
  const series = await db.series.findMany({
    where: { userId: user.id },
    include: { _count: { select: { books: true, entities: true, continuityIssues: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold">Your series</h1>
          <p className="mt-1 text-ink-900/60">Each series gets its own bible, timeline, and continuity scanner.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {series.map((s) => (
          <Link key={s.id} href={`/dashboard/series/${s.id}`} className="card hover:border-accent/50 transition">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                {s.genre && <div className="text-sm text-ink-900/60">{s.genre}</div>}
              </div>
              <BookOpen className="text-accent" />
            </div>
            <div className="mt-6 flex gap-6 text-sm text-ink-900/70">
              <span><b>{s._count.books}</b> books</span>
              <span><b>{s._count.entities}</b> entities</span>
              <span><b>{s._count.continuityIssues}</b> issues</span>
            </div>
          </Link>
        ))}

        <form action={createSeries} className="card border-dashed flex flex-col gap-3">
          <div className="flex items-center gap-2 text-ink-900/70">
            <Plus className="h-4 w-4" /> <span className="font-medium">Start a new series</span>
          </div>
          <input name="title" required placeholder="Series title (e.g. The Ember Cycle)" className="input" />
          <input name="genre" placeholder="Genre (e.g. Epic Fantasy)" className="input" />
          <button className="btn-accent">Create</button>
        </form>
      </div>
    </div>
  );
}
